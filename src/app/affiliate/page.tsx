// ── /affiliate — Panduan & bahan promosi (AWAM, boleh dicache) ──
// Halaman ini statik sepenuhnya: tiada data affiliate, tiada fetch.
// Header cache ditetapkan dalam next.config.ts.
import Link from 'next/link'
import type { Metadata } from 'next'
import { C, S } from './shared'
import CopyButton from './CopyButton'
import { PROMO_TEMPLATES } from './promo'

export const metadata: Metadata = {
  title: 'Program Affiliate — AEdu',
  description: 'Kongsi AEdu dan dapatkan komisen bagi setiap langganan Premium.',
}

const steps = [
  { n: '1', t: 'Daftar akaun affiliate', d: 'Isi nama, telefon dan emel. Admin AEdu akan menyemak dan mengaktifkan akaun anda.' },
  { n: '2', t: 'Kongsi pautan anda', d: 'Setiap affiliate mendapat pautan unik. Kongsi kepada ibu bapa melalui WhatsApp, Facebook atau kumpulan kelas.' },
  { n: '3', t: 'Terima komisen', d: 'Apabila murid yang anda rujuk menaik taraf ke Premium dan bayaran disahkan, komisen direkod dalam dashboard anda.' },
]

const rules = [
  'Komisen asas ialah 20% daripada harga Premium (kadar boleh berbeza mengikut perjanjian).',
  'Rujukan sah selama 30 hari selepas ibu bapa membuka pautan anda.',
  'Komisen hanya dikira selepas admin mengesahkan bayaran murid.',
  'Komisen bagi bayaran yang dibatalkan atau dipulangkan akan dibatalkan.',
  'Bayaran komisen dibuat terus ke akaun bank yang anda simpan dalam dashboard.',
  'Dilarang spam, iklan mengelirukan, atau mendaftar murid palsu. Akaun boleh digantung.',
]

export default function AffiliateLanding() {
  return (
    <div style={S.page}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Hero */}
        <div style={{ ...S.card, padding: '32px 24px', textAlign: 'center' }}>
          <img src="/logo.png" alt="AEdu" style={{ width: 72, height: 72, objectFit: 'contain' }} />
          <h1 style={{ ...S.h1, fontSize: 26, marginTop: 10 }}>Program Affiliate AEdu</h1>
          <p style={{ color: C.sub, fontSize: 14, lineHeight: 1.6, maxWidth: 480, margin: '10px auto 22px' }}>
            Kongsi AEdu kepada ibu bapa dan guru. Dapatkan komisen bagi setiap murid yang menaik taraf ke Premium melalui pautan anda.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/affiliate/daftar" style={{ ...S.btn, width: 'auto', padding: '12px 26px', textDecoration: 'none' }}>Daftar Affiliate</Link>
            <Link href="/affiliate/login" style={{ ...S.btnGhost, padding: '12px 26px', textDecoration: 'none' }}>Log Masuk</Link>
          </div>
        </div>

        {/* Cara */}
        <div style={S.card}>
          <h2 style={S.h2}>Cara ia berfungsi</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {steps.map(s => (
              <div key={s.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 30, height: 30, borderRadius: 10, background: C.brandSoft, color: C.brand, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.n}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{s.t}</div>
                  <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.55, marginTop: 2 }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peraturan */}
        <div style={S.card}>
          <h2 style={S.h2}>Panduan & peraturan</h2>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#334155', lineHeight: 1.8 }}>
            {rules.map(r => <li key={r}>{r}</li>)}
          </ul>
        </div>

        {/* Bahan promosi */}
        <div style={S.card}>
          <h2 style={S.h2}>Bahan promosi</h2>
          <p style={{ fontSize: 12, color: C.mute, margin: '-4px 0 12px' }}>
            Gantikan <b>[pautan anda]</b> dengan pautan dari dashboard. Dalam dashboard, pautan anda dimasukkan secara automatik.
          </p>
          <div style={{ display: 'grid', gap: 10 }}>
            {PROMO_TEMPLATES.map(p => {
              const text = p.body('[pautan anda]')
              return (
                <div key={p.title} style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, background: C.soft }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{p.title}</div>
                    <CopyButton text={text} />
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{text}</div>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: `1px dashed ${C.line}`, borderRadius: 12 }}>
            <img src="/logo.png" alt="Logo AEdu" style={{ width: 48, height: 48, objectFit: 'contain' }} />
            <div style={{ flex: 1, fontSize: 13 }}>Logo AEdu untuk poster atau hantaran media sosial</div>
            <a href="/logo.png" download="aedu-logo.png" style={{ ...S.btnGhost, textDecoration: 'none' }}>Muat turun</a>
          </div>
        </div>
      </div>
    </div>
  )
}
