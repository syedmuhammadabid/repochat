// Thin Gemini REST client: timeout, bounded retries with backoff, schema-constrained JSON output.
import { fail } from './errors.js';
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'; // confirm current name in AI Studio
const SCHEMA = { type: 'OBJECT', properties: { answer: { type: 'STRING' }, citations: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['answer', 'citations'] };
const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function ask(system, contents) {
  if (!process.env.GEMINI_API_KEY) throw fail(500, 'Server is missing GEMINI_API_KEY.');
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0.2 } }),
      signal: AbortSignal.timeout(30000)
    });
    if ((r.status === 429 || r.status === 503) && attempt < 2) { await sleep(1000 * 2 ** attempt); continue; }
    if (r.status === 429) throw fail(429, 'Gemini free-tier limit reached. Wait a moment and retry.');
    if (!r.ok) throw fail(502, `Gemini error ${r.status}`);
    try { return JSON.parse((await r.json()).candidates[0].content.parts[0].text); }
    catch { throw fail(502, 'Gemini returned an unreadable answer. Try again.'); }
  }
}
