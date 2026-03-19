import client from './client'

export async function summarizeDocument(params: {
  documentName: string
  documentType?: string
  fields?: { type: string }[]
  roles?: string[]
  pageCount?: number
}) {
  const { data } = await client.post('/ai/summarize', params)
  return data as { summary: string }
}

export async function detectFields(params: {
  documentName: string
  documentType?: string
}) {
  const { data } = await client.post('/ai/detect-fields', params)
  return data as {
    fields: {
      type: string
      label: string
      description: string
      page: number
      importance: 'required' | 'recommended' | 'optional'
    }[]
  }
}

export async function generateSmartSubject(params: {
  documentName: string
  recipientName?: string
}) {
  const { data } = await client.post('/ai/smart-subject', params)
  return data as { subject: string }
}
