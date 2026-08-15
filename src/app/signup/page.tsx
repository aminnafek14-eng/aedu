'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type PaymentInfo = {
  price: string
  instructions: string
  bank: string
  accountName: string
  accountNumber: string
  qrUrl: string
  whatsapp: string
}

type Step = 'form' | 'payment' | 'pending' | 'success'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentRequired, setPaymentRequired] = useState(false)
  const [payInfo, setPayInfo] = useState<PaymentInfo>({
    price: '50', instructions: '', bank: '', accountName: '', accountNumber: '', qrUrl: '', whatsapp: ''
  })
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [uploadedProof, setUploadedProof] = useState<string>('')
  const [uploadingProof, setUploadingProof] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const { data } = await supabase.from('app_settings').select('key,value')
    if (data) {
      const map: Record<string, string> = {}
      data.forEach(d => { map[d.key] = d.value })
      setPaymentRequired(map['payment_required'] === 'true')
      setPayInfo({
        price: map['payment_price'] || '50',
        instructions: map['payment_instructions'] || '',
        bank: map['payment_bank'] || '',
        accountName: map['payment_account_name'] || '',
        accountNumber: map['payment_account_number'] || '',
        qrUrl: map['payment_qr_url'] || '',
        whatsapp: map['payment_whatsapp'] || '',
      })
    }
    setSettingsLoaded(true)
  }

  const handleFormSubmit = async () => {
    const name = fullName.trim().toUpperCase()
    const phoneClean = phone.trim().replace(/\s+/g, '')
    if (!name) return setError('Sila masukkan nama penuh murid')
    if (!phoneClean || phoneClean.length < 9) return setError('Sila masukkan nombor telefon yang sah')
    setLoading(true); setError('')

    // Check duplicate
    const { data: existing } = await supabase
      .from('students').select('id').eq('full_name', name).single()
    if (existing) {
      setLoading(false)
      return setError('Nama ini sudah berdaftar. Sila log masuk.')
    }
    setLoading(false)

    // If payment required, go to payment step
    if (paymentRequired) {
      setStep('payment')
    } else {
      // Free mode — daftar terus
      await registerStudent(name, phoneClean, false)
    }
  }

  const registerStudent = async (name: string, phoneClean: string, withPayment: boolean) => {
    setLoading(true)
    const { error: err } = await supabase.from('students').insert({
      full_name: name,
      parent_phone: phoneClean,
      is_subscribed: false, // admin kena aktifkan selepas confirm bayaran
      subscription_note: withPayment ? `Menunggu pengesahan bayaran RM${payInfo.price}` : null,
    })
    if (err) {
      setError('Ralat pendaftaran. Cuba lagi.')
      setLoading(false)
      return
    }

    if (withPayment) {
      // Send WhatsApp notification if configured
      setStep('pending')
    } else {
      setStep('success')
    }
    setLoading(false)
  }

  const handlePaymentDone = async () => {
    const name = fullName.trim().toUpperCase()
    const phoneClean = phone.trim().replace(/\s+/g, '')
    await registerStudent(name, phoneClean, true)
  }

  const handleProofUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return setError('Fail terlalu besar (maks 5MB)')
    setUploadingProof(true)
    const r = new FileReader()
    r.onload = async (e) => {
      const dataUrl = e.target!.result as string
      const arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)![1]
      const bstr = atob(arr[1]); const u8 = new Uint8Array(bstr.length)
      for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i)
      const blob = new Blob([u8], { type: mime })
      const fname = `proof_${Date.now()}.${mime.split('/')[1]}`
      const { error } = await supabase.storage.from('images').upload(fname, blob)
      if (!error) {
        const { data } = supabase.storage.from('images').getPublicUrl(fname)
        setUploadedProof(data.publicUrl)
      }
      setUploadingProof(false)
    }
    r.readAsDataURL(file)
  }

  if (!settingsLoaded) return (
    <div style={S.page}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
    </div>
  )

  // ── STEP: FORM ──
  if (step === 'form') return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}><img src='/logo.png' alt='AEdu' style={{ width: 90, height: 90, objectFit: 'contain' }} /></div>
        <h1 style={S.title}>Daftar Akaun</h1>
        <p style={S.sub}>
          {paymentRequired ? `Akses Lifetime • RM${payInfo.price}` : 'Percuma — Daftar Sekarang!'}
        </p>

        {paymentRequired && (
          <div style={S.priceBanner}>
            <div style={S.priceTag}>RM{payInfo.price}</div>
            <div style={{ marginLeft: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#1E293B' }}>Akses Lifetime</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Bayar sekali, guna selamanya ✨</div>
            </div>
          </div>
        )}

        <div style={S.formGroup}>
          <label style={S.label}>Nama Penuh Murid</label>
          <input style={S.input} placeholder="cth: AHMAD BIN ALI" value={fullName}
            onChange={e => setFullName(e.target.value.toUpperCase())} autoCapitalize="characters" />
          <p style={S.hint}>✨ Tulisan bertukar besar secara automatik</p>
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>Nombor Telefon Ibu/Bapa</label>
          <input style={S.input} placeholder="cth: 0123456789" value={phone}
            onChange={e => setPhone(e.target.value.replace(/[^0-9+\-\s]/g, ''))} type="tel" inputMode="tel" />
        </div>

        {error && <div style={S.err}>{error}</div>}

        <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={handleFormSubmit} disabled={loading}>
          {loading ? 'Menyemak...' : paymentRequired ? `Teruskan ke Pembayaran →` : 'Daftar Sekarang →'}
        </button>

        <div style={S.divider}><span>Sudah ada akaun?</span></div>
        <Link href="/login" style={S.loginLink}>Log Masuk</Link>
      </div>
    </div>
  )

  // ── STEP: PAYMENT ──
  if (step === 'payment') return (
    <div style={S.page}>
      <div style={{ ...S.card, maxWidth: 420 }}>
        {/* Progress indicator */}
        <div style={S.progress}>
          <div style={S.progressDone}>✓ Maklumat</div>
          <div style={S.progressLine} />
          <div style={S.progressActive}>💳 Bayaran</div>
          <div style={S.progressLine} />
          <div style={S.progressPending}>⏳ Pengesahan</div>
        </div>

        <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 4, textAlign: 'center' }}>
          Buat Pembayaran
        </h2>
        <p style={{ color: '#64748B', fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
          Untuk <strong>{fullName}</strong>
        </p>

        {/* Amount */}
        <div style={S.amountBox}>
          <div style={S.amountLabel}>Jumlah Bayaran</div>
          <div style={S.amountVal}>RM {payInfo.price}</div>
          <div style={S.amountSub}>Akses Lifetime — Bayar Sekali Sahaja</div>
        </div>

        {/* Bank details */}
        <div style={S.bankBox}>
          <div style={S.bankTitle}>📋 Maklumat Pembayaran</div>
          {payInfo.instructions && (
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 12, lineHeight: 1.5 }}>{payInfo.instructions}</p>
          )}
          <div style={S.bankRow}>
            <span style={S.bankLabel}>Bank</span>
            <span style={S.bankVal}>{payInfo.bank || '-'}</span>
          </div>
          <div style={S.bankRow}>
            <span style={S.bankLabel}>Nama Akaun</span>
            <span style={S.bankVal}>{payInfo.accountName || '-'}</span>
          </div>
          <div style={S.bankRow}>
            <span style={S.bankLabel}>No. Akaun</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ ...S.bankVal, fontFamily: 'monospace', fontSize: 16, fontWeight: 800 }}>{payInfo.accountNumber || '-'}</span>
              <button style={S.copyBtn} onClick={() => { navigator.clipboard.writeText(payInfo.accountNumber); }}>
                Salin
              </button>
            </div>
          </div>
        </div>

        {/* QR Code if available */}
        {payInfo.qrUrl && (
          <div style={S.qrBox}>
            <div style={S.bankTitle}>📱 Imbas QR untuk Bayar</div>
            <img src={payInfo.qrUrl} alt="QR Payment" style={{ width: 180, height: 180, objectFit: 'contain', display: 'block', margin: '12px auto 0' }} />
          </div>
        )}

        {/* Upload proof */}
        <div style={S.proofBox}>
          <div style={S.bankTitle}>📸 Muat Naik Bukti Bayaran (pilihan)</div>
          <p style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>Muat naik screenshot resit untuk mempercepatkan pengesahan.</p>
          {uploadedProof
            ? <div style={{ position: 'relative', textAlign: 'center' }}>
                <img src={uploadedProof} alt="Proof" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10 }} />
                <div style={{ fontSize: 12, color: '#10B981', fontWeight: 700, marginTop: 6 }}>✓ Bukti berjaya dimuat naik</div>
              </div>
            : <label style={S.uploadLabel}>
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleProofUpload(f) }} />
                {uploadingProof ? '⏳ Memuat naik...' : '📎 Ketik untuk pilih gambar'}
              </label>}
        </div>

        {error && <div style={S.err}>{error}</div>}

        <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={handlePaymentDone} disabled={loading}>
          {loading ? 'Mendaftar...' : '✅ Saya Sudah Bayar — Hantar'}
        </button>

        {payInfo.whatsapp && (
          <a href={`https://wa.me/${payInfo.whatsapp}?text=Salam,%20saya%20${encodeURIComponent(fullName)}%20ingin%20mendaftar%20AEdu.%20Saya%20telah%20membuat%20bayaran%20RM${payInfo.price}.`}
            target="_blank" rel="noopener noreferrer" style={S.waBtn}>
            💬 Hubungi Admin via WhatsApp
          </a>
        )}

        <button style={S.backBtn} onClick={() => setStep('form')}>← Kembali</button>
      </div>
    </div>
  )

  // ── STEP: PENDING ──
  if (step === 'pending') return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ fontSize: 64, marginBottom: 16, textAlign: 'center' }}>⏳</div>
        <h2 style={{ ...S.title, fontSize: 22, marginBottom: 8 }}>Menunggu Pengesahan</h2>
        <p style={{ color: '#64748B', fontSize: 14, marginBottom: 20, textAlign: 'center', lineHeight: 1.6 }}>
          Akaun <strong>{fullName}</strong> telah didaftarkan.<br />
          Admin akan mengesahkan bayaran anda dan mengaktifkan akses dalam masa <strong>24 jam</strong>.
        </p>

        <div style={S.pendingBox}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 8 }}>📋 Apa yang perlu dilakukan:</div>
          <div style={S.pendingStep}>1. Simpan bukti bayaran anda</div>
          <div style={S.pendingStep}>2. Tunggu pengesahan dari admin</div>
          <div style={S.pendingStep}>3. Log masuk setelah diaktifkan</div>
        </div>

        {payInfo.whatsapp && (
          <a href={`https://wa.me/${payInfo.whatsapp}?text=Salam,%20saya%20${encodeURIComponent(fullName)}%20ingin%20mengesahkan%20bayaran%20RM${payInfo.price}%20untuk%20AEdu.`}
            target="_blank" rel="noopener noreferrer" style={{ ...S.waBtn, display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: 12 }}>
            💬 Hubungi Admin via WhatsApp
          </a>
        )}

        <Link href="/login" style={S.btn}>Pergi ke Log Masuk</Link>
      </div>
    </div>
  )

  // ── STEP: SUCCESS (free mode) ──
  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ fontSize: 64, marginBottom: 16, textAlign: 'center' }}>🎉</div>
        <h2 style={{ ...S.title, fontSize: 22, marginBottom: 8 }}>Pendaftaran Berjaya!</h2>
        <p style={{ color: '#64748B', fontSize: 14, marginBottom: 24, textAlign: 'center' }}>
          Akaun <strong>{fullName}</strong> telah dibuat. Sila log masuk untuk mula belajar!
        </p>
        <Link href="/login" style={S.btn}>Log Masuk Sekarang →</Link>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#4F46E5 0%,#06B6D4 100%)', padding: 16 },
  card: { background: 'white', borderRadius: 24, padding: '36px 24px', width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', textAlign: 'center' },
  logo: { width: 90, height: 90, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 24, fontWeight: 900, background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 },
  sub: { color: '#64748B', fontSize: 13, marginBottom: 20 },
  priceBanner: { display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg,#FFF7ED,#FFFBEB)', border: '1px solid #FDE68A', borderRadius: 14, padding: '14px 16px', marginBottom: 20, textAlign: 'left' },
  priceTag: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 28, fontWeight: 900, color: '#D97706', background: '#FEF3C7', borderRadius: 10, padding: '6px 14px', flexShrink: 0 },
  formGroup: { textAlign: 'left', marginBottom: 14 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', padding: '13px 15px', border: '2px solid #E2E8F0', borderRadius: 10, fontSize: 15, fontWeight: 600, outline: 'none', fontFamily: "'Inter',sans-serif" },
  hint: { fontSize: 11, color: '#94A3B8', marginTop: 5 },
  err: { background: '#FEF2F2', color: '#EF4444', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, textAlign: 'left', lineHeight: 1.5 },
  btn: { display: 'block', width: '100%', padding: 14, background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", textDecoration: 'none', textAlign: 'center', boxShadow: '0 6px 20px rgba(79,70,229,0.35)' },
  divider: { margin: '16px 0 10px', fontSize: 12, color: '#94A3B8' },
  loginLink: { display: 'block', padding: '12px', background: '#F1F5F9', color: '#4F46E5', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none', border: '1px solid #E2E8F0' },
  // Payment step
  progress: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 0 },
  progressDone: { fontSize: 11, fontWeight: 700, color: '#10B981', padding: '4px 10px', background: '#ECFDF5', borderRadius: 20 },
  progressActive: { fontSize: 11, fontWeight: 700, color: 'white', padding: '4px 10px', background: '#4F46E5', borderRadius: 20 },
  progressPending: { fontSize: 11, fontWeight: 700, color: '#94A3B8', padding: '4px 10px', background: '#F1F5F9', borderRadius: 20 },
  progressLine: { width: 16, height: 1, background: '#E2E8F0' },
  amountBox: { background: 'linear-gradient(135deg,#4F46E5,#6366F1)', borderRadius: 16, padding: '20px', marginBottom: 16, textAlign: 'center' },
  amountLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 },
  amountVal: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 42, fontWeight: 900, color: 'white', letterSpacing: '-1px' },
  amountSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  bankBox: { background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px', marginBottom: 14, textAlign: 'left' },
  bankTitle: { fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 12, fontFamily: "'Plus Jakarta Sans',sans-serif" },
  bankRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #E2E8F0' },
  bankLabel: { fontSize: 12, color: '#64748B', fontWeight: 500 },
  bankVal: { fontSize: 13, fontWeight: 700, color: '#0F172A' },
  copyBtn: { fontSize: 10, fontWeight: 700, padding: '3px 10px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' },
  qrBox: { background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px', marginBottom: 14, textAlign: 'left' },
  proofBox: { background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: '16px', marginBottom: 16, textAlign: 'left' },
  uploadLabel: { display: 'block', border: '2px dashed #86EFAC', borderRadius: 10, padding: '16px', textAlign: 'center', cursor: 'pointer', color: '#16A34A', fontSize: 13, fontWeight: 600 },
  waBtn: { display: 'block', padding: '12px', background: '#DCFCE7', color: '#15803D', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', marginBottom: 12, border: '1px solid #86EFAC' },
  backBtn: { background: 'none', border: 'none', color: '#94A3B8', fontSize: 13, cursor: 'pointer', marginTop: 8, width: '100%' },
  pendingBox: { background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '16px', marginBottom: 20, textAlign: 'left' },
  pendingStep: { fontSize: 13, color: '#78350F', padding: '4px 0', fontWeight: 500 },
}
