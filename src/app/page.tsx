'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Banner } from '@/lib/supabase'

type LinkItem = {
  id: string; name: string; url: string | null
  html_content: string | null; content_type: 'url' | 'html'
  img_url: string | null; emoji: string; tags: string[]
  folder_id: string; order_num: number
}

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

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Tahun 1': { bg: '#FFF0F0', text: '#EF4444', border: '#FECACA' },
  'Tahun 2': { bg: '#FFF7ED', text: '#F97316', border: '#FED7AA' },
  'Tahun 3': { bg: '#FEFCE8', text: '#D97706', border: '#FDE68A' },
  'Tahun 4': { bg: '#F0FDF4', text: '#10B981', border: '#BBF7D0' },
  'Tahun 5': { bg: '#EFF6FF', text: '#3B82F6', border: '#BFDBFE' },
  'Tahun 6': { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
  'Matematik': { bg: '#FFF0F0', text: '#EF4444', border: '#FECACA' },
  'Sains': { bg: '#F0FDF4', text: '#10B981', border: '#BBF7D0' },
  'Bahasa': { bg: '#EFF6FF', text: '#3B82F6', border: '#BFDBFE' },
}

const getTagStyle = (tag: string) => TAG_COLORS[tag] || { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' }

export default function StudentHome() {
  const router = useRouter()
  const [student, setStudent] = useState<{ id: string; full_name: string } | null>(null)
  const [allLinks, setAllLinks] = useState<LinkItem[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [bannerIdx, setBannerIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string>('Semua')
  const [activeLink, setActiveLink] = useState<LinkItem | null>(null)
  const [iframeLoading, setIframeLoading] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('aedu_student') || sessionStorage.getItem('aedu_student')
    if (!saved) { router.replace('/login'); return }
    const s = JSON.parse(saved)
    localStorage.setItem('aedu_student', saved)
    setStudent(s)
    loadData().then(() => joinPresence(s))
    const timeout = setTimeout(() => setLoading(false), 5000)
    return () => { channelRef.current?.unsubscribe(); clearTimeout(timeout) }
  }, [])

  const joinPresence = (s: { id: string; full_name: string }) => {
    const ch = supabase.channel('aedu_presence', { config: { presence: { key: s.id } } })
    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({ user_id: s.id, full_name: s.full_name, online_at: new Date().toISOString() })
      }
    })
    channelRef.current = ch
  }

  const loadData = async () => {
    const [{ data: l }, { data: b }] = await Promise.all([
      supabase.from('links').select('*').order('order_num'),
      supabase.from('banners').select('*').eq('active', true).order('order_num'),
    ])
    setAllLinks((l || []) as LinkItem[])
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

  // Get all unique tags from links
  const allTags = ['Semua', ...Array.from(new Set(allLinks.flatMap(l => l.tags || []))).sort()]

  // Filter links
  const filteredLinks = activeFilter === 'Semua'
    ? allLinks
    : allLinks.filter(l => (l.tags || []).includes(activeFilter))

  const firstName = student?.full_name.split(' ')[0] || ''

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#4F46E5,#06B6D4)' }}>
      <img src="/logo.png" alt="AEdu" style={{ width: 90, height: 90, objectFit: 'contain', marginBottom: 20 }} />
      <div style={{ width: 200, height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'white', borderRadius: 20, animation: 'loadbar 1.5s ease-in-out infinite' }} />
      </div>
      <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: 14, fontSize: 14, fontWeight: 600 }}>Memuatkan AEdu.my...</p>
      <style>{`@keyframes loadbar { 0%{width:0%} 50%{width:70%} 100%{width:100%} }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FF', fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes loadbar { 0%{width:0%;opacity:1} 80%{width:90%;opacity:1} 100%{width:100%;opacity:0} }
        .app-card { transition: transform 0.18s, box-shadow 0.18s !important; animation: fadeUp 0.35s ease both; }
        .app-card:active { transform: scale(0.93) !important; }
        @media (hover:hover) { .app-card:hover { transform: translateY(-4px) scale(1.02) !important; } }
        .filter-btn { transition: all 0.2s; }
        .filter-btn:active { transform: scale(0.94); }
        .logout-btn:active { transform: scale(0.95); }
        .apps-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 14px; }
        @media (min-width:480px) { .apps-grid { grid-template-columns: repeat(3,1fr); } }
        @media (min-width:768px) { .apps-grid { grid-template-columns: repeat(4,1fr); gap: 18px; } }
        @media (min-width:1100px) { .apps-grid { grid-template-columns: repeat(5,1fr); gap: 20px; } }
        .filter-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: 'linear-gradient(135deg,#4F46E5 0%,#06B6D4 100%)', padding: '16px 16px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, background: 'rgba(255,255,255,0.07)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -40, left: '25%', width: 160, height: 160, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="AEdu" style={{ width: 40, height: 40, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))' }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: 22, color: 'white', letterSpacing: '-0.5px' }}>AEdu.my</span>
          </div>
          <button className="logout-btn" onClick={logout} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 30, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'all 0.15s' }}>
            Keluar
          </button>
        </div>

        {student && (
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: 16, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.25)', position: 'relative' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 2 }}>Selamat datang! 🎉</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: 20, color: 'white' }}>Hai, {firstName}! 👋</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Hari ni kita belajar sambil bermain! 🚀</div>
          </div>
        )}
      </div>

      {/* ── BANNER ── */}
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
              {banners.map((_, i) => (
                <button key={i} onClick={() => setBannerIdx(i)} style={{ height: 6, width: i === bannerIdx ? 20 : 6, borderRadius: 3, border: 'none', background: i === bannerIdx ? 'white' : 'rgba(255,255,255,0.45)', cursor: 'pointer', padding: 0, transition: 'all 0.3s' }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FILTER TABS ── */}
      {allTags.length > 1 && (
        <div style={{ padding: '16px 12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 4, height: 20, background: 'linear-gradient(#4F46E5,#06B6D4)', borderRadius: 4 }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 15, color: '#1E293B' }}>Tapis Mengikut Tahun</span>
            <span style={{ fontSize: 16 }}>🎯</span>
          </div>
          <div className="filter-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {allTags.map(tag => {
              const isActive = activeFilter === tag
              const ts = getTagStyle(tag)
              return (
                <button key={tag} className="filter-btn" onClick={() => setActiveFilter(tag)} style={{
                  flexShrink: 0, padding: '9px 18px',
                  borderRadius: 30, border: `2px solid ${isActive ? ts.text : ts.border}`,
                  background: isActive ? ts.text : 'white',
                  color: isActive ? 'white' : ts.text,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  boxShadow: isActive ? `0 4px 14px ${ts.text}40` : '0 2px 6px rgba(0,0,0,0.06)',
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  transition: 'all 0.2s'
                }}>
                  {tag === 'Semua' ? '✨ Semua' : tag}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── APPS GRID ── */}
      <div style={{ padding: '16px 12px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 4, height: 20, background: 'linear-gradient(#4F46E5,#06B6D4)', borderRadius: 4 }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 15, color: '#1E293B' }}>
              {activeFilter === 'Semua' ? 'Semua Aktiviti' : `Aktiviti ${activeFilter}`}
            </span>
          </div>
          <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, background: 'white', padding: '4px 10px', borderRadius: 20, border: '1px solid #E2E8F0' }}>
            {filteredLinks.length} aktiviti
          </span>
        </div>

        {filteredLinks.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', background: 'white', borderRadius: 24, border: '2px dashed #E2E8F0' }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 700, color: '#64748B', fontSize: 15 }}>Tiada aktiviti untuk {activeFilter}</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Cuba pilih tahun lain</div>
            </div>
          )
          : (
            <div className="apps-grid">
              {filteredLinks.map((l, li) => {
                const color = COLORS[li % COLORS.length]
                const tags = l.tags || []
                return (
                  <div key={l.id} className="app-card" onClick={() => { setIframeLoading(true); setActiveLink(l) }}
                    style={{ cursor: 'pointer', animationDelay: `${li * 0.05}s` }}>
                    <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: `0 6px 24px ${color.shadow}` }}>
                      {/* Icon area */}
                      <div style={{ aspectRatio: '1/1', background: l.img_url ? 'transparent' : color.bg, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {l.img_url
                          ? <img src={l.img_url} alt={l.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : <>
                              <div style={{ position: 'absolute', top: -8, right: -8, width: 50, height: 50, background: 'rgba(255,255,255,0.15)', borderRadius: '50%' }} />
                              <div style={{ position: 'absolute', bottom: -12, left: -8, width: 70, height: 70, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                              <span style={{ fontSize: 48, position: 'relative', zIndex: 1 }}>🎮</span>
                            </>}
                        {/* Play button */}
                        <div style={{ position: 'absolute', bottom: 8, right: 8, width: 30, height: 30, background: 'rgba(255,255,255,0.92)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', zIndex: 2 }}>▶</div>
                      </div>
                      {/* Name + tags */}
                      <div style={{ padding: '8px 9px 10px' }}>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 12, color: '#1E293B', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: tags.length > 0 ? 6 : 0 }}>
                          {l.name}
                        </div>
                        {/* Tags */}
                        {tags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
                            {tags.slice(0, 2).map(tag => {
                              const ts = getTagStyle(tag)
                              return (
                                <span key={tag} style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20, background: ts.bg, color: ts.text, border: `1px solid ${ts.border}`, letterSpacing: '0.02em' }}>
                                  {tag}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </div>

      {/* ── FOOTER ── */}
      <div style={{ textAlign: 'center', padding: '28px 16px 20px', marginTop: 8 }}>
        <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>
          Dibina oleh <strong style={{ color: '#64748B' }}>Cikgu Amin</strong> dari SK Felda Inas
        </div>
        <div style={{ fontSize: 10, color: '#CBD5E1' }}>© 2026 AEdu.my — Hak Cipta Terpelihara</div>
        <a href="/admin" style={{ display: 'inline-block', marginTop: 12, fontSize: 11, color: '#CBD5E1', textDecoration: 'none', padding: '5px 14px', border: '1px solid #E2E8F0', borderRadius: 20, background: 'white' }}>⚙️ Admin</a>
      </div>

      {/* ── IFRAME VIEWER ── */}
      {activeLink && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', background: 'white' }}>
          <div style={{ height: 52, background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10, flexShrink: 0 }}>
            <button onClick={() => setActiveLink(null)} style={{ padding: '7px 16px', background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 25, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              ✕ Tutup
            </button>
            <div style={{ flex: 1, color: 'white', fontSize: 14, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {activeLink.name}
            </div>
            {(activeLink.tags || []).slice(0, 2).map(tag => {
              const ts = getTagStyle(tag)
              return <span key={tag} style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0 }}>{tag}</span>
            })}
            {activeLink.content_type === 'url' && activeLink.url && (
              <a href={activeLink.url} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, color: 'white', fontSize: 13, textDecoration: 'none', flexShrink: 0 }}>↗</a>
            )}
          </div>
          {iframeLoading && (
            <div style={{ height: 3, background: '#EEF2FF', flexShrink: 0 }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg,#4F46E5,#06B6D4)', animation: 'loadbar 1.5s ease infinite' }} />
            </div>
          )}
          {activeLink.content_type === 'html'
            ? <iframe ref={iframeRef} srcDoc={activeLink.html_content || ''} style={{ flex: 1, width: '100%', border: 'none', display: 'block' }} title={activeLink.name} onLoad={() => setIframeLoading(false)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-pointer-lock" />
            : <iframe ref={iframeRef} src={activeLink.url || ''} style={{ flex: 1, width: '100%', border: 'none', display: 'block' }} title={activeLink.name} onLoad={() => setIframeLoading(false)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation" />}
        </div>
      )}
    </div>
  )
}
