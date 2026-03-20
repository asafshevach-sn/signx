import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import FormData from 'form-data';

// ─── SignNow API ─────────────────────────────────────────────────────────────
const BASE_URL = process.env.SIGNNOW_API_BASE_URL || 'https://api.signnow.com';
const CLIENT_ID = process.env.SIGNNOW_CLIENT_ID;
const CLIENT_SECRET = process.env.SIGNNOW_CLIENT_SECRET;
const USERNAME = process.env.SIGNNOW_USERNAME;
const PASSWORD = process.env.SIGNNOW_PASSWORD;

// If SIGNNOW_API_TOKEN is set, use it directly (premium plan token bypasses OAuth)
// .trim() is critical — env vars stored via `echo "x" | vercel env add` include a trailing newline
const STATIC_TOKEN = process.env.SIGNNOW_API_TOKEN?.trim() || null;

let cachedToken = null;
let tokenExpiry = null;

async function getToken() {
  if (STATIC_TOKEN) return STATIC_TOKEN;
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) return cachedToken;
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await axios.post(`${BASE_URL}/oauth2/token`, {
    username: USERNAME, password: PASSWORD, grant_type: 'password', scope: '*',
  }, { headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/json' } });
  cachedToken = res.data.access_token;
  tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
  return cachedToken;
}

function api(token) {
  return axios.create({
    baseURL: BASE_URL,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
}

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
    email: inv.email, role: inv.role || null, action: 'sign',
    order: inv.signing_order != null ? Number(inv.signing_order) : null,
    status: inv.status, created: Number(inv.created), updated: Number(inv.updated),
    expires_at: inv.expiration_time ? Number(inv.expiration_time) : null,
    expired: inv.expiration_time ? Date.now() / 1000 > Number(inv.expiration_time) : false,
  }));
  const expiresAt = invites.length > 0 ? Math.max(...invites.map(i => Number(i.expiration_time || 0))) : null;
  return {
    id: raw.id, name: raw.document_name || raw.name || 'Untitled',
    entity_type: raw.entity_type || 'document', last_updated: raw.updated || raw.created || 0,
    invite: invites.length > 0 ? { invite_id: null, status: overallStatus, status_raw: overallStatus, expires_at: expiresAt, expired, participants } : null,
    documents: [{ id: raw.id, name: raw.document_name || raw.name || 'Untitled', roles: (raw.roles || []).map(r => r.name || r) }],
  };
}

async function listDocuments({ limit = 50, offset = 0, filter, sortby, order } = {}) {
  const token = await getToken();
  const params = { per_page: limit, page: Math.floor(offset / limit) + 1 };
  if (sortby) params.sortby = sortby;
  if (order) params.order = order;
  const res = await api(token).get('/user/documentsv2', { params });
  const raw = Array.isArray(res.data) ? res.data : (res.data.data || []);
  let docs = raw.map(normalizeDoc);
  if (filter === 'signed') docs = docs.filter(d => d.invite?.status === 'completed');
  else if (filter === 'pending') docs = docs.filter(d => d.invite?.status === 'pending' && !d.invite?.expired);
  else if (filter === 'expired') docs = docs.filter(d => d.invite?.expired === true);
  else if (filter === 'unsent') docs = docs.filter(d => !d.invite);
  return { document_groups: docs, document_group_total_count: raw.length, offset, limit, has_more: raw.length === limit };
}

async function getDocumentById(id) {
  const token = await getToken();
  const res = await api(token).get(`/document/${id}`);
  const norm = normalizeDoc(res.data);
  return { ...res.data, invite: norm.invite, name: norm.name };
}

async function uploadDoc(fileBuffer, filename) {
  const token = await getToken();
  const form = new FormData();
  form.append('file', fileBuffer, { filename, contentType: 'application/pdf' });
  const res = await axios.post(`${BASE_URL}/document`, form, {
    headers: { 'Authorization': `Bearer ${token}`, ...form.getHeaders() }
  });
  return res.data;
}

async function listTemplatesAPI({ limit = 50, offset = 0 } = {}) {
  const token = await getToken();
  const res = await api(token).get('/user/documents', { params: { type: 'template', per_page: limit } });
  const raw = Array.isArray(res.data) ? res.data : (res.data.data || []);
  return raw.map(t => ({
    id: t.id, name: t.document_name || t.name || 'Untitled', entity_type: 'template',
    folder_id: t.folder_id || null, last_updated: t.updated || t.created || Date.now() / 1000,
    is_prepared: true, roles: (t.roles || []).map(r => r.name || r),
  }));
}

async function createFromTemplate(templateId, name) {
  const token = await getToken();
  const body = { template_id: templateId };
  if (name) body.document_name = name;
  const res = await api(token).post(`/template/${templateId}/copy`, body);
  return res.data;
}

function extractUrl(data) {
  return data?.data?.url || data?.url || data?.link || data?.data?.link || null;
}

async function createEmbeddedEditorAPI(documentId, options = {}) {
  const token = await getToken();
  const body = { link_expiration: options.linkExpiration || 90 };
  if (options.redirectUri) body.redirect_uri = options.redirectUri;
  console.log(`[embed/editor] documentId=${documentId} token_prefix=${token.slice(0,8)}`);
  try {
    const res = await api(token).post(`/v2/documents/${documentId}/embedded/editor`, body);
    console.log('[embed/editor] success:', JSON.stringify(res.data).slice(0, 300));
    const url = extractUrl(res.data);
    if (!url) throw new Error(`No URL in response: ${JSON.stringify(res.data)}`);
    return { url };
  } catch (e) {
    console.error('[embed/editor] error:', e.response?.status, JSON.stringify(e.response?.data));
    throw e;
  }
}

async function createEmbeddedSendingAPI(documentId, options = {}) {
  const token = await getToken();
  const body = { link_expiration: options.linkExpiration || 30, type: options.type || 'manage' };
  if (options.redirectUri) body.redirect_uri = options.redirectUri;
  console.log(`[embed/sending] documentId=${documentId}`);
  try {
    const res = await api(token).post(`/v2/documents/${documentId}/embedded/sending`, body);
    console.log('[embed/sending] success:', JSON.stringify(res.data).slice(0, 300));
    const url = extractUrl(res.data);
    if (!url) throw new Error(`No URL in response: ${JSON.stringify(res.data)}`);
    return { url };
  } catch (e) {
    console.error('[embed/sending] error:', e.response?.status, JSON.stringify(e.response?.data));
    throw e;
  }
}

async function sendInviteAPI(documentId, recipients) {
  const token = await getToken();
  const to = recipients.map(r => ({ email: r.email, role: r.role, order: r.order || 1, ...(r.subject ? { subject: r.subject } : {}), ...(r.message ? { message: r.message } : {}) }));
  const res = await api(token).post(`/document/${documentId}/invite`, { to, from: USERNAME, document_id: documentId });
  return res.data;
}

async function getInviteStatusAPI(documentId) {
  const token = await getToken();
  const res = await api(token).get(`/document/${documentId}/fieldinvite`);
  return res.data;
}

async function cancelInviteAPI(documentId) {
  const token = await getToken();
  const res = await api(token).put(`/document/${documentId}/fieldinvitecancel`);
  return res.data;
}

async function getDownloadLink(documentId) {
  const token = await getToken();
  const res = await api(token).get(`/document/${documentId}/download?type=collapsed`);
  return res.data;
}

// ─── Express App ─────────────────────────────────────────────────────────────
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3001',
  /\.vercel\.app$/,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const allowed = allowedOrigins.some(o =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
    cb(null, allowed ? origin : false);
  },
  credentials: true,
}));
app.use(express.json());

const errHandler = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (e) {
    const detail = e.response?.data;
    console.error('API Error:', e.response?.status, JSON.stringify(detail) || e.message);
    res.status(500).json({ error: e.response?.data?.error || e.response?.data?.message || e.message, detail });
  }
};

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/stats', errHandler(async (req, res) => {
  const allDocs = await listDocuments({ limit: 100 });
  const docs = allDocs.document_groups || [];
  res.json({
    total: allDocs.document_group_total_count || docs.length,
    signed: docs.filter(d => d.invite?.status === 'completed').length,
    waitingForOthers: docs.filter(d => d.invite?.status === 'pending' && !d.invite?.expired).length,
    waitingForMe: 0,
    expired: docs.filter(d => d.invite?.expired === true).length,
    drafts: docs.filter(d => !d.invite).length,
  });
}));

app.get('/api/documents', errHandler(async (req, res) => {
  const { limit = 50, offset = 0, filter, sortby, order } = req.query;
  const data = await listDocuments({ limit: +limit, offset: +offset, filter, sortby, order });
  res.json(data);
}));

app.get('/api/documents/:id', errHandler(async (req, res) => {
  res.json(await getDocumentById(req.params.id));
}));

app.get('/api/documents/:id/download', errHandler(async (req, res) => {
  res.json(await getDownloadLink(req.params.id));
}));

app.get('/api/documents/:id/roles', errHandler(async (req, res) => {
  const doc = await getDocumentById(req.params.id);
  res.json({ roles: (doc.roles || []).map(r => r.name || r) });
}));

app.post('/api/documents/upload', upload.single('file'), errHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  res.json(await uploadDoc(req.file.buffer, req.file.originalname));
}));

app.get('/api/templates', errHandler(async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  res.json(await listTemplatesAPI({ limit: +limit, offset: +offset }));
}));

app.post('/api/templates/:id/use', errHandler(async (req, res) => {
  res.json(await createFromTemplate(req.params.id, req.body.name));
}));

app.post('/api/embed/editor', errHandler(async (req, res) => {
  const { documentId, linkExpiration, redirectUri } = req.body;
  res.json(await createEmbeddedEditorAPI(documentId, { linkExpiration, redirectUri }));
}));

app.post('/api/embed/sending', errHandler(async (req, res) => {
  const { documentId, type, linkExpiration, redirectUri } = req.body;
  res.json(await createEmbeddedSendingAPI(documentId, { type, linkExpiration, redirectUri }));
}));

app.post('/api/invites/send', errHandler(async (req, res) => {
  const { documentId, recipients } = req.body;
  res.json(await sendInviteAPI(documentId, recipients));
}));

app.get('/api/invites/:documentId/status', errHandler(async (req, res) => {
  res.json(await getInviteStatusAPI(req.params.documentId));
}));

app.post('/api/invites/:documentId/cancel', errHandler(async (req, res) => {
  res.json(await cancelInviteAPI(req.params.documentId));
}));

// ─── AI Routes ───────────────────────────────────────────────────────────────
// Lazy-init so a missing key doesn't crash the whole module at startup
let _anthropic = null;
function getAnthropic() {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

app.post('/api/ai/summarize', errHandler(async (req, res) => {
  const { documentName, documentType, fields, roles, pageCount } = req.body;
  const message = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-5', max_tokens: 300,
    messages: [{ role: 'user', content: `You are a helpful document assistant. Summarize this document for a recipient who is about to sign it.\n\nDocument name: ${documentName}\nDocument type: ${documentType || 'Agreement'}\nPages: ${pageCount || 'Unknown'}\nSigners: ${(roles || []).join(', ')}\nFields: ${(fields || []).map(f => f.type).join(', ')}\n\nWrite a concise, friendly 3-4 sentence summary explaining what this document is, what the signer agrees to, key things to note, and what happens after signing. No bullet points.` }]
  });
  res.json({ summary: message.content[0].text });
}));

app.post('/api/ai/detect-fields', errHandler(async (req, res) => {
  const { documentName, documentType } = req.body;
  const message = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-5', max_tokens: 500,
    messages: [{ role: 'user', content: `For a document named "${documentName}" of type "${documentType || 'Agreement'}", suggest common signature fields. Return ONLY a JSON array:\n[{"type":"signature","label":"Signature","description":"Primary signature","page":1,"importance":"required"},{"type":"date","label":"Date","description":"Date of signing","page":1,"importance":"required"}]\nField types: signature, initials, date, text, checkbox. Importance: required, recommended, optional. Suggest 4-8 fields.` }]
  });
  const text = message.content[0].text;
  const match = text.match(/\[[\s\S]*\]/);
  res.json({ fields: match ? JSON.parse(match[0]) : [] });
}));

app.post('/api/ai/smart-subject', errHandler(async (req, res) => {
  const { documentName, recipientName } = req.body;
  const message = await getAnthropic().messages.create({
    model: 'claude-haiku-4-5', max_tokens: 80,
    messages: [{ role: 'user', content: `Write a professional email subject line for sending "${documentName}" to ${recipientName || 'a recipient'} for signing. Max 60 chars. Return only the subject, no quotes.` }]
  });
  res.json({ subject: message.content[0].text.trim() });
}));

// ─── Webhook Event Queue ─────────────────────────────────────────────────────
// Module-level ring buffer — survives within a single function instance lifetime.
// Frontend polls /api/events?since=<ms> to drain new entries.
const MAX_EVENTS = 200;
const eventQueue = [];

function pushEvent(evt) {
  eventQueue.push({ ...evt, receivedAt: Date.now() });
  if (eventQueue.length > MAX_EVENTS) eventQueue.shift();
}

// SignNow webhook receiver
app.post('/api/webhooks/signnow', express.json(), (req, res) => {
  const body = req.body;
  const event = body?.meta?.event || body?.event || body?.type || 'unknown';
  const docId  = body?.content?.document_id || body?.data?.document_id || body?.document_id;
  const docName = body?.content?.document_name || body?.data?.document_name || '';
  const signerEmail = body?.content?.signer_email || body?.data?.email || body?.data?.signer_email || '';

  console.log(`[webhook] event=${event} doc=${docId} signer=${signerEmail}`);

  pushEvent({ event, docId, docName, signerEmail });
  res.status(200).json({ received: true });
});

// Frontend polls this endpoint for recent webhook events
app.get('/api/events', (req, res) => {
  const since = parseInt(req.query.since || '0', 10);
  const fresh = eventQueue.filter(e => e.receivedAt > since);
  res.json({ events: fresh, serverTime: Date.now() });
});

// ─── Export for Vercel ───────────────────────────────────────────────────────
// In development, also listen on a port
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`SignX API running on http://localhost:${PORT}`));
}

export default app;
