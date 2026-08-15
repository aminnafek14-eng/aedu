'use client'
// ── AEdu Student Home ──
// Route: / (default — pelajar)
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Folder, type Banner } from '@/lib/supabase'

export default function StudentHome() {
  const router = useRouter()
  const [student, setStudent] = useState<{ full_name: string } | null>(null)
  const [folders, setFolders] = useState<Folder[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [bannerIdx, setBannerIdx] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if logged in
    const saved = sessionStorage.getItem('aedu_student')
    if (!saved) { router.replace('/login'); return }
    setStudent(JSON.parse(saved))
    loadData()
  }, [])

  const loadData = async () => {
    const [{ data: f }, { data: b }] = await Promise.all([
      supabase.from('folders').select('*').order('order_num'),
      supabase.from('banners').select('*').eq('active', true).order('order_num'),
    ])
    setFolders(f || [])
    setBanners(b || [])
    setLoading(false)
  }

  // Auto-advance banner
  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), 4000)
    return () => clearInterval(t)
  }, [banners])

  const logout = () => { sessionStorage.removeItem('aedu_student'); router.replace('/login') }

  if (loading) return (
    <div style={S.center}>
      <div style={S.spinner} />
      <p style={{ color: '#64748B', marginTop: 12, fontSize: 14 }}>Memuatkan...</p>
    </div>
  )

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerTop}>
          <div style={S.brand}>🎓 AEdu</div>
          <button style={S.logoutBtn} onClick={logout}>Keluar</button>
        </div>
        {student && (
          <p style={S.welcome}>Selamat datang, <strong>{student.full_name}</strong>! 👋</p>
        )}
      </div>

      {/* Banner Galeri */}
      {banners.length > 0 && (
        <div style={S.bannerWrap}>
          <div style={S.bannerTrack}>
            {banners.map((b, i) => (
              <div
                key={b.id}
                style={{
                  ...S.bannerSlide,
                  display: i === bannerIdx ? 'flex' : 'none',
                }}
                onClick={() => b.link_url && window.open(b.link_url, '_blank')}
              >
                {b.img_url
                  ? <img src={b.img_url} alt={b.title} style={S.bannerImg} />
                  : (
                    <div style={S.bannerPlaceholder}>
                      <span style={{ fontSize: 32 }}>📢</span>
                      <span style={{ fontWeight: 700, fontSize: 16, marginTop: 8 }}>{b.title}</span>
                    </div>
                  )}
                {b.title && <div style={S.bannerCaption}>{b.title}</div>}
              </div>
            ))}
          </div>
          {/* Dots */}
          {banners.length > 1 && (
            <div style={S.bannerDots}>
              {banners.map((_, i) => (
                <button key={i} onClick={() => setBannerIdx(i)}
                  style={{ ...S.dot, background: i === bannerIdx ? '#fff' : 'rgba(255,255,255,0.4)' }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Folders */}
      <div style={S.section}>
        <div style={S.sectionLabel}>📚 Kategori Pembelajaran</div>
        {folders.length === 0
          ? <div style={S.empty}><span>📭</span><p>Tiada folder lagi</p></div>
          : (
            <div style={S.grid}>
              {folders.map(f => (
                <div key={f.id} style={S.folderCard} onClick={() => router.push(`/folder/${f.id}`)}>
                  <div style={S.folderImg}>
                    {f.img_url
                      ? <img src={f.img_url} alt={f.name} style={S.folderImgFill} />
                      : <span style={{ fontSize: 38 }}>{f.emoji || '📁'}</span>}
                  </div>
                  <div style={S.folderFoot}>
                    <div style={S.folderName}>{f.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Admin tiny link */}
      <div style={S.adminLink}>
        <a href="/admin" style={S.adminTiny}>⚙️ Admin</a>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F1F5F9' },
  center: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  header: { background: 'linear-gradient(135deg,#4F46E5 0%,#06B6D4 100%)', padding: '18px 16px 14px' },
  headerTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  brand: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: 22, color: 'white' },
  logoutBtn: { padding: '6px 14px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, color: 'white', fontSize: 12, cursor: 'pointer', fontWeight: 600 },
  welcome: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  bannerWrap: { margin: '12px', borderRadius: 14, overflow: 'hidden', position: 'relative', background: '#1e1b4b', minHeight: 160 },
  bannerTrack: { position: 'relative', width: '100%' },
  bannerSlide: { width: '100%', minHeight: 160, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', animation: 'bannerSlide 0.4s ease' },
  bannerImg: { width: '100%', height: 180, objectFit: 'cover', display: 'block' },
  bannerPlaceholder: { height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', padding: 20 },
  bannerCaption: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,0.7))', color: 'white', padding: '24px 14px 10px', fontSize: 13, fontWeight: 600 },
  bannerDots: { position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0 },
  section: { padding: '12px 12px 0' },
  sectionLabel: { fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: '#64748B', textTransform: 'uppercase', marginBottom: 10 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 },
  folderCard: { background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', cursor: 'pointer', aspectRatio: '1/1', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', transition: 'transform 0.15s' },
  folderImg: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#EEF2FF,#e0e7ff)', overflow: 'hidden' },
  folderImgFill: { width: '100%', height: '100%', objectFit: 'cover' },
  folderFoot: { padding: '8px 10px', borderTop: '1px solid #E2E8F0', background: 'white' },
  folderName: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  empty: { textAlign: 'center', padding: '40px 20px', color: '#64748B', fontSize: 14 },
  adminLink: { textAlign: 'center', padding: '24px 0 16px', marginTop: 'auto' },
  adminTiny: { fontSize: 11, color: '#94A3B8', textDecoration: 'none', padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6 },
}
