import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { joinUrl } from '../utils/roomCode';

// Faces cut from the group photo (public/faces/f01.jpg ... f18.jpg). Shown in a fixed, mixed-up order.
const FACE_COUNT = 18;
const FACE_ORDER = [3, 12, 1, 17, 8, 14, 10, 6, 18, 2, 15, 7, 11, 5, 16, 9, 13, 4];
const FACES = FACE_ORDER.map((n) => `/faces/f${String(n).padStart(2, '0')}.jpg`);
const FACE_MS = 3000; // every dancer gets a different person's face this often

// Index of the face a dancer wears now. `start` picks who comes first (the two dancers start half a list apart, so they
// never wear the same face), `delay` staggers when each dancer changes.
function useFace(start, delay) {
  const [i, setI] = useState(start);
  useEffect(() => {
    FACES.forEach((src) => { const img = new Image(); img.src = src; }); // load all once, so a swap never flashes empty
    let timer;
    const next = () => setI((n) => (n + 1) % FACE_COUNT);
    const first = setTimeout(() => { timer = setInterval(next, FACE_MS); }, delay);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [delay]);
  return FACES[i];
}

// A little stick-figure singer. Every limb is a nested group that rotates around its own joint.
function Dancer({ className = '', mic = false, flip = false, start = 0, delay = 0 }) {
  const o = (x, y) => ({ transformOrigin: `${x}px ${y}px` });
  const face = useFace(start, delay);
  const clipId = `face-clip-${className || 'x'}`;
  return (
    <svg className={`dancer ${className}`} viewBox="0 0 200 290" aria-hidden="true" focusable="false">
      <g className="d-body" style={o(100, 150)}>
        <g className="d-leg d-leg-l" style={o(92, 150)}>
          <line x1="92" y1="150" x2="88" y2="206" />
          <g className="d-shin" style={o(88, 206)}>
            <line x1="88" y1="206" x2="86" y2="260" />
            <line x1="86" y1="262" x2="68" y2="266" />
          </g>
        </g>
        <g className="d-leg d-leg-r" style={o(108, 150)}>
          <line x1="108" y1="150" x2="112" y2="206" />
          <g className="d-shin" style={o(112, 206)}>
            <line x1="112" y1="206" x2="114" y2="260" />
            <line x1="114" y1="262" x2="132" y2="266" />
          </g>
        </g>
        <line className="d-torso" x1="100" y1="92" x2="100" y2="150" />
        <g className="d-arm d-arm-l" style={o(82, 96)}>
          <line x1="82" y1="96" x2="56" y2="128" />
          <g className="d-fore d-fore-l" style={o(56, 128)}>
            <line x1="56" y1="128" x2="38" y2="162" />
          </g>
        </g>
        <g className="d-arm d-arm-r" style={o(118, 96)}>
          <line x1="118" y1="96" x2="144" y2="128" />
          <g className="d-fore d-fore-r" style={o(144, 128)}>
            <line x1="144" y1="128" x2="162" y2="162" />
            {mic && <circle className="d-mic" cx="165" cy="170" r="9" />}
          </g>
        </g>
        <g className="d-head" style={o(100, 72)}>
          <defs><clipPath id={clipId}><circle cx="100" cy="44" r="37" /></clipPath></defs>
          <circle className="d-face-bg" cx="100" cy="44" r="37" />
          {/* the right dancer is mirrored by CSS, so its face is flipped back to look the right way round */}
          <g transform={flip ? 'translate(200 0) scale(-1 1)' : undefined}>
            <image key={face} className="d-face" href={face} xlinkHref={face} x="63" y="7" width="74" height="74"
              preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} />
          </g>
          <circle className="d-face-ring" cx="100" cy="44" r="37" />
        </g>
      </g>
    </svg>
  );
}

const NOTES = [
  { n: '♪', x: '8%',  d: '0s',   s: '1.6rem' },
  { n: '♫', x: '22%', d: '-2.2s', s: '2.2rem' },
  { n: '♪', x: '36%', d: '-4s',   s: '1.4rem' },
  { n: '♬', x: '52%', d: '-1s',   s: '2rem' },
  { n: '♪', x: '66%', d: '-3.2s', s: '1.8rem' },
  { n: '♫', x: '78%', d: '-5s',   s: '1.5rem' },
  { n: '♬', x: '90%', d: '-1.8s', s: '2.1rem' },
];

export default function IdleTV({ roomCode }) {
  return (
    <div className="tv">
      <span className="tv-ant a1" aria-hidden="true" />
      <span className="tv-ant a2" aria-hidden="true" />
      <div className="tv-body">
        <div className="tv-screen">
          <div className="tv-beam b1" aria-hidden="true" />
          <div className="tv-beam b2" aria-hidden="true" />
          {NOTES.map((x, i) => (
            <span key={i} className="tv-note" aria-hidden="true"
              style={{ left: x.x, animationDelay: x.d, fontSize: x.s }}>{x.n}</span>
          ))}
          <Dancer className="left" mic start={0} delay={0} />
          <Dancer className="right" flip start={9} delay={1500} />
          <div className="tv-content">
            <p className="lyric">Walang kumakanta pa.</p>
            <p className="tv-hint">
              Scan the QR and reserve the first song. Room code: <b className="code-inline">{roomCode}</b>
            </p>
            <div className="qr-card">
              <QRCodeSVG className="qr-svg" value={joinUrl(roomCode)} size={220} bgColor="#fff6c2" fgColor="#0a1650" />
            </div>
          </div>
          <div className="tv-scan" aria-hidden="true" />
        </div>
        <div className="tv-panel" aria-hidden="true">
          <span className="tv-led" />
          <span className="tv-brand">Tagay-Oke!</span>
          <span className="tv-knobs"><i /><i /></span>
        </div>
      </div>
      <div className="tv-stand" aria-hidden="true"><i /><i /></div>
    </div>
  );
}