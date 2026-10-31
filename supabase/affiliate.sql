-- ═══════════════════════════════════════════════════════════════
-- AEdu — SISTEM AFFILIATE
-- Jalankan SEKALI dalam Supabase → SQL Editor → New query → Run.
-- Selamat dijalankan semula (idempotent).
-- ═══════════════════════════════════════════════════════════════

-- ── 1. JADUAL AFFILIATE ─────────────────────────────────────────
-- Seorang affiliate = seorang pengguna Supabase Auth (emel + kata laluan).
-- id = auth.users.id, jadi RLS boleh guna auth.uid().
create table if not exists public.affiliates (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  full_name       text not null,
  phone           text,
  code            text not null unique,                -- kod rujukan, cth AHMAD7K2Q
  commission_rate numeric(5,2) not null default 20,     -- peratus
  status          text not null default 'pending'
                  check (status in ('pending','active','suspended')),
  bank_name       text,
  account_name    text,
  account_number  text,
  created_at      timestamptz not null default now()
);

-- ── 2. JADUAL KOMISEN ───────────────────────────────────────────
-- Satu baris = satu jualan premium yang dirujuk oleh affiliate.
create table if not exists public.affiliate_commissions (
  id                 uuid primary key default gen_random_uuid(),
  affiliate_id       uuid not null references public.affiliates(id) on delete cascade,
  payment_request_id text not null unique,             -- elak komisen berganda
  student_ref        text,                             -- id murid (rujukan dalaman)
  student_label      text,                             -- nama ditapis, cth "AHMAD B."
  sale_amount        numeric(10,2) not null default 0,
  rate               numeric(5,2)  not null,
  commission_amount  numeric(10,2) not null default 0,
  status             text not null default 'pending'
                     check (status in ('pending','paid','cancelled')),
  created_at         timestamptz not null default now(),
  paid_at            timestamptz
);

-- Index untuk pagination & statistik pantas
create index if not exists affiliate_commissions_aff_created_idx
  on public.affiliate_commissions (affiliate_id, created_at desc);

-- ── 3. KOLUM RUJUKAN PADA JADUAL SEDIA ADA ──────────────────────
alter table public.students         add column if not exists referred_by    text;
alter table public.payment_requests add column if not exists affiliate_code text;
create index if not exists students_referred_by_idx on public.students (referred_by);

-- ── 4. ROW LEVEL SECURITY ───────────────────────────────────────
alter table public.affiliates            enable row level security;
alter table public.affiliate_commissions enable row level security;

-- Affiliate hanya nampak & ubah baris SENDIRI
drop policy if exists aff_select_own on public.affiliates;
create policy aff_select_own on public.affiliates
  for select to authenticated using (id = auth.uid());

drop policy if exists aff_update_own on public.affiliates;
create policy aff_update_own on public.affiliates
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists comm_select_own on public.affiliate_commissions;
create policy comm_select_own on public.affiliate_commissions
  for select to authenticated using (affiliate_id = auth.uid());

-- Hak akses kolum: affiliate TIDAK boleh ubah kod, kadar komisen atau status.
revoke all on public.affiliates            from anon, authenticated;
revoke all on public.affiliate_commissions from anon, authenticated;
grant select on public.affiliates            to authenticated;
grant select on public.affiliate_commissions to authenticated;
grant update (full_name, phone, bank_name, account_name, account_number)
  on public.affiliates to authenticated;
-- (INSERT dibuat melalui fungsi affiliate_register di bawah.
--  Komisen hanya dicipta oleh trigger — tiada siapa boleh insert sendiri.)

-- ── 5. DAFTAR AFFILIATE (dipanggil selepas login kali pertama) ──
create or replace function public.affiliate_register(p_full_name text, p_phone text)
returns public.affiliates
language plpgsql security definer set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_row  public.affiliates;
  v_base text;
  v_code text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select * into v_row from public.affiliates where id = v_uid;
  if found then return v_row; end if;

  v_base := upper(regexp_replace(split_part(trim(coalesce(p_full_name,'')), ' ', 1), '[^A-Za-z]', '', 'g'));
  v_base := left(coalesce(nullif(v_base, ''), 'AEDU'), 6);
  loop
    v_code := v_base || upper(substr(md5(random()::text), 1, 4));
    exit when not exists (select 1 from public.affiliates where code = v_code);
  end loop;

  insert into public.affiliates (id, email, full_name, phone, code)
  values (v_uid, auth.jwt() ->> 'email', trim(p_full_name), trim(p_phone), v_code)
  returning * into v_row;
  return v_row;
end $$;

revoke all on function public.affiliate_register(text, text) from public, anon;
grant execute on function public.affiliate_register(text, text) to authenticated;

-- ── 6. STATISTIK DASHBOARD — SATU PANGGILAN ─────────────────────
-- Profil + semua statistik dalam satu query (tiada puluhan request).
create or replace function public.affiliate_dashboard()
returns json
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_code text;
  v_out  json;
begin
  if v_uid is null then return null; end if;
  select code into v_code from public.affiliates where id = v_uid;
  if v_code is null then return null; end if;

  select json_build_object(
    'profile', (
      select json_build_object(
        'full_name', a.full_name, 'phone', a.phone, 'email', a.email,
        'code', a.code, 'commission_rate', a.commission_rate, 'status', a.status,
        'bank_name', a.bank_name, 'account_name', a.account_name,
        'account_number', a.account_number, 'created_at', a.created_at)
      from public.affiliates a where a.id = v_uid),
    'stats', (
      select json_build_object(
        'signups',            (select count(*) from public.students s where s.referred_by = v_code),
        'sales',              count(*) filter (where c.status <> 'cancelled'),
        'sales_amount',       coalesce(sum(c.sale_amount)       filter (where c.status <> 'cancelled'), 0),
        'commission_total',   coalesce(sum(c.commission_amount) filter (where c.status <> 'cancelled'), 0),
        'commission_pending', coalesce(sum(c.commission_amount) filter (where c.status = 'pending'), 0),
        'commission_paid',    coalesce(sum(c.commission_amount) filter (where c.status = 'paid'), 0),
        'commission_month',   coalesce(sum(c.commission_amount) filter (
                                where c.status <> 'cancelled'
                                and c.created_at >= date_trunc('month', now())), 0),
        'rows',               count(*))
      from public.affiliate_commissions c where c.affiliate_id = v_uid)
  ) into v_out;
  return v_out;
end $$;

revoke all on function public.affiliate_dashboard() from public, anon;
grant execute on function public.affiliate_dashboard() to authenticated;

-- ── 7. TRIGGER: CIPTA KOMISEN BILA ADMIN LULUSKAN BAYARAN ───────
create or replace function public.handle_affiliate_commission()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_code   text;
  v_name   text;
  v_aff    public.affiliates;
  v_amount numeric;
begin
  -- Diluluskan → cipta komisen
  if new.status = 'approved'
     and (tg_op = 'INSERT' or old.status is distinct from 'approved') then

    select s.referred_by, s.full_name into v_code, v_name
      from public.students s where s.id::text = new.student_id::text;
    v_code := upper(nullif(trim(coalesce(v_code, new.affiliate_code)), ''));
    if v_code is null then return new; end if;

    select * into v_aff from public.affiliates
      where code = v_code and status = 'active';
    if not found then return new; end if;

    v_amount := coalesce(nullif(regexp_replace(coalesce(new.amount::text, ''), '[^0-9.]', '', 'g'), '')::numeric, 0);
    v_name   := coalesce(v_name, new.full_name, '');

    insert into public.affiliate_commissions
      (affiliate_id, payment_request_id, student_ref, student_label,
       sale_amount, rate, commission_amount)
    values
      (v_aff.id, new.id::text, new.student_id::text,
       trim(split_part(v_name, ' ', 1) || ' ' || coalesce(left(nullif(split_part(v_name, ' ', 2), ''), 1) || '.', '')),
       v_amount, v_aff.commission_rate, round(v_amount * v_aff.commission_rate / 100, 2))
    on conflict (payment_request_id) do update
      set status = 'pending'
      where public.affiliate_commissions.status = 'cancelled';

  -- Kelulusan ditarik balik → batalkan komisen yang belum dibayar
  elsif tg_op = 'UPDATE' and old.status = 'approved' and new.status <> 'approved' then
    update public.affiliate_commissions
       set status = 'cancelled'
     where payment_request_id = new.id::text and status = 'pending';
  end if;
  return new;
end $$;

drop trigger if exists trg_affiliate_commission on public.payment_requests;
create trigger trg_affiliate_commission
  after insert or update of status on public.payment_requests
  for each row execute function public.handle_affiliate_commission();

-- ── 8. RINGKASAN UNTUK ADMIN (service role sahaja) ──────────────
create or replace function public.admin_affiliate_overview()
returns json
language sql stable security definer set search_path = public
as $$
  select coalesce(json_agg(row_to_json(t) order by t.created_at desc), '[]'::json)
  from (
    select a.id, a.email, a.full_name, a.phone, a.code, a.commission_rate, a.status,
           a.bank_name, a.account_name, a.account_number, a.created_at,
           (select count(*) from public.students s where s.referred_by = a.code) as signups,
           count(c.id) filter (where c.status <> 'cancelled')                         as sales,
           coalesce(sum(c.commission_amount) filter (where c.status = 'pending'), 0)  as pending,
           coalesce(sum(c.commission_amount) filter (where c.status = 'paid'), 0)     as paid
    from public.affiliates a
    left join public.affiliate_commissions c on c.affiliate_id = a.id
    group by a.id
  ) t
$$;

revoke all on function public.admin_affiliate_overview() from public, anon, authenticated;
grant execute on function public.admin_affiliate_overview() to service_role;
