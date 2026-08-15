# 🚀 Panduan Deploy AEdu ke Vercel

## Langkah 1 — Sediakan Supabase

1. Pergi ke [supabase.com](https://supabase.com) → **New Project**
2. Masukkan nama projek: `aedu` dan pilih wilayah terdekat (Singapore)
3. Pergi ke **SQL Editor** → tampal kandungan `SUPABASE_SETUP.sql` → **Run**
4. Pergi ke **Storage** → **New Bucket**
   - Nama: `images`
   - Tandakan **Public bucket** → Create
   - Pergi ke Policies → tambah policy:
     - Allowed operations: **SELECT, INSERT, UPDATE, DELETE**
     - Target roles: **anon**
5. Pergi ke **Settings → API** dan salin:
   - `Project URL` → contoh: `https://abcdef.supabase.co`
   - `anon public key` (kunci panjang)

---

## Langkah 2 — Upload ke GitHub

```bash
cd aedu
git init
git add .
git commit -m "AEdu initial commit"
git branch -M main
git remote add origin https://github.com/NAMA_ANDA/aedu.git
git push -u origin main
```

---

## Langkah 3 — Deploy ke Vercel

1. Pergi ke [vercel.com](https://vercel.com) → **Add New Project**
2. Import repo GitHub `aedu`
3. Dalam **Environment Variables**, tambah:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJxxx...` (kunci anon) |

4. Klik **Deploy** → tunggu 1-2 minit

---

## URL Akhir

| Halaman | URL |
|---------|-----|
| 🎓 Paparan Murid | `https://aedu.vercel.app/` |
| 🔑 Log Masuk Murid | `https://aedu.vercel.app/login` |
| 📝 Daftar Murid | `https://aedu.vercel.app/signup` |
| ⚙️ Panel Admin | `https://aedu.vercel.app/admin` |

**Kata laluan Admin:** `050505`

---

## Struktur Fail

```
src/app/
├── page.tsx          ← Paparan utama murid (/)
├── login/page.tsx    ← Log masuk murid
├── signup/page.tsx   ← Daftar murid baru
├── folder/[id]/      ← Senarai pautan dalam folder
└── admin/page.tsx    ← Panel admin (/admin)
```

---

## Nota

- Data murid disimpan dalam Supabase (realtime)
- Gambar folder/link/banner disimpan dalam Supabase Storage
- Analitik (pengguna dalam talian) adalah simulasi — untuk realtime sebenar, tambah Supabase Realtime channel
- Admin password disimpan dalam kod (`050505`) — selamat untuk kegunaan dalaman
