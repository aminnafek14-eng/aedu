'use client'
// Folder page — apps grid style + iframe viewer (murid kekal dalam apps)
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase, type Link, type Folder } from '@/lib/supabase'

const LINK_COLORS = [
  { bg: 'linear-gradient(135deg,#FF6B6B,#FF8E8E)', shadow: 'rgba(255,107,107,0.3)' },
  { bg: 'linear-gradient(135deg,#4ECDC4,#45B7AA)', shadow: 'rgba(78,205,196,0.3)' },
  { bg: 'linear-gradient(135deg,#A78BFA,#8B5CF6)', shadow: 'rgba(167,139,250,0.3)' },
  { bg: 'linear-gradient(135deg,#FCD34D,#F59E0B)', shadow: 'rgba(252,211,77,0.3)' },
  { bg: 'linear-gradient(135deg,#6EE7B7,#10B981)', shadow: 'rgba(110,231,183,0.3)' },
  { bg: 'linear-gradient(135deg,#93C5FD,#3B82F6)', shadow: 'rgba(147,197,253,0.3)' },
  { bg: 'linear-gradient(135deg,#FDA4AF,#F43F5E)', shadow: 'rgba(253,164,175,0.3)' },
  { bg: 'linear-gradient(135deg,#86EFAC,#22C55E)', shadow: 'rgba(134,239,172,0.3)' },
  { bg: 'linear-gradient(135deg,#FCA5A5,#EF4444)', shadow: 'rgba(252,165,165,0.3)' },
  { bg: 'linear-gradient(135deg,#C4B5FD,#7C3AED)', shadow: 'rgba(196,181,253,0.3)' },
  { bg: 'linear-gradient(135deg,#FDE68A,#D97706)', shadow: 'rgba(253,230,138,0.3)' },
  { bg: 'linear-gradient(135deg,#BAE6FD,#0284C7)', shadow: 'rgba(186,230,253,0.3)' },
]

export default function FolderPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [folder, setFolder] = useState<Folder | null>(null)
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  // iframe viewer state
  const [activeLink, setActiveLink] = useState<Link | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const s = sessionStorage.getItem('aedu_student')
    if (!s) { router.replace('/login'); return }
    loadData()
  }, [id])

  const loadData = async () => {
    const [{ data: f }, { data: l }] = await Promise.all([
      supabase.from('folders').select('*').eq('id', id).single(),
      supabase.from('links').select('*').eq('folder_id', id).order('order_num'),
    ])
    setFolder(f); setLinks(l || [])
    setLoading(false)
  }

  const openLink = (link: Link) => {
    setActiveLink(link)
  }

  const closeLink = () => {
    setActiveLink(null)
  }

  if (loading) return (
    <div style={S.center}>
      <div style={S.spinWrap}>
        <div style={{ fontSize: 40 }}>⏳</div>
        <div style={S.spinner} />
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <button style={S.back} onClick={() => router.back()}>←</button>
        <div style={S.headerImg}>
          {folder?.img_url
            ? <img src={folder.img_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 20 }}>{folder?.emoji || '📁'}</span>}
        </div>
        <span style={S.headerTitle}>{folder?.name}</span>
      </div>

      {/* Apps grid */}
      <div style={S.content}>
        {links.length === 0
          ? <div style={S.empty}>
              <span style={{ fontSize: 48 }}>🔗</span>
              <p style={{ marginTop: 12, fontWeight: 600 }}>Tiada aktiviti lagi</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Admin belum tambah pautan</p>
            </div>
          : <>
              <div style={S.gridLabel}>Ketik untuk mula! 👆</div>
              <div style={S.appsGrid}>
                {links.map((l, li) => {
                  const color = LINK_COLORS[li % LINK_COLORS.length]
                  return (
                    <div key={l.id} style={S.appItem} onClick={() => openLink(l)}>
                      <div style={{ ...S.appIcon, background: color.bg, boxShadow: `0 6px 20px ${color.shadow}` }}>
                        {l.img_url
                          ? <img src={l.img_url} alt={l.name} style={S.appIconImg} />
                          : <span style={S.appEmoji}>🎮</span>}
                      </div>
                      <div style={S.appName}>{l.name}</div>
                    </div>
                  )
                })}
              </div>
            </>}
      </div>

      {/* ── IFRAME VIEWER ── */}
      {activeLink && (
        <div style={S.iframeOverlay}>
          {/* Mini topbar dalam viewer */}
          <div style={S.iframeBar}>
            <button style={S.iframeBack} onClick={closeLink}>✕ Tutup</button>
            <div style={S.iframeTitle}>{activeLink.name}</div>
            <a href={activeLink.url} target="_blank" rel="noopener noreferrer" style={S.iframeExternal}>↗</a>
          </div>
          <iframe
            ref={iframeRef}
            src={activeLink.url}
            style={S.iframe}
            title={activeLink.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
          />
        </div>
      )}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#F0F4FF', display: 'flex', flexDirection: 'column' },
  center: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinWrap: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  spinner: { width: 32, height: 32, border: '3px solid #E2E8F0', borderTopColor: '#4F46E5', borderRadius: '50%' },
  header: { background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', padding: '0 14px', height: 58, display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 50 },
  back: { width: 36, height: 36, border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, background: 'rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 },
  headerImg: { width: 36, height: 36, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerTitle: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 17, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'white' },
  content: { padding: '16px 12px', flex: 1 },
  gridLabel: { fontSize: 12, fontWeight: 700, color: '#6366F1', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' },
  appsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px 8px' },
  appItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' },
  appIcon: { width: 72, height: 72, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', transition: 'transform 0.15s', flexShrink: 0 },
  appIconImg: { width: '100%', height: '100%', objectFit: 'cover' },
  appEmoji: { fontSize: 34, lineHeight: 1 },
  appName: { fontSize: 11, fontWeight: 600, color: '#1E293B', textAlign: 'center', lineHeight: 1.3, wordBreak: 'break-word', maxWidth: 76 },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#64748B', fontSize: 14 },
  // iframe overlay — penuh skrin dalam apps
  iframeOverlay: { position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', background: 'white' },
  iframeBar: { height: 50, background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10, flexShrink: 0 },
  iframeBack: { padding: '6px 14px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  iframeTitle: { flex: 1, color: 'white', fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Plus Jakarta Sans',sans-serif" },
  iframeExternal: { padding: '6px 10px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, color: 'white', fontSize: 14, textDecoration: 'none' },
  iframe: { flex: 1, width: '100%', border: 'none', display: 'block' },
}
