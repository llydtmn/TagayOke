import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { useMediaKeys } from '../hooks/useMediaKeys';

// YouTube end screens (the suggestion cards) are drawn inside the player and cannot be removed from our side.
// So: (1) move to the next song this many seconds before the video ends, and
// (2) cover the player with a clear shield for the last stretch so a click can't open a suggestion.
// Raise END_TRIM_SECONDS (up to about 20) if an uploader's cards still appear; lower it to keep more of the outro.
const END_TRIM_SECONDS = 20; // uploaders' end-screen suggestion cards usually show for the last 5 to 20 seconds

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
// onProgress(currentSeconds, usableSeconds) is called about 4 times a second (drives the fullscreen top bar).
export default function YouTubePlayer({ videoId, onEnded, onProgress, startAt = 0 }) {
  const host = useRef(null);
  const cb = useRef(onEnded);
  cb.current = onEnded;
  const progressCb = useRef(onProgress);
  progressCb.current = onProgress;
  const playerRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [blocked, setBlocked] = useState(false); // the browser refused to autoplay (page was refreshed, no tap yet)
  const startRef = useRef(startAt); // only read when the player is created, so it never restarts the song mid-play

  // TV remote / keyboard media keys. Stop pauses and returns to the start; Play then restarts the song. Next moves on to the next song.
  useMediaKeys({
    toggle: () => { const p = playerRef.current; if (p?.getPlayerState) (p.getPlayerState() === 1 ? p.pauseVideo() : p.playVideo()); },
    play: () => playerRef.current?.playVideo?.(),
    pause: () => playerRef.current?.pauseVideo?.(),
    stop: () => { const p = playerRef.current; try { p?.pauseVideo(); p?.seekTo(0, true); setPaused(true); } catch { /* player not ready */ } },
    next: () => cb.current(),
  });

  // If autoplay was refused, the first tap or key press (including the remote's OK button) starts the song with sound.
  useEffect(() => {
    if (!blocked) return undefined;
    const go = () => { playerRef.current?.playVideo?.(); setBlocked(false); };
    window.addEventListener('pointerdown', go, { once: true });
    window.addEventListener('keydown', go, { once: true });
    return () => { window.removeEventListener('pointerdown', go); window.removeEventListener('keydown', go); };
  }, [blocked]);

  useEffect(() => {
    let player; let blockTimer; let timer; let dead = false; let fired = false;

    const finish = () => {
      if (fired) return;
      fired = true;
      try { player?.pauseVideo(); } catch { /* player not ready */ }
      cb.current();
    };

    const tick = () => {
      if (!player?.getDuration) return;
      const total = player.getDuration();
      const now = player.getCurrentTime();
      if (!total || !now || total < END_TRIM_SECONDS * 3) return; // skip live streams and very short clips
      const left = total - now;
      progressCb.current?.(now, total - END_TRIM_SECONDS);
      if (left <= END_TRIM_SECONDS) finish();
    };

    // Captions (auto-generated "[Music]" text etc.) are switched off. The setting can load after playback starts, so this runs on ready and on play.
    const captionsOff = () => {
      try { player?.unloadModule('captions'); player?.unloadModule('cc'); } catch { /* player not ready */ }
    };

    loadYT().then((YT) => {
      if (dead) return;
      player = playerRef.current = new YT.Player(host.current, {
        videoId, width: '100%', height: '100%',
        // fs: 0 hides YouTube's own fullscreen button; it would fullscreen only the video and hide our top bar.
        // Use the "Full screen" button under the video instead.
        // controls: 0 hides YouTube's bottom bar (progress, share, watch later, "More videos", logo) so it never covers the lyrics.
        playerVars: { autoplay: 1, rel: 0, playsinline: 1, fs: 0, controls: 0, modestbranding: 1, iv_load_policy: 3, cc_load_policy: 0, start: Math.max(0, Math.floor(startRef.current || 0)) },
        events: {
          onReady: () => {
            timer = setInterval(tick, 250); captionsOff();
            blockTimer = setTimeout(() => { const st = player?.getPlayerState?.(); if (st === -1 || st === 5) setBlocked(true); }, 3000);
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) { captionsOff(); setPaused(false); setBlocked(false); }
            if (e.data === YT.PlayerState.PAUSED) setPaused(true);
            if (e.data === YT.PlayerState.ENDED) { setPaused(false); finish(); }
          },
          onError: finish,
        },
      });
    });

    return () => { dead = true; clearInterval(timer); clearTimeout(blockTimer); playerRef.current = null; player?.destroy?.(); };
  }, [videoId]);

  return (
    <div className="yt-frame">
      <div className="yt-slot"><div ref={host} /></div>
      {/* Always on: blocks clicks so nobody can pause the song or trigger YouTube's pause icon, end-screen cards or links. Songs just play. */}
      <div className="yt-shield" aria-hidden="true" />
      {blocked && <div className="yt-hint" role="status">Tap the screen or press any key to start the sound</div>}
      {/* Covers YouTube's own paused screen (suggested videos, big pause icon) */}
      {paused && (
        <div className="yt-paused" role="status">
          <Icon name="pause" size={72} />
          <p>Paused</p>
          <span>Press Play on the remote to continue</span>
        </div>
      )}
    </div>
  );
}