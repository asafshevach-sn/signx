import axios from 'axios';
import FormData from 'form-data';

const BASE_URL = process.env.SIGNNOW_API_BASE_URL || 'https://api.signnow.com';
const CLIENT_ID = process.env.SIGNNOW_CLIENT_ID;
const CLIENT_SECRET = process.env.SIGNNOW_CLIENT_SECRET;
const USERNAME = process.env.SIGNNOW_USERNAME;
const PASSWORD = process.env.SIGNNOW_PASSWORD;

let cachedToken = null;
let tokenExpiry = null;

export async function getToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await axios.post(`${BASE_URL}/oauth2/token`, {
    username: USERNAME,
    password: PASSWORD,
    grant_type: 'password',
    scope: '*',
  }, {
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    }
  });

  cachedToken = res.data.access_token;
  tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
  return cachedToken;
}

function api(token) {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
}

// ─── Normalize a raw SignNow document into MCP-like shape ───
function normalizeDoc(raw) {
  const invites = raw.field_invites || [];
  const expired = invites.some(i => i.expiration_time && Date.now() / 1000 > Number(i.expiration_time));
  const statuses = invites.map(i => i.status);
  let overallStatus = null;
  if (invites.length > 0) {
    if (statuses.every(s => s === 'fulfilled')) overallStatus = 'completed';
    else if (statuses.some(s => s === 'declined')) overallStatus = 'declined';
    else overallStatus = 'pending';
  }

  const participants = invites.map(inv => ({
    email: inv.email,
    role: inv.role || null,
    action: 'sign',
    order: inv.signing_order != null ? Number(inv.signing_order) : null,
    status: inv.status,
    created: Number(inv.created),
    updated: Number(inv.updated),
    expires_at: inv.expiration_time ? Number(inv.expiration_time) : null,
    expired: inv.expiration_time ? Date.now() / 1000 > Number(inv.expiration_time) : false,
  }));

  const expiresAt = invites.length > 0
    ? Math.max(...invites.map(i => Number(i.expiration_time || 0)))
    : null;

  return {
    id: raw.id,
    name: raw.document_name || raw.name || 'Untitled',
    entity_type: raw.entity_type || 'document',
    last_updated: raw.updated || raw.created || 0,
    invite: invites.length > 0 ? {
      invite_id: null,
      status: overallStatus,
      status_raw: overallStatus,
      expires_at: expiresAt,
      expired,
      participants,
    } : null,
    documents: [{
      id: raw.id,
      name: raw.document_name || raw.name || 'Untitled',
      roles: (raw.roles || []).map(r => r.name || r),
    }],
  };
}

// ─── Documents ──────────────────────────────────────────────
export async function listDocuments({ limit = 50, offset = 0, filter, sortby, order } = {}) {
  const token = await getToken();
  const params = { per_page: limit, page: Math.floor(offset / limit) + 1 };
  if (sortby) params.sortby = sortby;
  if (order) params.order = order;

  const res = await api(token).get('/user/documentsv2', { params });
  const raw = Array.isArray(res.data) ? res.data : (res.data.data || []);
  const total = res.headers?.['x-total-count'] ? Number(res.headers['x-total-count']) : raw.length;

  let docs = raw.map(normalizeDoc);

  // Apply filter client-side
  if (filter === 'signed') {
    docs = docs.filter(d => d.invite?.status === 'completed');
  } else if (filter === 'pending' || filter === 'waiting-for-others') {
    docs = docs.filter(d => d.invite?.status === 'pending' && !d.invite?.expired);
  } else if (filter === 'expired') {
    docs = docs.filter(d => d.invite?.expired === true);
  } else if (filter === 'unsent') {
    docs = docs.filter(d => !d.invite);
  }

  return {
    document_groups: docs,
    document_group_total_count: total,
    offset,
    limit,
    has_more: raw.length === limit,
  };
}

export async function getDocument(id) {
  const token = await getToken();
  const res = await api(token).get(`/document/${id}`);
  // Attach normalized invite info for UI
  const raw = res.data;
  const normalized = normalizeDoc(raw);
  return { ...raw, invite: normalized.invite, name: normalized.name };
}

export async function uploadDocument(fileBuffer, filename) {
  const token = await getToken();
  const form = new FormData();
  form.append('file', fileBuffer, { filename, contentType: 'application/pdf' });

  const res = await axios.post(`${BASE_URL}/document/multipart`, form, {
    headers: {
      'Authorization': `Bearer ${token}`,
      ...form.getHeaders(),
    }
  });
  return res.data;
}

export async function getDocumentDownloadLink(id) {
  const token = await getToken();
  const res = await api(token).get(`/document/${id}/download?type=collapsed`);
  return res.data;
}

// ─── Templates ──────────────────────────────────────────────
export async function listTemplates({ limit = 50, offset = 0 } = {}) {
  const token = await getToken();
  const res = await api(token).get('/user/documents', {
    params: { type: 'template', per_page: limit, page: Math.floor(offset / limit) + 1 }
  });
  const raw = Array.isArray(res.data) ? res.data : (res.data.data || []);
  return raw.map(t => ({
    id: t.id,
    name: t.document_name || t.name || 'Untitled',
    entity_type: 'template',
    folder_id: t.folder_id || null,
    last_updated: t.updated || t.created || Date.now() / 1000,
    is_prepared: true,
    roles: (t.roles || []).map(r => r.name || r),
  }));
}

export async function createFromTemplate(templateId, name) {
  const token = await getToken();
  const body = { template_id: templateId };
  if (name) body.document_name = name;
  const res = await api(token).post(`/template/${templateId}/copy`, body);
  return res.data;
}

// ─── Embedded Editor ────────────────────────────────────────
export async function createEmbeddedEditor(documentId, options = {}) {
  const token = await getToken();
  const body = {
    link_expiration: options.linkExpiration || 90,
    ...(options.redirectUri ? { redirect_uri: options.redirectUri } : {}),
  };
  const res = await api(token).post(`/v2/documents/${documentId}/embedded/editor`, body);
  return res.data;
}

// ─── Embedded Sending ────────────────────────────────────────
export async function createEmbeddedSending(documentId, options = {}) {
  const token = await getToken();
  const body = {
    link_expiration: options.linkExpiration || 30,
    type: options.type || 'manage',
    ...(options.redirectUri ? { redirect_uri: options.redirectUri } : {}),
  };
  const res = await api(token).post(`/v2/documents/${documentId}/embedded/sending`, body);
  return res.data;
}

// ─── Invites ────────────────────────────────────────────────
export async function sendInvite(documentId, recipients) {
  const token = await getToken();
  // recipients: [{ email, role, order?, action?, subject?, message? }]
  const to = recipients.map(r => ({
    email: r.email,
    role: r.role,
    order: r.order || 1,
    ...(r.subject ? { subject: r.subject } : {}),
    ...(r.message ? { message: r.message } : {}),
  }));

  const res = await api(token).post(`/document/${documentId}/invite`, {
    to,
    from: USERNAME,
    document_id: documentId,
  });
  return res.data;
}

export async function getInviteStatus(documentId) {
  const token = await getToken();
  const res = await api(token).get(`/document/${documentId}/fieldinvite`);
  return res.data;
}

export async function createEmbeddedInvite(documentId, orders) {
  const token = await getToken();
  const body = { invites: orders };
  const res = await api(token).post(`/v2/documents/${documentId}/embedded/invite`, body);
  return res.data;
}

export async function cancelInvite(documentId) {
  const token = await getToken();
  const res = await api(token).put(`/document/${documentId}/fieldinvitecancel`);
  return res.data;
}

// ─── Document Roles ─────────────────────────────────────────
export async function getDocumentRoles(documentId) {
  const token = await getToken();
  const doc = await getDocument(documentId);
  return doc.roles || [];
}
