export default function PortalSelectPage({ onSelect }) {
  const portals = [
    {
      key: 'admin',
      icon: '🏛️',
      title: 'Admin Portal',
      sub: 'City Agriculture Office',
      desc: 'Manage crop records, users, barangays, and system-wide analytics.',
      color: '#c95c20',
      accent: '#b04e18',
      glow: 'rgba(201,92,32,.3)',
      bg: 'rgba(201,92,32,.14)',
      borderHover: 'rgba(201,92,32,.6)',
    },
    {
      key: 'user',
      icon: '🌾',
      title: 'Farmer Portal',
      sub: 'Barangay Farm Manager',
      desc: 'Log crop entries, track harvests, and monitor your barangay\'s activity.',
      color: '#2d9b90',
      accent: '#25857b',
      glow: 'rgba(45,155,144,.25)',
      bg: 'rgba(45,155,144,.14)',
      borderHover: 'rgba(45,155,144,.6)',
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0d1a0c',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Layered background gradients */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse at 15% 50%, rgba(201,92,32,.22) 0%, transparent 50%),
          radial-gradient(ellipse at 85% 50%, rgba(45,155,144,.18) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 10%, rgba(77,158,77,.1) 0%, transparent 40%)
        `,
      }}/>
      {/* Grid texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}/>
      {/* Diagonal stripe texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(-45deg, transparent, transparent 30px, rgba(255,255,255,.008) 30px, rgba(255,255,255,.008) 31px)',
      }}/>

      {/* Brand */}
      <div style={{
        position: 'relative', zIndex: 1, textAlign: 'center',
        marginBottom: 52, animation: 'slideUp .5s both',
      }}>
        <div style={{
          width: 60, height: 60,
          background: 'linear-gradient(135deg, #357a35, #c95c20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, margin: '0 auto 20px',
          clipPath: 'polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)',
          boxShadow: '0 8px 32px rgba(53,122,53,.4)',
        }}>🌱</div>
        <div style={{
          fontFamily: 'var(--font-d)', fontSize: 38, fontWeight: 800,
          color: '#fff', letterSpacing: '-.04em', lineHeight: 1.1, marginBottom: 8,
        }}>
          Calbayog <span style={{ color: '#c95c20' }}>Farmers</span>
        </div>
        <div style={{
          fontSize: 11, color: 'rgba(255,255,255,.35)',
          fontFamily: 'var(--font-m)', textTransform: 'uppercase', letterSpacing: '.16em',
        }}>
          Crop Log System · Samar, PH
        </div>
      </div>

      {/* Portal cards */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', gap: 24, flexWrap: 'wrap',
        justifyContent: 'center', width: '100%', maxWidth: 760,
      }}>
        {portals.map((p, i) => (
          <div
            key={p.key}
            onClick={() => onSelect(p.key)}
            style={{
              flex: '1 1 300px', maxWidth: 340,
              background: 'rgba(255,255,255,.05)',
              border: `1px solid rgba(255,255,255,.1)`,
              borderTop: `3px solid ${p.color}`,
              padding: '32px 30px',
              cursor: 'pointer',
              transition: 'transform .2s, box-shadow .2s, background .2s, border-color .2s',
              animation: `scaleIn .45s ${i * .12}s both`,
              borderRadius: 4,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-7px)';
              e.currentTarget.style.boxShadow = `0 24px 56px rgba(0,0,0,.45), 0 0 40px ${p.glow}`;
              e.currentTarget.style.background = p.bg;
              e.currentTarget.style.borderColor = p.borderHover;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = 'rgba(255,255,255,.05)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)';
            }}
          >
            <div style={{ fontSize: 42, marginBottom: 18, lineHeight: 1 }}>{p.icon}</div>
            <div style={{
              fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 800,
              color: '#fff', letterSpacing: '-.03em', marginBottom: 4,
            }}>
              {p.title}
            </div>
            <div style={{
              fontSize: 10, fontFamily: 'var(--font-m)',
              color: p.color, textTransform: 'uppercase',
              letterSpacing: '.12em', marginBottom: 14,
            }}>
              {p.sub}
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(255,255,255,.45)',
              lineHeight: 1.75, marginBottom: 28,
            }}>
              {p.desc}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 22px',
              background: p.accent,
              color: '#fff',
              fontSize: 12, fontFamily: 'var(--font-d)', fontWeight: 700,
              borderRadius: p.key === 'admin' ? 3 : 100,
              boxShadow: `0 4px 16px ${p.glow}`,
              transition: 'opacity .15s',
            }}>
              Enter Portal
              <span style={{ fontSize: 14 }}>→</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        position: 'relative', zIndex: 1,
        marginTop: 40, fontSize: 11,
        color: 'rgba(255,255,255,.2)',
        fontFamily: 'var(--font-m)',
        animation: 'fadeIn 1s .7s both',
      }}>
        Version 2.0 · City Agriculture Office · Calbayog City, Samar, PH
      </div>
    </div>
  );
}