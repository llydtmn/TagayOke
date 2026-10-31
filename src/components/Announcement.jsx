import { useEffect, useId, useState } from 'react';
import { getPublicAnnouncement } from '../services/settings';
import RichText from './RichText';

const ago = (iso) => {
  if (!iso) return '';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'Posted just now';
  if (s < 3600) return `Posted ${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `Posted ${Math.floor(s / 3600)} h ago`;
  return `Posted ${Math.floor(s / 86400)} d ago`;
};

// Collapsible announcement: [red dot] Announcement! [v]. Used on the landing page and as the admin preview.
export function AnnouncementView({ title, message, updatedAt, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={`announce ${open ? 'open' : ''}`}>
      <button type="button" className="announce-head" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <span className="announce-dot" aria-hidden="true" />
        <span className="announce-title">{title || 'Announcement!'}</span>
        <svg className="announce-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <div id={id} className="announce-body" role="region" hidden={!open}>
        <p><RichText text={message} /></p>
        {updatedAt && <small>{ago(updatedAt)}</small>}
      </div>
    </div>
  );
}

// Landing page version: fetches the saved announcement and renders nothing while it is hidden.
export default function Announcement() {
  const [a, setA] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = () => getPublicAnnouncement().then((v) => alive && setA(v));
    load();
    const t = setInterval(load, 30000);            // pick up admin changes without a reload
    const onStore = (e) => { if (e.key === 'tagayoke:settings') load(); }; // demo mode: other tab
    window.addEventListener('storage', onStore);
    return () => { alive = false; clearInterval(t); window.removeEventListener('storage', onStore); };
  }, []);
  if (!a) return null;
  return <AnnouncementView title={a.title} message={a.message} updatedAt={a.updated_at} />;
}
