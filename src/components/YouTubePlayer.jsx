import { useEffect, useRef } from 'react';

let ytReady;
const loadYT = () => {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return (ytReady ??= new Promise((res) => {
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    window.onYouTubeIframeAPIReady = () => res(window.YT);
    document.head.appendChild(s);
  }));
};

// Official IFrame Player only. Errors (removed or non-embeddable video) skip to the next song.
export default function YouTubePlayer({ videoId, onEnded }) {
  const host = useRef(null);
  const cb = useRef(onEnded);
  cb.current = onEnded;

  useEffect(() => {
    let player; let dead = false;
    loadYT().then((YT) => {
      if (dead) return;
      player = new YT.Player(host.current, {
        videoId, width: '100%', height: '100%',
        playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
        events: {
          onStateChange: (e) => e.data === YT.PlayerState.ENDED && cb.current(),
          onError: () => cb.current(),
        },
      });
    });
    return () => { dead = true; player?.destroy?.(); };
  }, [videoId]);

  return <div className="yt-frame"><div ref={host} /></div>;
}
