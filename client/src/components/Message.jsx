// Renders `code` and **bold** without dangerouslySetInnerHTML.
function Rich({ text }) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((p, i) =>
    p.startsWith('`') ? <code key={i}>{p.slice(1, -1)}</code> : p.startsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : p);
}

export default function Message({ role, text, citations = [] }) {
  return (
    <div className={`msg ${role === 'user' ? 'u' : ''}`}>
      <Rich text={text} />
      {citations.length > 0 && (
        <div className="src">
          {citations.map(c => <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer">{c.label}</a>)}
        </div>
      )}
    </div>
  );
}
