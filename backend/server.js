import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import {
  listDocuments, getDocument, uploadDocument, getDocumentDownloadLink,
  listTemplates, createFromTemplate,
  createEmbeddedEditor, createEmbeddedSending,
  sendInvite, getInviteStatus, createEmbeddedInvite, cancelInvite,
  getDocumentRoles, getToken,
} from './signnow.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// ─── Documents ──────────────────────────────────────────────
app.get('/api/documents', async (req, res) => {
  try {
    const { limit = 50, offset = 0, filter, sortby, order } = req.query;
    const data = await listDocuments({ limit: +limit, offset: +offset, filter, sortby, order });
    res.json(data);
  } catch (e) {
    console.error('list documents error', e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data?.message || e.message });
  }
});

app.get('/api/documents/:id', async (req, res) => {
  try {
    const data = await getDocument(req.params.id);
    res.json(data);
  } catch (e) {
    console.error('get document error', e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data?.message || e.message });
  }
});

app.get('/api/documents/:id/download', async (req, res) => {
  try {
    const data = await getDocumentDownloadLink(req.params.id);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.response?.data?.message || e.message });
  }
});

app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const data = await uploadDocument(req.file.buffer, req.file.originalname);
    res.json(data);
  } catch (e) {
    console.error('upload error', e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data?.message || e.message });
  }
});

app.get('/api/documents/:id/roles', async (req, res) => {
  try {
    const roles = await getDocumentRoles(req.params.id);
    res.json({ roles });
  } catch (e) {
    res.status(500).json({ error: e.response?.data?.message || e.message });
  }
});

// ─── Templates ──────────────────────────────────────────────
app.get('/api/templates', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const data = await listTemplates({ limit: +limit, offset: +offset });
    res.json(data);
  } catch (e) {
    console.error('list templates error', e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data?.message || e.message });
  }
});

app.post('/api/templates/:id/use', async (req, res) => {
  try {
    const { name } = req.body;
    const data = await createFromTemplate(req.params.id, name);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.response?.data?.message || e.message });
  }
});

// ─── Embedded URLs ──────────────────────────────────────────
app.post('/api/embed/editor', async (req, res) => {
  try {
    const { documentId, linkExpiration, redirectUri } = req.body;
    const data = await createEmbeddedEditor(documentId, { linkExpiration, redirectUri });
    res.json(data);
  } catch (e) {
    console.error('embed editor error', e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data?.message || e.message });
  }
});

app.post('/api/embed/sending', async (req, res) => {
  try {
    const { documentId, type, linkExpiration, redirectUri } = req.body;
    const data = await createEmbeddedSending(documentId, { type, linkExpiration, redirectUri });
    res.json(data);
  } catch (e) {
    console.error('embed sending error', e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data?.message || e.message });
  }
});

app.post('/api/embed/invite', async (req, res) => {
  try {
    const { documentId, orders } = req.body;
    const data = await createEmbeddedInvite(documentId, orders);
    res.json(data);
  } catch (e) {
    console.error('embed invite error', e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data?.message || e.message });
  }
});

// ─── Invites ────────────────────────────────────────────────
app.post('/api/invites/send', async (req, res) => {
  try {
    const { documentId, recipients } = req.body;
    const data = await sendInvite(documentId, recipients);
    res.json(data);
  } catch (e) {
    console.error('send invite error', e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data?.message || e.message });
  }
});

app.get('/api/invites/:documentId/status', async (req, res) => {
  try {
    const data = await getInviteStatus(req.params.documentId);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.response?.data?.message || e.message });
  }
});

app.post('/api/invites/:documentId/cancel', async (req, res) => {
  try {
    const data = await cancelInvite(req.params.documentId);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.response?.data?.message || e.message });
  }
});

// ─── AI Features ────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post('/api/ai/summarize', async (req, res) => {
  try {
    const { documentName, documentType, fields, roles, pageCount } = req.body;

    const prompt = `You are a helpful document assistant. Summarize this document for a recipient who is about to sign it.

Document name: ${documentName}
Document type: ${documentType || 'Agreement'}
Number of pages: ${pageCount || 'Unknown'}
Signers/roles: ${(roles || []).join(', ')}
Fields present: ${(fields || []).map(f => f.type).join(', ')}

Write a concise, friendly summary (3-4 sentences) explaining:
1. What this document is about
2. What the signer is agreeing to
3. Key things to look out for
4. What happens after signing

Keep it professional but approachable. No bullet points—just flowing prose.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({ summary: message.content[0].text });
  } catch (e) {
    console.error('AI summarize error', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ai/detect-fields', async (req, res) => {
  try {
    const { documentName, documentType } = req.body;

    const prompt = `You are an expert at identifying signature fields in legal and business documents.

For a document named "${documentName}" of type "${documentType || 'Agreement'}", suggest the most common fields that should be placed.

Respond with a JSON array of field suggestions like:
[
  { "type": "signature", "label": "Signature", "description": "Primary signature field", "page": 1, "importance": "required" },
  { "type": "date", "label": "Date", "description": "Date of signing", "page": 1, "importance": "required" },
  { "type": "text", "label": "Full Name", "description": "Printed full name", "page": 1, "importance": "required" },
  { "type": "initials", "label": "Initials", "description": "Page initials", "page": 2, "importance": "recommended" }
]

Field types: signature, initials, date, text, checkbox, radio
Importance: required, recommended, optional

Suggest 4-8 fields. Return only the JSON array.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const fields = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    res.json({ fields });
  } catch (e) {
    console.error('AI detect fields error', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ai/smart-subject', async (req, res) => {
  try {
    const { documentName, recipientName } = req.body;
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Write a professional, friendly email subject line for sending "${documentName}" to ${recipientName || 'a recipient'} for signing. Be concise (max 60 chars). Return only the subject line, no quotes.`
      }]
    });
    res.json({ subject: message.content[0].text.trim() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Stats ──────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const allDocs = await listDocuments({ limit: 100 });
    const docs = allDocs.document_groups || [];
    const stats = {
      total: allDocs.document_group_total_count || docs.length,
      signed: docs.filter(d => d.invite?.status === 'completed').length,
      waitingForOthers: docs.filter(d => d.invite?.status === 'pending' && !d.invite?.expired).length,
      waitingForMe: docs.filter(d => d.invite?.status === 'created').length,
      expired: docs.filter(d => d.invite?.expired === true).length,
      drafts: docs.filter(d => !d.invite).length,
    };
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Health ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SignX backend running on http://localhost:${PORT}`));
