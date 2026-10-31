'use client'
// ── /affiliate/dashboard — SATU dashboard untuk semua affiliate ──
// Data dikenal pasti melalui sesi Supabase Auth (JWT). RLS di Supabase
// memastikan setiap affiliate hanya menerima baris miliknya sendiri.
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseAff, type AffiliateProfile, type AffiliateStats, type Commission } from '@/lib/supabaseAffiliate'
import { C, S, Field, rm } from '../shared'
import CopyButton from '../CopyButton'
import { PROMO_TEMPLATES } from '../promo'

const PAGE_SIZE = 20

const STATUS_STYLE: Record<Commission['status'], { label: string; bg: string; fg: string }> = {
  pending:   { label: 'Belum dibayar', bg: C.amberSoft, fg: C.amber },
  paid:      { label: 'Dibayar',       bg: C.greenSoft, fg: '#047857' },
  cancelled: { label: 'Dibatalkan',    bg: '#F1F5F9',   fg: C.mute },
}

export default function AffiliateDashboard() {
  const router = useRouter()
  const [uid, setUid] = useState<string | null>(null)
  const [profile, setProfile] = useState<AffiliateProfile | null>(null)
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [rows, setRows] = useState<Commission[]>([])
  const [page, setPage] = useState(0)
  const [rowsLoading, setRowsLoading] = useState(false)
  const [error, setError] = useState('')
  const [bank, setBank] = useState({ bank_name: '', account_name: '', account_number: '' })
  const [bankSaving, setBankSaving] = useState(false)
  const [bankMsg, setBankMsg] = useState('')
  const [showPromo, setShowPromo] = useState(false)

  // Satu panggilan RPC: profil + semua statistik
  const loadSummary = useCallback(async () => {
    let { data, error: err } = await supabaseAff.rpc('affiliate_dashboard')
    if (!err && !data) {
      // Login pertama selepas sahkan emel → cipta profil affiliate
      const { data: u } = await supabaseAff.auth.getUser()
      const meta = u.user?.user_metadata || {}
      await supabaseAff.rpc('affiliate_register', { p_full_name: meta.full_name || u.user?.email?.split('@')[0] || 'Affiliate', p_phone: meta.phone || '' })
      ;({ data, error: err } = await supabaseAff.rpc('affiliate_dashboard'))
    }
    if (err || !data) { setError('Gagal memuatkan dashboard. Cuba muat semula.'); return }
    setProfile(data.profile); setStats(data.stats)
    setBank({ bank_name: data.profile.bank_name || '', account_name: data.profile.account_name || '', account_number: data.profile.account_number || '' })
  }, [])

  // Pagination: hanya PAGE_SIZE rekod setiap kali
  const loadPage = useCallback(async (userId: string, p: number) => {
    setRowsLoading(true)
    const from = p * PAGE_SIZE
    const { data } = await supabaseAff
      .from('affiliate_commissions')
      .select('id, student_label, sale_amount, rate, commission_amount, status, created_at, paid_at')
      .eq('affiliate_id', userId)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    setRows((data as Commission[]) || [])
    setRowsLoading(false)
  }, [])

  useEffect(() => {
    (async () => {
      const { data } = await supabaseAff.auth.getSession()
      const user = data.session?.user
      if (!user) { router.replace('/affiliate/login'); return }
      setUid(user.id)
      await Promise.all([loadSummary(), loadPage(user.id, 0)])
    })()
  }, [router, loadSummary, loadPage])

  const goPage = (p: number) => { if (!uid) return; setPage(p); loadPage(uid, p) }

  const saveBank = async () => {
    if (!uid) return
    setBankSaving(true); setBankMsg('')
    const { error: err } = await supabaseAff.from('affiliates').update({
      bank_name: bank.bank_name.trim() || null,
      account_name: bank.account_name.trim() || null,
      account_number: bank.account_number.replace(/\s+/g, '') || null,
    }).eq('id', uid)
    setBankSaving(false)
    setBankMsg(err ? '⚠️ Gagal menyimpan' : '✓ Maklumat bank disimpan')
  }

  const logout = async () => { await supabaseAff.auth.signOut(); router.replace('/affiliate/login') }

  if (error) return <div style={S.page}><div style={{ ...S.authCard, textAlign: 'center' }}><div style={S.err}>{error}</div><button style={S.btnGhost} onClick={logout}>Log keluar</button></div></div>
  if (!profile || !stats) return <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.mute }}>⏳ Memuatkan dashboard...</div>

  const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${profile.code}`
  const totalPages = Math.max(1, Math.ceil(stats.rows / PAGE_SIZE))
  const statCards = [
    { label: 'Pendaftaran dirujuk', val: String(stats.signups), color: C.brand },
    { label: 'Jualan Premium', val: String(stats.sales), color: '#0EA5E9' },
    { label: 'Komisen bulan ini', val: rm(stats.commission_month), color: C.green },
    { label: 'Belum dibayar', val: rm(stats.commission_pending), color: C.amber },
    { label: 'Sudah dibayar', val: rm(stats.commission_paid), color: '#047857' },
    { label: 'Jumlah komisen', val: rm(stats.commission_total), color: C.ink },
  ]

  return (
    <div style={S.page}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <img src="/logo.png" alt="AEdu" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...S.h1, fontSize: 18 }}>Hai, {profile.full_name.split(' ')[0]}</div>
            <div style={{ fontSize: 12, color: C.mute }}>Dashboard Affiliate · Kadar komisen {Number(profile.commission_rate)}%</div>
          </div>
          <Link href="/affiliate" style={{ ...S.btnGhost, textDecoration: 'none', fontSize: 12 }}>Panduan</Link>
          <button style={{ ...S.btnGhost, fontSize: 12, color: C.red }} onClick={logout}>Log keluar</button>
        </div>

        {profile.status !== 'active' && (
          <div style={{ ...S.card, background: profile.status === 'pending' ? C.amberSoft : C.redSoft, borderColor: profile.status === 'pending' ? '#FDE68A' : '#FECACA', fontSize: 13, color: profile.status === 'pending' ? '#92400E' : '#991B1B' }}>
            {profile.status === 'pending'
              ? '⏳ Akaun anda sedang menunggu kelulusan admin. Komisen akan mula dikira selepas akaun diaktifkan.'
              : '⛔ Akaun affiliate anda telah digantung. Sila hubungi admin AEdu.'}
          </div>
        )}

        {/* Pautan rujukan */}
        <div style={S.card}>
          <h2 style={S.h2}>Pautan rujukan anda</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <code style={{ flex: '1 1 240px', minWidth: 0, padding: '11px 12px', background: C.brandSoft, borderRadius: 10, fontSize: 13, color: C.brand, fontWeight: 700, overflowWrap: 'anywhere' }}>{link}</code>
            <CopyButton text={link} label="Salin pautan" style={{ padding: '11px 14px' }} />
            <a href={`https://wa.me/?text=${encodeURIComponent(PROMO_TEMPLATES[0].body(link))}`} target="_blank" rel="noopener noreferrer"
              style={{ padding: '11px 14px', borderRadius: 10, background: '#DCFCE7', color: '#15803D', fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Kongsi WhatsApp
            </a>
          </div>
          <div style={{ fontSize: 12, color: C.mute, marginTop: 8 }}>Kod anda: <b style={{ color: C.ink }}>{profile.code}</b> · Rujukan sah 30 hari</div>
          <button onClick={() => setShowPromo(v => !v)} style={{ marginTop: 10, background: 'none', border: 'none', color: C.brand, fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
            {showPromo ? '▲ Sembunyi templat mesej' : '▼ Templat mesej siap dengan pautan anda'}
          </button>
          {showPromo && (
            <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
              {PROMO_TEMPLATES.map(p => {
                const text = p.body(link)
                return (
                  <div key={p.title} style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, background: C.soft }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <b style={{ fontSize: 12 }}>{p.title}</b><CopyButton text={text} />
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#334155', lineHeight: 1.55 }}>{text}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Statistik */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(max(140px,30%),1fr))', gap: 10, marginBottom: 14 }}>
          {statCards.map(s => (
            <div key={s.label} style={{ ...S.card, marginBottom: 0, padding: 16 }}>
              <div style={{ fontSize: 11, color: C.mute, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 900, color: s.color, marginTop: 6 }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Senarai komisen (pagination) */}
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ ...S.h2, margin: 0 }}>Sejarah komisen</h2>
            <span style={{ fontSize: 12, color: C.mute }}>{stats.rows} rekod</span>
          </div>
          {stats.rows === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: C.mute, fontSize: 13 }}>
              Belum ada jualan. Kongsi pautan anda untuk mula menjana komisen.
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gap: 6, opacity: rowsLoading ? 0.5 : 1, transition: 'opacity .15s' }}>
                {rows.map(r => {
                  const st = STATUS_STYLE[r.status]
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.line}` }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{r.student_label || 'Murid'}</div>
                        <div style={{ fontSize: 11, color: C.mute, marginTop: 2 }}>
                          {new Date(r.created_at).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' })} · Jualan {rm(r.sale_amount)} × {Number(r.rate)}%
                          {r.paid_at && ` · Dibayar ${new Date(r.paid_at).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short' })}`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: r.status === 'cancelled' ? C.mute : C.ink, textDecoration: r.status === 'cancelled' ? 'line-through' : 'none' }}>{rm(r.commission_amount)}</div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: st.bg, color: st.fg }}>{st.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14 }}>
                  <button style={{ ...S.btnGhost, opacity: page === 0 ? 0.4 : 1 }} disabled={page === 0 || rowsLoading} onClick={() => goPage(page - 1)}>← Sebelum</button>
                  <span style={{ fontSize: 12, color: C.sub }}>Halaman {page + 1} / {totalPages}</span>
                  <button style={{ ...S.btnGhost, opacity: page >= totalPages - 1 ? 0.4 : 1 }} disabled={page >= totalPages - 1 || rowsLoading} onClick={() => goPage(page + 1)}>Seterusnya →</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Maklumat bank */}
        <div style={S.card}>
          <h2 style={S.h2}>Maklumat bank untuk bayaran komisen</h2>
          <p style={{ fontSize: 12, color: C.mute, margin: '-6px 0 14px' }}>Hanya anda dan admin AEdu boleh melihat maklumat ini.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0 12px' }}>
            <Field label="Nama bank"><input style={S.input} value={bank.bank_name} onChange={e => setBank(b => ({ ...b, bank_name: e.target.value }))} placeholder="cth: Maybank" /></Field>
            <Field label="Nama pemegang akaun"><input style={S.input} value={bank.account_name} onChange={e => setBank(b => ({ ...b, account_name: e.target.value }))} /></Field>
            <Field label="Nombor akaun"><input style={{ ...S.input, fontFamily: 'monospace' }} value={bank.account_number} onChange={e => setBank(b => ({ ...b, account_number: e.target.value }))} inputMode="numeric" /></Field>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{ ...S.btn, width: 'auto', padding: '11px 22px', opacity: bankSaving ? 0.6 : 1 }} disabled={bankSaving} onClick={saveBank}>
              {bankSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
            {bankMsg && <span style={{ fontSize: 12, fontWeight: 600, color: bankMsg.startsWith('✓') ? C.green : C.red }}>{bankMsg}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
