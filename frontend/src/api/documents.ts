import client from './client'

export interface DocumentParticipant {
  email: string
  role: string | null
  action: string
  order: number | null
  status: string
  created: number
  updated: number
  expires_at: number
  expired: boolean
}

export interface DocumentInvite {
  invite_id: string | null
  status: string
  status_raw: string | null
  expires_at: number | null
  expired: boolean
  participants: DocumentParticipant[]
}

export interface DocumentRef {
  id: string
  name: string
  roles: string[]
}

export interface Document {
  id: string
  name: string
  entity_type: 'document' | 'document_group'
  last_updated: number
  invite: DocumentInvite | null
  documents: DocumentRef[]
}

export interface DocumentsResponse {
  document_groups: Document[]
  document_group_total_count: number
  offset: number
  limit: number
  has_more: boolean
}

export async function listDocuments(params?: {
  limit?: number
  offset?: number
  filter?: string
  sortby?: string
  order?: string
}): Promise<DocumentsResponse> {
  const { data } = await client.get('/documents', { params })
  return data
}

export async function getDocument(id: string) {
  const { data } = await client.get(`/documents/${id}`)
  return data
}

export async function uploadDocument(file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await client.post('/documents/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

export async function getDocumentDownload(id: string) {
  const { data } = await client.get(`/documents/${id}/download`)
  return data
}

export async function getDocumentRoles(id: string): Promise<{ roles: string[] }> {
  const { data } = await client.get(`/documents/${id}/roles`)
  return data
}

export async function getStats() {
  const { data } = await client.get('/stats')
  return data as {
    total: number
    signed: number
    waitingForOthers: number
    waitingForMe: number
    expired: number
    drafts: number
  }
}
