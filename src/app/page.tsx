'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Folder, type Banner } from '@/lib/supabase'

// Warna-warni untuk folder cards
const CARD_COLORS = [
  { bg: 'linear-gradient(135deg,#FF6B6B,#FF8E8E)', shadow: 'rgba(255,107,107,0.35)' },
  { bg: 'linear-gradient(135deg,#4ECDC4,#45B7AA)', shadow: 'rgba(78,205,196,0.35)' },
  { bg: 'linear-gradient(135deg,#A78BFA,#8B5CF6)', shadow: 'rgba(167,139,250,0.35)' },
  { bg: 'linear-gradient(135deg,#FCD34D,#F59E0B)', shadow: 'rgba(252,211,77,0.35)' },
  { bg: 'linear-gradient(135deg,#6EE7B7,#10B981)', shadow: 'rgba(110,231,183,0.35)' },
  { bg: 'linear-gradient(135deg,#93C5FD,#3B82F6)', shadow: 'rgba(147,197,253,0.35)' },
  { bg: 'linear-gradient(135deg,#FDA4AF,#F43F5E)', shadow: 'rgba(253,164,175,0.35)' },
  { bg: 'linear-gradient(135deg,#86EFAC,#22C55E)', shadow: 'rgba(134,239,172,0.35)' },
]

export default function StudentHome() {
  const router = useRouter()
  const [student, setStudent] = useState<{ id: string; full_name: string } | null>(null)
  const [folders, setFolders] = useState<Folder[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [bannerIdx, setBannerIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    // Guna localStorage supaya data kekal walaupun iframe dibuka
    const saved = localStorage.getItem('aedu_student') || sessionStorage.getItem('aedu_student')
    if (!saved) { router.replace('/login'); return }
    const s = JSON.parse(saved)
    // Simpan semula dalam localStorage untuk persistence
    localStorage.setItem('aedu_student', saved)
    setStudent(s)
    loadData().then(() => joinPresence(s))
    // Fallback: kalau loading lebih 5 saat, paksa tunjuk content
    const timeout = setTimeout(() => setLoading(false), 5000)
    return () => { channelRef.current?.unsubscribe(); clearTimeout(timeout) }
  }, [])

  const joinPresence = (s: { id: string; full_name: string }) => {
    const ch = supabase.channel('aedu_presence', {
      config: { presence: { key: s.id } }
    })
    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({
          user_id: s.id,
          full_name: s.full_name,
          online_at: new Date().toISOString(),
        })
      }
    })
    channelRef.current = ch
  }

  const loadData = async () => {
    const [{ data: f }, { data: b }] = await Promise.all([
      supabase.from('folders').select('*').order('order_num'),
      supabase.from('banners').select('*').eq('active', true).order('order_num'),
    ])
    setFolders(f || [])
    setBanners(b || [])
    setLoading(false)
  }

  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), 4000)
    return () => clearInterval(t)
  }, [banners])

  const logout = () => {
    channelRef.current?.unsubscribe()
    sessionStorage.removeItem('aedu_student')
    localStorage.removeItem('aedu_student')
    router.replace('/login')
  }

  if (loading) return (
    <div style={S.center}>
      <div style={S.loadingWrap}>
        <div style={S.loadingLogo}>🎓</div>
        <div style={S.loadingBar}><div style={S.loadingFill} /></div>
        <p style={S.loadingText}>Memuatkan AEdu...</p>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerTop}>
          <div style={S.brand}><img src='/logo.png' alt='AEdu' style={{height:36,objectFit:'contain',marginRight:6}}/> AEdu</div>
          <button style={S.logoutBtn} onClick={logout}>Keluar</button>
        </div>
        {student && (
          <p style={S.welcome}>
            Hai, <strong>{student.full_name}</strong>! 👋 Selamat belajar!
          </p>
        )}
      </div>

      {/* Banner Galeri */}
      {banners.length > 0 && (
        <div style={S.bannerWrap}>
          {banners.map((b, i) => (
            <div key={b.id} style={{
              ...S.bannerSlide,
              opacity: i === bannerIdx ? 1 : 0,
              transform: i === bannerIdx ? 'scale(1)' : 'scale(0.98)',
              pointerEvents: i === bannerIdx ? 'auto' : 'none',
              position: i === 0 ? 'relative' : 'absolute',
              top: 0, left: 0, right: 0,
            }} onClick={() => b.link_url && window.open(b.link_url, '_blank')}>
              {b.img_url
                ? <img src={b.img_url} alt={b.title} style={S.bannerImg} />
                : <div style={S.bannerPlaceholder}>
                    <span style={{ fontSize: 40 }}>📢</span>
                    <span style={{ fontWeight: 700, fontSize: 18, marginTop: 8, color: 'white' }}>{b.title}</span>
                  </div>}
              {b.title && b.img_url && <div style={S.bannerCaption}>{b.title}</div>}
            </div>
          ))}
          {banners.length > 1 && (
            <div style={S.bannerDots}>
              {banners.map((_, i) => (
                <button key={i} onClick={() => setBannerIdx(i)}
                  style={{ ...S.dot, width: i === bannerIdx ? 20 : 7, background: i === bannerIdx ? '#fff' : 'rgba(255,255,255,0.5)' }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Folders — Apps-style grid */}
      <div style={S.section}>
        <div style={S.sectionLabel}>✨ Pilih Aktiviti Pembelajaran</div>
        {folders.length === 0
          ? <div style={S.empty}>
              <span style={{ fontSize: 48 }}>📭</span>
              <p style={{ marginTop: 10 }}>Tiada folder lagi</p>
            </div>
          : <div style={S.appsGrid}>
              {folders.map((f, fi) => {
                const color = CARD_COLORS[fi % CARD_COLORS.length]
                return (
                  <div key={f.id} style={S.appItem} onClick={() => router.push(`/folder/${f.id}`)}>
                    <div style={{ ...S.appIcon, background: color.bg, boxShadow: `0 6px 20px ${color.shadow}` }}>
                      {f.img_url
                        ? <img src={f.img_url} alt={f.name} style={S.appIconImg} />
                        : <span style={S.appEmoji}>{f.emoji || '📁'}</span>}
                    </div>
                    <div style={S.appName}>{f.name}</div>
                  </div>
                )
              })}
            </div>}
      </div>

      {/* Admin tiny link */}
      <div style={S.adminLink}>
        <a href="/admin" style={S.adminTiny}>⚙️ Admin</a>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F4FF' },
  center: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#4F46E5,#06B6D4)' },
  loadingWrap: { textAlign: 'center', padding: 32 },
  loadingLogo: { fontSize: 56, marginBottom: 20, animation: 'bounce 1s infinite' },
  loadingBar: { width: 180, height: 6, background: 'rgba(255,255,255,0.25)', borderRadius: 10, margin: '0 auto 12px', overflow: 'hidden' },
  loadingFill: { height: '100%', width: '60%', background: 'white', borderRadius: 10, animation: 'loading 1.2s ease-in-out infinite' },
  loadingText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 600 },
  header: { background: 'linear-gradient(135deg,#4F46E5 0%,#06B6D4 100%)', padding: '20px 16px 16px' },
  headerTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  brand: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: 24, color: 'white', letterSpacing: '-0.5px' },
  logoutBtn: { padding: '6px 14px', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20, color: 'white', fontSize: 12, cursor: 'pointer', fontWeight: 600 },
  welcome: { color: 'rgba(255,255,255,0.92)', fontSize: 14 },
  bannerWrap: { margin: '14px 12px 0', borderRadius: 18, overflow: 'hidden', position: 'relative', background: '#1e1b4b', minHeight: 170 },
  bannerSlide: { width: '100%', minHeight: 170, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'opacity 0.5s ease, transform 0.5s ease' },
  bannerImg: { width: '100%', height: 180, objectFit: 'cover', display: 'block' },
  bannerPlaceholder: { height: 170, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', padding: 20 },
  bannerCaption: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,0.75))', color: 'white', padding: '28px 14px 12px', fontSize: 13, fontWeight: 700 },
  bannerDots: { position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, alignItems: 'center' },
  dot: { height: 7, borderRadius: 4, border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s ease' },
  section: { padding: '16px 12px 0', flex: 1 },
  sectionLabel: { fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', color: '#6366F1', textTransform: 'uppercase', marginBottom: 14, paddingLeft: 4 },
  // Apps-style grid
  appsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px 8px', padding: '0 4px 24px' },
  appItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' },
  appIcon: { width: 72, height: 72, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', transition: 'transform 0.15s', flexShrink: 0 },
  appIconImg: { width: '100%', height: '100%', objectFit: 'cover' },
  appEmoji: { fontSize: 36, lineHeight: 1 },
  appName: { fontSize: 11, fontWeight: 600, color: '#1E293B', textAlign: 'center', lineHeight: 1.3, wordBreak: 'break-word', maxWidth: 76 },
  empty: { textAlign: 'center', padding: '40px 20px', color: '#64748B', fontSize: 14 },
  adminLink: { textAlign: 'center', padding: '20px 0 16px', marginTop: 'auto' },
  adminTiny: { fontSize: 11, color: '#94A3B8', textDecoration: 'none', padding: '5px 12px', border: '1px solid #E2E8F0', borderRadius: 20, background: 'white' },  footer: { textAlign: 'center' as const, padding: '12px 16px 24px', marginTop: 8 },  footerText: { fontSize: 12, color: '#64748B', fontWeight: 500 },  footerSub: { fontSize: 10, color: '#CBD5E1', marginTop: 3 },
}
