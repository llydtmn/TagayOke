import { ROLE_LABELS } from '../data/constants';

const ADMIN_NAV = [
  { section: 'Overview' },
  { key: 'admin-dashboard', icon: '▦',  label: 'Dashboard' },
  { section: 'Management' },
  { key: 'admin-croplog',   icon: '📋', label: 'Crop Logs' },
  { key: 'admin-harvest',   icon: '🌾', label: 'Harvest Records' },
  { key: 'admin-farmers',   icon: '👨‍🌾', label: 'Farmers List' },
  { key: 'admin-barangay',  icon: '📍', label: 'By Barangay' },
  { key: 'admin-land',      icon: '🗺️', label: 'Land Management' },
  { section: 'Analytics' },
  { key: 'admin-reports',   icon: '📊', label: 'Reports' },
  { section: 'System' },
  { key: 'admin-users',     icon: '👥', label: 'User Management' },
  { key: 'admin-audit',     icon: '📝', label: 'Audit Log' },
  { key: 'admin-settings',  icon: '⚙️', label: 'Settings' },
];

const USER_NAV = [
  { section: 'Overview' },
  { key: 'user-dashboard', icon: '▦',  label: 'Dashboard' },
  { section: 'My Farm' },
  { key: 'user-croplog',   icon: '📋', label: 'Crop Logs' },
  { key: 'user-addentry',  icon: '➕', label: 'Add Entry' },
  { key: 'user-harvest',   icon: '🌾', label: 'Harvest Tracker' },
  { key: 'user-barangay',  icon: '📍', label: 'My Barangay' },
  { key: 'user-farmers',   icon: '👨‍🌾', label: 'Farmers List' },  // ← NEW
  { section: 'Resources' },
  { key: 'user-guide',     icon: '📁', label: 'Field Guide' },
  { section: 'Account' },
  { key: 'user-profile',   icon: '👤', label: 'My Profile' },
];

const ROLE_ACCENT = {
  admin:   '#4d9e4d',
  farmer:  '#a8895f',
  at:      '#f59e0b',
  encoder: '#64748b',
};

export default function Sidebar({ user, active, onNav, stats, onLogout }) {
  const isAdmin = user?.role === 'admin';
  const nav = isAdmin ? ADMIN_NAV : USER_NAV;
  const roleColor = ROLE_ACCENT[user?.role] || '#64748b';

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, width: 'var(--sidebar-w)', height: '100vh',
      background: '#111b10', display: 'flex', flexDirection: 'column',
      zIndex: 100, overflow: 'hidden', borderRight: '1px solid rgba(255,255,255,.06)',
    }}>
      {/* Subtle texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `radial-gradient(ellipse at 0% 0%, rgba(77,158,77,.15) 0%, transparent 60%)`,
      }}/>

      {/* Brand */}
      <div style={{
        padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,.06)',
        position: 'relative', zIndex: 1, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 34, height: 34, background: 'var(--forest-500)',
            borderRadius: 9, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 18, flexShrink: 0,
          }}>🌱</div>
          <div>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 13, color: '#fff', lineHeight: 1.2 }}>
              Calbayog Farmers
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', fontFamily: 'var(--font-m)', marginTop: 1 }}>
              Crop Log System
            </div>
          </div>
        </div>
        {/* Role badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 9px', borderRadius: 100,
          background: `${roleColor}22`, color: roleColor,
          fontSize: 10, fontFamily: 'var(--font-m)', fontWeight: 500, letterSpacing: '.04em',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: roleColor }}/>
          {ROLE_LABELS[user?.role] || user?.role}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1, overflowY: 'auto', padding: '8px 10px',
        position: 'relative', zIndex: 1,
      }}>
        {nav.map((item, idx) => {
          if (item.section) {
            return (
              <div key={idx} style={{
                fontSize: 9, fontFamily: 'var(--font-m)', textTransform: 'uppercase',
                letterSpacing: '.14em', color: 'rgba(255,255,255,.2)',
                padding: '14px 8px 5px',
              }}>
                {item.section}
              </div>
            );
          }

          const isActive  = active === item.key;
          const showBadge = item.key?.includes('harvest') && (stats?.overdue || 0) > 0;

          return (
            <div
              key={item.key}
              onClick={() => onNav(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                borderRadius: 7, cursor: 'pointer', marginBottom: 1,
                background: isActive ? 'rgba(77,158,77,.18)' : 'transparent',
                color: isActive ? '#a3d9a3' : 'rgba(255,255,255,.5)',
                transition: 'all .15s',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.color = 'rgba(255,255,255,.8)'; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.5)'; }}}
            >
              {isActive && (
                <div style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: 3, height: 20, background: 'var(--forest-400)', borderRadius: '0 3px 3px 0',
                }}/>
              )}
              <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              <span style={{
                fontSize: 13, fontWeight: isActive ? 600 : 400, flex: 1,
                color: isActive ? '#c8ebc8' : 'inherit',
              }}>{item.label}</span>
              {showBadge && (
                <span style={{
                  background: '#ef4444', color: '#fff',
                  fontSize: 10, fontFamily: 'var(--font-m)',
                  minWidth: 18, height: 18, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px', borderRadius: 100, fontWeight: 600,
                }}>
                  {stats.overdue}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{
        padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,.06)',
        position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <div
          onClick={() => !isAdmin && onNav('user-profile')}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--forest-400), var(--earth-400))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-d)', fontWeight: 700, color: '#fff',
            fontSize: 13, flexShrink: 0,
            cursor: isAdmin ? 'default' : 'pointer',
          }}
        >
          {user?.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.85)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{user?.name}</div>
          <div style={{
            fontSize: 10, color: 'rgba(255,255,255,.3)', fontFamily: 'var(--font-m)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{user?.email}</div>
        </div>
        <button
          onClick={onLogout}
          title="Logout"
          style={{
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 7, color: 'rgba(255,255,255,.4)', cursor: 'pointer',
            fontSize: 13, transition: 'all .15s', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,.15)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.color = 'rgba(255,255,255,.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; }}
        >
          ⏻
        </button>
      </div>
    </aside>
  );
}