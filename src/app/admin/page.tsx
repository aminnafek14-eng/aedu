'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { adminApi, uploadImageAdmin } from '@/lib/adminApi'
import type { Folder, Link, Banner, Student } from '@/lib/supabase'

type Tab = 'overview' | 'apps' | 'banners' | 'students' | 'subscription' | 'payment'
const ADMIN_PW = '050505'

// Lucide-style SVG icons (inline, no dependency)
const Icons = {
  overview: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  folders: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  banners: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  students: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  subscription: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  payment: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  chevron: (open: boolean) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transform:open?'rotate(180deg)':'rotate(0deg)',transition:'transform 0.2s'}}><polyline points="6 9 12 15 18 9"/></svg>,
  link: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  save: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  logout: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  eye: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  upload: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [links, setLinks] = useState<Link[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [students, setStudents] = useState<any[]>([])
  const [paymentRequired, setPaymentRequired] = useState(false)
  const [paymentRequests, setPaymentRequests] = useState<any[]>([])
  const [togglingPayment, setTogglingPayment] = useState(false)
  const [paySettings, setPaySettings] = useState({
    price: '50', instructions: '', bank: '', accountName: '', accountNumber: '', qrUrl: '', whatsapp: ''
  })
  const [savingPaySettings, setSavingPaySettings] = useState(false)
  const [payQrData, setPayQrData] = useState('')

  // Realtime presence
  const [online, setOnline] = useState(0)
  const [onlineNames, setOnlineNames] = useState<string[]>([])
  const presenceRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const [chartPts, setChartPts] = useState<number[]>(Array(20).fill(0))
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [logs, setLogs] = useState<{ msg: string; type: string; time: string }[]>([])

  // Modals
  const [linkModal, setLinkModal] = useState<{ open: boolean; folderIdx: number | null; linkIdx: string | null }>({ open: false, folderIdx: null, linkIdx: null })
  const [bannerModal, setBannerModal] = useState<{ open: boolean; idx: number | null }>({ open: false, idx: null })
  const [addStudentModal, setAddStudentModal] = useState(false)
  const [editStudentModal, setEditStudentModal] = useState<{ open: boolean; student: any | null }>({ open: false, student: null })
  const [editStudentId, setEditStudentId] = useState('')
  const [editStudentPw, setEditStudentPw] = useState('')
  const [editStudentPremium, setEditStudentPremium] = useState(false)
  const [showEditPw, setShowEditPw] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type?: string } | null>(null)
  const [subSearch, setSubSearch] = useState('')

  // Forms
  const [lName, setLName] = useState(''); const [lUrl, setLUrl] = useState(''); const [lImgData, setLImgData] = useState(''); const [lContentType, setLContentType] = useState<'url'|'html'>('url'); const [lHtmlContent, setLHtmlContent] = useState(''); const [lTags, setLTags] = useState<string[]>([]); const [lAccessType, setLAccessType] = useState<'free'|'premium'>('free')
  const [bTitle, setBTitle] = useState(''); const [bImgData, setBImgData] = useState(''); const [bLinkUrl, setBLinkUrl] = useState(''); const [bActive, setBActive] = useState(true)
  const [newStudentName, setNewStudentName] = useState(''); const [newStudentPhone, setNewStudentPhone] = useState(''); const [newStudentNote, setNewStudentNote] = useState('')

  const addLog = (msg: string, type: string) => {
    const time = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs(prev => [{ msg, type, time }, ...prev].slice(0, 25))
  }

  const login = () => {
    if (pw === ADMIN_PW) { setAuthed(true); loadAll(); startPresenceWatch() }
    else setPwErr('Kata laluan salah')
  }

  const loadAll = async () => {
    const [{ data: l }, { data: b }, { data: s }, { data: settings }, { data: pr }] = await Promise.all([
      supabase.from('links').select('*').order('order_num'),
      supabase.from('banners').select('*').order('order_num'),
      supabase.from('students').select('*').order('created_at', { ascending: false }),
      supabase.from('app_settings').select('*').eq('key', 'payment_required').single(),
      supabase.from('payment_requests').select('*').eq('status','pending').order('created_at', { ascending: false }),
    ])
    setLinks(l || [])
    setBanners(b || []); setStudents(s || [])
    setPaymentRequired(settings?.value === 'true')
    {
      const { data: allSettings } = await supabase.from('app_settings').select('key,value')
      if (allSettings) {
        const m: Record<string, string> = {}
        allSettings.forEach((s: { key: string; value: string }) => { m[s.key] = s.value })
        setPaySettings({
          price: m['payment_price'] || '50',
          instructions: m['payment_instructions'] || '',
          bank: m['payment_bank'] || '',
          accountName: m['payment_account_name'] || '',
          accountNumber: m['payment_account_number'] || '',
          qrUrl: m['payment_qr_url'] || '',
          whatsapp: m['payment_whatsapp'] || '',
        })
        setPayQrData(m['payment_qr_url'] || '')
      }
    }
  }

  const togglePaymentMode = async () => {
    setTogglingPayment(true)
    const newVal = !paymentRequired
    await adminApi.upsert('app_settings', { key: 'payment_required', value: newVal.toString(), updated_at: new Date().toISOString() })
    setPaymentRequired(newVal)
    showToast(newVal ? '🔒 Mod Berbayar DIAKTIFKAN' : '🔓 Mod Percuma DIAKTIFKAN', 'success')
    setTogglingPayment(false)
  }

  const savePaySettings = async () => {
    setSavingPaySettings(true)
    let qrUrl = paySettings.qrUrl
    if (payQrData && payQrData.startsWith('data:')) {
      const arr = payQrData.split(','), mime = arr[0].match(/:(.*?);/)![1]
      const bstr = atob(arr[1]); const u8 = new Uint8Array(bstr.length)
      for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i)
      const blob = new Blob([u8], { type: mime })
      const fname = `qr_${Date.now()}.${mime.split('/')[1]}`
      const { error } = await supabase.storage.from('images').upload(fname, blob)
      if (!error) qrUrl = supabase.storage.from('images').getPublicUrl(fname).data.publicUrl
    }
    const updates = [
      { key: 'payment_price', value: paySettings.price },
      { key: 'payment_instructions', value: paySettings.instructions },
      { key: 'payment_bank', value: paySettings.bank },
      { key: 'payment_account_name', value: paySettings.accountName },
      { key: 'payment_account_number', value: paySettings.accountNumber },
      { key: 'payment_qr_url', value: qrUrl },
      { key: 'payment_whatsapp', value: paySettings.whatsapp },
    ]
    for (const u of updates) {
      await adminApi.upsert('app_settings', { key: u.key, value: u.value, updated_at: new Date().toISOString() })
    }
    setPaySettings(p => ({ ...p, qrUrl }))
    showToast('Tetapan bayaran disimpan!', 'success')
    setSavingPaySettings(false)
  }

  const toggleStudentSub = async (studentId: string, current: boolean, name: string) => {
    await adminApi.update('students', studentId, {
      is_subscribed: !current,
      subscribed_at: !current ? new Date().toISOString() : null,
    })
    showToast(!current ? `${name} — akses diaktifkan` : `${name} — akses dilumpuhkan`, !current ? 'success' : '')
    loadAll()
  }

  const addStudentWithSub = async () => {
    const name = newStudentName.trim().toUpperCase()
    const phone = newStudentPhone.trim()
    if (!name) return showToast('Masukkan nama murid', 'error')
    if (!phone) return showToast('Masukkan nombor telefon', 'error')
    const { data: existing } = await supabase.from('students').select('id').eq('full_name', name).single()
    if (existing) return showToast('Nama sudah wujud', 'error')
    await adminApi.insert('students', {
      full_name: name, parent_phone: phone,
      is_subscribed: true, subscribed_at: new Date().toISOString(),
      subscription_note: newStudentNote || null,
    })
    showToast(`${name} ditambah dengan akses aktif!`, 'success')
    setAddStudentModal(false); setNewStudentName(''); setNewStudentPhone(''); setNewStudentNote('')
    loadAll()
  }

  const saveEditStudent = async () => {
    const s = editStudentModal.student
    if (!s) return
    if (!editStudentId.trim()) return showToast('ID tidak boleh kosong', 'error')
    if (editStudentId.trim().length < 3) return showToast('ID mestilah sekurang-kurangnya 3 aksara', 'error')
    if (!editStudentPw.trim()) return showToast('Kata laluan tidak boleh kosong', 'error')
    // Check ID duplicate (exclude current student)
    const { data: existing } = await supabase.from('students').select('id').eq('student_id', editStudentId.trim().toLowerCase()).neq('id', s.id).maybeSingle()
    if (existing) return showToast('ID ini sudah digunakan murid lain', 'error')
    await adminApi.update('students', s.id, {
      student_id: editStudentId.trim().toLowerCase(),
      password: editStudentPw.trim(),
      is_premium: editStudentPremium,
    })
    showToast(`✅ Maklumat ${s.full_name} dikemaskini!`, 'success')
    setEditStudentModal({ open: false, student: null })
    loadAll()
  }

  const deleteStudent = async (studentId: string, name: string) => {
    if (!confirm(`⚠️ Padam akaun "${name}"?\n\nTindakan ini tidak boleh dibatalkan.`)) return
    await adminApi.delete('students', studentId)
    showToast(`Akaun ${name} dipadam 🗑️`)
    loadAll()
  }

  const openEditStudent = (s: any) => {
    setEditStudentId(s.student_id || '')
    setEditStudentPw(s.password || '')
    setEditStudentPremium(s.is_premium || false)
    setShowEditPw(false)
    setEditStudentModal({ open: true, student: s })
  }

  const approvePayment = async (reqId: string, studentId: string, name: string) => {
    // Activate premium for student
    await adminApi.update('students', studentId, { is_premium: true, is_subscribed: true, subscribed_at: new Date().toISOString() })
    // Update request status
    await adminApi.update('payment_requests', reqId, { status: 'approved', updated_at: new Date().toISOString() })
    showToast(`✅ ${name} — Premium diaktifkan!`, 'success')
    loadAll()
  }

  const rejectPayment = async (reqId: string, name: string) => {
    if (!confirm(`Tolak permintaan dari ${name}?`)) return
    await adminApi.update('payment_requests', reqId, { status: 'rejected', updated_at: new Date().toISOString() })
    showToast(`❌ Permintaan ${name} ditolak`, '')
    loadAll()
  }

  const startPresenceWatch = () => {
    presenceRef.current?.unsubscribe()
    const ch = supabase.channel('aedu_presence')
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState<{ full_name: string; user_id: string }>()
      const users = Object.values(state).flat()
      setOnline(users.length); setOnlineNames(users.map(u => u.full_name))
      setChartPts(prev => [...prev.slice(1), users.length])
    })
    ch.on('presence', { event: 'join' }, ({ newPresences }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newPresences.forEach((p: any) => addLog(`${p.full_name || 'Pengguna'} menyertai`, 'join'))
    })
    ch.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      leftPresences.forEach((p: any) => addLog(`${p.full_name || 'Pengguna'} keluar`, 'leave'))
    })
    ch.subscribe(); presenceRef.current = ch
  }

  useEffect(() => { return () => { presenceRef.current?.unsubscribe() } }, [])

  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d'); if (!ctx) return
    c.width = c.parentElement!.clientWidth - 32; c.height = 80
    const W = c.width, H = c.height, max = Math.max(...chartPts, 1)
    const step = W / (chartPts.length - 1)
    ctx.clearRect(0, 0, W, H)
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, 'rgba(99,102,241,0.3)'); g.addColorStop(1, 'rgba(99,102,241,0)')
    ctx.beginPath()
    chartPts.forEach((v, i) => { const x = i * step, y = H * (1 - v / max) + 4; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) })
    ctx.lineTo((chartPts.length - 1) * step, H); ctx.lineTo(0, H); ctx.closePath()
    ctx.fillStyle = g; ctx.fill()
    ctx.beginPath(); ctx.strokeStyle = '#6366F1'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'
    chartPts.forEach((v, i) => { const x = i * step, y = H * (1 - v / max) + 4; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) })
    ctx.stroke()
    const lv = chartPts[chartPts.length - 1]
    ctx.beginPath(); ctx.arc((chartPts.length - 1) * step, H * (1 - lv / max) + 4, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#6366F1'; ctx.fill()
    ctx.beginPath(); ctx.arc((chartPts.length - 1) * step, H * (1 - lv / max) + 4, 7, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(99,102,241,0.3)'; ctx.lineWidth = 3; ctx.stroke()
  }, [chartPts])

  const showToast = (msg: string, type = '') => { setToast({ msg, type }); setTimeout(() => setToast(null), 2800) }

  const readImg = (file: File, cb: (d: string) => void) => {
    if (file.size > 3 * 1024 * 1024) return showToast('Fail terlalu besar (maks 3MB)', 'error')
    const r = new FileReader(); r.onload = e => cb(e.target!.result as string); r.readAsDataURL(file)
  }

  const uploadImg = async (dataUrl: string): Promise<string | null> => {
    try {
      // Convert dataUrl to File, upload via server API (service role)
      const arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)![1]
      const bstr = atob(arr[1]); const u8 = new Uint8Array(bstr.length)
      for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i)
      const blob = new Blob([u8], { type: mime })
      const file = new File([blob], `upload.${mime.split('/')[1]}`, { type: mime })
      return await uploadImageAdmin(file)
    } catch (e) {
      showToast('Gagal upload: ' + String(e), 'error'); return null
    }
  }





  const openAddLink = () => { setLName(''); setLUrl(''); setLImgData(''); setLContentType('url'); setLHtmlContent(''); setLTags([]); setLAccessType('free'); setLinkModal({ open: true, folderIdx: null, linkIdx: null }) }
  const openEditLink = (linkId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lnk = links.find((l: any) => l.id === linkId) as any
    if (!lnk) return
    setLName(lnk.name); setLUrl(lnk.url || ''); setLImgData(lnk.img_url || '')
    setLContentType(lnk.content_type || 'url'); setLHtmlContent(lnk.html_content || ''); setLTags(lnk.tags || []); setLAccessType(lnk.access_type || 'free')
    setLinkModal({ open: true, folderIdx: null, linkIdx: linkId })
  }
  const saveLink = async () => {
    if (!lName.trim()) return showToast('Masukkan nama aktiviti', 'error')
    if (lContentType === 'url' && !lUrl.trim()) return showToast('Masukkan URL', 'error')
    if (lContentType === 'html' && !lHtmlContent.trim()) return showToast('Paste kod HTML', 'error')
    let url = lUrl.trim()
    if (lContentType === 'url' && url && !/^https?:\/\//i.test(url)) url = 'https://' + url
    let imgUrl: string | null = null
    if (lImgData?.startsWith('data:')) imgUrl = await uploadImg(lImgData)
    else if (lImgData) imgUrl = lImgData
    const isEdit = linkModal.linkIdx !== null
    if (!isEdit) {
      await adminApi.insert('links', {
        folder_id: null, name: lName.trim(),
        url: lContentType === 'url' ? url : null,
        html_content: lContentType === 'html' ? lHtmlContent.trim() : null,
        content_type: lContentType, img_url: imgUrl,
        emoji: lContentType === 'html' ? '🎮' : '🔗',
        tags: lTags, access_type: lAccessType, order_num: links.length
      })
      showToast('Aktiviti ditambah!', 'success')
    } else {
      await adminApi.update('links', linkModal.linkIdx as string, {
        name: lName.trim(),
        url: lContentType === 'url' ? url : null,
        html_content: lContentType === 'html' ? lHtmlContent.trim() : null,
        content_type: lContentType, img_url: imgUrl,
        emoji: lContentType === 'html' ? '🎮' : '🔗', tags: lTags, access_type: lAccessType
      })
      showToast('Aktiviti dikemaskini!', 'success')
    }
    setLinkModal({ open: false, folderIdx: null, linkIdx: null }); loadAll()
  }
  const deleteLink = async (linkId: string, name: string) => {
    if (!confirm(`Padam "${name}"?`)) return
    await adminApi.delete('links', linkId); showToast('Aktiviti dipadam'); loadAll()
  }

  const openAddBanner = () => { setBTitle(''); setBImgData(''); setBLinkUrl(''); setBActive(true); setBannerModal({ open: true, idx: null }) }
  const openEditBanner = (i: number) => { const b = banners[i]; setBTitle(b.title); setBImgData(b.img_url || ''); setBLinkUrl(b.link_url || ''); setBActive(b.active); setBannerModal({ open: true, idx: i }) }
  const saveBanner = async () => {
    let imgUrl: string | null = null
    if (bImgData?.startsWith('data:')) imgUrl = await uploadImg(bImgData)
    else if (bImgData) imgUrl = bImgData
    if (bannerModal.idx === null) {
      await adminApi.insert('banners', { title: bTitle.trim(), img_url: imgUrl, link_url: bLinkUrl || null, active: bActive, order_num: banners.length })
      showToast('Banner ditambah!', 'success')
    } else {
      await adminApi.update('banners', banners[bannerModal.idx].id, { title: bTitle.trim(), img_url: imgUrl, link_url: bLinkUrl || null, active: bActive })
      showToast('Banner dikemaskini!', 'success')
    }
    setBannerModal({ open: false, idx: null }); loadAll()
  }
  const deleteBanner = async (i: number) => {
    if (!confirm('Padam banner ini?')) return
    await adminApi.delete('banners', banners[i].id); showToast('Banner dipadam'); loadAll()
  }

  const subscribedCount = students.filter(s => s.is_subscribed).length
  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(subSearch.toLowerCase()) || s.parent_phone.includes(subSearch)
  )

  const Toggle = ({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) => (
    <button onClick={onToggle} disabled={disabled} style={{
      width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
      background: on ? '#6366F1' : '#E2E8F0', position: 'relative', transition: 'background 0.3s',
      flexShrink: 0, boxShadow: on ? '0 0 0 3px rgba(99,102,241,0.2)' : 'none', padding: 0,
    }}>
      <span style={{
        position: 'absolute', top: 4, left: on ? 28 : 4,
        width: 20, height: 20, borderRadius: '50%', background: 'white',
        transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', display: 'block'
      }} />
    </button>
  )

  // LOGIN
  if (!authed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#0F172A 0%,#1E1B4B 50%,#312E81 100%)', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 24, padding: '44px 32px', width: '100%', maxWidth: 360, textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>
        <img src="/logo.png" alt="AEdu" style={{ width: 90, height: 90, objectFit: 'contain', margin: '0 auto 20px', display: 'block' }} />
        <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>Panel Admin</h1>
        <p style={{ color: '#94A3B8', fontSize: 13, marginBottom: 28 }}>AEdu — Akses Terhad</p>
        <input type="password" style={{ width: '100%', padding: '13px 16px', border: '2px solid #E2E8F0', borderRadius: 12, fontSize: 18, letterSpacing: 8, textAlign: 'center', outline: 'none', marginBottom: 8, fontFamily: 'monospace' }}
          placeholder="••••••" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} />
        {pwErr && <p style={{ color: '#EF4444', fontSize: 12, marginBottom: 8 }}>{pwErr}</p>}
        <button style={{ width: '100%', padding: 13, background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 16 }} onClick={login}>
          Log Masuk
        </button>
        <a href="/" style={{ fontSize: 12, color: '#94A3B8', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          {Icons.logout} Kembali ke AEdu
        </a>
      </div>
    </div>
  )

  const tabConfig: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: Icons.overview },
    { key: 'apps', label: 'Aktiviti', icon: Icons.link },
    { key: 'banners', label: 'Banner', icon: Icons.banners },
    { key: 'students', label: 'Murid', icon: Icons.students },
    { key: 'subscription', label: 'Langganan', icon: Icons.subscription },
    { key: 'payment', label: 'Bayaran', icon: Icons.payment },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter',sans-serif" }}>

      {/* Sidebar + Content layout for desktop, stacked for mobile */}
      <style>{`
        @media (min-width: 768px) {
          .admin-layout { display: flex !important; }
          .admin-sidebar { display: flex !important; }
          .admin-tabbar { display: none !important; }
          .admin-content { margin-left: 220px !important; }
        }
        @media (max-width: 767px) {
          .admin-sidebar { display: none !important; }
          .admin-tabbar { display: flex !important; }
        }
        .tab-item:hover { background: rgba(99,102,241,0.08) !important; color: #4F46E5 !important; }
        .folder-row:hover { background: #F1F5F9 !important; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
        .icon-btn:hover { opacity: 0.8; }
      `}</style>

      {/* SIDEBAR (desktop) */}
      <div className="admin-sidebar" style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 220,
        background: 'white', borderRight: '1px solid #E2E8F0',
        flexDirection: 'column', zIndex: 100, boxShadow: '2px 0 12px rgba(0,0,0,0.06)'
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="AEdu" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: 16, color: '#0F172A' }}>AEdu</div>
              <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>ADMIN PANEL</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tabConfig.map(t => (
            <button key={t.key} className="tab-item" onClick={() => setTab(t.key)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 10, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
              background: tab === t.key ? '#EEF2FF' : 'transparent',
              color: tab === t.key ? '#4F46E5' : '#64748B',
              fontWeight: tab === t.key ? 700 : 500, fontSize: 13, transition: 'all 0.15s'
            }}>
              <span style={{ color: tab === t.key ? '#4F46E5' : '#94A3B8', display: 'flex' }}>{t.icon}</span>
              {t.label}
              {t.key === 'subscription' && paymentRequired && (
                <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 800, background: '#4F46E5', color: 'white', padding: '2px 7px', borderRadius: 20 }}>ON</span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ width: 8, height: 8, background: '#10B981', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{online} dalam talian</span>
          </div>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94A3B8', textDecoration: 'none', padding: '8px 10px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            {Icons.eye} Paparan Pelajar
          </a>
        </div>
      </div>

      {/* MOBILE TAB BAR */}
      <div className="admin-tabbar" style={{
        position: 'sticky', top: 0, zIndex: 100, background: 'white',
        borderBottom: '1px solid #E2E8F0', padding: '0 8px',
        overflowX: 'auto', gap: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        {/* Mobile topbar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 8px', gap: 8, width: '100%' }}>
          <img src="/logo.png" alt="AEdu" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: 15, flex: 1 }}>AEdu Admin</span>
          <a href="/" style={{ fontSize: 11, color: '#64748B', textDecoration: 'none', padding: '5px 10px', background: '#F1F5F9', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            {Icons.eye} Pelajar
          </a>
        </div>
        <div style={{ display: 'flex', overflowX: 'auto', width: '100%', paddingBottom: 1 }}>
          {tabConfig.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer',
              color: tab === t.key ? '#4F46E5' : '#94A3B8', fontSize: 10, fontWeight: tab === t.key ? 700 : 500,
              borderBottom: tab === t.key ? '2px solid #4F46E5' : '2px solid transparent',
              whiteSpace: 'nowrap', transition: 'all 0.15s'
            }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="admin-content" style={{ padding: '24px 16px', maxWidth: 760 }}>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>Dashboard</h2>
              <p style={{ color: '#64748B', fontSize: 13 }}>Selamat datang ke panel admin AEdu</p>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Dalam Talian', val: online, sub: 'pengguna aktif', color: '#6366F1', bg: '#EEF2FF', live: true },
                { label: 'Murid Daftar', val: students.length, sub: 'jumlah keseluruhan', color: '#0EA5E9', bg: '#E0F2FE', live: false },
                { label: 'Akses Aktif', val: subscribedCount, sub: paymentRequired ? 'mod berbayar' : 'mod percuma', color: '#10B981', bg: '#ECFDF5', live: false },
                { label: 'Aktiviti', val: links.length, sub: 'jumlah aktiviti', color: '#F59E0B', bg: '#FFFBEB', live: false },
              ].map(s => (
                <div key={s.label} className="stat-card" style={{ background: 'white', borderRadius: 16, padding: '18px', border: '1px solid #F1F5F9', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 34, fontWeight: 900, color: s.color, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-1px' }}>
                    {s.val}
                    {s.live && <span style={{ width: 8, height: 8, background: '#10B981', borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #F1F5F9', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 14, color: '#0F172A' }}>Pengguna Dalam Talian</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Data masa nyata</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#10B981', fontWeight: 700, background: '#ECFDF5', padding: '4px 10px', borderRadius: 20 }}>
                  <span style={{ width: 6, height: 6, background: '#10B981', borderRadius: '50%', display: 'inline-block' }} />
                  LANGSUNG
                </div>
              </div>
              <div style={{ padding: '12px 16px 8px' }}><canvas ref={canvasRef} style={{ width: '100%', height: 80, display: 'block' }} /></div>
              <div style={{ maxHeight: 180, overflowY: 'auto', padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {logs.length === 0
                  ? <p style={{ color: '#CBD5E1', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>Menunggu aktiviti...</p>
                  : logs.map((l, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: '#F8FAFC' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: l.type === 'join' ? '#10B981' : '#EF4444', flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ flex: 1, fontSize: 11, color: '#475569' }}>{l.msg}</span>
                      <span style={{ fontSize: 10, color: '#CBD5E1' }}>{l.time}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* ── PAYMENT REQUESTS ── */}
            {paymentRequests.length > 0 && (
              <div style={{ background: 'white', borderRadius: 16, border: '2px solid #FDE68A', boxShadow: '0 4px 16px rgba(245,158,11,0.15)', marginBottom: 16, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg,#FFF7ED,#FFFBEB)', borderBottom: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>💳</span>
                    <div>
                      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 14, color: '#92400E' }}>Permintaan Upgrade Premium</div>
                      <div style={{ fontSize: 11, color: '#B45309', marginTop: 1 }}>Menunggu kelulusan anda</div>
                    </div>
                  </div>
                  <div style={{ background: '#F59E0B', color: 'white', borderRadius: 20, padding: '3px 12px', fontSize: 13, fontWeight: 800 }}>
                    {paymentRequests.length} pending
                  </div>
                </div>
                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {paymentRequests.map((req: any) => (
                    <div key={req.id} style={{ background: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A', padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#F59E0B,#D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>👤</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{req.full_name}</div>
                          <div style={{ fontSize: 11, color: '#92400E', marginTop: 1 }}>
                            💰 RM{req.amount} • {new Date(req.created_at).toLocaleDateString('ms-MY', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                          </div>
                        </div>
                      </div>
                      {req.proof_url && (
                        <a href={req.proof_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'block', marginBottom: 10 }}>
                          <img src={req.proof_url} alt="Bukti" style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 10, border: '1px solid #FDE68A' }} />
                          <div style={{ fontSize: 11, color: '#92400E', marginTop: 4, textAlign: 'center' }}>👆 Klik untuk besar</div>
                        </a>
                      )}
                      {!req.proof_url && (
                        <div style={{ background: '#FEF3C7', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#92400E', marginBottom: 10 }}>
                          ⚠️ Tiada bukti bayaran dimuat naik
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => approvePayment(req.id, req.student_id, req.full_name)}
                          style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                          ✅ Luluskan & Aktifkan Premium
                        </button>
                        <button onClick={() => rejectPayment(req.id, req.full_name)}
                          style={{ padding: '10px 14px', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Online users list */}
            {onlineNames.length > 0 && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #F1F5F9', padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 13, color: '#0F172A', marginBottom: 10 }}>
                  Sedang Dalam Talian
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {onlineNames.map((n, i) => (
                    <span key={i} style={{ background: '#EEF2FF', color: '#4F46E5', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>{n}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* APPS / AKTIVITI */}
        {tab === 'apps' && (
          <Section title={`Semua Aktiviti (${links.length})`} action={<BtnAdd onClick={openAddLink}>{Icons.plus} Tambah Aktiviti</BtnAdd>}>
            {links.length === 0
              ? <Empty msg="Tiada aktiviti lagi. Tambah aktiviti pertama!" />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(links as any[]).map((l: any) => {
                    const tags: string[] = l.tags || []
                    return (
                      <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, border: '1px solid #E2E8F0', background: 'white' }}>
                        <Thumb img={l.img_url} emoji={l.content_type === 'html' ? '🎮' : '🔗'} size={44} radius={12} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{l.name}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: l.content_type === 'html' ? '#EEF2FF' : '#F0FDF4', color: l.content_type === 'html' ? '#4F46E5' : '#10B981', border: `1px solid ${l.content_type === 'html' ? '#C7D2FE' : '#BBF7D0'}` }}>
                              {l.content_type === 'html' ? 'HTML' : 'LINK'}
                            </span>
                            {tags.map((tag: string) => (
                              <span key={tag} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' }}>{tag}</span>
                            ))}
                            {l.url && <span style={{ fontSize: 10, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{l.url}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <IconBtn color="#EEF2FF" textColor="#4F46E5" onClick={() => openEditLink(l.id)}>{Icons.edit}</IconBtn>
                          <IconBtn color="#FEF2F2" textColor="#EF4444" onClick={() => deleteLink(l.id, l.name)}>{Icons.trash}</IconBtn>
                        </div>
                      </div>
                    )
                  })}
                </div>}
          </Section>
        )}

        {/* BANNERS */}
        {tab === 'banners' && (
          <Section title="Galeri Banner" action={<BtnAdd onClick={openAddBanner}>{Icons.plus} Banner</BtnAdd>}>
            {banners.length === 0
              ? <Empty msg="Tiada banner. Banner dipapar sebagai galeri bergerak kepada murid." />
              : banners.map((b, i) => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: 'white', marginBottom: 6 }}>
                  <Thumb img={b.img_url} emoji="📢" size={50} radius={8} wide />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{b.title || '(tiada tajuk)'}</div>
                    <div style={{ fontSize: 10, marginTop: 2, fontWeight: 600, color: b.active ? '#10B981' : '#94A3B8' }}>{b.active ? '● Aktif' : '○ Tidak aktif'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <IconBtn color="#EEF2FF" textColor="#4F46E5" onClick={() => openEditBanner(i)}>{Icons.edit}</IconBtn>
                    <IconBtn color="#FEF2F2" textColor="#EF4444" onClick={() => deleteBanner(i)}>{Icons.trash}</IconBtn>
                  </div>
                </div>
              ))}
          </Section>
        )}

        {/* STUDENTS */}
        {tab === 'students' && (
          <Section title={`Senarai Murid (${students.length})`}>
            {students.length === 0
              ? <Empty msg="Tiada murid berdaftar" />
              : students.map((s: any, i: number) => {
                const lastLogin = s.last_login ? new Date(s.last_login) : null
                const now = new Date()
                const diffDays = lastLogin ? Math.floor((now.getTime() - lastLogin.getTime()) / (1000*60*60*24)) : null
                const isActive = diffDays !== null && diffDays <= 7
                const lastLoginStr = lastLogin ? lastLogin.toLocaleDateString('ms-MY', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : 'Belum pernah login'
                return (
                  <div key={s.id} style={{ padding: '12px 14px', borderRadius: 12, border: `1px solid ${isActive ? '#BBF7D0' : '#E2E8F0'}`, background: isActive ? '#F0FDF4' : 'white', marginBottom: 8 }}>
                    {/* Row 1: Info + action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: isActive ? 'linear-gradient(135deg,#10B981,#059669)' : '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: isActive ? 'white' : '#4F46E5', flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{s.full_name}</span>
                          {s.student_id
                            ? <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#6366F1', background: '#EEF2FF', padding: '1px 7px', borderRadius: 6, fontWeight: 700 }}>{s.student_id}</span>
                            : <span style={{ fontSize: 10, color: '#EF4444', background: '#FEF2F2', padding: '1px 7px', borderRadius: 6 }}>Tiada ID</span>}
                          {s.is_premium && <span style={{ fontSize: 9, fontWeight: 800, background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: 'white', padding: '1px 7px', borderRadius: 20 }}>💎</span>}
                        </div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>📞 {s.parent_phone}</div>
                        {!s.password && <div style={{ fontSize: 10, color: '#F59E0B', fontWeight: 600, marginTop: 2 }}>⚠️ Belum ada kata laluan</div>}
                      </div>
                      {/* Action buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: s.is_subscribed ? '#10B981' : '#94A3B8', textAlign: 'right', marginBottom: 2 }}>
                          {s.is_subscribed ? '✓ Aktif' : '○ Tidak Aktif'}
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => openEditStudent(s)} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: '#EEF2FF', color: '#4F46E5', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {Icons.edit} Edit
                          </button>
                          <button onClick={() => deleteStudent(s.id, s.full_name)} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: '#FEF2F2', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {Icons.trash} Padam
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Row 2: Last login */}
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#10B981' : diffDays === null ? '#94A3B8' : '#F59E0B', display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: '#94A3B8' }}>Last login:</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: isActive ? '#10B981' : '#64748B' }}>{lastLoginStr}</span>
                      {diffDays !== null && diffDays > 30 && <span style={{ fontSize: 9, fontWeight: 700, background: '#FEF2F2', color: '#EF4444', padding: '1px 7px', borderRadius: 20, marginLeft: 'auto' }}>Tidak aktif &gt;30 hari</span>}
                      {!s.student_id && <span style={{ fontSize: 9, fontWeight: 700, background: '#FFF7ED', color: '#F59E0B', padding: '1px 7px', borderRadius: 20, marginLeft: 'auto' }}>Perlu set ID & password</span>}
                    </div>
                  </div>
                )
              })}
          </Section>
        )}

        {/* SUBSCRIPTION */}
        {tab === 'subscription' && (
          <>
            {/* Toggle card */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: '20px', marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 15, color: '#0F172A', marginBottom: 3 }}>
                    {paymentRequired ? '🔒 Mod Berbayar' : '🔓 Mod Percuma'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    {paymentRequired ? 'Hanya murid dengan akses aktif boleh log masuk' : 'Semua murid berdaftar boleh log masuk'}
                  </div>
                </div>
                <Toggle on={paymentRequired} onToggle={togglePaymentMode} disabled={togglingPayment} />
              </div>
              <div style={{ background: paymentRequired ? '#FFFBEB' : '#F0FDF4', border: `1px solid ${paymentRequired ? '#FDE68A' : '#BBF7D0'}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: paymentRequired ? '#92400E' : '#14532D' }}>
                {paymentRequired ? '⚠️ Murid yang belum diaktifkan tidak boleh log masuk.' : '✅ Semua murid berdaftar boleh masuk tanpa perlu diaktifkan.'}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Jumlah Daftar', val: students.length, color: '#4F46E5' },
                { label: 'Akses Aktif', val: subscribedCount, color: '#10B981' },
                { label: 'Belum Aktif', val: students.length - subscribedCount, color: '#EF4444' },
              ].map(s => (
                <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: '14px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 26, fontWeight: 900, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Student list with toggles */}
            <Section title="Urus Akses Murid" action={<BtnAdd onClick={() => setAddStudentModal(true)}>{Icons.plus} Tambah</BtnAdd>}>
              <input style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, outline: 'none', marginBottom: 10, background: '#F8FAFC' }}
                placeholder="🔍 Cari nama atau nombor telefon..." value={subSearch} onChange={e => setSubSearch(e.target.value)} />
              {filteredStudents.length === 0
                ? <Empty msg="Tiada murid ditemui" />
                : filteredStudents.map(s => (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    borderRadius: 12, border: `1px solid ${s.is_subscribed ? '#BBF7D0' : '#E2E8F0'}`,
                    background: s.is_subscribed ? '#F0FDF4' : 'white', marginBottom: 6, transition: 'all 0.2s'
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: s.is_subscribed ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,#94A3B8,#64748B)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: 'white'
                    }}>{s.full_name.charAt(0)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{s.full_name}</div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>📞 {s.parent_phone}</div>
                      {s.subscription_note && <div style={{ fontSize: 10, color: '#6366F1', marginTop: 2, fontWeight: 600 }}>📝 {s.subscription_note}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', color: s.is_subscribed ? '#10B981' : '#94A3B8', textTransform: 'uppercase' }}>
                        {s.is_subscribed ? 'AKTIF' : 'TIDAK AKTIF'}
                      </span>
                      <Toggle on={s.is_subscribed} onToggle={() => toggleStudentSub(s.id, s.is_subscribed, s.full_name)} />
                    </div>
                  </div>
                ))}
            </Section>
          </>
        )}

        {/* PAYMENT */}
        {tab === 'payment' && (
          <Section title="Tetapan Bayaran" action={
            <button onClick={savePaySettings} disabled={savingPaySettings} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: savingPaySettings ? '#E2E8F0' : 'linear-gradient(135deg,#4F46E5,#6366F1)', color: savingPaySettings ? '#94A3B8' : 'white', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {Icons.save} {savingPaySettings ? 'Menyimpan...' : 'Simpan'}
            </button>
          }>
            {/* Payment mode toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: paymentRequired ? '#FFFBEB' : '#F0FDF4', borderRadius: 12, border: `1px solid ${paymentRequired ? '#FDE68A' : '#BBF7D0'}`, marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{paymentRequired ? '🔒 Mod Berbayar Aktif' : '🔓 Mod Percuma Aktif'}</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{paymentRequired ? 'Pengguna perlu bayar untuk daftar' : 'Pengguna boleh daftar percuma'}</div>
              </div>
              <Toggle on={paymentRequired} onToggle={togglePaymentMode} />
            </div>

            {/* Price */}
            <FG label="Harga (RM)">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: '#4F46E5' }}>RM</span>
                <input type="number" min="1" value={paySettings.price} onChange={e => setPaySettings(p => ({ ...p, price: e.target.value }))}
                  style={{ width: 100, padding: '10px 14px', border: '2px solid #E2E8F0', borderRadius: 10, fontSize: 22, fontWeight: 900, color: '#4F46E5', outline: 'none', textAlign: 'center' }} />
                <span style={{ fontSize: 12, color: '#94A3B8' }}>/ Lifetime</span>
              </div>
            </FG>

            <FG label="Arahan Pembayaran">
              <textarea value={paySettings.instructions} onChange={e => setPaySettings(p => ({ ...p, instructions: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, outline: 'none', resize: 'none', height: 70, fontFamily: "'Inter',sans-serif" }}
                placeholder="cth: Sila buat bayaran ke akaun berikut..." />
            </FG>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FG label="Nama Bank">
                <input value={paySettings.bank} onChange={e => setPaySettings(p => ({ ...p, bank: e.target.value }))}
                  style={inpStyle} placeholder="cth: Maybank" />
              </FG>
              <FG label="Nama Akaun">
                <input value={paySettings.accountName} onChange={e => setPaySettings(p => ({ ...p, accountName: e.target.value }))}
                  style={inpStyle} placeholder="Nama penerima" />
              </FG>
            </div>

            <FG label="Nombor Akaun">
              <input value={paySettings.accountNumber} onChange={e => setPaySettings(p => ({ ...p, accountNumber: e.target.value }))}
                style={{ ...inpStyle, fontFamily: 'monospace', fontSize: 16, fontWeight: 700, letterSpacing: 2 }} placeholder="cth: 1234567890" />
            </FG>

            <FG label="WhatsApp Admin (dengan kod negara)">
              <input value={paySettings.whatsapp} onChange={e => setPaySettings(p => ({ ...p, whatsapp: e.target.value }))}
                style={inpStyle} placeholder="cth: 601234567890" />
            </FG>

            <FG label="QR Code Bayaran (pilihan)">
              <div style={{ border: '1.5px dashed #E2E8F0', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: '#F8FAFC', minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
                onClick={() => document.getElementById('qrInput')?.click()}>
                {payQrData || paySettings.qrUrl
                  ? <><img src={payQrData || paySettings.qrUrl} alt="QR" style={{ width: '100%', maxHeight: 180, objectFit: 'contain' }} />
                    <button style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12 }}
                      onClick={e => { e.stopPropagation(); setPayQrData(''); setPaySettings(p => ({ ...p, qrUrl: '' })) }}>✕</button></>
                  : <div style={{ textAlign: 'center', padding: 20, color: '#94A3B8' }}>{Icons.upload}<div style={{ fontSize: 12, marginTop: 8 }}>Muat naik QR Code</div></div>}
                <input id="qrInput" type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setPayQrData(ev.target!.result as string); r.readAsDataURL(f) } }} />
              </div>
            </FG>

            {/* Preview */}
            <div style={{ background: '#F0F4FF', border: '1px solid #C7D2FE', borderRadius: 12, padding: '14px 16px', marginTop: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4F46E5', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pratonton — paparan murid</div>
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 2 }}>
                <div>💰 Harga: <strong>RM {paySettings.price}</strong></div>
                <div>🏦 Bank: <strong>{paySettings.bank || '-'}</strong></div>
                <div>👤 Nama: <strong>{paySettings.accountName || '-'}</strong></div>
                <div>🔢 Akaun: <strong style={{ fontFamily: 'monospace' }}>{paySettings.accountNumber || '-'}</strong></div>
                {paySettings.whatsapp && <div>💬 WhatsApp: <strong>{paySettings.whatsapp}</strong></div>}
              </div>
            </div>
          </Section>
        )}
      </div>

      {/* MODALS */}

      {linkModal.open && (
        <Modal title={linkModal.linkIdx === null ? 'Tambah Aktiviti Baru' : 'Edit Aktiviti'} onClose={() => setLinkModal({ open: false, folderIdx: null, linkIdx: null })}>
          <FG label="Nama Aktiviti"><input style={inpStyle} placeholder="cth: Kuiz Matematik, Games Sains..." value={lName} onChange={e => setLName(e.target.value)} /></FG>

          {/* Toggle URL / HTML */}
          <FG label="Jenis Kandungan">
            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <button onClick={() => setLContentType('url')} style={{
                flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${lContentType==='url'?'#4F46E5':'#E2E8F0'}`,
                background: lContentType==='url'?'#EEF2FF':'white', color: lContentType==='url'?'#4F46E5':'#64748B',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s'
              }}>🔗 URL / Link</button>
              <button onClick={() => setLContentType('html')} style={{
                flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${lContentType==='html'?'#6366F1':'#E2E8F0'}`,
                background: lContentType==='html'?'#EEF2FF':'white', color: lContentType==='html'?'#6366F1':'#64748B',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s'
              }}>{'</>'} Kod HTML</button>
            </div>
          </FG>

          {/* URL input */}
          {lContentType === 'url' && (
            <FG label="URL Website">
              <input style={inpStyle} placeholder="https://..." value={lUrl} onChange={e => setLUrl(e.target.value)} type="url" />
              <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 5 }}>Link ke website luar atau games online</p>
            </FG>
          )}

          {/* HTML editor */}
          {lContentType === 'html' && (
            <FG label="Kod HTML">
              <div style={{ position: 'relative' }}>
                <textarea
                  value={lHtmlContent}
                  onChange={e => setLHtmlContent(e.target.value)}
                  placeholder={'<!DOCTYPE html>\n<html>\n<head>\n  <title>Games</title>\n</head>\n<body>\n  <!-- Paste HTML anda di sini -->\n</body>\n</html>'}
                  style={{
                    ...inpStyle, height: 220, resize: 'vertical',
                    fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6,
                    background: '#0F172A', color: '#E2E8F0', border: '2px solid #334155',
                    borderRadius: 10, padding: '12px'
                  }}
                />
                {lHtmlContent && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>
                      {lHtmlContent.length.toLocaleString()} aksara
                      {lHtmlContent.length > 900000 && <span style={{ color: '#EF4444', marginLeft: 4 }}>⚠️ Hampir had 1MB</span>}
                    </span>
                    <button onClick={() => setLHtmlContent('')}
                      style={{ marginLeft: 'auto', fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Padam
                    </button>
                  </div>
                )}
              </div>
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '8px 12px', marginTop: 8 }}>
                <div style={{ fontSize: 11, color: '#15803D', fontWeight: 700, marginBottom: 3 }}>✅ Tips:</div>
                <div style={{ fontSize: 11, color: '#166534', lineHeight: 1.6 }}>
                  • Export HTML dari Scratch, Construct, GDevelop<br/>
                  • Games HTML5, kuiz, animasi semua boleh<br/>
                  • JavaScript dan CSS berfungsi sepenuhnya
                </div>
              </div>
            </FG>
          )}

          <FG label="Tag / Tahun">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {['Tahun 1','Tahun 2','Tahun 3','Tahun 4','Tahun 5','Tahun 6','Matematik','Sains','Bahasa'].map(tag => {
                const active = lTags.includes(tag)
                return (
                  <button key={tag} type="button" onClick={() => setLTags(prev => active ? prev.filter(t => t !== tag) : [...prev, tag])}
                    style={{ padding: '6px 14px', borderRadius: 20, border: `2px solid ${active ? '#4F46E5' : '#E2E8F0'}`, background: active ? '#4F46E5' : 'white', color: active ? 'white' : '#64748B', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {tag}
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize: 11, color: '#94A3B8' }}>Pilih satu atau lebih tag. Murid boleh filter mengikut tag ini.</p>
          </FG>
          <FG label="Akses">
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setLAccessType('free')} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${lAccessType==='free'?'#10B981':'#E2E8F0'}`, background: lAccessType==='free'?'#ECFDF5':'white', color: lAccessType==='free'?'#059669':'#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                ✓ FREE
              </button>
              <button type="button" onClick={() => setLAccessType('premium')} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${lAccessType==='premium'?'#F59E0B':'#E2E8F0'}`, background: lAccessType==='premium'?'linear-gradient(135deg,#FFF7ED,#FFFBEB)':'white', color: lAccessType==='premium'?'#D97706':'#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                💎 PREMIUM
              </button>
            </div>
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 5 }}>FREE: semua murid boleh akses. PREMIUM: hanya murid premium sahaja.</p>
          </FG>
          <FG label="Gambar Ikon (pilihan)"><ImgUpload dataUrl={lImgData} onChange={setLImgData} onRead={readImg} /></FG>
          <ModalBtns onCancel={() => setLinkModal({ open: false, folderIdx: null, linkIdx: null })} onSave={saveLink} />
        </Modal>
      )}
      {bannerModal.open && (
        <Modal title={bannerModal.idx === null ? 'Tambah Banner' : 'Edit Banner'} onClose={() => setBannerModal({ open: false, idx: null })}>
          <FG label="Tajuk Banner (pilihan)"><input style={inpStyle} placeholder="cth: Aktiviti Minggu Ini..." value={bTitle} onChange={e => setBTitle(e.target.value)} /></FG>
          <FG label="Gambar Banner"><ImgUpload dataUrl={bImgData} onChange={setBImgData} onRead={readImg} /></FG>
          <FG label="URL Pautan (pilihan)"><input style={inpStyle} placeholder="https://..." value={bLinkUrl} onChange={e => setBLinkUrl(e.target.value)} /></FG>
          <FG label="Status">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={bActive} onChange={e => setBActive(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#4F46E5' }} />
              <span style={{ fontSize: 13 }}>Paparkan banner ini kepada murid</span>
            </label>
          </FG>
          <ModalBtns onCancel={() => setBannerModal({ open: false, idx: null })} onSave={saveBanner} />
        </Modal>
      )}
      {/* ── EDIT STUDENT MODAL ── */}
      {editStudentModal.open && editStudentModal.student && (
        <Modal title={`Edit Akaun — ${editStudentModal.student.full_name}`} onClose={() => setEditStudentModal({ open: false, student: null })}>
          <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#3730A3' }}>
            Kemaskini ID, kata laluan, atau status premium murid ini.
          </div>
          <FG label="ID Murid">
            <input style={{ ...inpStyle, fontFamily: 'monospace', letterSpacing: 1 }}
              placeholder="cth: ahmad01"
              value={editStudentId}
              onChange={e => setEditStudentId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} />
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Huruf kecil dan nombor sahaja. Min 3 aksara.</p>
          </FG>
          <FG label="Kata Laluan">
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...inpStyle, paddingRight: 44 }}
                type={showEditPw ? 'text' : 'password'}
                placeholder="Kata laluan baru"
                value={editStudentPw}
                onChange={e => setEditStudentPw(e.target.value)} />
              <button onClick={() => setShowEditPw(!showEditPw)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94A3B8' }}>
                {showEditPw ? '🙈' : '👁️'}
              </button>
            </div>
          </FG>
          <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#3730A3' }}>
            💡 Status premium diurus melalui tab <strong>Overview → Permintaan Upgrade</strong>. Admin luluskan bayaran di sana untuk aktifkan premium murid.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button
              onClick={() => { deleteStudent(editStudentModal.student.id, editStudentModal.student.full_name); setEditStudentModal({ open: false, student: null }) }}
              style={{ padding: '9px 14px', background: '#FEF2F2', color: '#EF4444', border: '1.5px solid #FECACA', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Padam Akaun
            </button>
            <div style={{ flex: 1, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={{ padding: '9px 16px', border: '1.5px solid #E2E8F0', borderRadius: 10, background: 'white', cursor: 'pointer', fontSize: 13, color: '#64748B' }}
                onClick={() => setEditStudentModal({ open: false, student: null })}>Batal</button>
              <button style={{ padding: '9px 22px', background: 'linear-gradient(135deg,#4F46E5,#6366F1)', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                onClick={saveEditStudent}>Simpan</button>
            </div>
          </div>
        </Modal>
      )}

      {addStudentModal && (
        <Modal title="Tambah Murid — Akses Aktif" onClose={() => setAddStudentModal(false)}>
          <div style={{ background: '#ECFDF5', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: '#14532D' }}>
            Murid yang ditambah di sini akan terus mendapat akses aktif.
          </div>
          <FG label="Nama Penuh Murid">
            <input style={inpStyle} placeholder="NAMA PENUH" value={newStudentName} onChange={e => setNewStudentName(e.target.value.toUpperCase())} />
          </FG>
          <FG label="Nombor Telefon Ibu/Bapa">
            <input style={inpStyle} placeholder="0123456789" value={newStudentPhone} onChange={e => setNewStudentPhone(e.target.value)} type="tel" />
          </FG>
          <FG label="Nota (pilihan — cth: Bayar RM50)">
            <input style={inpStyle} placeholder="Nota pembayaran..." value={newStudentNote} onChange={e => setNewStudentNote(e.target.value)} />
          </FG>
          <ModalBtns onCancel={() => setAddStudentModal(false)} onSave={addStudentWithSub} />
        </Modal>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : '#1E293B', color: 'white', padding: '10px 22px', borderRadius: 100, fontSize: 13, fontWeight: 600, zIndex: 999, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// ── Reusable sub-components ──
const inpStyle: React.CSSProperties = { width: '100%', padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: "'Inter',sans-serif", background: '#F8FAFC' }

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{title}</h3>
        {action}
      </div>
      <div style={{ padding: 12 }}>{children}</div>
    </div>
  )
}

function BtnAdd({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'linear-gradient(135deg,#4F46E5,#6366F1)', color: 'white', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 10px rgba(79,70,229,0.25)' }}>
      {children}
    </button>
  )
}

function IconBtn({ onClick, color, textColor, children }: { onClick: () => void; color: string; textColor: string; children: React.ReactNode }) {
  return (
    <button className="icon-btn" onClick={onClick} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: color, color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.15s' }}>
      {children}
    </button>
  )
}

function Thumb({ img, emoji, size, radius, wide }: { img: string | null; emoji: string; size: number; radius: number; wide?: boolean }) {
  return (
    <div style={{ width: wide ? size * 1.4 : size, height: size, borderRadius: radius, background: '#EEF2FF', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.45 }}>
      {img ? <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : emoji}
    </div>
  )
}

function Empty({ msg }: { msg: string }) {
  return <p style={{ textAlign: 'center', color: '#94A3B8', padding: '24px 0', fontSize: 13 }}>{msg}</p>
}

function FG({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 14 }}><label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</label>{children}</div>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '24px 22px', width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}>
        <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 800, marginBottom: 18, color: '#0F172A' }}>{title}</h3>
        {children}
      </div>
    </div>
  )
}

function ImgUpload({ dataUrl, onChange, onRead }: { dataUrl: string; onChange: (v: string) => void; onRead: (f: File, cb: (d: string) => void) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div style={{ border: '1.5px dashed #E2E8F0', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', position: 'relative' }}
      onClick={() => ref.current?.click()}>
      {dataUrl
        ? <><img src={dataUrl} alt="" style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
          <button style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12 }}
            onClick={e => { e.stopPropagation(); onChange('') }}>✕</button></>
        : <div style={{ textAlign: 'center', padding: 20, color: '#94A3B8' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{Icons.upload}</div>
            <div style={{ fontSize: 12 }}>Ketik untuk muat naik gambar</div>
            <div style={{ fontSize: 10, marginTop: 3, color: '#CBD5E1' }}>PNG · JPG (maks 3MB)</div>
          </div>}
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onRead(f, onChange) }} />
    </div>
  )
}

function ModalBtns({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
      <button style={{ padding: '9px 18px', border: '1.5px solid #E2E8F0', borderRadius: 10, background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#64748B' }} onClick={onCancel}>Batal</button>
      <button style={{ padding: '9px 22px', background: 'linear-gradient(135deg,#4F46E5,#6366F1)', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 10px rgba(79,70,229,0.3)' }} onClick={onSave}>Simpan</button>
    </div>
  )
}
