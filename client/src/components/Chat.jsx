import { useEffect, useRef, useState } from 'react';
import { post } from '../api.js';
import Message from './Message.jsx';

const STARTERS = ['How do I run this locally?', 'How do I contribute?', 'What does this project do?'];

export default function Chat({ repo }) {
  const [msgs, setMsgs] = useState([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  useEffect(() => end.current?.scrollIntoView({ block: 'end' }), [msgs, busy]);

  async function ask(question) {
    question = question.trim();
    if (!question || busy) return;
    const history = msgs.map(m => ({ role: m.role, text: m.text }));
    setMsgs(m => [...m, { role: 'user', text: question }]); setQ(''); setBusy(true);
    try {
      const j = await post('/api/chat', { question, history, sections: repo.sections });
      setMsgs(m => [...m, { role: 'model', text: j.answer, citations: j.citations }]);
    } catch (err) { setMsgs(m => [...m, { role: 'model', text: err.message }]); }
    setBusy(false);
  }

  return (
    <>
      {!msgs.length && <div className="chips">{STARTERS.map(s => <button key={s} onClick={() => ask(s)}>{s}</button>)}</div>}
      <div>{msgs.map((m, i) => <Message key={i} {...m} />)}{busy && <div className="msg">Thinking…</div>}<div ref={end} /></div>
      <footer>
        <form className="row" onSubmit={e => { e.preventDefault(); ask(q); }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Ask about this repo…" aria-label="Your question" />
          <button disabled={busy || !q.trim()}>Ask</button>
        </form>
      </footer>
    </>
  );
}
