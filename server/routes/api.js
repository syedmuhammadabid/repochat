import { Router } from 'express';
import { z } from 'zod';
import { fail } from '../lib/errors.js';
import { loadDocs } from '../lib/docs.js';
import { answer } from '../lib/qa.js';

const LoadBody = z.object({ url: z.string().max(300) });
const ChatBody = z.object({
  question: z.string().min(1).max(1000),
  history: z.array(z.object({ role: z.enum(['user', 'model']), text: z.string().max(4000) })).max(12).default([]),
  sections: z.array(z.object({ id: z.string(), file: z.string(), heading: z.string(), text: z.string(), url: z.string() })).min(1).max(2000)
});
const handle = (schema, msg, fn) => async (req, res) => {
  try {
    const b = schema.safeParse(req.body);
    if (!b.success) throw fail(400, msg);
    res.json(await fn(b.data));
  } catch (e) { res.status(e.status || 500).json({ error: e.status ? e.message : 'Something went wrong.' }); }
};

const r = Router();
r.get('/health', (_q, s) => s.json({ ok: true }));
r.post('/load', handle(LoadBody, 'Enter a GitHub repo URL.', d => loadDocs(d.url)));
r.post('/chat', handle(ChatBody, 'Load a repo and ask a question.', answer));
export default r;
