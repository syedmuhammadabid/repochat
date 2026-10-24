import { useState } from 'react';
import { post } from '../api.js';

export default function RepoLoader({ onLoaded }) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function load(e) {
    e.preventDefault();
    setBusy(true); setStatus('Loading docs…');
    try {
      const j = await post('/api/load', { url });
      setStatus(`Loaded ${j.repo}: ${j.files} files, ${j.sections.length} sections${j.truncated ? ' (truncated)' : ''}.`);
      onLoaded(j);
    } catch (err) { setStatus(err.message); }
    setBusy(false);
  }

  return (
    <form className="row" onSubmit={load}>
      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://github.com/owner/repo" aria-label="GitHub repository URL" />
      <button disabled={busy || !url.trim()}>Load docs</button>
      <p id="status" role="status">{status}</p>
    </form>
  );
}
