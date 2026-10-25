'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const login = async () => {
    if (!pw.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })

      if (res.ok) {
        router.replace('/admin')
      } else {
        const data = await res.json()
        setError(data.error || 'Kata laluan salah')
        setPw('')
      }
    } catch {
      setError('Ralat sambungan. Cuba semula.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #F0F4FF 0%, #EEF2FF 50%, #F5F3FF 100%)',
      fontFamily: "'Inter', sans-serif", padding: 20,
    }}>
      <div style={{
        background: 'white', borderRadius: 24, padding: '40px 36px',
        boxShadow: '0 20px 60px rgba(79,70,229,0.12)', width: '100%', maxWidth: 380,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.png" alt="AEdu" style={{ width: 72, height: 72, objectFit: 'contain', marginBottom: 12 }} />
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>AEdu</div>
          <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>ADMIN PANEL</div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Kata Laluan Admin
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'}
              value={pw}
              onChange={e => { setPw(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && login()}
              placeholder="Masukkan kata laluan"
              autoFocus
              style={{
                width: '100%', padding: '13px 44px 13px 16px',
                border: `2px solid ${error ? '#FCA5A5' : '#E2E8F0'}`,
                borderRadius: 12, fontSize: 15, outline: 'none',
                background: error ? '#FFF5F5' : 'white',
                fontFamily: 'monospace', letterSpacing: 3,
                boxSizing: 'border-box' as const,
                transition: 'border-color 0.15s',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 16, padding: 4 }}
            >
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: '#EF4444', fontWeight: 600 }}>
              <span>⚠️</span> {error}
            </div>
          )}
        </div>

        <button
          onClick={login}
          disabled={loading || !pw.trim()}
          style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
            background: loading || !pw.trim() ? '#E2E8F0' : 'linear-gradient(135deg, #4F46E5, #6366F1)',
            color: loading || !pw.trim() ? '#94A3B8' : 'white',
            fontSize: 14, fontWeight: 700, cursor: loading || !pw.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s', letterSpacing: '0.02em',
          }}
        >
          {loading ? '⏳ Mengesahkan...' : '🔐 Log Masuk'}
        </button>

        <div style={{ marginTop: 20, padding: '12px 14px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.6 }}>
            🔒 Sesi akan tamat selepas <strong>8 jam</strong> tidak aktif.
          </div>
        </div>
      </div>
    </div>
  )
}
