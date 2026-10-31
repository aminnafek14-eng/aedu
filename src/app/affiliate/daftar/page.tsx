'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabaseAff } from '@/lib/supabaseAffiliate'
import { C, S, Field, Logo } from '../shared'

export default function AffiliateSignup() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkEmail, setCheckEmail] = useState(false)

  const submit = async () => {
    const name = fullName.trim(), ph = phone.replace(/\s+/g, ''), em = email.trim().toLowerCase()
    if (!name) return setError('Masukkan nama penuh')
    if (ph.length < 9) return setError('Masukkan nombor telefon yang sah')
    if (!/^\S+@\S+\.\S+$/.test(em)) return setError('Masukkan emel yang sah')
    if (password.length < 8) return setError('Kata laluan mestilah sekurang-kurangnya 8 aksara')
    setLoading(true); setError('')

    const { data, error: err } = await supabaseAff.auth.signUp({
      email: em, password,
      options: {
        data: { full_name: name, phone: ph },
        emailRedirectTo: `${window.location.origin}/affiliate/dashboard`,
      },
    })
    if (err) {
      setLoading(false)
      return setError(err.message.includes('registered') ? 'Emel ini sudah berdaftar. Sila log masuk.' : err.message)
    }

    // Pengesahan emel dimatikan → terus ada sesi
    if (data.session) {
      await supabaseAff.rpc('affiliate_register', { p_full_name: name, p_phone: ph })
      router.replace('/affiliate/dashboard')
      return
    }
    // Pengesahan emel dihidupkan → minta semak emel
    setLoading(false); setCheckEmail(true)
  }

  if (checkEmail) return (
    <div style={S.page}>
      <div style={{ ...S.authCard, textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>📧</div>
        <h1 style={{ ...S.h1, marginTop: 8 }}>Semak emel anda</h1>
        <p style={{ color: C.sub, fontSize: 14, lineHeight: 1.6 }}>
          Kami telah menghantar pautan pengesahan ke <b>{email}</b>. Klik pautan tersebut untuk masuk ke dashboard affiliate.
        </p>
        <Link href="/affiliate/login" style={{ color: C.brand, fontWeight: 700, fontSize: 13 }}>Ke halaman log masuk</Link>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <div style={S.authCard}>
        <Logo sub="DAFTAR AFFILIATE" />
        {error && <div style={S.err}>⚠️ {error}</div>}
        <Field label="Nama penuh">
          <input style={S.input} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="cth: Ahmad bin Ali" />
        </Field>
        <Field label="No. telefon (WhatsApp)">
          <input style={S.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="0123456789" type="tel" />
        </Field>
        <Field label="Emel">
          <input style={S.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@emel.com" type="email" autoComplete="email" />
        </Field>
        <Field label="Kata laluan">
          <input style={S.input} value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Min. 8 aksara" autoComplete="new-password"
            onKeyDown={e => e.key === 'Enter' && submit()} />
        </Field>
        <button style={{ ...S.btn, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={submit}>
          {loading ? 'Mendaftar...' : 'Daftar'}
        </button>
        <p style={{ textAlign: 'center', fontSize: 13, color: C.sub, marginTop: 18 }}>
          Sudah ada akaun? <Link href="/affiliate/login" style={{ color: C.brand, fontWeight: 700 }}>Log masuk</Link>
        </p>
        <p style={{ textAlign: 'center', fontSize: 12, marginTop: 6 }}>
          <Link href="/affiliate" style={{ color: C.mute }}>Baca panduan affiliate</Link>
        </p>
      </div>
    </div>
  )
}
