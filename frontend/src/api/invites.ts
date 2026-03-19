import client from './client'

export interface Recipient {
  email: string
  role: string
  order?: number
  action?: 'sign' | 'view' | 'approve'
  subject?: string
  message?: string
}

export async function sendInvite(documentId: string, recipients: Recipient[]) {
  const { data } = await client.post('/invites/send', { documentId, recipients })
  return data
}

export async function getInviteStatus(documentId: string) {
  const { data } = await client.get(`/invites/${documentId}/status`)
  return data
}

export async function cancelInvite(documentId: string) {
  const { data } = await client.post(`/invites/${documentId}/cancel`)
  return data
}
