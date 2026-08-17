'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Step = 'form' | 'payment' | 'pending' | 'success'

type PayInfo = { price: string; instructions: string; bank: string; accountName: string; accountNumber: string; qrUrl: string; whatsapp: string }

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [fullName, setFullName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentRequired, setPaymentRequired] = useState(false)
  const [payInfo, setPayInfo] = useState<PayInfo>({ price: '50', instructions: '', bank: '', accountName: '', accountNumber: '', qrUrl: '', whatsapp: '' })
  const [showPw, setShowPw] = useState(false)
  const [uploadedProof, setUploadedProof] = useState('')

  useEffect(() => {
    supabase.from('app_settings').select('key,value').then(({ data }) => {
      if (data) {
        const m: Record<string, string> = {}
        data.forEach((d: { key: string; value: string }) => { m[d.key] = d.value })
        setPaymentRequired(m['payment_required'] === 'true')
        setPayInfo({ price: m['payment_price'] || '50', instructions: m['payment_instructions'] || '', bank: m['payment_bank'] || '', accountName: m['payment_account_name'] || '', accountNumber: m['payment_account_number'] || '', qrUrl: m['payment_qr_url'] || '', whatsapp: m['payment_whatsapp'] || '' })
      }
    })
  }, [])

  // Auto-generate ID from name
  const handleNameChange = (val: string) => {
    setFullName(val.toUpperCase())
    if (!studentId) {
      const auto = val.toLowerCase().trim().split(' ')[0].replace(/[^a-z0-9]/g, '').slice(0, 8)
      setStudentId(auto)
    }
  }

  const handleFormSubmit = async () => {
    const name = fullName.trim().toUpperCase()
    const id = studentId.trim().toLowerCase()
    const phoneClean = phone.trim().replace(/\s+/g, '')
    if (!name) return setError('Masukkan nama penuh murid')
    if (!id || id.length < 3) return setError('ID mestilah sekurang-kurangnya 3 aksara')
    if (!/^[a-z0-9]+$/.test(id)) return setError('ID hanya boleh mengandungi huruf kecil dan nombor')
    if (!password || password.length < 4) return setError('Kata laluan mestilah sekurang-kurangnya 4 aksara')
    if (password !== confirmPassword) return setError('Kata laluan tidak sepadan')
    if (!phoneClean || phoneClean.length < 9) return setError('Masukkan nombor telefon yang sah')
    setLoading(true); setError('')

    // Check duplicate ID
    const { data: existId } = await supabase.from('students').select('id').eq('student_id', id).single()
    if (existId) { setLoading(false); return setError('ID ini sudah digunakan. Pilih ID lain.') }

    // Check duplicate name
    const { data: existName } = await supabase.from('students').select('id').eq('full_name', name).single()
    if (existName) { setLoading(false); return setError('Nama ini sudah berdaftar.') }

    setLoading(false)
    if (paymentRequired) { setStep('payment') }
    else { await registerStudent(name, id, phoneClean, false) }
  }

  const registerStudent = async (name: string, id: string, phoneClean: string, withPayment: boolean) => {
    setLoading(true)
    const { error: err } = await supabase.from('students').insert({
      full_name: name, student_id: id, password,
      parent_phone: phoneClean, is_subscribed: false,
      subscription_note: withPayment ? `Menunggu pengesahan bayaran RM${payInfo.price}` : null,
    })
    if (err) { setError('Ralat pendaftaran. Cuba lagi.'); setLoading(false); return }
    setStep(withPayment ? 'pending' : 'success')
    setLoading(false)
  }

  const handlePaymentDone = async () => {
    await registerStudent(fullName.trim().toUpperCase(), studentId.trim().toLowerCase(), phone.trim(), true)
  }

  // ── STEP: FORM ──
  if (step === 'form') return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <img src="/logo.png" alt="AEdu" style={{ width: 72, height: 72, objectFit: 'contain' }} />
          <h1 style={S.title}>Daftar Akaun</h1>
          <p style={S.sub}>{paymentRequired ? `Akses Lifetime • RM${payInfo.price}` : 'Percuma — Daftar Sekarang!'}</p>
        </div>

        {paymentRequired && (
          <div style={{ display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg,#FFF7ED,#FFFBEB)', border: '1px solid #FDE68A', borderRadius: 14, padding: '12px 16px', marginBottom: 18 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 26, fontWeight: 900, color: '#D97706', background: '#FEF3C7', borderRadius: 10, padding: '5px 12px', flexShrink: 0 }}>RM{payInfo.price}</div>
            <div style={{ marginLeft: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#1E293B' }}>Akses Lifetime</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>Bayar sekali, guna selamanya ✨</div>
            </div>
          </div>
        )}

        <div style={S.formGroup}>
          <label style={S.label}>Nama Penuh Murid</label>
          <input style={S.input} placeholder="cth: AHMAD BIN ALI" value={fullName}
            onChange={e => handleNameChange(e.target.value)} autoCapitalize="characters" />
          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>✨ Tulisan bertukar besar secara automatik</p>
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>ID Murid <span style={{ color: '#94A3B8', fontWeight: 400 }}>(untuk login)</span></label>
          <input style={{ ...S.input, fontFamily: 'monospace', letterSpacing: 1 }}
            placeholder="cth: ahmad01" value={studentId}
            onChange={e => setStudentId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} />
          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Huruf kecil dan nombor sahaja. Min 3 aksara.</p>
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>Kata Laluan</label>
          <div style={{ position: 'relative' }}>
            <input style={{ ...S.input, paddingRight: 44 }} type={showPw ? 'text' : 'password'}
              placeholder="Min 4 aksara" value={password} onChange={e => setPassword(e.target.value)} />
            <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94A3B8' }}>
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>Sahkan Kata Laluan</label>
          <input style={{ ...S.input, border: confirmPassword && confirmPassword !== password ? '2px solid #EF4444' : '2px solid #E2E8F0' }}
            type="password" placeholder="Masukkan semula kata laluan"
            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          {confirmPassword && confirmPassword !== password && <p style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>❌ Kata laluan tidak sepadan</p>}
          {confirmPassword && confirmPassword === password && <p style={{ fontSize: 11, color: '#10B981', marginTop: 4 }}>✅ Kata laluan sepadan</p>}
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>Nombor Telefon Ibu/Bapa</label>
          <input style={S.input} placeholder="cth: 0123456789" value={phone}
            onChange={e => setPhone(e.target.value.replace(/[^0-9+\-\s]/g, ''))} type="tel" inputMode="tel" />
          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Digunakan jika lupa kata laluan</p>
        </div>

        {error && <div style={S.err}>{error}</div>}
        <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={handleFormSubmit} disabled={loading}>
          {loading ? 'Menyemak...' : paymentRequired ? 'Teruskan ke Pembayaran →' : 'Daftar Sekarang →'}
        </button>
        <div style={{ margin: '14px 0 10px', fontSize: 12, color: '#94A3B8', textAlign: 'center' }}><span>Sudah ada akaun?</span></div>
        <Link href="/login" style={{ display: 'block', padding: '12px', background: '#F1F5F9', color: '#4F46E5', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', border: '1px solid #E2E8F0', textAlign: 'center' }}>Log Masuk</Link>
      </div>
    </div>
  )

  // ── STEP: PAYMENT ──
  if (step === 'payment') return (
    <div style={S.page}>
      <div style={{ ...S.card, maxWidth: 420 }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
          {['✓ Maklumat', '💳 Bayaran', '⏳ Pengesahan'].map((s, i) => (
            <div key={i} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: i === 1 ? '#4F46E5' : i === 0 ? '#ECFDF5' : '#F1F5F9', color: i === 1 ? 'white' : i === 0 ? '#10B981' : '#94A3B8' }}>{s}</div>
          ))}
        </div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 4, textAlign: 'center' }}>Buat Pembayaran</h2>
        <p style={{ color: '#64748B', fontSize: 13, textAlign: 'center', marginBottom: 20 }}>Untuk <strong>{fullName}</strong> (ID: {studentId})</p>
        <div style={{ background: 'linear-gradient(135deg,#4F46E5,#6366F1)', borderRadius: 16, padding: 20, marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600, marginBottom: 6 }}>JUMLAH BAYARAN</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 42, fontWeight: 900, color: 'white' }}>RM {payInfo.price}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Akses Lifetime — Bayar Sekali Sahaja</div>
        </div>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📋 Maklumat Pembayaran</div>
          {payInfo.instructions && <p style={{ fontSize: 13, color: '#475569', marginBottom: 10 }}>{payInfo.instructions}</p>}
          {[['Bank', payInfo.bank], ['Nama Akaun', payInfo.accountName], ['No. Akaun', payInfo.accountNumber]].map(([k, v]) => v ? (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>{k}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{v}</span>
                {k === 'No. Akaun' && <button onClick={() => navigator.clipboard.writeText(v)} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Salin</button>}
              </div>
            </div>
          ) : null)}
        </div>
        {payInfo.qrUrl && <div style={{ textAlign: 'center', marginBottom: 14 }}><img src={payInfo.qrUrl} alt="QR" style={{ width: 160, height: 160, objectFit: 'contain' }} /></div>}
        {/* Upload proof */}
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>📸 Muat Naik Bukti Bayaran (pilihan)</div>
          {uploadedProof
            ? <div style={{ textAlign: 'center' }}><img src={uploadedProof} style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8 }} /><p style={{ fontSize: 12, color: '#10B981', fontWeight: 700, marginTop: 6 }}>✓ Berjaya dimuat naik</p></div>
            : <label style={{ display: 'block', border: '2px dashed #86EFAC', borderRadius: 10, padding: 14, textAlign: 'center', cursor: 'pointer', color: '#16A34A', fontSize: 13, fontWeight: 600 }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                  const f = e.target.files?.[0]; if (!f) return
                  const r = new FileReader(); r.onload = async ev => {
                    const d = ev.target!.result as string
                    const arr = d.split(','), mime = arr[0].match(/:(.*?);/)![1]
                    const bstr = atob(arr[1]); const u8 = new Uint8Array(bstr.length)
                    for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i)
                    const blob = new Blob([u8], { type: mime })
                    const { error } = await supabase.storage.from('images').upload(`proof_${Date.now()}.${mime.split('/')[1]}`, blob)
                    if (!error) setUploadedProof(d)
                  }; r.readAsDataURL(f)
                }} />
                📎 Ketik untuk pilih gambar
              </label>}
        </div>
        {error && <div style={S.err}>{error}</div>}
        <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={handlePaymentDone} disabled={loading}>
          {loading ? 'Mendaftar...' : '✅ Saya Sudah Bayar — Hantar'}
        </button>
        {payInfo.whatsapp && (
          <a href={`https://wa.me/${payInfo.whatsapp}?text=Salam%2C+saya+${encodeURIComponent(fullName)}+(ID%3A+${studentId})+ingin+mendaftar+AEdu.+Saya+telah+membuat+bayaran+RM${payInfo.price}.`}
            target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: 12, background: '#DCFCE7', color: '#15803D', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', marginTop: 10, textAlign: 'center', border: '1px solid #86EFAC' }}>
            💬 Hubungi Admin via WhatsApp
          </a>
        )}
        <button style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 13, cursor: 'pointer', marginTop: 10, width: '100%', textAlign: 'center' }} onClick={() => setStep('form')}>← Kembali</button>
      </div>
    </div>
  )

  // ── STEP: PENDING ──
  if (step === 'pending') return (
    <div style={S.page}><div style={S.card}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 60, marginBottom: 12 }}>⏳</div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Menunggu Pengesahan</h2>
        <p style={{ color: '#64748B', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>Akaun <strong>{fullName}</strong> telah didaftarkan. Admin akan mengesahkan bayaran dan mengaktifkan akses dalam masa <strong>24 jam</strong>.</p>
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'left' }}>
          <div style={{ fontWeight: 700, color: '#92400E', marginBottom: 8 }}>📋 Maklumat Log Masuk Anda:</div>
          <div style={{ fontSize: 13, color: '#78350F' }}>ID: <strong style={{ fontFamily: 'monospace' }}>{studentId}</strong></div>
          <div style={{ fontSize: 13, color: '#78350F', marginTop: 4 }}>Kata Laluan: <strong style={{ fontFamily: 'monospace' }}>{password}</strong></div>
          <div style={{ fontSize: 11, color: '#92400E', marginTop: 8 }}>Simpan maklumat ini! 🔒</div>
        </div>
        {payInfo.whatsapp && <a href={`https://wa.me/${payInfo.whatsapp}?text=Salam%2C+saya+${encodeURIComponent(fullName)}+(ID%3A+${studentId})+ingin+mengesahkan+bayaran+RM${payInfo.price}+untuk+AEdu.`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: 12, background: '#DCFCE7', color: '#15803D', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', marginBottom: 10, border: '1px solid #86EFAC' }}>💬 Hubungi Admin via WhatsApp</a>}
        <Link href="/login" style={S.btn}>Pergi ke Log Masuk</Link>
      </div>
    </div></div>
  )

  // ── STEP: SUCCESS ──
  return (
    <div style={S.page}><div style={S.card}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 60, marginBottom: 12 }}>🎉</div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Pendaftaran Berjaya!</h2>
        <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: '#3730A3', marginBottom: 8 }}>📋 Maklumat Log Masuk:</div>
          <div style={{ fontSize: 14, color: '#4338CA' }}>ID: <strong style={{ fontFamily: 'monospace', fontSize: 16 }}>{studentId}</strong></div>
          <div style={{ fontSize: 14, color: '#4338CA', marginTop: 6 }}>Kata Laluan: <strong style={{ fontFamily: 'monospace', fontSize: 16 }}>{password}</strong></div>
          <div style={{ fontSize: 11, color: '#6366F1', marginTop: 8 }}>Simpan maklumat ini! 🔒</div>
        </div>
        <Link href="/login" style={S.btn}>Log Masuk Sekarang →</Link>
      </div>
    </div></div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#4F46E5 0%,#06B6D4 100%)', padding: 16 },
  card: { background: 'white', borderRadius: 24, padding: '36px 24px', width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' },
  title: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 24, fontWeight: 900, background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 },
  sub: { color: '#64748B', fontSize: 13 },
  formGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', padding: '12px 14px', border: '2px solid #E2E8F0', borderRadius: 12, fontSize: 14, fontWeight: 500, outline: 'none', fontFamily: "'Inter',sans-serif", background: '#F8FAFC', transition: 'border 0.2s' },
  err: { background: '#FEF2F2', color: '#EF4444', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14, lineHeight: 1.5 },
  btn: { display: 'block', width: '100%', padding: 14, background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", textDecoration: 'none', textAlign: 'center', boxShadow: '0 6px 20px rgba(79,70,229,0.3)' },
}
