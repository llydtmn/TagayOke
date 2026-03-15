import { useState } from 'react';

export default function AdminLoginPage({ onLogin, onBack }) {
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
      const r = await onLogin(email, pw, 'admin');
      if (!r.ok) { setApiErr(r.error || 'Invalid credentials. Please try again.'); setLoading(false); }
    }, 500);
  };

  const handleKey = e => { if (e.key === 'Enter') submit(); };

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr',
      background: '#0d1a0c',
    }}>
      {/* Left — branding panel */}
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 56px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            radial-gradient(ellipse at 10% 20%, rgba(77,158,77,.25) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 80%, rgba(168,137,95,.15) 0%, transparent 50%)
          `,
        }}/>
        {/* Grid texture */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}/>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <button onClick={onBack} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 40,
            fontSize: 12, fontFamily: 'var(--font-m)', color: 'rgba(255,255,255,.35)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            transition: 'color .15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,.7)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.35)'}
          >
            ← Back to Portal Select
          </button>

          <div style={{
            width: 48, height: 48, background: 'var(--forest-500)',
            borderRadius: 12, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 24, marginBottom: 24,
          }}>🏛️</div>

          <h1 style={{
            fontFamily: 'var(--font-d)', fontSize: 38, fontWeight: 800, color: '#fff',
            lineHeight: 1.1, letterSpacing: '-.04em', marginBottom: 8,
          }}>
            Admin<br/><span style={{ color: 'var(--forest-400)' }}>Portal</span>
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', fontFamily: 'var(--font-m)', marginBottom: 40 }}>
            City Agriculture Office · Calbayog, Samar
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              'City-wide crop management & oversight',
              'Barangay analytics and reporting',
              'User account administration',
              'Audit log and system configuration',
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,.5)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--forest-400)', flexShrink: 0 }}/>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — login form */}
      <div style={{
        background: '#fff', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px 56px', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: 4,
          background: 'linear-gradient(to bottom, var(--forest-400), var(--earth-400))',
        }}/>

        <div style={{ maxWidth: 380 }}>
          <h2 style={{
            fontFamily: 'var(--font-d)', fontSize: 26, fontWeight: 800,
            letterSpacing: '-.03em', marginBottom: 4, color: 'var(--text-1)',
          }}>
            Administrator Sign In
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 32 }}>
            Restricted to City Agriculture Office staff only.
          </p>

          {/* API Error */}
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
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 500,
              color: 'var(--text-2)', marginBottom: 6,
            }}>Email Address</label>
            <input
              type="email"
              placeholder="admin@calbayog.gov.ph"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); setApiErr(''); }}
              onKeyDown={handleKey}
              style={{
                width: '100%', padding: '10px 13px',
                border: `1.5px solid ${errors.email ? 'var(--red-400)' : 'var(--border)'}`,
                borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-b)',
                color: 'var(--text-1)', background: '#fff', outline: 'none',
                transition: 'border-color .15s',
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
              onKeyDown={handleKey}
              style={{
                width: '100%', padding: '10px 13px',
                border: `1.5px solid ${errors.pw ? 'var(--red-400)' : 'var(--border)'}`,
                borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-b)',
                color: 'var(--text-1)', background: '#fff', outline: 'none',
                transition: 'border-color .15s',
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
              background: loading ? 'var(--slate-300)' : 'var(--forest-500)',
              color: '#fff', fontSize: 14, fontFamily: 'var(--font-d)',
              fontWeight: 700, border: 'none', borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background .2s',
              boxShadow: loading ? 'none' : '0 2px 8px rgba(53,122,53,.3)',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--forest-600)'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--forest-500)'; }}
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>

          {/* Demo credentials */}
          <div style={{ marginTop: 28, paddingTop: 22, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 10, fontFamily: 'var(--font-m)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
              Demo — Click to fill
            </p>
            <div
              onClick={() => { setEmail('admin@calbayog.gov.ph'); setPw('admin123'); setErrors({}); setApiErr(''); }}
              style={{
                padding: '10px 12px', background: 'var(--forest-50)',
                border: '1px solid var(--forest-100)', borderRadius: 8, cursor: 'pointer',
                transition: 'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--forest-100)'; e.currentTarget.style.borderColor = 'var(--forest-200)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--forest-50)';  e.currentTarget.style.borderColor = 'var(--forest-100)'; }}
            >
              <div style={{ fontSize: 10, fontFamily: 'var(--font-m)', color: 'var(--forest-600)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Admin CAO</div>
              <div style={{ fontSize: 12, color: 'var(--text-1)', fontWeight: 500, marginTop: 2 }}>admin@calbayog.gov.ph</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}