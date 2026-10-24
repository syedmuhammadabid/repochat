// Thin Gemini REST client: timeout, bounded retries with backoff, schema-constrained JSON output.
import { fail } from './errors.js';
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const SCHEMA = { type: 'OBJECT', properties: { answer: { type: 'STRING' }, citations: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['answer', 'citations'] };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const retryAfterMs = response => {
  const seconds = Number(response.headers.get('retry-after'));
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000, 30000) : 1000;
};

export async function ask(system, contents) {
  if (!process.env.GEMINI_API_KEY) throw fail(500, 'Server is missing GEMINI_API_KEY.');
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0.2 } }),
      signal: AbortSignal.timeout(30000)
    });
    if (r.status === 429) throw fail(429, 'Gemini free-tier limit reached. Wait for the quota window to reset, then retry.');
    if (r.status === 503 && attempt < 2) { await sleep(Math.min(retryAfterMs(r) * 2 ** attempt, 30000)); continue; }
    if (!r.ok) {
      let detail = '';
      try {
        const body = await r.json();
        detail = body?.error?.message ? `: ${body.error.message}` : '';
      } catch {
        // Keep the status-based error when the upstream response is not JSON.
      }
      throw fail(502, `Gemini error ${r.status}${detail}`);
    }
    try { return JSON.parse((await r.json()).candidates[0].content.parts[0].text); }
    catch { throw fail(502, 'Gemini returned an unreadable answer. Try again.'); }
  }
}
