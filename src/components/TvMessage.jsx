// A short message from the admin, shown over the TV (works inside full screen because it lives in the stage box).
export default function TvMessage({ message }) {
  if (!message) return null;
  return (
    <div className="tv-message" role="alert" aria-live="assertive" key={message.key}>
      <span className="tv-message-icon" aria-hidden="true">📣</span>
      <p className="tv-message-text">{message.text}</p>
    </div>
  );
}
