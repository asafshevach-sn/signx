import client from './client'

export async function createEmbeddedEditor(documentId: string, options?: {
  linkExpiration?: number
  redirectUri?: string
}) {
  const { data } = await client.post('/embed/editor', { documentId, ...options })
  return data as { url: string }
}

export async function createEmbeddedSending(documentId: string, options?: {
  type?: 'manage' | 'edit' | 'send-invite'
  linkExpiration?: number
  redirectUri?: string
}) {
  const { data } = await client.post('/embed/sending', { documentId, ...options })
  return data as { url: string }
}

export async function createEmbeddedInvite(documentId: string, orders: any[]) {
  const { data } = await client.post('/embed/invite', { documentId, orders })
  return data as { url: string }
}
