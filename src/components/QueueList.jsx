export default function QueueList({ items, onRemove, canRemoveAll = false, empty }) {
  if (!items.length) return <p className="empty">{empty}</p>;
  return (
    <ol className="queue">
      {items.map((i) => (
        <li key={i.id}>
          <span className="chip small">#{i.song.code}</span>
          <div className="grow">
            <b>{i.song.title}</b>
            <span className="muted">{i.singer}{i.status === 'playing' ? ' · now playing' : ''}</span>
          </div>
          {canRemoveAll && onRemove &&
            <button className="ghost" onClick={() => onRemove(i.id)} aria-label={`Remove ${i.song.title}`}>Remove</button>}
        </li>
      ))}
    </ol>
  );
}