import { useState, createContext, useContext, useCallback } from 'react';
import ReactDOM from 'react-dom';

/* ─── BADGE ──────────────────────────────────────── */
export function Badge({ status }) {
  const cfg = {
    growing:   { bg: '#dcfce7', color: '#166534', dot: '#22c55e', label: 'Growing' },
    harvested: { bg: '#fef9c3', color: '#854d0e', dot: '#eab308', label: 'Harvested' },
    overdue:   { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444', label: 'Overdue' },
  };
  const s = cfg[status] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8', label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 100,
      background: s.bg, color: s.color,
      fontSize: 11, fontFamily: 'var(--font-m)',
      fontWeight: 500, letterSpacing: '.03em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }}/>
      {s.label}
    </span>
  );
}

/* ─── PROGRESS BAR ───────────────────────────────── */
export function PBar({ pct = 0, color = 'var(--forest-400)', h = 6 }) {
  const clamp = Math.min(100, Math.max(0, pct));
  return (
    <div style={{ width: '100%', height: h, background: 'var(--slate-100)', borderRadius: 100, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${clamp}%`,
        background: color, borderRadius: 100,
        transition: 'width 0.8s var(--ease-out)',
      }}/>
    </div>
  );
}

/* ─── BUTTON ─────────────────────────────────────── */
export function Btn({ children, variant = 'secondary', icon, onClick, disabled, small, style: sx = {}, ...p }) {
  const variants = {
    primary:   { bg: 'var(--forest-500)', hover: 'var(--forest-600)', color: '#fff', border: 'transparent', radius: 6 },
    secondary: { bg: '#fff', hover: 'var(--slate-50)', color: 'var(--text-2)', border: 'var(--border)', radius: 6 },
    ghost:     { bg: 'transparent', hover: 'var(--slate-100)', color: 'var(--text-3)', border: 'transparent', radius: 6 },
    danger:    { bg: 'var(--red-50)', hover: 'var(--red-100)', color: 'var(--red-600)', border: 'var(--red-100)', radius: 6 },
    amber:     { bg: 'var(--amber-50)', hover: 'var(--amber-100)', color: 'var(--amber-600)', border: 'var(--amber-200)', radius: 6 },
    earth:     { bg: 'var(--earth-500)', hover: 'var(--earth-600)', color: '#fff', border: 'transparent', radius: 6 },
  };
  const [hovered, setHovered] = useState(false);
  const v = variants[variant] || variants.secondary;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: small ? '5px 12px' : '8px 16px',
        background: hovered && !disabled ? v.hover : v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        borderRadius: v.radius,
        fontSize: small ? 12 : 13,
        fontFamily: 'var(--font-b)',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? .5 : 1,
        transition: 'all .15s ease',
        whiteSpace: 'nowrap',
        boxShadow: variant === 'primary' || variant === 'earth' ? '0 1px 3px rgba(0,0,0,.12)' : 'none',
        ...sx,
      }}
      {...p}
    >
      {icon && <span style={{ fontSize: small ? 13 : 14, lineHeight: 1 }}>{icon}</span>}
      {children}
    </button>
  );
}

/* ─── ICON BUTTON ────────────────────────────────── */
export function IconBtn({ icon, onClick, title, danger }) {
  const [h, sh] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => sh(true)} onMouseLeave={() => sh(false)}
      style={{
        width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${danger ? (h ? 'var(--red-400)' : 'var(--red-100)') : (h ? 'var(--border-2)' : 'var(--border)')}`,
        borderRadius: 6,
        background: danger ? (h ? 'var(--red-100)' : 'var(--red-50)') : (h ? 'var(--slate-50)' : '#fff'),
        color: danger ? 'var(--red-500)' : 'var(--text-3)',
        cursor: 'pointer', fontSize: 14, transition: 'all .15s',
      }}>
      {icon}
    </button>
  );
}

/* ─── CARD ───────────────────────────────────────── */
export function Card({ children, style: sx = {}, accent, onClick }) {
  const [h, sh] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => sh(true)}
      onMouseLeave={() => sh(false)}
      style={{
        background: '#fff',
        border: `1px solid ${h && onClick ? 'var(--forest-300)' : 'var(--border)'}`,
        borderRadius: 10,
        borderTop: accent ? `3px solid ${accent}` : undefined,
        boxShadow: h && onClick ? 'var(--shadow)' : 'var(--shadow-sm)',
        transition: 'all .2s',
        transform: h && onClick ? 'translateY(-2px)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        ...sx,
      }}
    >
      {children}
    </div>
  );
}

/* ─── STAT CARD ──────────────────────────────────── */
export function StatCard({ icon, num, label, color = 'var(--forest-400)', badge, onClick, i = 0 }) {
  return (
    <Card
      onClick={onClick}
      accent={color}
      style={{ padding: '18px 20px', animation: `scaleIn .4s ${i * .07}s both` }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>
          {icon}
        </div>
        {badge && (
          <span style={{
            fontSize: 10, fontFamily: 'var(--font-m)', padding: '2px 8px', borderRadius: 100,
            background: 'var(--amber-100)', color: 'var(--amber-600)', fontWeight: 500,
          }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{ fontFamily: 'var(--font-d)', fontSize: 30, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{num}</div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, fontWeight: 500 }}>{label}</div>
    </Card>
  );
}

/* ─── TABLE SHELL ────────────────────────────────── */
export function TableShell({ children, title, subtitle, right, accentColor = 'var(--forest-400)' }) {
  return (
    <Card accent={accentColor}>
      {(title || right) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2)',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{subtitle}</div>}
          </div>
          {right}
        </div>
      )}
      {children}
    </Card>
  );
}

/* ─── TABLE ──────────────────────────────────────── */
export function Table({ headers, children, minWidth }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: minWidth || 500 }}>
        <thead>
          <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
            {headers.map(h => (
              <th key={h} style={{
                padding: '10px 16px', textAlign: 'left', fontSize: 11,
                fontFamily: 'var(--font-m)', fontWeight: 500,
                textTransform: 'uppercase', letterSpacing: '.07em',
                color: 'var(--text-3)', whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function TR({ children, i = 0, onClick }) {
  const [h, sh] = useState(false);
  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => sh(true)}
      onMouseLeave={() => sh(false)}
      style={{
        borderBottom: '1px solid var(--border)',
        background: h ? 'var(--forest-50)' : 'transparent',
        cursor: onClick ? 'pointer' : 'default',
        animation: `slideUp .2s ${i * .03}s both`,
        transition: 'background .1s',
      }}
    >
      {children}
    </tr>
  );
}

export function TD({ children, mono, muted, bold, style: sx = {} }) {
  return (
    <td style={{
      padding: '10px 16px', fontSize: 13,
      fontFamily: mono ? 'var(--font-m)' : 'var(--font-b)',
      color: muted ? 'var(--text-3)' : 'var(--text-1)',
      fontWeight: bold ? 600 : 400,
      ...sx,
    }}>
      {children}
    </td>
  );
}

/* ─── FORM INPUT ─────────────────────────────────── */
export function Input({ label, error, type = 'text', ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && (
        <label style={{
          display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)',
          marginBottom: 6, letterSpacing: '.01em',
        }}>
          {label}
        </label>
      )}
      <input
        type={type}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '9px 12px',
          border: `1.5px solid ${error ? 'var(--red-400)' : focused ? 'var(--forest-400)' : 'var(--border)'}`,
          borderRadius: 7, fontSize: 13,
          fontFamily: 'var(--font-b)', color: 'var(--text-1)',
          background: '#fff', outline: 'none',
          transition: 'border-color .15s',
        }}
        {...props}
      />
      {error && <p style={{ fontSize: 11, color: 'var(--red-500)', marginTop: 4, fontFamily: 'var(--font-m)' }}>{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && (
        <label style={{
          display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)',
          marginBottom: 6,
        }}>
          {label}
        </label>
      )}
      <select
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '9px 12px',
          border: `1.5px solid ${error ? 'var(--red-400)' : focused ? 'var(--forest-400)' : 'var(--border)'}`,
          borderRadius: 7, fontSize: 13,
          fontFamily: 'var(--font-b)', color: 'var(--text-1)',
          background: '#fff', outline: 'none', cursor: 'pointer',
          transition: 'border-color .15s',
        }}
        {...props}
      >
        {children}
      </select>
      {error && <p style={{ fontSize: 11, color: 'var(--red-500)', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

/* ─── SEARCH BAR ─────────────────────────────────── */
export function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
      <span style={{
        position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--text-4)', fontSize: 14, pointerEvents: 'none',
      }}>🔍</span>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder || 'Search…'}
        style={{
          width: '100%', padding: '8px 12px 8px 34px',
          border: '1.5px solid var(--border)', borderRadius: 7,
          fontSize: 13, fontFamily: 'var(--font-b)', color: 'var(--text-1)',
          background: '#fff', outline: 'none',
          transition: 'border-color .15s',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--forest-400)'}
        onBlur={e  => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  );
}

/* ─── FILTER BAR ─────────────────────────────────── */
export function FilterBar({ children }) {
  return (
    <div style={{
      display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
      background: '#fff', border: '1px solid var(--border)', borderRadius: 9,
      padding: '10px 14px', marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

/* ─── CONFIRM DIALOG ─────────────────────────────── */
export function ConfirmDialog({ title, desc, onConfirm, onCancel, confirmLabel = 'Delete', confirmVariant = 'danger' }) {
  return (
    <Modal onClose={onCancel} maxWidth={420}>
      <div style={{ padding: '28px 28px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{
          width: 44, height: 44, background: 'var(--red-50)', borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
        }}>⚠️</div>
        <div>
          <div style={{ fontFamily: 'var(--font-d)', fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--text-1)' }}>{title}</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>{desc}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '0 28px 24px', justifyContent: 'flex-end' }}>
        <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
        <Btn variant={confirmVariant} onClick={onConfirm} icon="🗑️">{confirmLabel}</Btn>
      </div>
    </Modal>
  );
}

/* ─── MODAL ──────────────────────────────────────── */
export function Modal({ onClose, children, maxWidth = 640, title }) {
  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)',
        backdropFilter: 'blur(6px)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, animation: 'fadeIn .18s ease', overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', width: '100%', maxWidth, maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          borderRadius: 14, boxShadow: '0 24px 60px rgba(0,0,0,.18)',
          animation: 'bounceIn .3s var(--ease-spring)',
          overflow: 'hidden', position: 'relative', margin: 'auto',
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(to right,var(--forest-400),var(--earth-400),var(--amber-400))',
        }}/>
        {title && (
          <div style={{
            padding: '20px 24px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          }}>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: 17, fontWeight: 700, color: 'var(--text-1)' }}>{title}</div>
            <button onClick={onClose} style={{
              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer',
              background: '#fff', color: 'var(--text-3)', fontSize: 16,
            }}>✕</button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ─── EMPTY STATE ────────────────────────────────── */
export function EmptyState({ icon = '🌾', text = 'No entries found', action }) {
  return (
    <div style={{ padding: '60px 40px', textAlign: 'center' }}>
      <div style={{ fontSize: 44, marginBottom: 12, opacity: .3 }}>{icon}</div>
      <div style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: action ? 20 : 0 }}>{text}</div>
      {action}
    </div>
  );
}

/* ─── SECTION HEADER ─────────────────────────────── */
export function SectionHeader({ title, subtitle, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 16, gap: 12,
    }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

/* ─── TAB BAR ────────────────────────────────────── */
export function TabBar({ tabs, active, onSelect }) {
  return (
    <div style={{
      display: 'flex', gap: 2, padding: '4px',
      background: 'var(--slate-100)', borderRadius: 9, width: 'fit-content', marginBottom: 16,
    }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onSelect(t.key)}
          style={{
            padding: '6px 16px', border: 'none', borderRadius: 7, cursor: 'pointer',
            fontSize: 12, fontFamily: 'var(--font-b)', fontWeight: 500,
            background: active === t.key ? '#fff' : 'transparent',
            color: active === t.key ? 'var(--text-1)' : 'var(--text-3)',
            boxShadow: active === t.key ? 'var(--shadow-sm)' : 'none',
            transition: 'all .15s',
          }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ─── TOAST ──────────────────────────────────────── */
export const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, set] = useState([]);
  const push = useCallback(({ title, sub, type = 'info', duration = 3500 }) => {
    const id = Date.now();
    set(p => [...p, { id, title, sub, type }]);
    setTimeout(() => set(p => p.filter(t => t.id !== id)), duration + 500);
  }, []);
  const dismiss = id => set(p => p.filter(t => t.id !== id));

  const cfg = {
    success: { icon: '✅', border: 'var(--forest-400)', dot: 'var(--forest-400)' },
    error:   { icon: '❌', border: 'var(--red-400)',    dot: 'var(--red-400)'    },
    info:    { icon: 'ℹ️', border: 'var(--amber-400)',  dot: 'var(--amber-400)'  },
    warn:    { icon: '⚠️', border: 'var(--amber-300)',  dot: 'var(--amber-300)'  },
  };

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const c = cfg[t.type] || cfg.info;
          return (
            <div key={t.id} style={{
              pointerEvents: 'all', background: '#fff', padding: '12px 16px',
              display: 'flex', alignItems: 'flex-start', gap: 10,
              minWidth: 280, maxWidth: 360,
              boxShadow: '0 8px 24px rgba(0,0,0,.12)',
              borderLeft: `3px solid ${c.border}`,
              borderRadius: '0 10px 10px 0',
              border: `1px solid var(--border)`,
              borderLeft: `3px solid ${c.border}`,
              animation: 'slideUp .3s both',
            }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{c.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{t.title}</div>
                {t.sub && <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-m)', marginTop: 1 }}>{t.sub}</div>}
              </div>
              <button onClick={() => dismiss(t.id)} style={{
                background: 'none', border: 'none', color: 'var(--text-4)',
                cursor: 'pointer', fontSize: 14, flexShrink: 0, padding: 0,
              }}>✕</button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);