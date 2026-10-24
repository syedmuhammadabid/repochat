import { fail } from './errors.js';

const MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-8b-instruct:free';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const retryAfterMs = response => {
  const seconds = Number(response.headers.get('retry-after'));
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000, 30000) : 1000;
};

function parseAnswer(content) {
  const text = Array.isArray(content) ? content.map(part => part.text || '').join('') : content;
  if (typeof text !== 'string') throw new Error('OpenRouter returned no text.');
  const json = text.replace(/^```(?:json)?\s*|\s*```$/gi, '').trim();
  return JSON.parse(json);
}

export async function ask(system, contents) {
  if (!process.env.OPENROUTER_API_KEY) throw fail(500, 'Server is missing OPENROUTER_API_KEY.');
  const messages = [
    { role: 'system', content: system },
    ...contents.map(message => ({
      role: message.role === 'model' ? 'assistant' : message.role,
      content: message.parts.map(part => part.text).join('')
    }))
  ];

  for (let attempt = 0; ; attempt++) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:3001',
        'X-Title': 'RepoChat'
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.2
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (response.status === 429) throw fail(429, 'OpenRouter free-tier limit reached. Wait for the quota window to reset, then retry.');
    if (response.status === 503 && attempt < 2) {
      await sleep(Math.min(retryAfterMs(response) * 2 ** attempt, 30000));
      continue;
    }
    if (response.status === 401 || response.status === 403) throw fail(502, 'OpenRouter rejected the configured API key.');
    if (!response.ok) throw fail(502, `OpenRouter error ${response.status}`);

    try {
      const data = await response.json();
      return parseAnswer(data.choices[0].message.content);
    } catch {
      throw fail(502, 'OpenRouter returned an unreadable answer. Try again.');
    }
  }
}
