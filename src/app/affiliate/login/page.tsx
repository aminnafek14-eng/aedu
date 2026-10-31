'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabaseAff } from '@/lib/supabaseAffiliate'
import { C, S, Field, Logo } from '../shared'

type Mode = 'login' | 'forgot' | 'reset'

export default function AffiliateLogin() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    // Pautan "reset kata laluan" dari emel → tunjuk borang kata laluan baru
    const { data: sub } = supabaseAff.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') { setMode('reset'); setError(''); setInfo('') }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const login = async () => {
    if (!email.trim() || !password) return setError('Masukkan emel dan kata laluan')
    setLoading(true); setError('')
    const { error: err } = await supabaseAff.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    setLoading(false)
    if (err) return setError(err.message.includes('confirm') ? 'Sila sahkan emel anda dahulu.' : 'Emel atau kata laluan salah.')
    router.replace('/affiliate/dashboard')
  }

  const forgot = async () => {
    if (!email.trim()) return setError('Masukkan emel anda')
    setLoading(true); setError('')
    await supabaseAff.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/affiliate/login`,
    })
    setLoading(false)
    setInfo('Jika emel ini berdaftar, pautan reset telah dihantar.')
  }

  const reset = async () => {
    if (password.length < 8) return setError('Kata laluan mestilah sekurang-kurangnya 8 aksara')
    setLoading(true); setError('')
    const { error: err } = await supabaseAff.auth.updateUser({ password })
    setLoading(false)
    if (err) return setError(err.message)
    router.replace('/affiliate/dashboard')
  }

  const action = mode === 'login' ? login : mode === 'forgot' ? forgot : reset

  return (
    <div style={S.page}>
      <div style={S.authCard}>
        <Logo sub={mode === 'login' ? 'LOG MASUK AFFILIATE' : mode === 'forgot' ? 'LUPA KATA LALUAN' : 'KATA LALUAN BARU'} />
        {error && <div style={S.err}>⚠️ {error}</div>}
        {info && <div style={S.ok}>{info}</div>}

        {mode !== 'reset' && (
          <Field label="Emel">
            <input style={S.input} value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="nama@emel.com"
              onKeyDown={e => e.key === 'Enter' && action()} />
          </Field>
        )}
        {mode !== 'forgot' && (
          <Field label={mode === 'reset' ? 'Kata laluan baru' : 'Kata laluan'}>
            <input style={S.input} value={password} onChange={e => setPassword(e.target.value)} type="password"
              autoComplete={mode === 'reset' ? 'new-password' : 'current-password'}
              onKeyDown={e => e.key === 'Enter' && action()} />
          </Field>
        )}

        <button style={{ ...S.btn, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={action}>
          {loading ? 'Sila tunggu...' : mode === 'login' ? 'Log Masuk' : mode === 'forgot' ? 'Hantar pautan reset' : 'Simpan kata laluan'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, marginTop: 16, display: 'grid', gap: 8 }}>
          {mode === 'login'
            ? <button onClick={() => { setMode('forgot'); setError(''); setInfo('') }} style={{ background: 'none', border: 'none', color: C.brand, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Lupa kata laluan?</button>
            : mode === 'forgot' && <button onClick={() => { setMode('login'); setError(''); setInfo('') }} style={{ background: 'none', border: 'none', color: C.brand, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Kembali ke log masuk</button>}
          <span style={{ color: C.sub }}>Belum ada akaun? <Link href="/affiliate/daftar" style={{ color: C.brand, fontWeight: 700 }}>Daftar</Link></span>
        </div>
      </div>
    </div>
  )
}
