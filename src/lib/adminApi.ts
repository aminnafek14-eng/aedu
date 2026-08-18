// ── Admin API Helper ──
// Semua operasi admin melalui server API
// Service role key TIDAK pernah keluar ke browser

const ADMIN_KEY = '050505' // sama dengan ADMIN_PASSWORD

async function callAdmin(action: string, payload: Record<string, unknown>) {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': ADMIN_KEY,
    },
    body: JSON.stringify({ action, ...payload }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Admin API error')
  return data
}

export const adminApi = {
  insert: (table: string, data: Record<string, unknown>) =>
    callAdmin('insert', { table, data }),

  update: (table: string, id: string, data: Record<string, unknown>) =>
    callAdmin('update', { table, id, data }),

  delete: (table: string, id: string) =>
    callAdmin('delete', { table, id }),

  upsert: (table: string, data: Record<string, unknown> | Record<string, unknown>[]) =>
    callAdmin('upsert', { table, data }),

  deleteLinksByFolder: (folderId: string) =>
    callAdmin('delete_links_by_folder', { id: folderId }),
}

// ── Compress gambar sebelum upload ──
// Saiz output: maks 400x400px, kualiti 80%, format WebP
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const MAX_SIZE = 400 // px
    const QUALITY = 0.80

    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Kira saiz baru — kekalkan nisbah
      let { width, height } = img
      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height = Math.round((height / width) * MAX_SIZE)
          width = MAX_SIZE
        } else {
          width = Math.round((width / height) * MAX_SIZE)
          height = MAX_SIZE
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' })
          console.log(`Compressed: ${(file.size/1024).toFixed(0)}KB → ${(compressed.size/1024).toFixed(0)}KB (${width}x${height}px)`)
          resolve(compressed)
        },
        'image/webp',
        QUALITY
      )
    }

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

export async function uploadImageAdmin(file: File): Promise<string> {
  // Compress dulu sebelum upload
  const compressed = await compressImage(file)
  const formData = new FormData()
  formData.append('file', compressed)
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'x-admin-key': ADMIN_KEY },
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data.url
}
