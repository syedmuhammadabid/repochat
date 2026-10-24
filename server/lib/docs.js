// Stage 1 (Loader): deterministic, no LLM. Fetch docs from GitHub and split into sections.
import { fail } from './errors.js';
const MAX_FILES = 25, MAX_CHARS = 150000;
const slug = s => s.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

export function split(file, md, base) {
  const out = []; let heading = file, buf = [], code = false;
  const flush = () => { const text = buf.join('\n').trim(); if (text) out.push({ file, heading, text, url: `${base}#${slug(heading)}` }); };
  for (const line of md.split('\n')) {
    if (line.startsWith('```')) code = !code;
    const m = !code && line.match(/^#{1,4}\s+(.+)/);
    if (m) { flush(); heading = m[1].replace(/[`*_]/g, '').trim(); buf = []; } else buf.push(line);
  }
  flush(); return out;
}

export async function loadDocs(url) {
  const m = url.match(/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/|$)/);
  if (!m) throw fail(400, 'Enter a GitHub repo URL like https://github.com/owner/repo');
  const [, owner, repo] = m;
  const headers = { 'User-Agent': 'repochat', ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }) };
  const t = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, { headers, signal: AbortSignal.timeout(15000) });
  if (t.status === 403 || t.status === 429) throw fail(429, 'GitHub rate limit reached. Try again shortly.');
  if (!t.ok) throw fail(404, 'Repo not found, or not public.');
  const rank = p => (/^readme/i.test(p) ? 0 : /^contributing/i.test(p) ? 1 : 2);
  const files = (await t.json()).tree
    .filter(f => f.type === 'blob' && (/^(README|CONTRIBUTING)[^/]*\.mdx?$/i.test(f.path) || /^docs?\/.*\.mdx?$/i.test(f.path)) && !f.path.includes('node_modules'))
    .sort((a, b) => rank(a.path) - rank(b.path) || a.path.localeCompare(b.path)).slice(0, MAX_FILES);
  if (!files.length) throw fail(404, 'No README or docs/ markdown found in this repo.');
  const texts = await Promise.all(files.map(f => fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${f.path}`, { signal: AbortSignal.timeout(15000) }).then(r => (r.ok ? r.text() : ''))));
  const sections = []; let total = 0, truncated = false;
  files.forEach((f, i) => {
    for (const s of split(f.path, texts[i], `https://github.com/${owner}/${repo}/blob/HEAD/${f.path}`)) {
      if (total + s.text.length > MAX_CHARS) { truncated = true; return; }
      total += s.text.length; sections.push({ id: `S${sections.length + 1}`, ...s });
    }
  });
  return { repo: `${owner}/${repo}`, files: files.length, sections, truncated };
}
