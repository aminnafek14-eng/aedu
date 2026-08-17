// ── Admin API Helper ──
const ADMIN_KEY = '050505'

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

export async function uploadImageAdmin(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'x-admin-key': ADMIN_KEY },
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data.url
}