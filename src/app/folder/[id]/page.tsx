'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase, type Folder } from '@/lib/supabase'

type LinkItem = {
  id: string; folder_id: string; name: string; url: string | null
  html_content: string | null; content_type: 'url' | 'html'
  img_url: string | null; emoji: string; order_num: number
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

export default function FolderPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [folder, setFolder] = useState<Folder | null>(null)
  const [links, setLinks] = useState<LinkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLink, setActiveLink] = useState<LinkItem | null>(null)
  const [iframeLoading, setIframeLoading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const s = localStorage.getItem('aedu_student') || sessionStorage.getItem('aedu_student')
    if (!s) { router.replace('/login'); return }
    localStorage.setItem('aedu_student', s)
    loadData()
  }, [id])

  const loadData = async () => {
    const [{ data: f }, { data: l }] = await Promise.all([
      supabase.from('folders').select('*').eq('id', id).single(),
      supabase.from('links').select('*').eq('folder_id', id).order('order_num'),
    ])
    setFolder(f); setLinks((l || []) as LinkItem[])
    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#4F46E5,#06B6D4)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</div>
        <p style={{ color: 'white', fontWeight: 600 }}>Memuatkan...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FF', fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .app-card { transition: transform 0.18s, box-shadow 0.18s; animation: fadeUp 0.35s ease both; }
        .app-card:active { transform: scale(0.93) !important; }
        @media (hover:hover) { .app-card:hover { transform: translateY(-4px) scale(1.02); } }
        .back-btn:active { transform: scale(0.92); }
        /* RESPONSIVE */
        .apps-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 14px; }
        @media (min-width:480px) { .apps-grid { grid-template-columns: repeat(3,1fr); gap: 16px; } }
        @media (min-width:768px) { .apps-grid { grid-template-columns: repeat(4,1fr); gap: 18px; } }
        @media (min-width:1100px) { .apps-grid { grid-template-columns: repeat(5,1fr); gap: 20px; } }
      `}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', padding: '0 14px', height: 62, display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 4px 20px rgba(79,70,229,0.25)' }}>
        <button className="back-btn" onClick={() => router.back()} style={{
          width: 40, height: 40, border: '2px solid rgba(255,255,255,0.35)',
          borderRadius: 14, background: 'rgba(255,255,255,0.18)',
          cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'white', flexShrink: 0,
          backdropFilter: 'blur(8px)', transition: 'all 0.15s'
        }}>←</button>
        <div style={{ width: 38, height: 38, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(255,255,255,0.3)' }}>
          {folder?.img_url
            ? <img src={folder.img_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 20 }}>{folder?.emoji || '📁'}</span>}
        </div>
        <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: 18, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
          {folder?.name}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '18px 12px' }}>
        {/* Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 4, height: 20, background: 'linear-gradient(#4F46E5,#06B6D4)', borderRadius: 4 }} />
          <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 15, color: '#1E293B' }}>
            Pilih Aktiviti
          </span>
          <span style={{ fontSize: 18 }}>🎯</span>
        </div>

        {links.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 24, border: '2px dashed #E2E8F0' }}>
              <div style={{ fontSize: 60, marginBottom: 12 }}>🎮</div>
              <div style={{ fontWeight: 700, color: '#64748B', fontSize: 15 }}>Tiada aktiviti lagi</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Admin belum tambah aktiviti</div>
            </div>
          )
          : (
            <div className="apps-grid">
              {links.map((l, li) => {
                const color = COLORS[li % COLORS.length]
                return (
                  <div key={l.id} className="app-card" onClick={() => { setIframeLoading(true); setActiveLink(l) }}
                    style={{ cursor: 'pointer', animationDelay: `${li * 0.06}s` }}>
                    <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: `0 6px 24px ${color.shadow}` }}>
                      {/* Icon */}
                      <div style={{ aspectRatio: '1/1', background: l.img_url ? 'transparent' : color.bg, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {l.img_url
                          ? <img src={l.img_url} alt={l.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : <>
                              <div style={{ position: 'absolute', top: -8, right: -8, width: 50, height: 50, background: 'rgba(255,255,255,0.15)', borderRadius: '50%' }} />
                              <div style={{ position: 'absolute', bottom: -12, left: -8, width: 70, height: 70, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                              <span style={{ fontSize: 48, filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.15))', position: 'relative', zIndex: 1 }}>🎮</span>
                            </>}
                        {/* Play button overlay */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.15))', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 8 }}>
                          <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>▶</div>
                        </div>
                      </div>
                      {/* Name */}
                      <div style={{ padding: '9px 10px 10px', background: 'white' }}>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 12, color: '#1E293B', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {l.name}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </div>

      {/* IFRAME VIEWER */}
      {activeLink && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', background: 'white' }}>
          {/* Topbar */}
          <div style={{ height: 52, background: 'linear-gradient(135deg,#4F46E5,#06B6D4)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10, flexShrink: 0, boxShadow: '0 2px 12px rgba(79,70,229,0.3)' }}>
            <button onClick={() => setActiveLink(null)} style={{ padding: '7px 16px', background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: 25, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
              ✕ Tutup
            </button>
            <div style={{ flex: 1, color: 'white', fontSize: 14, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {activeLink.name}
            </div>
            {activeLink.content_type === 'url' && activeLink.url && (
              <a href={activeLink.url} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, color: 'white', fontSize: 13, textDecoration: 'none', flexShrink: 0 }}>↗</a>
            )}
          </div>
          {/* Loading bar */}
          {iframeLoading && (
            <div style={{ height: 3, background: '#EEF2FF', flexShrink: 0 }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg,#4F46E5,#06B6D4)', borderRadius: 2, animation: 'loadbar 1.5s ease infinite' }} />
            </div>
          )}
          {/* iframe */}
          {activeLink.content_type === 'html'
            ? <iframe ref={iframeRef} srcDoc={activeLink.html_content || ''} style={{ flex: 1, width: '100%', border: 'none', display: 'block' }} title={activeLink.name} onLoad={() => setIframeLoading(false)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-pointer-lock" />
            : <iframe ref={iframeRef} src={activeLink.url || ''} style={{ flex: 1, width: '100%', border: 'none', display: 'block' }} title={activeLink.name} onLoad={() => setIframeLoading(false)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation" />}
          <style>{`@keyframes loadbar { 0%{width:0%;opacity:1} 80%{width:90%;opacity:1} 100%{width:100%;opacity:0} }`}</style>
        </div>
      )}
    </div>
  )
}
