import client from './client'

export interface Template {
  id: string
  name: string
  entity_type: 'template' | 'template_group'
  folder_id: string | null
  last_updated: number
  is_prepared: boolean
  roles: string[]
}

export interface TemplatesResponse {
  templates?: Template[]
  total_count?: number
}

export async function listTemplates(params?: { limit?: number; offset?: number }) {
  // Try the MCP-style response first, fall back to raw SignNow response
  const { data } = await client.get('/templates', { params })
  return data
}

export async function useTemplate(templateId: string, name?: string) {
  const { data } = await client.post(`/templates/${templateId}/use`, { name })
  return data
}
