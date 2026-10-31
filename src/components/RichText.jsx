import { useRef } from 'react';
import '../styles/rich.css';

// Tiny, safe formatter for announcements (no HTML is ever injected):
//   **bold**   [label](https://link)   and plain links (https://… or www.…) become clickable.
const TOKEN = /\*\*(.+?)\*\*|\[([^\]\n]+)\]\(((?:https?:\/\/|www\.)[^\s)]+)\)|((?:https?:\/\/|www\.)[^\s<]+)/g;
const TRAIL = /[.,!?;:'")\]]+$/;
const href = (u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

function parse(text, keyBase = 'r') {
  const out = [];
  let last = 0, n = 0, m;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyBase}-${n++}`;
    if (m[1] !== undefined) {
      out.push(<strong key={key}>{parse(m[1], key)}</strong>);
    } else if (m[2] !== undefined) {
      out.push(<a key={key} href={href(m[3])} target="_blank" rel="noopener noreferrer">{m[2]}</a>);
    } else {
      const trail = (m[4].match(TRAIL) || [''])[0];
      const url = m[4].slice(0, m[4].length - trail.length);
      out.push(<a key={key} href={href(url)} target="_blank" rel="noopener noreferrer">{url}</a>);
      if (trail) out.push(trail);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function RichText({ text }) { return <>{parse(text || '')}</>; }

// Admin textarea with Bold / Link buttons (Ctrl+B also works). Stores plain text with the markup above.
export function RichTextarea({ value, onChange, maxLength = 800, rows = 5, placeholder }) {
  const ref = useRef(null);

  const edit = (fn) => {
    const el = ref.current; if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const { text, from, to } = fn(value.slice(0, s), value.slice(s, e), value.slice(e));
    if (text.length > maxLength) return;
    onChange(text);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(from, to); });
  };

  const bold = () => edit((a, sel, b) => {
    const inner = sel || 'bold text';
    return { text: `${a}**${inner}**${b}`, from: a.length + 2, to: a.length + 2 + inner.length };
  });

  const link = () => {
    const el = ref.current; if (!el) return;
    const picked = value.slice(el.selectionStart, el.selectionEnd);
    const url = (window.prompt('Paste the link (https://…)', /^(https?:\/\/|www\.)/i.test(picked) ? picked : 'https://') || '').trim();
    if (!url || url === 'https://') return;
    edit((a, sel, b) => {
      if (!sel || sel === url) return { text: `${a}${url}${b}`, from: a.length + url.length, to: a.length + url.length }; // plain link: auto-clickable
      const md = `[${sel}](${url})`;
      return { text: `${a}${md}${b}`, from: a.length + md.length, to: a.length + md.length };
    });
  };

  return (
    <>
      <div className="rt-bar" role="toolbar" aria-label="Formatting">
        <button type="button" className="rt-btn" onClick={bold} title="Bold (Ctrl+B): select a word or sentence first" aria-label="Bold"><b>B</b></button>
        <button type="button" className="rt-btn" onClick={link} title="Add a link: select text first to make it the clickable label" aria-label="Add link">🔗 Link</button>
        <span className="rt-tip">Select text, then tap B or Link. Pasted links are clickable automatically.</span>
      </div>
      <textarea ref={ref} value={value} maxLength={maxLength} rows={rows} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); bold(); } }} />
    </>
  );
}
