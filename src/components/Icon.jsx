// Small shared icon set (inline SVG, no dependency). Decorative by default: put the meaning in the button's text or aria-label.
const PATHS = {
  keypad: <><circle cx="6" cy="5" r="1.4" /><circle cx="12" cy="5" r="1.4" /><circle cx="18" cy="5" r="1.4" /><circle cx="6" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="18" cy="12" r="1.4" /><circle cx="6" cy="19" r="1.4" /><circle cx="12" cy="19" r="1.4" /><circle cx="18" cy="19" r="1.4" /></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z" /><path d="M6.5 17A2.5 2.5 0 0 0 6.5 22H20v-5" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" /></>,
  queue: <><path d="M4 6h11M4 12h11M4 18h6" /><circle cx="17.5" cy="17" r="2.5" /><path d="M20 17V8l-3 1" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  skip: <><path d="M5 4l10 8-10 8V4z" /><path d="M19 5v14" /></>,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  power: <><path d="M12 3v9" /><path d="M6.3 6.3a8 8 0 1 0 11.4 0" /></>,
  play: <path d="M7 4l13 8-13 8V4z" />,
  pause: <path d="M8 5v14M16 5v14" strokeWidth="3.5" />,
};

export default function Icon({ name, size = 18, className = '' }) {
  const dots = name === 'keypad';
  return (
    <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false"
      fill={dots ? 'currentColor' : 'none'} stroke={dots ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </svg>
  );
}