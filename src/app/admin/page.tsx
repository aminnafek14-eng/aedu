'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase, type Folder, type Link, type Banner, type Student } from '@/lib/supabase'

type Tab = 'overview' | 'folders' | 'banners' | 'students'
const ADMIN_PW = '050505'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [folders, setFolders] = useState<Folder[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [students, setStudents] = useState<Student[]>([])

  // REALTIME PRESENCE — sebenar
  const [online, setOnline] = useState(0)
  const [onlineNames, setOnlineNames] = useState<string[]>([])
  const presenceRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const [chartPts, setChartPts] = useState<number[]>(Array(20).fill(0))
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [logs, setLogs] = useState<{ msg: string; type: string; time: string }[]>([])

  const [folderModal, setFolderModal] = useState<{ open: boolean; idx: number | null }>({ open: false, idx: null })
  const [linkModal, setLinkModal] = useState<{ open: boolean; folderIdx: number | null; linkIdx: number | null }>({ open: false, folderIdx: null, linkIdx: null })
  const [bannerModal, setBannerModal] = useState<{ open: boolean; idx: number | null }>({ open: false, idx: null })
  const [openFolder, setOpenFolder] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ msg: string; type?: string } | null>(null)

  const [fName, setFName] = useState(''); const [fImgData, setFImgData] = useState('')
  const [lName, setLName] = useState(''); const [lUrl, setLUrl] = useState(''); const [lImgData, setLImgData] = useState('')
  const [bTitle, setBTitle] = useState(''); const [bImgData, setBImgData] = useState(''); const [bLinkUrl, setBLinkUrl] = useState(''); const [bActive, setBActive] = useState(true)

  const addLog = (msg: string, type: string) => {
    const time = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs(prev => [{ msg, type, time }, ...prev].slice(0, 25))
  }

  const login = () => {
    if (pw === ADMIN_PW) { setAuthed(true); loadAll(); startPresenceWatch() }
    else setPwErr('Kata laluan salah')
  }

  const loadAll = async () => {
    const [{ data: f }, { data: l }, { data: b }, { data: s }] = await Promise.all([
      supabase.from('folders').select('*').order('order_num'),
      supabase.from('links').select('*').order('order_num'),
      supabase.from('banners').select('*').order('order_num'),
      supabase.from('students').select('*').order('created_at', { ascending: false }),
    ])
    setFolders(f || []); setLinks(l || [])
    setBanners(b || []); setStudents(s || [])
  }

  // ── REALTIME PRESENCE SEBENAR ──
  const startPresenceWatch = () => {
    // Unsubscribe kalau ada channel lama
    presenceRef.current?.unsubscribe()

    const ch = supabase.channel('aedu_presence')

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState<{ full_name: string; user_id: string }>()
      const users = Object.values(state).flat()
      const count = users.length
      const names = users.map(u => u.full_name)
      setOnline(count)
      setOnlineNames(names)
      setChartPts(prev => [...prev.slice(1), count])
    })

    ch.on('presence', { event: 'join' }, ({ newPresences }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newPresences.forEach((p: any) => {
        addLog(`${p.full_name || 'Pengguna'} telah menyertai`, 'join')
      })
    })

    ch.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      leftPresences.forEach((p: any) => {
        addLog(`${p.full_name || 'Pengguna'} telah keluar`, 'leave')
      })
    })

    ch.subscribe()
    presenceRef.current = ch
  }

  useEffect(() => {
    return () => { presenceRef.current?.unsubscribe() }
  }, [])

  // Draw chart
  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d'); if (!ctx) return
    c.width = c.parentElement!.clientWidth - 32; c.height = 70
    const W = c.width, H = c.height, max = Math.max(...chartPts, 1)
    const step = W / (chartPts.length - 1)
    ctx.clearRect(0, 0, W, H)
    ctx.strokeStyle = '#E2E8F0'; ctx.lineWidth = 1
    ;[0.25, 0.5, 0.75, 1].forEach(f => { ctx.beginPath(); ctx.moveTo(0, H * (1 - f) + 2); ctx.lineTo(W, H * (1 - f) + 2); ctx.stroke() })
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, 'rgba(79,70,229,0.25)'); g.addColorStop(1, 'rgba(79,70,229,0)')
    ctx.beginPath()
    chartPts.forEach((v, i) => { const x = i * step, y = H * (1 - v / max) + 2; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) })
    ctx.lineTo((chartPts.length - 1) * step, H); ctx.lineTo(0, H); ctx.closePath()
    ctx.fillStyle = g; ctx.fill()
    ctx.beginPath(); ctx.strokeStyle = '#4F46E5'; ctx.lineWidth = 2; ctx.lineJoin = 'round'
    chartPts.forEach((v, i) => { const x = i * step, y = H * (1 - v / max) + 2; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) })
    ctx.stroke()
    const lv = chartPts[chartPts.length - 1]
    ctx.beginPath(); ctx.arc((chartPts.length - 1) * step, H * (1 - lv / max) + 2, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = '#4F46E5'; ctx.fill()
  }, [chartPts])

  const showToast = (msg: string, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2600)
  }

  const readImg = (file: File, cb: (d: string) => void) => {
    if (file.size > 3 * 1024 * 1024) return showToast('Fail terlalu besar (maks 3MB)', 'error')
    const r = new FileReader(); r.onload = e => cb(e.target!.result as string); r.readAsDataURL(file)
  }

  const uploadImg = async (dataUrl: string, bucket: string): Promise<string | null> => {
    const arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)![1]
    const bstr = atob(arr[1]); const u8 = new Uint8Array(bstr.length)
    for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i)
    const blob = new Blob([u8], { type: mime })
    const ext = mime.split('/')[1]
    const fname = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(fname, blob)
    if (error) { showToast('Gagal upload gambar: ' + error.message, 'error'); return null }
    const { data } = supabase.storage.from(bucket).getPublicUrl(fname)
    return data.publicUrl
  }

  // FOLDER CRUD
  const openAddFolder = () => { setFName(''); setFImgData(''); setFolderModal({ open: true, idx: null }) }
  const openEditFolder = (i: number) => { setFName(folders[i].name); setFImgData(folders[i].img_url || ''); setFolderModal({ open: true, idx: i }) }
  const saveFolder = async () => {
    if (!fName.trim()) return showToast('Masukkan nama folder', 'error')
    let imgUrl: string | null = null
    if (fImgData && fImgData.startsWith('data:')) imgUrl = await uploadImg(fImgData, 'images')
    else if (fImgData) imgUrl = fImgData
    if (folderModal.idx === null) {
      await supabase.from('folders').insert({ name: fName.trim(), img_url: imgUrl, emoji: '📁', order_num: folders.length })
      showToast('Folder ditambah! ✅', 'success')
    } else {
      await supabase.from('folders').update({ name: fName.trim(), img_url: imgUrl }).eq('id', folders[folderModal.idx].id)
      showToast('Folder dikemaskini! ✅', 'success')
    }
    setFolderModal({ open: false, idx: null }); loadAll()
  }
  const deleteFolder = async (i: number) => {
    if (!confirm(`Padam folder "${folders[i].name}"?`)) return
    await supabase.from('links').delete().eq('folder_id', folders[i].id)
    await supabase.from('folders').delete().eq('id', folders[i].id)
    showToast('Folder dipadam 🗑️'); loadAll()
  }

  // LINK CRUD
  const folderLinks = (fi: number) => links.filter(l => l.folder_id === folders[fi].id)
  const openAddLink = (fi: number) => { setLName(''); setLUrl(''); setLImgData(''); setLinkModal({ open: true, folderIdx: fi, linkIdx: null }) }
  const openEditLink = (fi: number, li: number) => {
    const lnk = folderLinks(fi)[li]
    setLName(lnk.name); setLUrl(lnk.url); setLImgData(lnk.img_url || '')
    setLinkModal({ open: true, folderIdx: fi, linkIdx: li })
  }
  const saveLink = async () => {
    if (!lName.trim()) return showToast('Masukkan nama pautan', 'error')
    if (!lUrl.trim()) return showToast('Masukkan URL', 'error')
    let url = lUrl.trim(); if (!/^https?:\/\//i.test(url)) url = 'https://' + url
    let imgUrl: string | null = null
    if (lImgData && lImgData.startsWith('data:')) imgUrl = await uploadImg(lImgData, 'images')
    else if (lImgData) imgUrl = lImgData
    const fi = linkModal.folderIdx!
    if (linkModal.linkIdx === null) {
      await supabase.from('links').insert({ folder_id: folders[fi].id, name: lName.trim(), url, img_url: imgUrl, emoji: '🔗', order_num: folderLinks(fi).length })
      showToast('Pautan ditambah! ✅', 'success')
    } else {
      const lnk = folderLinks(fi)[linkModal.linkIdx!]
      await supabase.from('links').update({ name: lName.trim(), url, img_url: imgUrl }).eq('id', lnk.id)
      showToast('Pautan dikemaskini! ✅', 'success')
    }
    setLinkModal({ open: false, folderIdx: null, linkIdx: null }); loadAll()
  }
  const deleteLink = async (fi: number, li: number) => {
    const lnk = folderLinks(fi)[li]
    if (!confirm(`Padam pautan "${lnk.name}"?`)) return
    await supabase.from('links').delete().eq('id', lnk.id)
    showToast('Pautan dipadam 🗑️'); loadAll()
  }

  // BANNER CRUD
  const openAddBanner = () => { setBTitle(''); setBImgData(''); setBLinkUrl(''); setBActive(true); setBannerModal({ open: true, idx: null }) }
  const openEditBanner = (i: number) => { const b = banners[i]; setBTitle(b.title); setBImgData(b.img_url || ''); setBLinkUrl(b.link_url || ''); setBActive(b.active); setBannerModal({ open: true, idx: i }) }
  const saveBanner = async () => {
    let imgUrl: string | null = null
    if (bImgData && bImgData.startsWith('data:')) imgUrl = await uploadImg(bImgData, 'images')
    else if (bImgData) imgUrl = bImgData
    if (bannerModal.idx === null) {
      await supabase.from('banners').insert({ title: bTitle.trim(), img_url: imgUrl, link_url: bLinkUrl || null, active: bActive, order_num: banners.length })
      showToast('Banner ditambah! ✅', 'success')
    } else {
      await supabase.from('banners').update({ title: bTitle.trim(), img_url: imgUrl, link_url: bLinkUrl || null, active: bActive }).eq('id', banners[bannerModal.idx].id)
      showToast('Banner dikemaskini! ✅', 'success')
    }
    setBannerModal({ open: false, idx: null }); loadAll()
  }
  const deleteBanner = async (i: number) => {
    if (!confirm('Padam banner ini?')) return
    await supabase.from('banners').delete().eq('id', banners[i].id)
    showToast('Banner dipadam 🗑️'); loadAll()
  }

  // LOGIN SCREEN
  if (!authed) return (
    <div style={S.loginPage}>
      <div style={S.loginCard}>
        <div style={S.loginLogo}>⚙️</div>
        <h1 style={S.loginTitle}>AEdu Admin</h1>
        <p style={S.loginSub}>Panel pengurusan — akses terhad</p>
        <input type="password" style={S.pwInput} placeholder="Kata laluan admin" value={pw}
          onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} />
        {pwErr && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 10 }}>{pwErr}</p>}
        <button style={S.pwBtn} onClick={login}>Log Masuk Admin</button>
        <a href="/" style={S.backToApp}>← Kembali ke AEdu</a>
      </div>
    </div>
  )

  const totalLinks = links.length

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9' }}>
      {/* Topbar */}
      <div style={S.topbar}>
        <span style={S.topbarBrand}>⚙️ AEdu Admin</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={S.liveDot} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>LANGSUNG</span>
          <a href="/" style={S.topbarExit}>Paparan Pelajar →</a>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabBar}>
        {(['overview', 'folders', 'banners', 'students'] as Tab[]).map(t => (
          <button key={t} style={{ ...S.tabBtn, ...(tab === t ? S.tabActive : {}) }} onClick={() => setTab(t)}>
            {{ overview: '📊 Overview', folders: '📁 Folder', banners: '🖼️ Banner', students: '👥 Murid' }[t]}
          </button>
        ))}
      </div>

      <div style={S.main}>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <>
            <div style={S.statsGrid}>
              <div style={S.statCard}>
                <div style={S.statLabel}>🟢 Dalam Talian Sekarang</div>
                <div style={S.statVal}>
                  {online}
                  <span style={S.liveDot} />
                </div>
                {onlineNames.length > 0 && (
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>
                    {onlineNames.slice(0, 3).join(', ')}{onlineNames.length > 3 ? ` +${onlineNames.length - 3} lagi` : ''}
                  </div>
                )}
              </div>
              <div style={S.statCard}>
                <div style={S.statLabel}>👥 Jumlah Murid Berdaftar</div>
                <div style={S.statVal}>{students.length}</div>
              </div>
              <div style={S.statCard}>
                <div style={S.statLabel}>📁 Folder</div>
                <div style={S.statVal}>{folders.length}</div>
              </div>
              <div style={S.statCard}>
                <div style={S.statLabel}>🔗 Pautan</div>
                <div style={S.statVal}>{totalLinks}</div>
              </div>
            </div>

            <div style={S.section}>
              <div style={S.sectionHdr}>
                <h3 style={S.sectionTitle}>📈 Graf Pengguna Dalam Talian</h3>
                <span style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={S.liveDot} /> Data sebenar
                </span>
              </div>
              <div style={{ padding: '14px 16px 8px' }}>
                <canvas ref={canvasRef} style={{ width: '100%', height: 70 }} />
              </div>
              <div style={{ padding: '0 12px 12px', maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {logs.length === 0
                  ? <p style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', padding: 20 }}>Menunggu aktiviti pengguna...</p>
                  : logs.map((l, i) => (
                    <div key={i} style={S.logEntry}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: l.type === 'join' ? '#10B981' : '#EF4444', flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ flex: 1, fontSize: 11 }}>{l.msg}</span>
                      <span style={{ fontSize: 10, color: '#94A3B8' }}>{l.time}</span>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* FOLDERS */}
        {tab === 'folders' && (
          <div style={S.section}>
            <div style={S.sectionHdr}>
              <h3 style={S.sectionTitle}>📁 Urus Folder & Pautan</h3>
              <button style={S.addBtn} onClick={openAddFolder}>＋ Folder</button>
            </div>
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {folders.length === 0
                ? <p style={{ textAlign: 'center', color: '#94A3B8', padding: 30, fontSize: 13 }}>Tiada folder lagi</p>
                : folders.map((f, fi) => (
                  <div key={f.id} style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={S.folderRow} onClick={() => setOpenFolder(p => ({ ...p, [f.id]: !p[f.id] }))}>
                      <div style={S.folderThumb}>
                        {f.img_url ? <img src={f.img_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 20 }}>{f.emoji}</span>}
                      </div>
                      <span style={S.folderNameA}>{f.name}</span>
                      <span style={{ fontSize: 11, color: '#94A3B8', marginRight: 6 }}>{folderLinks(fi).length}p</span>
                      <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
                        <button style={S.iconBtn} onClick={() => openEditFolder(fi)}>✏️</button>
                        <button style={{ ...S.iconBtn, background: '#FEF2F2' }} onClick={() => deleteFolder(fi)}>🗑️</button>
                      </div>
                      <span style={{ fontSize: 10, color: '#94A3B8', marginLeft: 4 }}>{openFolder[f.id] ? '▲' : '▼'}</span>
                    </div>
                    {openFolder[f.id] && (
                      <div style={{ padding: '8px 10px', background: 'white', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {folderLinks(fi).map((l, li) => (
                          <div key={l.id} style={S.linkRow}>
                            <div style={S.linkThumb}>
                              {l.img_url ? <img src={l.img_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 18 }}>{l.emoji}</span>}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600 }}>{l.name}</div>
                              <div style={{ fontSize: 10, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.url}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button style={S.iconBtn} onClick={() => openEditLink(fi, li)}>✏️</button>
                              <button style={{ ...S.iconBtn, background: '#FEF2F2' }} onClick={() => deleteLink(fi, li)}>🗑️</button>
                            </div>
                          </div>
                        ))}
                        <div style={S.addLinkRow} onClick={() => openAddLink(fi)}>＋ Tambah Pautan</div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* BANNERS */}
        {tab === 'banners' && (
          <div style={S.section}>
            <div style={S.sectionHdr}>
              <h3 style={S.sectionTitle}>🖼️ Urus Galeri Banner</h3>
              <button style={S.addBtn} onClick={openAddBanner}>＋ Banner</button>
            </div>
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {banners.length === 0
                ? <p style={{ textAlign: 'center', color: '#94A3B8', padding: 30, fontSize: 13 }}>Tiada banner. Banner dipaparkan sebagai galeri bergerak kepada murid.</p>
                : banners.map((b, i) => (
                  <div key={b.id} style={{ ...S.linkRow, padding: 10, borderRadius: 10, border: '1px solid #E2E8F0', background: 'white' }}>
                    <div style={{ ...S.linkThumb, width: 56, height: 42, borderRadius: 8 }}>
                      {b.img_url ? <img src={b.img_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22 }}>📢</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{b.title || '(tiada tajuk)'}</div>
                      <div style={{ fontSize: 10, color: b.active ? '#10B981' : '#94A3B8' }}>{b.active ? '✓ Aktif' : '○ Tidak aktif'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={S.iconBtn} onClick={() => openEditBanner(i)}>✏️</button>
                      <button style={{ ...S.iconBtn, background: '#FEF2F2' }} onClick={() => deleteBanner(i)}>🗑️</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* STUDENTS */}
        {tab === 'students' && (
          <div style={S.section}>
            <div style={S.sectionHdr}><h3 style={S.sectionTitle}>👥 Senarai Murid ({students.length})</h3></div>
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {students.length === 0
                ? <p style={{ textAlign: 'center', color: '#94A3B8', padding: 30, fontSize: 13 }}>Tiada murid berdaftar lagi</p>
                : students.map((s, i) => (
                  <div key={s.id} style={{ ...S.linkRow, padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: 'white' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#4F46E5', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{s.full_name}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>📞 {s.parent_phone}</div>
                    </div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>{new Date(s.created_at).toLocaleDateString('ms-MY')}</div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {folderModal.open && (
        <Modal title={folderModal.idx === null ? '➕ Tambah Folder' : '✏️ Edit Folder'} onClose={() => setFolderModal({ open: false, idx: null })}>
          <FG label="Nama Folder"><input style={S.inp} placeholder="cth: Tahun 1..." value={fName} onChange={e => setFName(e.target.value)} /></FG>
          <FG label="Gambar Folder"><ImgUpload dataUrl={fImgData} onChange={setFImgData} onRead={readImg} /></FG>
          <ModalBtns onCancel={() => setFolderModal({ open: false, idx: null })} onSave={saveFolder} />
        </Modal>
      )}

      {linkModal.open && (
        <Modal title={linkModal.linkIdx === null ? `➕ Pautan — ${folders[linkModal.folderIdx!]?.name}` : '✏️ Edit Pautan'} onClose={() => setLinkModal({ open: false, folderIdx: null, linkIdx: null })}>
          <FG label="Nama Pautan"><input style={S.inp} placeholder="cth: Kuiz Matematik..." value={lName} onChange={e => setLName(e.target.value)} /></FG>
          <FG label="URL"><input style={S.inp} placeholder="https://..." value={lUrl} onChange={e => setLUrl(e.target.value)} type="url" /></FG>
          <FG label="Gambar Pautan"><ImgUpload dataUrl={lImgData} onChange={setLImgData} onRead={readImg} /></FG>
          <ModalBtns onCancel={() => setLinkModal({ open: false, folderIdx: null, linkIdx: null })} onSave={saveLink} />
        </Modal>
      )}

      {bannerModal.open && (
        <Modal title={bannerModal.idx === null ? '➕ Tambah Banner' : '✏️ Edit Banner'} onClose={() => setBannerModal({ open: false, idx: null })}>
          <FG label="Tajuk Banner (pilihan)"><input style={S.inp} placeholder="cth: Aktiviti Minggu Ini..." value={bTitle} onChange={e => setBTitle(e.target.value)} /></FG>
          <FG label="Gambar Banner"><ImgUpload dataUrl={bImgData} onChange={setBImgData} onRead={readImg} /></FG>
          <FG label="URL Pautan (klik banner — pilihan)"><input style={S.inp} placeholder="https://..." value={bLinkUrl} onChange={e => setBLinkUrl(e.target.value)} /></FG>
          <FG label="Status">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={bActive} onChange={e => setBActive(e.target.checked)} style={{ width: 16, height: 16 }} />
              <span style={{ fontSize: 13 }}>Paparkan banner ini kepada murid</span>
            </label>
          </FG>
          <ModalBtns onCancel={() => setBannerModal({ open: false, idx: null })} onSave={saveBanner} />
        </Modal>
      )}

      {toast && (
        <div style={{ ...S.toast, background: toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : '#0F172A' }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '24px 20px', width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 17, fontWeight: 800, marginBottom: 18 }}>{title}</h3>
        {children}
      </div>
    </div>
  )
}

function FG({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 14 }}><label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</label>{children}</div>
}

function ImgUpload({ dataUrl, onChange, onRead }: { dataUrl: string; onChange: (v: string) => void; onRead: (f: File, cb: (d: string) => void) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div style={{ border: '2px dashed #E2E8F0', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', position: 'relative' }}
      onClick={() => ref.current?.click()}>
      {dataUrl
        ? <>
          <img src={dataUrl} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
          <button style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12 }}
            onClick={e => { e.stopPropagation(); onChange('') }}>✕</button>
        </>
        : <div style={{ textAlign: 'center', padding: 20, color: '#94A3B8' }}><div style={{ fontSize: 28, marginBottom: 6 }}>🖼️</div><div style={{ fontSize: 12 }}>Ketik untuk muat naik gambar</div><div style={{ fontSize: 10, marginTop: 3 }}>PNG · JPG (maks 3MB)</div></div>}
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onRead(f, onChange) }} />
    </div>
  )
}

function ModalBtns({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
      <button style={{ padding: '9px 18px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13 }} onClick={onCancel}>Batal</button>
      <button style={{ padding: '9px 22px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onClick={onSave}>Simpan</button>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  loginPage: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)', padding: 16 },
  loginCard: { background: 'white', borderRadius: 24, padding: '40px 28px', width: '100%', maxWidth: 360, textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' },
  loginLogo: { width: 64, height: 64, background: 'linear-gradient(135deg,#312e81,#4F46E5)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 14px' },
  loginTitle: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 24, fontWeight: 900, color: '#0F172A', marginBottom: 4 },
  loginSub: { color: '#64748B', fontSize: 13, marginBottom: 24 },
  pwInput: { width: '100%', padding: '13px 16px', border: '2px solid #E2E8F0', borderRadius: 10, fontSize: 16, letterSpacing: 6, textAlign: 'center', outline: 'none', marginBottom: 12 },
  pwBtn: { width: '100%', padding: 13, background: 'linear-gradient(135deg,#312e81,#4F46E5)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 16 },
  backToApp: { fontSize: 12, color: '#94A3B8', textDecoration: 'none' },
  topbar: { background: '#1e1b4b', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 },
  topbarBrand: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 16, color: 'white' },
  topbarExit: { fontSize: 12, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', padding: '6px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: 7, border: '1px solid rgba(255,255,255,0.15)' },
  liveDot: { display: 'inline-block', width: 7, height: 7, background: '#10B981', borderRadius: '50%', marginLeft: 6 },
  tabBar: { background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 12px', display: 'flex', gap: 0, overflowX: 'auto' },
  tabBtn: { padding: '12px 14px', border: 'none', background: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#64748B', whiteSpace: 'nowrap', borderBottom: '2px solid transparent' },
  tabActive: { color: '#4F46E5', borderBottom: '2px solid #4F46E5' },
  main: { padding: '12px', maxWidth: 700, margin: '0 auto' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 },
  statCard: { background: 'white', borderRadius: 14, padding: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' },
  statLabel: { fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 },
  statVal: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center' },
  section: { background: 'white', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', marginBottom: 12, overflow: 'hidden' },
  sectionHdr: { padding: '13px 14px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 700 },
  addBtn: { padding: '7px 13px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  folderRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#F8FAFC', cursor: 'pointer' },
  folderThumb: { width: 42, height: 42, borderRadius: 9, overflow: 'hidden', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  folderNameA: { flex: 1, fontSize: 13, fontWeight: 600 },
  iconBtn: { width: 30, height: 30, borderRadius: 7, border: 'none', background: '#EEF2FF', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  linkRow: { display: 'flex', alignItems: 'center', gap: 9 },
  linkThumb: { width: 40, height: 40, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  addLinkRow: { padding: '9px 10px', background: '#EEF2FF', borderRadius: 8, border: '1px dashed #4F46E5', display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', color: '#4F46E5', fontSize: 12, fontWeight: 600 },
  logEntry: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 7, background: '#F8FAFC' },
  inp: { width: '100%', padding: '11px 13px', border: '2px solid #E2E8F0', borderRadius: 9, fontSize: 14, outline: 'none', fontFamily: "'Inter',sans-serif", background: '#F8FAFC' },
  toast: { position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', color: 'white', padding: '10px 20px', borderRadius: 100, fontSize: 13, fontWeight: 500, zIndex: 999, boxShadow: '0 6px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' },
}
