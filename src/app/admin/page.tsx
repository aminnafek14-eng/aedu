'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase, type Folder, type Link, type Banner, type Student } from '@/lib/supabase'

type Tab = 'overview' | 'folders' | 'banners' | 'students' | 'subscription' | 'payment'
const ADMIN_PW = '050505'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [folders, setFolders] = useState<Folder[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [students, setStudents] = useState<any[]>([])
  const [paymentRequired, setPaymentRequired] = useState(false)
  const [togglingPayment, setTogglingPayment] = useState(false)
  const [paySettings, setPaySettings] = useState({
    price: '50', instructions: 'Sila buat bayaran melalui:', bank: 'Maybank',
    accountName: '', accountNumber: '', qrUrl: '', whatsapp: ''
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
  const [folderModal, setFolderModal] = useState<{ open: boolean; idx: number | null }>({ open: false, idx: null })
  const [linkModal, setLinkModal] = useState<{ open: boolean; folderIdx: number | null; linkIdx: number | null }>({ open: false, folderIdx: null, linkIdx: null })
  const [bannerModal, setBannerModal] = useState<{ open: boolean; idx: number | null }>({ open: false, idx: null })
  const [addStudentModal, setAddStudentModal] = useState(false)
  const [openFolder, setOpenFolder] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ msg: string; type?: string } | null>(null)

  // Forms
  const [fName, setFName] = useState(''); const [fImgData, setFImgData] = useState('')
  const [lName, setLName] = useState(''); const [lUrl, setLUrl] = useState(''); const [lImgData, setLImgData] = useState('')
  const [bTitle, setBTitle] = useState(''); const [bImgData, setBImgData] = useState(''); const [bLinkUrl, setBLinkUrl] = useState(''); const [bActive, setBActive] = useState(true)
  const [newStudentName, setNewStudentName] = useState(''); const [newStudentPhone, setNewStudentPhone] = useState(''); const [newStudentNote, setNewStudentNote] = useState('')
  const [subSearch, setSubSearch] = useState('')

  const addLog = (msg: string, type: string) => {
    const time = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs(prev => [{ msg, type, time }, ...prev].slice(0, 25))
  }

  const login = () => {
    if (pw === ADMIN_PW) { setAuthed(true); loadAll(); startPresenceWatch() }
    else setPwErr('Kata laluan salah')
  }

  const loadAll = async () => {
    const [{ data: f }, { data: l }, { data: b }, { data: s }, { data: settings }] = await Promise.all([
      supabase.from('folders').select('*').order('order_num'),
      supabase.from('links').select('*').order('order_num'),
      supabase.from('banners').select('*').order('order_num'),
      supabase.from('students').select('*').order('created_at', { ascending: false }),
      supabase.from('app_settings').select('*').eq('key', 'payment_required').single(),
    ])
    setFolders(f || []); setLinks(l || [])
    setBanners(b || []); setStudents(s || [])
    setPaymentRequired(settings?.value === 'true')
    // Load payment settings
    {
      const { data: allSettings } = await supabase.from('app_settings').select('key,value')
      if (allSettings) {
        const m: Record<string,string> = {}
        allSettings.forEach((s: {key:string;value:string}) => { m[s.key] = s.value })
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

  // ── TOGGLE PAYMENT MODE ──
  const togglePaymentMode = async () => {
    setTogglingPayment(true)
    const newVal = !paymentRequired
    await supabase.from('app_settings')
      .upsert({ key: 'payment_required', value: newVal.toString(), updated_at: new Date().toISOString() })
    setPaymentRequired(newVal)
    showToast(newVal ? '🔒 Mod Berbayar DIAKTIFKAN' : '🔓 Mod Percuma DIAKTIFKAN', 'success')
    setTogglingPayment(false)
  }

  // ── SAVE PAYMENT SETTINGS ──
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
      if (!error) {
        qrUrl = supabase.storage.from('images').getPublicUrl(fname).data.publicUrl
      }
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
      await supabase.from('app_settings').upsert({ key: u.key, value: u.value, updated_at: new Date().toISOString() })
    }
    setPaySettings(p => ({ ...p, qrUrl }))
    showToast('Tetapan bayaran disimpan! ✅', 'success')
    setSavingPaySettings(false)
  }

  // ── SUBSCRIPTION MURID ──
  const toggleStudentSub = async (studentId: string, current: boolean, name: string) => {
    const now = new Date().toISOString()
    await supabase.from('students').update({
      is_subscribed: !current,
      subscribed_at: !current ? now : null,
    }).eq('id', studentId)
    showToast(!current ? `✅ ${name} — akses diaktifkan` : `❌ ${name} — akses dilumpuhkan`, !current ? 'success' : '')
    loadAll()
  }

  const addStudentWithSub = async () => {
    const name = newStudentName.trim().toUpperCase()
    const phone = newStudentPhone.trim()
    if (!name) return showToast('Masukkan nama murid', 'error')
    if (!phone) return showToast('Masukkan nombor telefon', 'error')
    const { data: existing } = await supabase.from('students').select('id').eq('full_name', name).single()
    if (existing) return showToast('Nama sudah wujud', 'error')
    await supabase.from('students').insert({
      full_name: name, parent_phone: phone,
      is_subscribed: true,
      subscribed_at: new Date().toISOString(),
      subscription_note: newStudentNote || null,
    })
    showToast(`✅ ${name} ditambah dengan akses aktif!`, 'success')
    setAddStudentModal(false); setNewStudentName(''); setNewStudentPhone(''); setNewStudentNote('')
    loadAll()
  }

  // ── PRESENCE ──
  const startPresenceWatch = () => {
    presenceRef.current?.unsubscribe()
    const ch = supabase.channel('aedu_presence')
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState<{ full_name: string; user_id: string }>()
      const users = Object.values(state).flat()
      setOnline(users.length)
      setOnlineNames(users.map(u => u.full_name))
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
    ch.subscribe()
    presenceRef.current = ch
  }

  useEffect(() => { return () => { presenceRef.current?.unsubscribe() } }, [])

  // Chart
  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d'); if (!ctx) return
    c.width = c.parentElement!.clientWidth - 32; c.height = 70
    const W = c.width, H = c.height, max = Math.max(...chartPts, 1)
    const step = W / (chartPts.length - 1)
    ctx.clearRect(0, 0, W, H)
    ctx.strokeStyle = '#E2E8F0'; ctx.lineWidth = 1
    ;[0.25, 0.5, 0.75, 1].forEach(f => { ctx.beginPath(); ctx.moveTo(0, H*(1-f)+2); ctx.lineTo(W, H*(1-f)+2); ctx.stroke() })
    const g = ctx.createLinearGradient(0,0,0,H)
    g.addColorStop(0,'rgba(79,70,229,0.25)'); g.addColorStop(1,'rgba(79,70,229,0)')
    ctx.beginPath()
    chartPts.forEach((v,i) => { const x=i*step,y=H*(1-v/max)+2; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y) })
    ctx.lineTo((chartPts.length-1)*step,H); ctx.lineTo(0,H); ctx.closePath()
    ctx.fillStyle=g; ctx.fill()
    ctx.beginPath(); ctx.strokeStyle='#4F46E5'; ctx.lineWidth=2; ctx.lineJoin='round'
    chartPts.forEach((v,i) => { const x=i*step,y=H*(1-v/max)+2; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y) })
    ctx.stroke()
    const lv=chartPts[chartPts.length-1]
    ctx.beginPath(); ctx.arc((chartPts.length-1)*step,H*(1-lv/max)+2,3.5,0,Math.PI*2)
    ctx.fillStyle='#4F46E5'; ctx.fill()
  }, [chartPts])

  const showToast = (msg: string, type = '') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 2800)
  }

  const readImg = (file: File, cb: (d: string) => void) => {
    if (file.size > 3*1024*1024) return showToast('Fail terlalu besar (maks 3MB)', 'error')
    const r = new FileReader(); r.onload = e => cb(e.target!.result as string); r.readAsDataURL(file)
  }

  const uploadImg = async (dataUrl: string): Promise<string | null> => {
    const arr=dataUrl.split(','), mime=arr[0].match(/:(.*?);/)![1]
    const bstr=atob(arr[1]); const u8=new Uint8Array(bstr.length)
    for(let i=0;i<bstr.length;i++) u8[i]=bstr.charCodeAt(i)
    const blob=new Blob([u8],{type:mime}); const ext=mime.split('/')[1]
    const fname=`${Date.now()}.${ext}`
    const {error}=await supabase.storage.from('images').upload(fname,blob)
    if(error){showToast('Gagal upload: '+error.message,'error');return null}
    return supabase.storage.from('images').getPublicUrl(fname).data.publicUrl
  }

  // FOLDER CRUD
  const openAddFolder=()=>{setFName('');setFImgData('');setFolderModal({open:true,idx:null})}
  const openEditFolder=(i:number)=>{setFName(folders[i].name);setFImgData(folders[i].img_url||'');setFolderModal({open:true,idx:i})}
  const saveFolder=async()=>{
    if(!fName.trim()) return showToast('Masukkan nama folder','error')
    let imgUrl:string|null=null
    if(fImgData?.startsWith('data:')) imgUrl=await uploadImg(fImgData)
    else if(fImgData) imgUrl=fImgData
    if(folderModal.idx===null){
      await supabase.from('folders').insert({name:fName.trim(),img_url:imgUrl,emoji:'📁',order_num:folders.length})
      showToast('Folder ditambah! ✅','success')
    } else {
      await supabase.from('folders').update({name:fName.trim(),img_url:imgUrl}).eq('id',folders[folderModal.idx].id)
      showToast('Folder dikemaskini! ✅','success')
    }
    setFolderModal({open:false,idx:null}); loadAll()
  }
  const deleteFolder=async(i:number)=>{
    if(!confirm(`Padam folder "${folders[i].name}"?`)) return
    await supabase.from('links').delete().eq('folder_id',folders[i].id)
    await supabase.from('folders').delete().eq('id',folders[i].id)
    showToast('Folder dipadam 🗑️'); loadAll()
  }

  // LINK CRUD
  const folderLinks=(fi:number)=>links.filter(l=>l.folder_id===folders[fi].id)
  const openAddLink=(fi:number)=>{setLName('');setLUrl('');setLImgData('');setLinkModal({open:true,folderIdx:fi,linkIdx:null})}
  const openEditLink=(fi:number,li:number)=>{const lnk=folderLinks(fi)[li];setLName(lnk.name);setLUrl(lnk.url);setLImgData(lnk.img_url||'');setLinkModal({open:true,folderIdx:fi,linkIdx:li})}
  const saveLink=async()=>{
    if(!lName.trim()) return showToast('Masukkan nama pautan','error')
    if(!lUrl.trim()) return showToast('Masukkan URL','error')
    let url=lUrl.trim(); if(!/^https?:\/\//i.test(url)) url='https://'+url
    let imgUrl:string|null=null
    if(lImgData?.startsWith('data:')) imgUrl=await uploadImg(lImgData)
    else if(lImgData) imgUrl=lImgData
    const fi=linkModal.folderIdx!
    if(linkModal.linkIdx===null){
      await supabase.from('links').insert({folder_id:folders[fi].id,name:lName.trim(),url,img_url:imgUrl,emoji:'🎮',order_num:folderLinks(fi).length})
      showToast('Pautan ditambah! ✅','success')
    } else {
      const lnk=folderLinks(fi)[linkModal.linkIdx!]
      await supabase.from('links').update({name:lName.trim(),url,img_url:imgUrl}).eq('id',lnk.id)
      showToast('Pautan dikemaskini! ✅','success')
    }
    setLinkModal({open:false,folderIdx:null,linkIdx:null}); loadAll()
  }
  const deleteLink=async(fi:number,li:number)=>{
    const lnk=folderLinks(fi)[li]
    if(!confirm(`Padam pautan "${lnk.name}"?`)) return
    await supabase.from('links').delete().eq('id',lnk.id)
    showToast('Pautan dipadam 🗑️'); loadAll()
  }

  // BANNER CRUD
  const openAddBanner=()=>{setBTitle('');setBImgData('');setBLinkUrl('');setBActive(true);setBannerModal({open:true,idx:null})}
  const openEditBanner=(i:number)=>{const b=banners[i];setBTitle(b.title);setBImgData(b.img_url||'');setBLinkUrl(b.link_url||'');setBActive(b.active);setBannerModal({open:true,idx:i})}
  const saveBanner=async()=>{
    let imgUrl:string|null=null
    if(bImgData?.startsWith('data:')) imgUrl=await uploadImg(bImgData)
    else if(bImgData) imgUrl=bImgData
    if(bannerModal.idx===null){
      await supabase.from('banners').insert({title:bTitle.trim(),img_url:imgUrl,link_url:bLinkUrl||null,active:bActive,order_num:banners.length})
      showToast('Banner ditambah! ✅','success')
    } else {
      await supabase.from('banners').update({title:bTitle.trim(),img_url:imgUrl,link_url:bLinkUrl||null,active:bActive}).eq('id',banners[bannerModal.idx].id)
      showToast('Banner dikemaskini! ✅','success')
    }
    setBannerModal({open:false,idx:null}); loadAll()
  }
  const deleteBanner=async(i:number)=>{
    if(!confirm('Padam banner ini?')) return
    await supabase.from('banners').delete().eq('id',banners[i].id)
    showToast('Banner dipadam 🗑️'); loadAll()
  }

  const subscribedCount = students.filter(s => s.is_subscribed).length
  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(subSearch.toLowerCase()) ||
    s.parent_phone.includes(subSearch)
  )

  // LOGIN
  if (!authed) return (
    <div style={S.loginPage}>
      <div style={S.loginCard}>
        <div style={S.loginLogo}>⚙️</div>
        <h1 style={S.loginTitle}>AEdu Admin</h1>
        <p style={S.loginSub}>Panel pengurusan — akses terhad</p>
        <input type="password" style={S.pwInput} placeholder="Kata laluan admin" value={pw}
          onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} />
        {pwErr&&<p style={{color:'#EF4444',fontSize:13,marginBottom:10}}>{pwErr}</p>}
        <button style={S.pwBtn} onClick={login}>Log Masuk Admin</button>
        <a href="/" style={S.backToApp}>← Kembali ke AEdu</a>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#F1F5F9'}}>
      {/* Topbar */}
      <div style={S.topbar}>
        <span style={S.topbarBrand}>⚙️ AEdu Admin</span>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={S.liveDot}/>
          <a href="/" style={S.topbarExit}>Paparan Pelajar →</a>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabBar}>
        {(['overview','folders','banners','students','subscription','payment'] as Tab[]).map(t=>(
          <button key={t} style={{...S.tabBtn,...(tab===t?S.tabActive:{})}} onClick={()=>setTab(t)}>
            {{overview:'📊 Overview',folders:'📁 Folder',banners:'🖼️ Banner',students:'👥 Murid',subscription:'⭐ Langganan',payment:'💳 Bayaran'}[t]}
            {t==='subscription'&&paymentRequired&&<span style={S.activePill}>ON</span>}
          </button>
        ))}
      </div>

      <div style={S.main}>

        {/* OVERVIEW */}
        {tab==='overview'&&(
          <>
            <div style={S.statsGrid}>
              <div style={{...S.statCard,background:'linear-gradient(135deg,#4F46E5,#6366F1)',border:'none'}}>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.75)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>🟢 Dalam Talian</div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:36,fontWeight:900,color:'white',display:'flex',alignItems:'center',gap:8}}>
                  {online}<span style={{width:8,height:8,background:'#4ADE80',borderRadius:'50%',display:'inline-block',boxShadow:'0 0 0 3px rgba(74,222,128,0.3)'}}/>
                </div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.6)',marginTop:4}}>pengguna aktif sekarang</div>
              </div>
              <div style={{...S.statCard,background:'linear-gradient(135deg,#0EA5E9,#06B6D4)',border:'none'}}>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.75)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>👥 Murid Daftar</div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:36,fontWeight:900,color:'white'}}>{students.length}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.6)',marginTop:4}}>jumlah keseluruhan</div>
              </div>
              <div style={{...S.statCard,background:'linear-gradient(135deg,#10B981,#059669)',border:'none'}}>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.75)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>⭐ Akses Aktif</div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:36,fontWeight:900,color:'white'}}>{subscribedCount}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.6)',marginTop:4}}>{paymentRequired?'🔒 Mod Berbayar':'🔓 Mod Percuma'}</div>
              </div>
              <div style={{...S.statCard,background:'linear-gradient(135deg,#F59E0B,#D97706)',border:'none'}}>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.75)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>🔗 Pautan</div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:36,fontWeight:900,color:'white'}}>{links.length}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.6)',marginTop:4}}>dalam {folders.length} folder</div>
              </div>
            </div>
            <div style={S.section}>
              <div style={S.sectionHdr}>
                <h3 style={S.sectionTitle}>📈 Graf Pengguna Dalam Talian</h3>
                <span style={{fontSize:11,color:'#10B981',display:'flex',alignItems:'center',gap:4}}><span style={S.liveDot}/>Data sebenar</span>
              </div>
              <div style={{padding:'14px 16px 8px'}}><canvas ref={canvasRef} style={{width:'100%',height:70}}/></div>
              <div style={{padding:'0 12px 12px',maxHeight:180,overflowY:'auto',display:'flex',flexDirection:'column',gap:5}}>
                {logs.length===0
                  ?<p style={{color:'#94A3B8',fontSize:12,textAlign:'center',padding:20}}>Menunggu aktiviti...</p>
                  :logs.map((l,i)=>(
                    <div key={i} style={S.logEntry}>
                      <span style={{width:6,height:6,borderRadius:'50%',background:l.type==='join'?'#10B981':'#EF4444',flexShrink:0,display:'inline-block'}}/>
                      <span style={{flex:1,fontSize:11}}>{l.msg}</span>
                      <span style={{fontSize:10,color:'#94A3B8'}}>{l.time}</span>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* SUBSCRIPTION TAB */}
        {tab==='subscription'&&(
          <>
            {/* Toggle Payment Mode */}
            <div style={{...S.section,marginBottom:12,overflow:'visible'}}>
              <div style={{padding:'18px 16px'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                  <div>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:15,marginBottom:4}}>
                      {paymentRequired?'🔒 Mod Berbayar Aktif':'🔓 Mod Percuma Aktif'}
                    </div>
                    <div style={{fontSize:12,color:'#64748B',lineHeight:1.5}}>
                      {paymentRequired
                        ?'Hanya murid yang ada akses aktif boleh log masuk.'
                        :'Semua murid berdaftar boleh log masuk tanpa had.'}
                    </div>
                  </div>
                  {/* Toggle switch */}
                  <button
                    onClick={togglePaymentMode}
                    disabled={togglingPayment}
                    style={{
                      width:56,height:30,borderRadius:15,border:'none',cursor:'pointer',
                      background:paymentRequired?'#4F46E5':'#E2E8F0',
                      position:'relative',transition:'background 0.3s',flexShrink:0,marginLeft:16
                    }}>
                    <span style={{
                      position:'absolute',top:3,
                      left:paymentRequired?28:3,
                      width:24,height:24,borderRadius:'50%',background:'white',
                      transition:'left 0.3s',boxShadow:'0 2px 6px rgba(0,0,0,0.2)',
                      display:'block'
                    }}/>
                  </button>
                </div>

                <div style={{
                  background:paymentRequired?'#FFF7ED':'#F0FDF4',
                  border:`1px solid ${paymentRequired?'#FDE68A':'#BBF7D0'}`,
                  borderRadius:10,padding:'10px 14px',fontSize:12,
                  color:paymentRequired?'#92400E':'#14532D',lineHeight:1.6
                }}>
                  {paymentRequired
                    ?'⚠️ Mod BERBAYAR: Murid yang belum diaktifkan tidak boleh log masuk. Aktifkan akses secara manual di bawah.'
                    :'✅ Mod PERCUMA: Semua murid berdaftar boleh masuk tanpa perlu diaktifkan.'}
                </div>
              </div>
            </div>

            {/* Subscription stats */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:12}}>
              <div style={{...S.statCard,textAlign:'center'}}>
                <div style={{fontSize:24,fontWeight:800,color:'#4F46E5'}}>{students.length}</div>
                <div style={{fontSize:11,color:'#64748B',marginTop:2}}>Jumlah Daftar</div>
              </div>
              <div style={{...S.statCard,textAlign:'center'}}>
                <div style={{fontSize:24,fontWeight:800,color:'#10B981'}}>{subscribedCount}</div>
                <div style={{fontSize:11,color:'#64748B',marginTop:2}}>Akses Aktif</div>
              </div>
              <div style={{...S.statCard,textAlign:'center'}}>
                <div style={{fontSize:24,fontWeight:800,color:'#EF4444'}}>{students.length-subscribedCount}</div>
                <div style={{fontSize:11,color:'#64748B',marginTop:2}}>Belum Aktif</div>
              </div>
            </div>

            {/* Senarai murid + toggle */}
            <div style={S.section}>
              <div style={S.sectionHdr}>
                <h3 style={S.sectionTitle}>👥 Urus Akses Murid</h3>
                <button style={S.addBtn} onClick={()=>setAddStudentModal(true)}>＋ Tambah</button>
              </div>
              {/* Search */}
              <div style={{padding:'10px 12px 0'}}>
                <input style={{...S.inp,fontSize:13}} placeholder="🔍 Cari nama atau nombor telefon..."
                  value={subSearch} onChange={e=>setSubSearch(e.target.value)}/>
              </div>
              <div style={{padding:10,display:'flex',flexDirection:'column',gap:6}}>
                {filteredStudents.length===0
                  ?<p style={{textAlign:'center',color:'#94A3B8',padding:24,fontSize:13}}>Tiada murid ditemui</p>
                  :filteredStudents.map(s=>(
                    <div key={s.id} style={{
                      display:'flex',alignItems:'center',gap:12,padding:'12px 14px',
                      borderRadius:12,border:s.is_subscribed?'1px solid #BBF7D0':'1px solid #E2E8F0',
                      background:s.is_subscribed?'#F0FDF4':'white',transition:'all 0.2s'
                    }}>
                      <div style={{
                        width:40,height:40,borderRadius:12,flexShrink:0,
                        background:s.is_subscribed?'linear-gradient(135deg,#10B981,#059669)':'linear-gradient(135deg,#94A3B8,#64748B)',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:16,fontWeight:800,color:'white'
                      }}>
                        {s.full_name.charAt(0)}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:'#0F172A'}}>{s.full_name}</div>
                        <div style={{fontSize:11,color:'#64748B',marginTop:1}}>📞 {s.parent_phone}</div>
                        {s.subscription_note&&<div style={{fontSize:10,color:'#6366F1',marginTop:2,fontWeight:600}}>📝 {s.subscription_note}</div>}
                      </div>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,flexShrink:0}}>
                        <span style={{fontSize:9,fontWeight:800,letterSpacing:'0.06em',color:s.is_subscribed?'#10B981':'#94A3B8',textTransform:'uppercase'}}>
                          {s.is_subscribed?'AKTIF':'TIDAK AKTIF'}
                        </span>
                        <div onClick={()=>toggleStudentSub(s.id,s.is_subscribed,s.full_name)}
                          style={{width:48,height:26,borderRadius:13,background:s.is_subscribed?'#10B981':'#CBD5E1',position:'relative',cursor:'pointer',transition:'background 0.3s',flexShrink:0,boxShadow:s.is_subscribed?'0 0 0 3px rgba(16,185,129,0.2)':'none'}}>
                          <span style={{position:'absolute',top:3,left:s.is_subscribed?24:3,width:20,height:20,borderRadius:'50%',background:'white',transition:'left 0.3s',boxShadow:'0 2px 6px rgba(0,0,0,0.2)',display:'block'}}/>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* PAYMENT SETTINGS */}
        {tab==='payment'&&(
          <div style={S.section}>
            <div style={S.sectionHdr}>
              <h3 style={S.sectionTitle}>💳 Tetapan Bayaran Manual</h3>
              <button style={{...S.addBtn,opacity:savingPaySettings?0.7:1}} onClick={savePaySettings} disabled={savingPaySettings}>
                {savingPaySettings?'Menyimpan...':'💾 Simpan'}
              </button>
            </div>
            <div style={{padding:'16px',display:'flex',flexDirection:'column',gap:14}}>

              {/* Status */}
              <div style={{background:paymentRequired?'#FFF7ED':'#F0FDF4',border:`1px solid ${paymentRequired?'#FDE68A':'#BBF7D0'}`,borderRadius:12,padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:'#0F172A',marginBottom:2}}>{paymentRequired?'🔒 Mod Berbayar Aktif':'🔓 Mod Percuma Aktif'}</div>
                  <div style={{fontSize:11,color:'#64748B'}}>{paymentRequired?'Pengguna perlu bayar untuk daftar':'Pengguna boleh daftar secara percuma'}</div>
                </div>
                <div onClick={togglePaymentMode} style={{width:48,height:26,borderRadius:13,background:paymentRequired?'#4F46E5':'#CBD5E1',position:'relative',cursor:'pointer',transition:'background 0.3s',flexShrink:0}}>
                  <span style={{position:'absolute',top:3,left:paymentRequired?24:3,width:20,height:20,borderRadius:'50%',background:'white',transition:'left 0.3s',boxShadow:'0 2px 6px rgba(0,0,0,0.2)',display:'block'}}/>
                </div>
              </div>

              {/* Price */}
              <div>
                <label style={S.flabel}>💰 Harga (RM)</label>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:20,fontWeight:800,color:'#4F46E5'}}>RM</span>
                  <input style={{...S.inp,fontSize:24,fontWeight:900,color:'#4F46E5',width:120,textAlign:'center'}}
                    type="number" min="1" value={paySettings.price}
                    onChange={e=>setPaySettings(p=>({...p,price:e.target.value}))}/>
                  <span style={{fontSize:13,color:'#64748B'}}>/ Lifetime</span>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label style={S.flabel}>📋 Arahan Pembayaran</label>
                <textarea style={{...S.inp,height:70,resize:'none'}}
                  placeholder="cth: Sila buat bayaran ke akaun berikut..."
                  value={paySettings.instructions}
                  onChange={e=>setPaySettings(p=>({...p,instructions:e.target.value}))}/>
              </div>

              {/* Bank info */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div>
                  <label style={S.flabel}>🏦 Nama Bank</label>
                  <input style={S.inp} placeholder="cth: Maybank, CIMB..." value={paySettings.bank}
                    onChange={e=>setPaySettings(p=>({...p,bank:e.target.value}))}/>
                </div>
                <div>
                  <label style={S.flabel}>👤 Nama Akaun</label>
                  <input style={S.inp} placeholder="Nama penerima..." value={paySettings.accountName}
                    onChange={e=>setPaySettings(p=>({...p,accountName:e.target.value}))}/>
                </div>
              </div>

              <div>
                <label style={S.flabel}>🔢 Nombor Akaun</label>
                <input style={{...S.inp,fontFamily:'monospace',fontSize:16,fontWeight:700,letterSpacing:2}}
                  placeholder="cth: 1234567890" value={paySettings.accountNumber}
                  onChange={e=>setPaySettings(p=>({...p,accountNumber:e.target.value}))}/>
              </div>

              {/* WhatsApp */}
              <div>
                <label style={S.flabel}>💬 Nombor WhatsApp Admin (dengan kod negara)</label>
                <input style={S.inp} placeholder="cth: 601234567890" value={paySettings.whatsapp}
                  onChange={e=>setPaySettings(p=>({...p,whatsapp:e.target.value}))}/>
                <p style={{fontSize:11,color:'#94A3B8',marginTop:4}}>Murid akan dihubungkan ke WhatsApp anda selepas bayar</p>
              </div>

              {/* QR Code */}
              <div>
                <label style={S.flabel}>📱 QR Code Bayaran (pilihan)</label>
                <div style={{border:'2px dashed #E2E8F0',borderRadius:12,overflow:'hidden',cursor:'pointer',background:'#F8FAFC',position:'relative',minHeight:100,display:'flex',alignItems:'center',justifyContent:'center'}}
                  onClick={()=>document.getElementById('qrInput')?.click()}>
                  {payQrData||paySettings.qrUrl
                    ?<><img src={payQrData||paySettings.qrUrl} alt="QR" style={{width:'100%',maxHeight:180,objectFit:'contain',display:'block'}}/>
                      <button style={{position:'absolute',top:6,right:6,width:26,height:26,borderRadius:'50%',background:'rgba(0,0,0,0.5)',color:'white',border:'none',cursor:'pointer',fontSize:12}}
                        onClick={e=>{e.stopPropagation();setPayQrData('');setPaySettings(p=>({...p,qrUrl:''}))}}>✕</button></>
                    :<div style={{textAlign:'center',padding:20,color:'#94A3B8'}}><div style={{fontSize:28,marginBottom:6}}>📱</div><div style={{fontSize:12}}>Muat naik QR Code (pilihan)</div></div>}
                  <input id="qrInput" type="file" accept="image/*" style={{display:'none'}}
                    onChange={e=>{const f=e.target.files?.[0];if(f){const r=new FileReader();r.onload=ev=>setPayQrData(ev.target!.result as string);r.readAsDataURL(f)}}}/>
                </div>
              </div>

              {/* Preview */}
              <div style={{background:'#F0F4FF',border:'1px solid #C7D2FE',borderRadius:12,padding:'14px 16px'}}>
                <div style={{fontSize:12,fontWeight:700,color:'#4F46E5',marginBottom:8}}>👁️ Pratonton — Apa murid akan nampak:</div>
                <div style={{fontSize:13,color:'#475569',lineHeight:1.8}}>
                  <div>💰 Harga: <strong>RM {paySettings.price}</strong> (Lifetime)</div>
                  <div>🏦 Bank: <strong>{paySettings.bank||'-'}</strong></div>
                  <div>👤 Nama: <strong>{paySettings.accountName||'-'}</strong></div>
                  <div>🔢 Akaun: <strong>{paySettings.accountNumber||'-'}</strong></div>
                  {paySettings.whatsapp&&<div>💬 WhatsApp: <strong>{paySettings.whatsapp}</strong></div>}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* FOLDERS */}
        {tab==='folders'&&(
          <div style={S.section}>
            <div style={S.sectionHdr}>
              <h3 style={S.sectionTitle}>📁 Urus Folder & Pautan</h3>
              <button style={S.addBtn} onClick={openAddFolder}>＋ Folder</button>
            </div>
            <div style={{padding:10,display:'flex',flexDirection:'column',gap:8}}>
              {folders.length===0
                ?<p style={{textAlign:'center',color:'#94A3B8',padding:30,fontSize:13}}>Tiada folder lagi</p>
                :folders.map((f,fi)=>(
                  <div key={f.id} style={{border:'1px solid #E2E8F0',borderRadius:10,overflow:'hidden'}}>
                    <div style={S.folderRow} onClick={()=>setOpenFolder(p=>({...p,[f.id]:!p[f.id]}))}>
                      <div style={S.folderThumb}>
                        {f.img_url?<img src={f.img_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{fontSize:20}}>{f.emoji}</span>}
                      </div>
                      <span style={S.folderNameA}>{f.name}</span>
                      <span style={{fontSize:11,color:'#94A3B8',marginRight:6}}>{folderLinks(fi).length}p</span>
                      <div style={{display:'flex',gap:5}} onClick={e=>e.stopPropagation()}>
                        <button style={S.iconBtn} onClick={()=>openEditFolder(fi)}>✏️</button>
                        <button style={{...S.iconBtn,background:'#FEF2F2'}} onClick={()=>deleteFolder(fi)}>🗑️</button>
                      </div>
                      <span style={{fontSize:10,color:'#94A3B8',marginLeft:4}}>{openFolder[f.id]?'▲':'▼'}</span>
                    </div>
                    {openFolder[f.id]&&(
                      <div style={{padding:'8px 10px',background:'white',borderTop:'1px solid #E2E8F0',display:'flex',flexDirection:'column',gap:6}}>
                        {folderLinks(fi).map((l,li)=>(
                          <div key={l.id} style={S.linkRow}>
                            <div style={S.linkThumb}>
                              {l.img_url?<img src={l.img_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{fontSize:18}}>{l.emoji}</span>}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:12,fontWeight:600}}>{l.name}</div>
                              <div style={{fontSize:10,color:'#94A3B8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.url}</div>
                            </div>
                            <div style={{display:'flex',gap:4}}>
                              <button style={S.iconBtn} onClick={()=>openEditLink(fi,li)}>✏️</button>
                              <button style={{...S.iconBtn,background:'#FEF2F2'}} onClick={()=>deleteLink(fi,li)}>🗑️</button>
                            </div>
                          </div>
                        ))}
                        <div style={S.addLinkRow} onClick={()=>openAddLink(fi)}>＋ Tambah Pautan</div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* BANNERS */}
        {tab==='banners'&&(
          <div style={S.section}>
            <div style={S.sectionHdr}>
              <h3 style={S.sectionTitle}>🖼️ Urus Galeri Banner</h3>
              <button style={S.addBtn} onClick={openAddBanner}>＋ Banner</button>
            </div>
            <div style={{padding:10,display:'flex',flexDirection:'column',gap:8}}>
              {banners.length===0
                ?<p style={{textAlign:'center',color:'#94A3B8',padding:30,fontSize:13}}>Tiada banner lagi.</p>
                :banners.map((b,i)=>(
                  <div key={b.id} style={{...S.linkRow,padding:10,borderRadius:10,border:'1px solid #E2E8F0',background:'white'}}>
                    <div style={{...S.linkThumb,width:56,height:42,borderRadius:8}}>
                      {b.img_url?<img src={b.img_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{fontSize:22}}>📢</span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600}}>{b.title||'(tiada tajuk)'}</div>
                      <div style={{fontSize:10,color:b.active?'#10B981':'#94A3B8'}}>{b.active?'✓ Aktif':'○ Tidak aktif'}</div>
                    </div>
                    <div style={{display:'flex',gap:4}}>
                      <button style={S.iconBtn} onClick={()=>openEditBanner(i)}>✏️</button>
                      <button style={{...S.iconBtn,background:'#FEF2F2'}} onClick={()=>deleteBanner(i)}>🗑️</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* STUDENTS */}
        {tab==='students'&&(
          <div style={S.section}>
            <div style={S.sectionHdr}><h3 style={S.sectionTitle}>👥 Senarai Murid ({students.length})</h3></div>
            <div style={{padding:10,display:'flex',flexDirection:'column',gap:6}}>
              {students.length===0
                ?<p style={{textAlign:'center',color:'#94A3B8',padding:30,fontSize:13}}>Tiada murid berdaftar</p>
                :students.map((s,i)=>(
                  <div key={s.id} style={{...S.linkRow,padding:'10px 12px',borderRadius:10,border:'1px solid #E2E8F0',background:'white'}}>
                    <div style={{width:32,height:32,borderRadius:8,background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#4F46E5',flexShrink:0}}>{i+1}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700}}>{s.full_name}</div>
                      <div style={{fontSize:11,color:'#94A3B8'}}>📞 {s.parent_phone}</div>
                    </div>
                    <div style={{fontSize:11,fontWeight:700,color:s.is_subscribed?'#10B981':'#94A3B8'}}>
                      {s.is_subscribed?'✅ Aktif':'❌ Tidak Aktif'}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {folderModal.open&&(
        <Modal title={folderModal.idx===null?'➕ Tambah Folder':'✏️ Edit Folder'} onClose={()=>setFolderModal({open:false,idx:null})}>
          <FG label="Nama Folder"><input style={S.inp} placeholder="cth: Tahun 1..." value={fName} onChange={e=>setFName(e.target.value)}/></FG>
          <FG label="Gambar Folder"><ImgUpload dataUrl={fImgData} onChange={setFImgData} onRead={readImg}/></FG>
          <ModalBtns onCancel={()=>setFolderModal({open:false,idx:null})} onSave={saveFolder}/>
        </Modal>
      )}

      {linkModal.open&&(
        <Modal title={linkModal.linkIdx===null?`➕ Pautan — ${folders[linkModal.folderIdx!]?.name}`:'✏️ Edit Pautan'} onClose={()=>setLinkModal({open:false,folderIdx:null,linkIdx:null})}>
          <FG label="Nama Pautan"><input style={S.inp} placeholder="cth: Kuiz Matematik..." value={lName} onChange={e=>setLName(e.target.value)}/></FG>
          <FG label="URL"><input style={S.inp} placeholder="https://..." value={lUrl} onChange={e=>setLUrl(e.target.value)} type="url"/></FG>
          <FG label="Gambar Pautan"><ImgUpload dataUrl={lImgData} onChange={setLImgData} onRead={readImg}/></FG>
          <ModalBtns onCancel={()=>setLinkModal({open:false,folderIdx:null,linkIdx:null})} onSave={saveLink}/>
        </Modal>
      )}

      {bannerModal.open&&(
        <Modal title={bannerModal.idx===null?'➕ Tambah Banner':'✏️ Edit Banner'} onClose={()=>setBannerModal({open:false,idx:null})}>
          <FG label="Tajuk Banner (pilihan)"><input style={S.inp} placeholder="cth: Aktiviti Minggu Ini..." value={bTitle} onChange={e=>setBTitle(e.target.value)}/></FG>
          <FG label="Gambar Banner"><ImgUpload dataUrl={bImgData} onChange={setBImgData} onRead={readImg}/></FG>
          <FG label="URL Pautan (pilihan)"><input style={S.inp} placeholder="https://..." value={bLinkUrl} onChange={e=>setBLinkUrl(e.target.value)}/></FG>
          <FG label="Status">
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
              <input type="checkbox" checked={bActive} onChange={e=>setBActive(e.target.checked)} style={{width:16,height:16}}/>
              <span style={{fontSize:13}}>Paparkan banner ini kepada murid</span>
            </label>
          </FG>
          <ModalBtns onCancel={()=>setBannerModal({open:false,idx:null})} onSave={saveBanner}/>
        </Modal>
      )}

      {/* Add student with subscription */}
      {addStudentModal&&(
        <Modal title="➕ Tambah Murid (Akses Aktif)" onClose={()=>setAddStudentModal(false)}>
          <div style={{background:'#ECFDF5',border:'1px solid #BBF7D0',borderRadius:8,padding:'10px 12px',marginBottom:16,fontSize:12,color:'#14532D'}}>
            ✅ Murid yang ditambah melalui sini akan terus mendapat akses aktif.
          </div>
          <FG label="Nama Penuh Murid">
            <input style={S.inp} placeholder="NAMA PENUH (huruf besar)" value={newStudentName}
              onChange={e=>setNewStudentName(e.target.value.toUpperCase())}/>
          </FG>
          <FG label="Nombor Telefon Ibu/Bapa">
            <input style={S.inp} placeholder="0123456789" value={newStudentPhone}
              onChange={e=>setNewStudentPhone(e.target.value)} type="tel"/>
          </FG>
          <FG label="Nota (pilihan — cth: Bayar RM50, 15 Jan 2025)">
            <input style={S.inp} placeholder="Nota pembayaran atau lain-lain..." value={newStudentNote}
              onChange={e=>setNewStudentNote(e.target.value)}/>
          </FG>
          <ModalBtns onCancel={()=>setAddStudentModal(false)} onSave={addStudentWithSub}/>
        </Modal>
      )}

      {toast&&(
        <div style={{...S.toast,background:toast.type==='success'?'#10B981':toast.type==='error'?'#EF4444':'#0F172A'}}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16}}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:'white',borderRadius:20,padding:'24px 20px',width:'100%',maxWidth:440,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 64px rgba(0,0,0,0.2)'}}>
        <h3 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:17,fontWeight:800,marginBottom:18}}>{title}</h3>
        {children}
      </div>
    </div>
  )
}

function FG({label,children}:{label:string;children:React.ReactNode}){
  return <div style={{marginBottom:14}}><label style={{display:'block',fontSize:11,fontWeight:700,color:'#64748B',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>{label}</label>{children}</div>
}

function ImgUpload({dataUrl,onChange,onRead}:{dataUrl:string;onChange:(v:string)=>void;onRead:(f:File,cb:(d:string)=>void)=>void}){
  const ref=useRef<HTMLInputElement>(null)
  return(
    <div style={{border:'2px dashed #E2E8F0',borderRadius:10,overflow:'hidden',cursor:'pointer',minHeight:100,display:'flex',alignItems:'center',justifyContent:'center',background:'#F8FAFC',position:'relative'}}
      onClick={()=>ref.current?.click()}>
      {dataUrl
        ?<><img src={dataUrl} alt="" style={{width:'100%',height:120,objectFit:'cover',display:'block'}}/>
          <button style={{position:'absolute',top:6,right:6,width:26,height:26,borderRadius:'50%',background:'rgba(0,0,0,0.5)',color:'white',border:'none',cursor:'pointer',fontSize:12}}
            onClick={e=>{e.stopPropagation();onChange('')}}>✕</button></>
        :<div style={{textAlign:'center',padding:20,color:'#94A3B8'}}><div style={{fontSize:28,marginBottom:6}}>🖼️</div><div style={{fontSize:12}}>Ketik untuk muat naik gambar</div><div style={{fontSize:10,marginTop:3}}>PNG · JPG (maks 3MB)</div></div>}
      <input ref={ref} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)onRead(f,onChange)}}/>
    </div>
  )
}

function ModalBtns({onCancel,onSave}:{onCancel:()=>void;onSave:()=>void}){
  return(
    <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:20}}>
      <button style={{padding:'9px 18px',border:'1px solid #E2E8F0',borderRadius:8,background:'white',cursor:'pointer',fontSize:13}} onClick={onCancel}>Batal</button>
      <button style={{padding:'9px 22px',background:'#4F46E5',color:'white',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}} onClick={onSave}>Simpan</button>
    </div>
  )
}

const S:Record<string,React.CSSProperties>={
  loginPage:{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)',padding:16},
  loginCard:{background:'white',borderRadius:24,padding:'40px 28px',width:'100%',maxWidth:360,textAlign:'center',boxShadow:'0 24px 64px rgba(0,0,0,0.3)'},
  loginLogo:{width:64,height:64,background:'linear-gradient(135deg,#312e81,#4F46E5)',borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,margin:'0 auto 14px'},
  loginTitle:{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:24,fontWeight:900,color:'#0F172A',marginBottom:4},
  loginSub:{color:'#64748B',fontSize:13,marginBottom:24},
  pwInput:{width:'100%',padding:'13px 16px',border:'2px solid #E2E8F0',borderRadius:10,fontSize:16,letterSpacing:6,textAlign:'center',outline:'none',marginBottom:12},
  pwBtn:{width:'100%',padding:13,background:'linear-gradient(135deg,#312e81,#4F46E5)',color:'white',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',marginBottom:16},
  backToApp:{fontSize:12,color:'#94A3B8',textDecoration:'none'},
  topbar:{background:'linear-gradient(135deg,#1e1b4b 0%,#4F46E5 100%)',padding:'0 16px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100,boxShadow:'0 4px 24px rgba(79,70,229,0.25)'},
  topbarBrand:{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:16,color:'white'},
  topbarExit:{fontSize:12,color:'rgba(255,255,255,0.7)',textDecoration:'none',padding:'6px 12px',background:'rgba(255,255,255,0.1)',borderRadius:7,border:'1px solid rgba(255,255,255,0.15)'},
  liveDot:{display:'inline-block',width:7,height:7,background:'#10B981',borderRadius:'50%',marginLeft:4},
  tabBar:{background:'white',borderBottom:'1px solid #E2E8F0',padding:'0 8px',display:'flex',gap:0,overflowX:'auto',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'},
  tabBtn:{padding:'12px 10px',border:'none',background:'none',fontSize:12,fontWeight:600,cursor:'pointer',color:'#64748B',whiteSpace:'nowrap',borderBottom:'2px solid transparent',display:'flex',alignItems:'center',gap:4},
  tabActive:{color:'#4F46E5',borderBottom:'2px solid #4F46E5'},
  activePill:{background:'#4F46E5',color:'white',fontSize:9,fontWeight:800,padding:'1px 6px',borderRadius:10},
  main:{padding:'16px',maxWidth:720,margin:'0 auto'},
  statsGrid:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12},
  statCard:{background:'white',borderRadius:16,padding:'16px',border:'1px solid #E2E8F0',boxShadow:'0 4px 16px rgba(0,0,0,0.06)',transition:'transform 0.2s'},
  statLabel:{fontSize:10,color:'#64748B',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6},
  statVal:{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:32,fontWeight:900,display:'flex',alignItems:'center',letterSpacing:'-1px'},
  section:{background:'white',borderRadius:18,border:'1px solid #E2E8F0',boxShadow:'0 4px 20px rgba(0,0,0,0.06)',marginBottom:14,overflow:'hidden'},
  sectionHdr:{padding:'13px 14px',borderBottom:'1px solid #E2E8F0',display:'flex',alignItems:'center',justifyContent:'space-between'},
  sectionTitle:{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:700},
  addBtn:{padding:'8px 16px',background:'linear-gradient(135deg,#4F46E5,#6366F1)',color:'white',border:'none',borderRadius:10,fontSize:12,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 12px rgba(79,70,229,0.3)'},
  folderRow:{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'#F8FAFC',cursor:'pointer'},
  folderThumb:{width:42,height:42,borderRadius:9,overflow:'hidden',background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0},
  folderNameA:{flex:1,fontSize:13,fontWeight:600},
  iconBtn:{width:30,height:30,borderRadius:7,border:'none',background:'#EEF2FF',cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center'},
  linkRow:{display:'flex',alignItems:'center',gap:9},
  linkThumb:{width:40,height:40,borderRadius:8,background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0},
  addLinkRow:{padding:'9px 10px',background:'#EEF2FF',borderRadius:8,border:'1px dashed #4F46E5',display:'flex',alignItems:'center',gap:7,cursor:'pointer',color:'#4F46E5',fontSize:12,fontWeight:600},
  logEntry:{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:7,background:'#F8FAFC'},
  inp:{width:'100%',padding:'11px 13px',border:'2px solid #E2E8F0',borderRadius:9,fontSize:14,outline:'none',fontFamily:"'Inter',sans-serif",background:'#F8FAFC'},
  toast:{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',color:'white',padding:'10px 20px',borderRadius:100,fontSize:13,fontWeight:500,zIndex:999,boxShadow:'0 6px 20px rgba(0,0,0,0.2)',whiteSpace:'nowrap'},
  flabel:{display:'block',fontSize:11,fontWeight:700,color:'#64748B',textTransform:'uppercase' as const,letterSpacing:'0.05em',marginBottom:6},
}
