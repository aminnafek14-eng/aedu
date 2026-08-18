'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Banner } from '@/lib/supabase'

type LinkItem = {
  id: string; name: string; url: string | null
  html_content: string | null; content_type: 'url' | 'html'
  img_url: string | null; emoji: string
  tags: string[]; access_type: 'free' | 'premium'
  folder_id: string; order_num: number
}

type StudentSession = { id: string; full_name: string; student_id: string; is_subscribed: boolean; is_premium: boolean }

const COLORS = [
  { bg: 'linear-gradient(145deg,#FF6B6B,#FF8E53)', shadow: 'rgba(255,107,107,0.35)' },
  { bg: 'linear-gradient(145deg,#4ECDC4,#2BB5AC)', shadow: 'rgba(78,205,196,0.35)' },
  { bg: 'linear-gradient(145deg,#A78BFA,#7C3AED)', shadow: 'rgba(167,139,250,0.35)' },
  { bg: 'linear-gradient(145deg,#F59E0B,#D97706)', shadow: 'rgba(245,158,11,0.35)' },
  { bg: 'linear-gradient(145deg,#10B981,#059669)', shadow: 'rgba(16,185,129,0.35)' },
  { bg: 'linear-gradient(145deg,#3B82F6,#1D4ED8)', shadow: 'rgba(59,130,246,0.35)' },
  { bg: 'linear-gradient(145deg,#F43F5E,#BE123C)', shadow: 'rgba(244,63,94,0.35)' },
  { bg: 'linear-gradient(145deg,#8B5CF6,#6D28D9)', shadow: 'rgba(139,92,246,0.35)' },
  { bg: 'linear-gradient(145deg,#EC4899,#BE185D)', shadow: 'rgba(236,72,153,0.35)' },
  { bg: 'linear-gradient(145deg,#F97316,#C2410C)', shadow: 'rgba(249,115,22,0.35)' },
  { bg: 'linear-gradient(145deg,#06B6D4,#0E7490)', shadow: 'rgba(6,182,212,0.35)' },
  { bg: 'linear-gradient(145deg,#84CC16,#4D7C0F)', shadow: 'rgba(132,204,22,0.35)' },
]

// Extract unique subjects from tags (non-Tahun tags)
const YEAR_TAGS = ['Tahun 1', 'Tahun 2', 'Tahun 3', 'Tahun 4', 'Tahun 5', 'Tahun 6']

export default function StudentHome() {
  const router = useRouter()
  const [student, setStudent] = useState<StudentSession | null>(null)
  const [allLinks, setAllLinks] = useState<LinkItem[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [bannerIdx, setBannerIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filterSubject, setFilterSubject] = useState('Semua')
  const [filterYear, setFilterYear] = useState('Semua')
  const [activeLink, setActiveLink] = useState<LinkItem | null>(null)
  const [upgradeTarget, setUpgradeTarget] = useState<LinkItem | null>(null)
  const [upgradeStep, setUpgradeStep] = useState<'ad'|'payment'>('ad')
  const [payInfo, setPayInfo] = useState({ price: '50', bank: '', accountName: '', accountNumber: '', qrUrl: '', whatsapp: '', instructions: '' })
  const [proofUrl, setProofUrl] = useState('')
  const [uploadingProof, setUploadingProof] = useState(false)
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)
  const [iframeLoading, setIframeLoading] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('aedu_student') || sessionStorage.getItem('aedu_student')
    if (!saved) { router.replace('/login'); return }
    const s = JSON.parse(saved)
    localStorage.setItem('aedu_student', saved)
    setStudent(s)
    loadData().then(() => startHeartbeat(s))
    const timeout = setTimeout(() => setLoading(false), 5000)
    return () => { channelRef.current?.unsubscribe(); clearTimeout(timeout) }
  }, [])

  // Heartbeat: update last_seen setiap 2 minit
  // Tiada WebSocket — hanya HTTP request biasa
  const startHeartbeat = (s: StudentSession) => {
    const ping = async () => {
      const { error } = await supabase
        .from('students')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', s.id)
      if (error) console.error('Heartbeat error:', error)
    }
    ping() // terus ping bila login
    const interval = setInterval(ping, 2 * 60 * 1000) // setiap 2 minit
    channelRef.current = { unsubscribe: () => clearInterval(interval) } as any
  }

  // ── MURID: POLLING SAHAJA — tiada Realtime WebSocket ──
  // 500 murid = 0 Realtime connections dari murid
  // Admin kekal 1 Realtime connection sahaja
  useEffect(() => {
    if (!student) return

    // Poll premium status setiap 30 saat
    const premiumInterval = setInterval(async () => {
      const { data } = await supabase
        .from('students')
        .select('id, full_name, student_id, is_subscribed, is_premium')
        .eq('id', student.id)
        .single()
      if (data) {
        const newSession = JSON.stringify({
          id: data.id, full_name: data.full_name,
          student_id: data.student_id,
          is_subscribed: data.is_subscribed,
          is_premium: data.is_premium,
        })
        sessionStorage.setItem('aedu_student', newSession)
        localStorage.setItem('aedu_student', newSession)
        // Hanya update state jika ada perubahan
        if (data.is_premium !== student.is_premium || data.is_subscribed !== student.is_subscribed) {
          setStudent(data as StudentSession)
        }
      }
    }, 30 * 1000) // 30 saat

    // Poll apps & content setiap 5 minit
    const contentInterval = setInterval(() => {
      loadData()
    }, 5 * 60 * 1000) // 5 minit

    return () => {
      clearInterval(premiumInterval)
      clearInterval(contentInterval)
    }
  }, [student?.id])

  const loadData = async () => {
    const [{ data: l }, { data: b }, { data: settings }] = await Promise.all([
      supabase.from('links').select('*').order('order_num'),
      supabase.from('banners').select('*').eq('active', true).order('order_num'),
      supabase.from('app_settings').select('key,value'),
    ])
    setAllLinks((l || []) as LinkItem[])
    setBanners(b || [])
    if (settings) {
      const m: Record<string,string> = {}
      settings.forEach((s: {key:string;value:string}) => { m[s.key] = s.value })
      setPayInfo({
        price: m['payment_price'] || '50',
        bank: m['payment_bank'] || '',
        accountName: m['payment_account_name'] || '',
        accountNumber: m['payment_account_number'] || '',
        qrUrl: m['payment_qr_url'] || '',
        whatsapp: m['payment_whatsapp'] || '',
        instructions: m['payment_instructions'] || '',
      })
    }
    setLoading(false)
  }

  const refreshStudentSession = async (studentId: string) => {
    // Refresh student data dari DB (premium status, subscription dll)
    const { data } = await supabase.from('students')
      .select('id, full_name, student_id, is_subscribed, is_premium')
      .eq('id', studentId).single()
    if (data) {
      const updated = JSON.stringify({
        id: data.id, full_name: data.full_name,
        student_id: data.student_id,
        is_subscribed: data.is_subscribed,
        is_premium: data.is_premium,
      })
      sessionStorage.setItem('aedu_student', updated)
      localStorage.setItem('aedu_student', updated)
      setStudent(data as StudentSession)
    }
  }

  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), 4000)
    return () => clearInterval(t)
  }, [banners])

  const logout = () => {
    channelRef.current?.unsubscribe()
    sessionStorage.removeItem('aedu_student'); localStorage.removeItem('aedu_student')
    router.replace('/login')
  }

  // Get unique subjects (non-year tags)
  const allSubjects = ['Semua', ...Array.from(new Set(
    allLinks.flatMap(l => (l.tags || []).filter(t => !YEAR_TAGS.includes(t)))
  )).sort()]

  // Get year tags available for current subject filter
  const availableYears = ['Semua', ...Array.from(new Set(
    allLinks
      .filter(l => filterSubject === 'Semua' || (l.tags || []).includes(filterSubject))
      .flatMap(l => (l.tags || []).filter(t => YEAR_TAGS.includes(t)))
  )).sort()]

  // Filter links
  const filteredLinks = allLinks.filter(l => {
    const tags = l.tags || []
    const subjectMatch = filterSubject === 'Semua' || tags.includes(filterSubject)
    const yearMatch = filterYear === 'Semua' || tags.includes(filterYear)
    return subjectMatch && yearMatch
  })

  const canAccess = (link: LinkItem) => {
    if (link.access_type !== 'premium') return true
    return student?.is_premium || student?.is_subscribed
  }

  const firstName = student?.full_name.split(' ')[0] || ''

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#4F46E5,#06B6D4)' }}>
      <img src="/logo.png" alt="AEdu" style={{ width: 90, height: 90, objectFit: 'contain', marginBottom: 20 }} />
      <div style={{ width: 200, height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'white', borderRadius: 20, animation: 'loadbar 1.5s ease-in-out infinite' }} />
      </div>
      <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: 14, fontSize: 14, fontWeight: 600 }}>Memuatkan AEdu.my...</p>
      <style>{`@keyframes loadbar{0%{width:0%}50%{width:70%}100%{width:100%}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FF', fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes loadbar{0%{width:0%;opacity:1}80%{width:90%;opacity:1}100%{width:100%;opacity:0}}
        .app-card{transition:transform .18s,box-shadow .18s!important;animation:fadeUp .35s ease both}
        .app-card:active{transform:scale(.93)!important}
        @media(hover:hover){.app-card:hover{transform:translateY(-4px) scale(1.02)!important}}
        .filter-btn{transition:all .2s;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif}
        .filter-btn:active{transform:scale(.94)}
        .filter-scroll::-webkit-scrollbar{display:none}
        .apps-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
        @media(min-width:480px){.apps-grid{grid-template-columns:repeat(3,1fr)}}
        @media(min-width:768px){.apps-grid{grid-template-columns:repeat(4,1fr);gap:18px}}
        @media(min-width:1100px){.apps-grid{grid-template-columns:repeat(5,1fr);gap:20px}}
      `}</style>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#4F46E5 0%,#06B6D4 100%)', padding: '16px 16px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, background: 'rgba(255,255,255,0.07)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -40, left: '25%', width: 160, height: 160, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="AEdu" style={{ width: 40, height: 40, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))' }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: 22, color: 'white' }}>AEdu.my</span>
          </div>
          <button onClick={logout} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 30, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Keluar</button>
        </div>
        {student && (
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: 16, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 2 }}>Selamat datang! 🎉</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: 18, color: 'white' }}>Hai, {firstName}! 👋</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>ID: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{student.student_id}</span></div>
              </div>
              {(student.is_premium || student.is_subscribed) && (
                <div style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                  💎 PREMIUM
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BANNER */}
      {banners.length > 0 && (
        <div style={{ margin: '14px 12px 0', borderRadius: 20, overflow: 'hidden', position: 'relative', background: '#1e1b4b', boxShadow: '0 8px 32px rgba(79,70,229,0.2)' }}>
          {banners.map((b, i) => (
            <div key={b.id} style={{ display: i === bannerIdx ? 'block' : 'none' }} onClick={() => b.link_url && window.open(b.link_url, '_blank')}>
              {b.img_url
                ? <img src={b.img_url} alt={b.title} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block', cursor: b.link_url ? 'pointer' : 'default' }} />
                : <div style={{ height: 170, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', cursor: 'pointer' }}>
                    <span style={{ fontSize: 36, marginBottom: 8 }}>📢</span>
                    <span style={{ fontWeight: 800, fontSize: 18, color: 'white', textAlign: 'center', padding: '0 20px' }}>{b.title}</span>
                  </div>}
              {b.title && b.img_url && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,0.75))', color: 'white', padding: '28px 16px 12px', fontSize: 14, fontWeight: 700 }}>{b.title}</div>}
            </div>
          ))}
          {banners.length > 1 && (
            <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
              {banners.map((_, i) => <button key={i} onClick={() => setBannerIdx(i)} style={{ height: 6, width: i === bannerIdx ? 20 : 6, borderRadius: 3, border: 'none', background: i === bannerIdx ? 'white' : 'rgba(255,255,255,0.45)', cursor: 'pointer', padding: 0, transition: 'all 0.3s' }} />)}
            </div>
          )}
        </div>
      )}

      {/* FILTER SECTION */}
      <div style={{ padding: '16px 12px 0' }}>
        {/* Subject Filter */}
        {allSubjects.length > 1 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 4, height: 20, background: 'linear-gradient(#4F46E5,#06B6D4)', borderRadius: 4 }} />
              <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 14, color: '#1E293B' }}>Pilih Subjek</span>
              <span style={{ fontSize: 15 }}>📖</span>
            </div>
            <div className="filter-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', marginBottom: 12 }}>
              {allSubjects.map(subj => {
                const active = filterSubject === subj
                return (
                  <button key={subj} className="filter-btn" onClick={() => { setFilterSubject(subj); setFilterYear('Semua') }} style={{
                    flexShrink: 0, padding: '8px 16px', borderRadius: 30,
                    background: active ? '#4F46E5' : 'white',
                    color: active ? 'white' : '#475569',
                    fontSize: 13, fontWeight: 700,
                    boxShadow: active ? '0 4px 14px rgba(79,70,229,0.3)' : '0 2px 6px rgba(0,0,0,0.07)',
                    border: `2px solid ${active ? '#4F46E5' : '#E2E8F0'}`
                  }}>
                    {subj === 'Semua' ? '✨ Semua' : subj}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* Year Filter (shown after subject selected) */}
        {availableYears.length > 1 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 4, height: 18, background: 'linear-gradient(#F59E0B,#EF4444)', borderRadius: 4 }} />
              <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 13, color: '#1E293B' }}>Tapis Tahun</span>
              <span style={{ fontSize: 14 }}>🎯</span>
            </div>
            <div className="filter-scroll" style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', marginBottom: 12 }}>
              {availableYears.map(yr => {
                const active = filterYear === yr
                const colors: Record<string, string> = { 'Tahun 1': '#EF4444', 'Tahun 2': '#F97316', 'Tahun 3': '#D97706', 'Tahun 4': '#10B981', 'Tahun 5': '#3B82F6', 'Tahun 6': '#7C3AED' }
                const c = colors[yr] || '#64748B'
                return (
                  <button key={yr} className="filter-btn" onClick={() => setFilterYear(yr)} style={{
                    flexShrink: 0, padding: '7px 14px', borderRadius: 30,
                    background: active ? c : 'white',
                    color: active ? 'white' : c,
                    fontSize: 12, fontWeight: 800,
                    boxShadow: active ? `0 4px 12px ${c}50` : '0 2px 6px rgba(0,0,0,0.07)',
                    border: `2px solid ${active ? c : c + '40'}`
                  }}>
                    {yr === 'Semua' ? '📚 Semua Tahun' : yr}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* APPS GRID */}
      <div style={{ padding: '4px 12px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 4, height: 20, background: 'linear-gradient(#4F46E5,#06B6D4)', borderRadius: 4 }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 15, color: '#1E293B' }}>
              {filterSubject === 'Semua' && filterYear === 'Semua' ? 'Semua Aktiviti' : filterSubject !== 'Semua' && filterYear !== 'Semua' ? `${filterSubject} — ${filterYear}` : filterSubject !== 'Semua' ? filterSubject : filterYear}
            </span>
          </div>
          <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, background: 'white', padding: '4px 10px', borderRadius: 20, border: '1px solid #E2E8F0' }}>
            {filteredLinks.length} aktiviti
          </span>
        </div>

        {filteredLinks.length === 0
          ? <div style={{ textAlign: 'center', padding: '50px 20px', background: 'white', borderRadius: 24, border: '2px dashed #E2E8F0' }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 700, color: '#64748B', fontSize: 15 }}>Tiada aktiviti ditemui</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Cuba tapis yang lain</div>
            </div>
          : <div className="apps-grid">
              {filteredLinks.map((l, li) => {
                const color = COLORS[li % COLORS.length]
                const tags = l.tags || []
                const yearTags = tags.filter(t => YEAR_TAGS.includes(t))
                const isPremium = l.access_type === 'premium'
                const accessible = canAccess(l)

                return (
                  <div key={l.id} className="app-card" onClick={() => {
                    if (!accessible) { setUpgradeTarget(l); return }
                    setIframeLoading(true); setActiveLink(l)
                  }} style={{ cursor: accessible ? 'pointer' : 'not-allowed', animationDelay: `${li * 0.05}s`, opacity: accessible ? 1 : 0.75 }}>
                    <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: `0 6px 24px ${color.shadow}`, position: 'relative' }}>
                      {/* Icon area */}
                      <div style={{ aspectRatio: '1/1', background: l.img_url ? 'transparent' : color.bg, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {l.img_url
                          ? <img src={l.img_url} alt={l.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : <>
                              <div style={{ position: 'absolute', top: -8, right: -8, width: 50, height: 50, background: 'rgba(255,255,255,0.15)', borderRadius: '50%' }} />
                              <span style={{ fontSize: 48, position: 'relative', zIndex: 1 }}>🎮</span>
                            </>}

                        {/* FREE / PREMIUM badge */}
                        <div style={{ position: 'absolute', top: 7, left: 7 }}>
                          {isPremium
                            ? <div style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: 'white', fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 3, boxShadow: '0 2px 8px rgba(245,158,11,0.5)' }}>💎 PREMIUM</div>
                            : <div style={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white', fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 20, boxShadow: '0 2px 8px rgba(16,185,129,0.4)' }}>✓ FREE</div>}
                        </div>

                        {/* Lock overlay for premium if not accessible */}
                        {!accessible && (
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(79,70,229,0.7),rgba(124,58,237,0.8))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
                            <div style={{ fontSize: 26, marginBottom: 4, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🔒</div>
                            <div style={{ color: 'white', fontSize: 9, fontWeight: 900, textAlign: 'center', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 20 }}>PREMIUM</div>
                          </div>
                        )}
                      </div>

                      {/* Name + year tags */}
                      <div style={{ padding: '8px 9px 10px' }}>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 12, color: '#1E293B', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: yearTags.length > 0 ? 5 : 0 }}>
                          {l.name}
                        </div>
                        {yearTags.length > 0 && (
                          <div style={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {yearTags.slice(0, 2).map(tag => {
                              const yColors: Record<string, { bg: string; text: string }> = { 'Tahun 1': { bg: '#FEE2E2', text: '#DC2626' }, 'Tahun 2': { bg: '#FED7AA', text: '#EA580C' }, 'Tahun 3': { bg: '#FEF3C7', text: '#D97706' }, 'Tahun 4': { bg: '#D1FAE5', text: '#059669' }, 'Tahun 5': { bg: '#DBEAFE', text: '#2563EB' }, 'Tahun 6': { bg: '#EDE9FE', text: '#7C3AED' } }
                              const yc = yColors[tag] || { bg: '#F1F5F9', text: '#64748B' }
                              return <span key={tag} style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 20, background: yc.bg, color: yc.text }}>{tag}</span>
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>}
      </div>

      {/* FOOTER */}
      <div style={{ textAlign: 'center', padding: '28px 16px 20px', marginTop: 8 }}>
        <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Dibina oleh <strong style={{ color: '#64748B' }}>Cikgu Amin</strong> dari SK Felda Inas</div>
        <div style={{ fontSize: 10, color: '#CBD5E1' }}>© 2026 AEdu.my — Hak Cipta Terpelihara</div>
        <a href="/admin" style={{ display: 'inline-block', marginTop: 12, fontSize: 11, color: '#CBD5E1', textDecoration: 'none', padding: '5px 14px', border: '1px solid #E2E8F0', borderRadius: 20, background: 'white' }}>⚙️ Admin</a>
      </div>

      {/* ── UPGRADE PREMIUM POPUP ── */}
      {upgradeTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 0 0' }}
          onClick={e => { if(e.target === e.currentTarget){ setUpgradeTarget(null); setUpgradeStep('ad'); setPaymentSubmitted(false); setProofUrl('') }}}>

          <div style={{ background: 'white', borderRadius: '28px 28px 0 0', width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', paddingBottom: 32 }}>

            {/* AD STEP */}
            {upgradeStep === 'ad' && !paymentSubmitted && (
              <>
                {/* Hero banner */}
                <div style={{ background: 'linear-gradient(135deg,#4F46E5 0%,#7C3AED 50%,#EC4899 100%)', padding: '32px 24px 28px', position: 'relative', overflow: 'hidden', borderRadius: '28px 28px 0 0' }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
                  <div style={{ position: 'absolute', bottom: -30, left: '20%', width: 160, height: 160, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                  <button onClick={() => { setUpgradeTarget(null); setUpgradeStep('ad') }}
                    style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  <div style={{ textAlign: 'center', position: 'relative' }}>
                    <div style={{ fontSize: 56, marginBottom: 8, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>💎</div>
                    <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 26, fontWeight: 900, color: 'white', marginBottom: 6, letterSpacing: '-0.5px' }}>AEdu Premium</h2>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>Buka kunci semua aktiviti pembelajaran!</p>
                  </div>
                </div>

                <div style={{ padding: '24px 20px' }}>
                  {/* Locked app preview */}
                  <div style={{ background: '#F8FAFC', borderRadius: 16, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #E2E8F0' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {upgradeTarget.img_url
                        ? <img src={upgradeTarget.img_url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
                        : <span style={{ fontSize: 26 }}>🎮</span>}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>{upgradeTarget.name}</div>
                      <div style={{ fontSize: 12, color: '#6366F1', fontWeight: 600, marginTop: 2 }}>🔒 Aktiviti Premium — Kunci dengan upgrade!</div>
                    </div>
                  </div>

                  {/* Features */}
                  <div style={{ marginBottom: 20 }}>
                    {[
                      { icon: '🎮', text: 'Akses SEMUA aktiviti & games premium' },
                      { icon: '⚡', text: 'Kandungan baru ditambah setiap minggu' },
                      { icon: '🏆', text: 'Pembelajaran interaktif yang lebih menyeronokkan' },
                      { icon: '👨‍👩‍👧', text: 'Sesuai untuk semua tahun persekolahan' },
                    ].map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 3 ? '1px solid #F1F5F9' : 'none' }}>
                        <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
                        <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{f.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price */}
                  <div style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', borderRadius: 20, padding: '20px', marginBottom: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 600, marginBottom: 4 }}>HARGA ISTIMEWA</div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 48, fontWeight: 900, color: 'white', letterSpacing: '-2px' }}>
                      RM{payInfo.price}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>✨ Bayar sekali • Guna selamanya • Tiada yuran bulanan</div>
                  </div>

                  <button onClick={() => setUpgradeStep('payment')} style={{
                    width: '100%', padding: '16px', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
                    color: 'white', border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 800,
                    cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif",
                    boxShadow: '0 8px 24px rgba(79,70,229,0.4)', letterSpacing: '-0.3px'
                  }}>
                    💎 Upgrade ke Premium — RM{payInfo.price}
                  </button>
                  <button onClick={() => { setUpgradeTarget(null); setUpgradeStep('ad') }}
                    style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: '#94A3B8', fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
                    Mungkin lain kali
                  </button>
                </div>
              </>
            )}

            {/* PAYMENT STEP */}
            {upgradeStep === 'payment' && !paymentSubmitted && (
              <>
                <div style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', padding: '20px 20px 16px', borderRadius: '28px 28px 0 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setUpgradeStep('ad')} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: 16, cursor: 'pointer' }}>←</button>
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 17, color: 'white', flex: 1 }}>Buat Pembayaran</div>
                  <button onClick={() => { setUpgradeTarget(null); setUpgradeStep('ad') }}
                    style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: 16, cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ padding: '20px' }}>
                  {/* Amount */}
                  <div style={{ background: 'linear-gradient(135deg,#4F46E5,#6366F1)', borderRadius: 16, padding: '18px', marginBottom: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600, marginBottom: 4 }}>JUMLAH BAYARAN</div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 40, fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>RM {payInfo.price}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Akses Lifetime Premium</div>
                  </div>

                  {/* Bank details */}
                  <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '16px', marginBottom: 14, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12, color: '#0F172A' }}>📋 Maklumat Pembayaran</div>
                    {payInfo.instructions && <p style={{ fontSize: 12, color: '#475569', marginBottom: 10, lineHeight: 1.5 }}>{payInfo.instructions}</p>}
                    {[['🏦 Bank', payInfo.bank], ['👤 Nama Akaun', payInfo.accountName], ['🔢 No. Akaun', payInfo.accountNumber]].map(([k,v]) => v ? (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ fontSize: 12, color: '#64748B' }}>{k}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{v}</span>
                          {k.includes('Akaun') && k.includes('No') && (
                            <button onClick={() => navigator.clipboard.writeText(v)}
                              style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Salin</button>
                          )}
                        </div>
                      </div>
                    ) : null)}
                  </div>

                  {payInfo.qrUrl && (
                    <div style={{ textAlign: 'center', marginBottom: 14 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>📱 Atau imbas QR</div>
                      <img src={payInfo.qrUrl} alt="QR" style={{ width: 160, height: 160, objectFit: 'contain', borderRadius: 12 }} />
                    </div>
                  )}

                  {/* Upload proof */}
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '14px', marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>📸 Muat Naik Bukti Bayaran</div>
                    {proofUrl
                      ? <div style={{ textAlign: 'center' }}>
                          <img src={proofUrl} style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8 }} />
                          <p style={{ fontSize: 12, color: '#10B981', fontWeight: 700, marginTop: 6 }}>✓ Bukti dimuat naik</p>
                        </div>
                      : <label style={{ display: 'block', border: '2px dashed #86EFAC', borderRadius: 10, padding: '14px', textAlign: 'center', cursor: 'pointer', color: '#16A34A', fontSize: 13, fontWeight: 600 }}>
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                            const f = e.target.files?.[0]; if (!f) return
                            setUploadingProof(true)
                            const r = new FileReader(); r.onload = async ev => {
                              const d = ev.target!.result as string
                              const arr = d.split(','), mime = arr[0].match(/:(.*?);/)![1]
                              const bstr = atob(arr[1]); const u8 = new Uint8Array(bstr.length)
                              for (let i=0;i<bstr.length;i++) u8[i]=bstr.charCodeAt(i)
                              const blob = new Blob([u8],{type:mime})
                              const fname = `proof_${Date.now()}.${mime.split('/')[1]}`
                              const { error } = await supabase.storage.from('images').upload(fname, blob)
                              if (!error) {
                                const { data } = supabase.storage.from('images').getPublicUrl(fname)
                                setProofUrl(data.publicUrl)
                              }
                              setUploadingProof(false)
                            }; r.readAsDataURL(f)
                          }} />
                          {uploadingProof ? '⏳ Memuat naik...' : '📎 Ketik untuk pilih gambar resit'}
                        </label>}
                  </div>

                  <button onClick={async () => {
                    if (!student) return
                    // Submit payment request
                    const { data: studentData } = await supabase
                      .from('students').select('parent_phone').eq('id', student.id).single()
                    await supabase.from('payment_requests').insert({
                      student_id: student.id,
                      full_name: student.full_name,
                      parent_phone: studentData?.parent_phone || '',
                      amount: payInfo.price,
                      proof_url: proofUrl || null,
                      status: 'pending',
                    })
                    setPaymentSubmitted(true)
                  }} style={{
                    width: '100%', padding: '15px', background: 'linear-gradient(135deg,#10B981,#059669)',
                    color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 800,
                    cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif",
                    boxShadow: '0 6px 20px rgba(16,185,129,0.35)'
                  }}>
                    ✅ Saya Sudah Bayar — Hantar
                  </button>

                  {payInfo.whatsapp && (
                    <a href={`https://wa.me/${payInfo.whatsapp}?text=Salam%2C+saya+${encodeURIComponent(student?.full_name||'')}+ingin+upgrade+ke+AEdu+Premium+RM${payInfo.price}.`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'block', padding: '12px', background: '#DCFCE7', color: '#15803D', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', marginTop: 10, textAlign: 'center', border: '1px solid #86EFAC' }}>
                      💬 Hubungi Admin via WhatsApp
                    </a>
                  )}
                </div>
              </>
            )}

            {/* SUCCESS STEP */}
            {paymentSubmitted && (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Terima Kasih!</h2>
                <p style={{ color: '#64748B', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                  Permintaan upgrade anda telah dihantar. Admin akan mengesahkan bayaran dan mengaktifkan Premium dalam masa <strong>24 jam</strong>.
                </p>
                <div style={{ background: '#EEF2FF', borderRadius: 14, padding: '16px', marginBottom: 20, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: '#3730A3', marginBottom: 8, fontSize: 13 }}>📋 Langkah seterusnya:</div>
                  <div style={{ fontSize: 13, color: '#4338CA', lineHeight: 1.8 }}>
                    1. Simpan resit bayaran anda<br/>
                    2. Tunggu pengesahan admin<br/>
                    3. Log keluar dan log masuk semula selepas diaktifkan
                  </div>
                </div>
                <button onClick={() => { setUpgradeTarget(null); setUpgradeStep('ad'); setPaymentSubmitted(false); setProofUrl('') }}
                  style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* IFRAME VIEWER */}
      {activeLink && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', background: 'white' }}>
          <div style={{ height: 52, background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10, flexShrink: 0 }}>
            <button onClick={() => setActiveLink(null)} style={{ padding: '7px 16px', background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 25, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>✕ Tutup</button>
            <div style={{ flex: 1, color: 'white', fontSize: 14, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{activeLink.name}</div>
            {activeLink.access_type === 'premium' && <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, background: 'rgba(245,158,11,0.3)', color: '#FDE68A', border: '1px solid rgba(245,158,11,0.4)', flexShrink: 0 }}>💎 PREMIUM</span>}
            {activeLink.content_type === 'url' && activeLink.url && <a href={activeLink.url} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, color: 'white', fontSize: 13, textDecoration: 'none', flexShrink: 0 }}>↗</a>}
          </div>
          {iframeLoading && <div style={{ height: 3, background: '#EEF2FF', flexShrink: 0 }}><div style={{ height: '100%', background: 'linear-gradient(90deg,#4F46E5,#06B6D4)', animation: 'loadbar 1.5s ease infinite' }} /></div>}
          {activeLink.content_type === 'html'
            ? <iframe ref={iframeRef} srcDoc={activeLink.html_content || ''} style={{ flex: 1, width: '100%', border: 'none', display: 'block' }} title={activeLink.name} onLoad={() => setIframeLoading(false)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-pointer-lock" />
            : <iframe ref={iframeRef} src={activeLink.url || ''} style={{ flex: 1, width: '100%', border: 'none', display: 'block' }} title={activeLink.name} onLoad={() => setIframeLoading(false)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation" />}
        </div>
      )}
    </div>
  )
}
