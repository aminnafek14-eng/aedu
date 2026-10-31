// ── Jejak kod rujukan affiliate (?ref=KOD) ──
// Disimpan dalam localStorage selama 30 hari.
const KEY = 'aedu_ref'
const TTL_MS = 30 * 24 * 60 * 60 * 1000

export function captureRefFromUrl() {
  try {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (!ref) return
    const code = ref.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20)
    if (code) localStorage.setItem(KEY, JSON.stringify({ code, at: Date.now() }))
  } catch { /* storage disekat — abaikan */ }
}

export function getStoredRef(): string | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const { code, at } = JSON.parse(raw)
    if (!code || Date.now() - at > TTL_MS) { localStorage.removeItem(KEY); return null }
    return code
  } catch { return null }
}
