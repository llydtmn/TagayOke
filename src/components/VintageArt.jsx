// Vintage engraving-style illustrations (inline SVG, no dependencies). All decorative: aria-hidden.
// <HatchDefs /> must be rendered once on a page before <Sleeve /> is used (shared hatch patterns).

export function HatchDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <pattern id="vt-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="currentColor" strokeWidth="1.1" />
        </pattern>
        <pattern id="vt-dots" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="1" fill="currentColor" />
        </pattern>
      </defs>
    </svg>
  );
}

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' };

export function Mic({ className = '', size = 120 }) {
  return (
    <svg className={`vt-art ${className}`} width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <g {...S}>
        <rect x="42" y="8" width="36" height="58" rx="18" fill="var(--v-mustard)" />
        <rect x="42" y="8" width="36" height="58" rx="18" fill="url(#vt-hatch)" stroke="none" opacity=".55" />
        <path d="M42 28h36M42 38h36M42 48h36" />
        <path d="M30 52c0 20 13 32 30 32s30-12 30-32" />
        <path d="M60 84v20M42 106h36" />
        <path d="M18 34c-4 8-4 18 0 26M102 34c4 8 4 18 0 26" opacity=".7" />
      </g>
    </svg>
  );
}

export function Notes({ className = '', size = 64 }) {
  return (
    <svg className={`vt-art ${className}`} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <g {...S}>
        <path d="M22 46V14l28-6v32" />
        <ellipse cx="16" cy="46" rx="8" ry="6" fill="currentColor" />
        <ellipse cx="44" cy="40" rx="8" ry="6" fill="currentColor" />
        <path d="M22 24l28-6" />
      </g>
    </svg>
  );
}

export function Waves({ className = '', size = 64 }) {
  return (
    <svg className={`vt-art ${className}`} width={size} height={size * 0.5} viewBox="0 0 64 32" aria-hidden="true" focusable="false">
      <g {...S}><path d="M2 16h6M12 8v16M20 3v26M28 9v14M36 5v22M44 11v10M52 7v18M60 16h2" /></g>
    </svg>
  );
}

export function Burst({ className = '', size = 90 }) {
  const pts = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const r = i % 2 ? 36 : 46;
    return `${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`;
  }).join(' ');
  return (
    <svg className={`vt-art ${className}`} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <polygon points={pts} fill="var(--v-mustard)" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  );
}

// Record-sleeve thumbnail. The motif and colours are picked from the song code, so every song keeps its own cover.
const COVERS = [
  ['var(--v-teal)', 'var(--v-cream)'],
  ['var(--v-mustard)', 'var(--v-ink)'],
  ['var(--v-coral)', 'var(--v-cream)'],
  ['var(--v-cream)', 'var(--v-teal)'],
];
export function Sleeve({ code }) {
  const n = Math.abs(parseInt(code, 10) || String(code).split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  const [bg, fg] = COVERS[n % COVERS.length];
  const motif = Math.floor(n / 4) % 4;
  return (
    <svg className="vt-sleeve" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
      <rect x="1.5" y="1.5" width="77" height="77" fill={bg} stroke="currentColor" strokeWidth="2.4" />
      <rect x="1.5" y="1.5" width="77" height="77" fill="url(#vt-dots)" opacity=".16" style={{ color: fg }} />
      <rect x="6" y="6" width="68" height="68" fill="none" stroke={fg} strokeWidth="1" opacity=".8" />
      <g style={{ color: fg }} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {motif === 0 && (<>
          <circle cx="40" cy="40" r="26" fill="var(--v-ink)" stroke="var(--v-ink)" />
          <circle cx="40" cy="40" r="20" stroke="var(--v-cream)" strokeWidth="1" opacity=".5" />
          <circle cx="40" cy="40" r="14" stroke="var(--v-cream)" strokeWidth="1" opacity=".5" />
          <circle cx="40" cy="40" r="9" fill="var(--v-mustard)" stroke="var(--v-ink)" />
          <circle cx="40" cy="40" r="1.8" fill="var(--v-ink)" stroke="none" />
        </>)}
        {motif === 1 && (<>
          <rect x="30" y="12" width="20" height="32" rx="10" fill="var(--v-paper)" stroke="var(--v-ink)" />
          <rect x="30" y="12" width="20" height="32" rx="10" fill="url(#vt-hatch)" stroke="none" style={{ color: 'var(--v-ink)' }} opacity=".5" />
          <path d="M22 34c0 12 8 18 18 18s18-6 18-18M40 52v14M30 67h20" stroke="var(--v-ink)" />
        </>)}
        {motif === 2 && (<>
          <path d="M28 56V22l30-6v34" stroke="var(--v-ink)" />
          <ellipse cx="22" cy="56" rx="8" ry="6" fill="var(--v-ink)" stroke="var(--v-ink)" />
          <ellipse cx="52" cy="50" rx="8" ry="6" fill="var(--v-ink)" stroke="var(--v-ink)" />
          <path d="M28 32l30-6" stroke="var(--v-ink)" />
        </>)}
        {motif === 3 && (<>
          <path d="M14 18h52a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H40l-12 12v-12H14a4 4 0 0 1-4-4V22a4 4 0 0 1 4-4z" fill="var(--v-paper)" stroke="var(--v-ink)" />
          <path d="M22 36h4M30 30v12M38 26v20M46 31v10M54 28v16M62 36h-2" stroke="var(--v-ink)" />
        </>)}
      </g>
    </svg>
  );
}
