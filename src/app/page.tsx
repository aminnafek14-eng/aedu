'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Folder, type Banner } from '@/lib/supabase'

const FOLDER_GRADIENTS = [
  { bg: 'linear-gradient(145deg,#FF6B6B,#FF8E53)', shadow: 'rgba(255,107,107,0.4)', light: '#FFF0F0' },
  { bg: 'linear-gradient(145deg,#4ECDC4,#2BB5AC)', shadow: 'rgba(78,205,196,0.4)', light: '#F0FAFA' },
  { bg: 'linear-gradient(145deg,#A78BFA,#7C3AED)', shadow: 'rgba(167,139,250,0.4)', light: '#F5F0FF' },
  { bg: 'linear-gradient(145deg,#F59E0B,#D97706)', shadow: 'rgba(245,158,11,0.4)', light: '#FFFBF0' },
  { bg: 'linear-gradient(145deg,#10B981,#059669)', shadow: 'rgba(16,185,129,0.4)', light: '#F0FFF8' },
  { bg: 'linear-gradient(145deg,#3B82F6,#1D4ED8)', shadow: 'rgba(59,130,246,0.4)', light: '#F0F5FF' },
  { bg: 'linear-gradient(145deg,#F43F5E,#BE123C)', shadow: 'rgba(244,63,94,0.4)', light: '#FFF0F3' },
  { bg: 'linear-gradient(145deg,#8B5CF6,#6D28D9)', shadow: 'rgba(139,92,246,0.4)', light: '#F5F0FF' },
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

  const firstName = student?.full_name.split(' ')[0] || ''

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#4F46E5,#06B6D4)' }}>
      <img src="/logo.png" alt="AEdu" style={{ width: 90, height: 90, objectFit: 'contain', marginBottom: 20, animation: 'bounce 1s infinite' }} />
      <div style={{ width: 200, height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'white', borderRadius: 20, animation: 'loadbar 1.5s ease-in-out infinite' }} />
      </div>
      <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: 14, fontSize: 14, fontWeight: 600 }}>Memuatkan AEdu.my...</p>
      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes loadbar { 0%{width:0%} 50%{width:70%} 100%{width:100%} }
      `}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FF', fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse2 { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes bannerFade { from{opacity:0;transform:scale(0.98)} to{opacity:1;transform:scale(1)} }
        .folder-card { transition: transform 0.18s, box-shadow 0.18s !important; animation: fadeUp 0.4s ease both; }
        .folder-card:active { transform: scale(0.94) !important; }
        @media (hover:hover) { .folder-card:hover { transform: translateY(-4px) scale(1.02) !important; } }
        .logout-btn:active { transform: scale(0.95); }
        .banner-img { animation: bannerFade 0.5s ease; }
        /* RESPONSIVE GRID */
        .folders-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 14px; }
        @media (min-width:480px) { .folders-grid { grid-template-columns: repeat(3,1fr); gap: 16px; } }
        @media (min-width:768px) { .folders-grid { grid-template-columns: repeat(4,1fr); gap: 18px; } }
        @media (min-width:1100px) { .folders-grid { grid-template-columns: repeat(5,1fr); gap: 20px; } }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg,#4F46E5 0%,#06B6D4 100%)',
        padding: '16px 16px 20px', position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -30, left: '30%', width: 140, height: 140, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="AEdu" style={{ width: 40, height: 40, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))' }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: 22, color: 'white', letterSpacing: '-0.5px', textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>AEdu.my</span>
          </div>
          <button className="logout-btn" onClick={logout} style={{
            padding: '8px 16px', background: 'rgba(255,255,255,0.18)',
            border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 30,
            color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            backdropFilter: 'blur(8px)', transition: 'all 0.15s'
          }}>Keluar</button>
        </div>

        {/* Greeting */}
        {student && (
          <div style={{
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
            borderRadius: 16, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.25)',
            position: 'relative'
          }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 2 }}>Selamat datang! 🎉</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: 20, color: 'white' }}>
              Hai, {firstName}! 👋
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Hari ni kita belajar sambil bermain! 🚀</div>
          </div>
        )}
      </div>

      {/* ── BANNER ── */}
      {banners.length > 0 && (
        <div style={{ margin: '14px 12px 0', borderRadius: 20, overflow: 'hidden', position: 'relative', background: '#1e1b4b', boxShadow: '0 8px 32px rgba(79,70,229,0.2)' }}>
          {banners.map((b, i) => (
            <div key={b.id} style={{ display: i === bannerIdx ? 'block' : 'none' }}
              onClick={() => b.link_url && window.open(b.link_url, '_blank')}>
              {b.img_url
                ? <img src={b.img_url} alt={b.title} className="banner-img" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block', cursor: b.link_url ? 'pointer' : 'default' }} />
                : <div style={{ height: 170, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', cursor: 'pointer' }}>
                    <span style={{ fontSize: 36, marginBottom: 8 }}>📢</span>
                    <span style={{ fontWeight: 800, fontSize: 18, color: 'white', textAlign: 'center', padding: '0 20px' }}>{b.title}</span>
                  </div>}
              {b.title && b.img_url && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,0.75))', color: 'white', padding: '28px 16px 12px', fontSize: 14, fontWeight: 700 }}>
                  {b.title}
                </div>
              )}
            </div>
          ))}
          {banners.length > 1 && (
            <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
              {banners.map((_, i) => (
                <button key={i} onClick={() => setBannerIdx(i)} style={{
                  height: 6, width: i === bannerIdx ? 20 : 6, borderRadius: 3,
                  border: 'none', background: i === bannerIdx ? 'white' : 'rgba(255,255,255,0.45)',
                  cursor: 'pointer', padding: 0, transition: 'all 0.3s'
                }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FOLDERS ── */}
      <div style={{ padding: '18px 12px 0' }}>
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 4, height: 22, background: 'linear-gradient(#4F46E5,#06B6D4)', borderRadius: 4 }} />
          <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 16, color: '#1E293B' }}>
            Pilih Tahun Anda
          </span>
          <span style={{ fontSize: 18 }}>📚</span>
        </div>

        {folders.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', background: 'white', borderRadius: 20, border: '2px dashed #E2E8F0' }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>📭</div>
              <div style={{ fontWeight: 700, color: '#64748B', fontSize: 15 }}>Tiada folder lagi</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Admin belum tambah kandungan</div>
            </div>
          )
          : (
            <div className="folders-grid">
              {folders.map((f, fi) => {
                const grad = FOLDER_GRADIENTS[fi % FOLDER_GRADIENTS.length]
                return (
                  <div key={f.id} className="folder-card" onClick={() => router.push(`/folder/${f.id}`)}
                    style={{ cursor: 'pointer', animationDelay: `${fi * 0.06}s` }}>
                    {/* Card */}
                    <div style={{
                      background: 'white', borderRadius: 20,
                      boxShadow: `0 4px 20px ${grad.shadow}`,
                      overflow: 'hidden', border: '2px solid transparent',
                      backgroundClip: 'padding-box',
                    }}>
                      {/* Image area */}
                      <div style={{
                        aspectRatio: '1/1', overflow: 'hidden',
                        background: f.img_url ? 'transparent' : grad.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative'
                      }}>
                        {f.img_url
                          ? <img src={f.img_url} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : (
                            <>
                              {/* Decorative circles */}
                              <div style={{ position: 'absolute', top: -10, right: -10, width: 60, height: 60, background: 'rgba(255,255,255,0.15)', borderRadius: '50%' }} />
                              <div style={{ position: 'absolute', bottom: -15, left: -10, width: 80, height: 80, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                              <span style={{ fontSize: 52, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))', position: 'relative', zIndex: 1 }}>
                                {f.emoji || '📁'}
                              </span>
                            </>
                          )}
                      </div>
                      {/* Name bar */}
                      <div style={{
                        padding: '10px 10px 11px',
                        background: 'white',
                        borderTop: `3px solid ${grad.light}`,
                      }}>
                        <div style={{
                          fontFamily: "'Plus Jakarta Sans',sans-serif",
                          fontWeight: 800, fontSize: 13,
                          color: '#1E293B', textAlign: 'center',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>{f.name}</div>
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
    </div>
  )
}
