import { useEffect, useRef, useState } from 'react';

// Stands in for the player when a song has no youtubeId (demo catalog).
export default function DemoStage({ song, onEnded, seconds = 15 }) {
  const [t, setT] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 0.25), 250);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (t >= seconds && !done.current) { done.current = true; onEnded(); }
  }, [t, seconds, onEnded]);
  return (
    <div className="demo-stage">
      <p className="demo-code">{song.code}</p>
      <p className="lyric">♪ {song.title} ♪</p>
      <div className="bar"><span style={{ width: `${Math.min(100, (t / seconds) * 100)}%` }} /></div>
      <p className="muted">Demo playback. Real songs play through the YouTube player once a youtube_id is set.</p>
    </div>
  );
}
