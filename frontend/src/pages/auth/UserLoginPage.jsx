import { useState } from 'react';

const DEMO_USERS = [
  { label: 'Farmer',     name: 'Rodrigo Lim',    email: 'rodrigo@farmer.ph', password: 'farmer123' },
  { label: 'Agri. Tech', name: 'Jose Dela Cruz',  email: 'jose@at.ph',        password: 'at123'     },
  { label: 'Encoder',    name: 'Ana Reyes',       email: 'ana@encoder.ph',    password: 'enc123'    },
];

export default function UserLoginPage({ onLogin, onBack, onSignUp }) {
  const [email,   setEmail]   = useState('');
  const [pw,      setPw]      = useState('');
  const [errors,  setErrors]  = useState({});
  const [apiErr,  setApiErr]  = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';
    if (!pw) e.pw = 'Password is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    setApiErr('');
    if (!validate()) return;
    setLoading(true);
    setTimeout(async () => {
      const r = await onLogin(email, pw, 'user');
      if (!r.ok) { setApiErr(r.error || 'Invalid credentials. Please check and try again.'); setLoading(false); }
    }, 500);
  };

  const fillDemo = (u) => { setEmail(u.email); setPw(u.password); setErrors({}); setApiErr(''); };

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr',
      background: '#0e1a12',
    }}>
      {/* Left panel */}
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 56px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            radial-gradient(ellipse at 5% 30%, rgba(168,137,95,.2) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(77,158,77,.18) 0%, transparent 55%)
          `,
        }}/>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `linear-gradient(rgba(255,255,255,.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.015) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}/>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <button onClick={onBack} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 40,
            fontSize: 12, fontFamily: 'var(--font-m)', color: 'rgba(255,255,255,.35)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color .15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,.7)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.35)'}
          >
            ← Back to Portal Select
          </button>

          <div style={{
            width: 48, height: 48, background: 'var(--earth-500)',
            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, marginBottom: 24,
          }}>🌾</div>

          <h1 style={{
            fontFamily: 'var(--font-d)', fontSize: 38, fontWeight: 800, color: '#fff',
            lineHeight: 1.1, letterSpacing: '-.04em', marginBottom: 8,
          }}>
            Farmer<br/><span style={{ color: 'var(--earth-300)' }}>Portal</span>
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', fontFamily: 'var(--font-m)', marginBottom: 40 }}>
            Barangay Farm Manager · Calbayog
          </p>

          {[
            'Log and track your crop entries',
            'Monitor harvest progress',
            'View barangay activity overview',
            'Access field guides and tips',
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--earth-400)', flexShrink: 0 }}/>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        background: '#fff', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px 56px', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: 4,
          background: 'linear-gradient(to bottom, var(--earth-400), var(--forest-400))',
        }}/>

        <div style={{ maxWidth: 380 }}>
          <h2 style={{
            fontFamily: 'var(--font-d)', fontSize: 26, fontWeight: 800,
            letterSpacing: '-.03em', marginBottom: 4, color: 'var(--text-1)',
          }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 32 }}>
            Sign in to your farmer account to continue.
          </p>

          {apiErr && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: 'var(--red-50)', border: '1px solid var(--red-100)',
              borderLeft: '3px solid var(--red-400)', borderRadius: '0 7px 7px 0',
              padding: '10px 14px', marginBottom: 20, animation: 'slideUp .2s',
            }}>
              <span style={{ fontSize: 14 }}>❌</span>
              <p style={{ fontSize: 13, color: 'var(--red-600)' }}>{apiErr}</p>
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); setApiErr(''); }}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{
                width: '100%', padding: '10px 13px',
                border: `1.5px solid ${errors.email ? 'var(--red-400)' : 'var(--border)'}`,
                borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-b)',
                color: 'var(--text-1)', background: '#fff', outline: 'none', transition: 'border-color .15s',
              }}
              onFocus={e => { if (!errors.email) e.target.style.borderColor = 'var(--forest-400)'; }}
              onBlur={e  => { if (!errors.email) e.target.style.borderColor = 'var(--border)'; }}
            />
            {errors.email && <p style={{ fontSize: 11, color: 'var(--red-500)', marginTop: 5, fontFamily: 'var(--font-m)' }}>{errors.email}</p>}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={pw}
              onChange={e => { setPw(e.target.value); setErrors(p => ({ ...p, pw: '' })); setApiErr(''); }}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{
                width: '100%', padding: '10px 13px',
                border: `1.5px solid ${errors.pw ? 'var(--red-400)' : 'var(--border)'}`,
                borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-b)',
                color: 'var(--text-1)', background: '#fff', outline: 'none', transition: 'border-color .15s',
              }}
              onFocus={e => { if (!errors.pw) e.target.style.borderColor = 'var(--forest-400)'; }}
              onBlur={e  => { if (!errors.pw) e.target.style.borderColor = 'var(--border)'; }}
            />
            {errors.pw && <p style={{ fontSize: 11, color: 'var(--red-500)', marginTop: 5, fontFamily: 'var(--font-m)' }}>{errors.pw}</p>}
          </div>

          <button
            onClick={submit}
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: loading ? 'var(--slate-300)' : 'var(--earth-500)',
              color: '#fff', fontSize: 14, fontFamily: 'var(--font-d)',
              fontWeight: 700, border: 'none', borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'background .2s',
              boxShadow: loading ? 'none' : '0 2px 8px rgba(138,109,66,.3)',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--earth-600)'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--earth-500)'; }}
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>

          <p style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
            Don't have an account?{' '}
            <span
              onClick={onSignUp}
              style={{ color: 'var(--forest-500)', cursor: 'pointer', fontWeight: 600, transition: 'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--forest-600)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--forest-500)'}
            >
              Sign up here →
            </span>
          </p>

          {/* Demo */}
          <div style={{ marginTop: 28, paddingTop: 22, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 10, fontFamily: 'var(--font-m)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
              Demo accounts — click to fill
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {DEMO_USERS.map(u => (
                <div
                  key={u.email}
                  onClick={() => fillDemo(u)}
                  style={{
                    padding: '9px 12px', background: 'var(--forest-50)',
                    border: '1px solid var(--forest-100)', borderRadius: 7,
                    cursor: 'pointer', transition: 'all .15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--forest-100)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--forest-50)'; }}
                >
                  <div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-m)', color: 'var(--forest-600)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{u.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-1)', fontWeight: 500, marginTop: 1 }}>{u.name}</div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--font-m)' }}>{u.email}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}