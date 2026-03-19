/**
 * Per-user document ownership tracking.
 * Stores { [userId]: Set<docId> } in localStorage so each user only sees their own documents.
 * This is the ISV pattern: one shared SignNow account, per-user isolation in the app layer.
 */

const STORE_KEY = 'signx_user_docs'

function getStore(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') }
  catch { return {} }
}

export function claimDoc(userId: string, docId: string) {
  if (!userId || !docId) return
  const store = getStore()
  const existing = new Set(store[userId] || [])
  existing.add(docId)
  store[userId] = Array.from(existing)
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

export function getUserDocIds(userId: string): Set<string> {
  if (!userId) return new Set()
  const store = getStore()
  return new Set(store[userId] || [])
}

export function isUserDoc(userId: string, docId: string): boolean {
  return getUserDocIds(userId).has(docId)
}

/** Filter a list of documents to only ones owned by userId */
export function filterUserDocs<T extends { id: string }>(userId: string, docs: T[]): T[] {
  if (!userId) return []
  const ids = getUserDocIds(userId)
  if (ids.size === 0) return []
  return docs.filter(d => ids.has(d.id))
}
