'use client'
// ── Folder drill-in — links list ──
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase, type Link, type Folder } from '@/lib/supabase'

export default function FolderPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [folder, setFolder] = useState<Folder | null>(null)
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) return <div style={S.center}><div style={S.spinner} /></div>

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button style={S.back} onClick={() => router.back()}>←</button>
        <div style={S.headerImg}>
          {folder?.img_url
            ? <img src={folder.img_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 22 }}>{folder?.emoji || '📁'}</span>}
        </div>
        <span style={S.headerTitle}>{folder?.name}</span>
      </div>

      <div style={S.list}>
        {links.length === 0
          ? <div style={S.empty}><span style={{ fontSize: 40 }}>🔗</span><p style={{ marginTop: 10 }}>Tiada pautan dalam folder ini</p></div>
          : links.map(l => (
            <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" style={S.linkCard}>
              <div style={S.linkImg}>
                {l.img_url
                  ? <img src={l.img_url} alt={l.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 26 }}>{l.emoji || '🔗'}</span>}
              </div>
              <div style={S.linkInfo}>
                <div style={S.linkName}>{l.name}</div>
                <div style={S.linkUrl}>{l.url}</div>
              </div>
              <div style={S.arrow}>›</div>
            </a>
          ))}
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#F1F5F9', display: 'flex', flexDirection: 'column' },
  center: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: 32, height: 32, border: '3px solid #E2E8F0', borderTopColor: '#4F46E5', borderRadius: '50%' },
  header: { background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 14px', height: 56, display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  back: { width: 36, height: 36, border: '1px solid #E2E8F0', borderRadius: 9, background: 'white', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', flexShrink: 0 },
  headerImg: { width: 36, height: 36, borderRadius: 9, overflow: 'hidden', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerTitle: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 16, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  list: { padding: 12, display: 'flex', flexDirection: 'column', gap: 10 },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#64748B', fontSize: 14 },
  linkCard: { background: 'white', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden', display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#0F172A', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', minHeight: 68 },
  linkImg: { width: 68, height: 68, flexShrink: 0, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  linkInfo: { flex: 1, padding: '10px 12px', minWidth: 0 },
  linkName: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 3 },
  linkUrl: { fontSize: 11, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  arrow: { paddingRight: 14, fontSize: 20, color: '#CBD5E1' },
}
