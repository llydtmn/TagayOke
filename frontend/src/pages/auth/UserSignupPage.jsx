import { useState } from 'react';
import { BARANGAYS } from '../../data/constants';
import { Btn, useToast } from '../../components/UIComponents';

export default function UserSignupPage({ onSignUp, onBack }) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '',
    contact: '', barangay: '', farmLocation: '', farmSize: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = 'Full name is required.';
    if (!form.email.trim())    e.email    = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.password)        e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match.';
    if (!form.contact.trim())  e.contact  = 'Contact number is required.';
    if (!form.barangay)        e.barangay = 'Please select your barangay.';
    if (!form.farmLocation.trim()) e.farmLocation = 'Farm location description is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      const result = onSignUp({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        contact: form.contact.trim(),
        barangay: form.barangay,
        farmLocation: form.farmLocation.trim(),
        farmSize: form.farmSize.trim(),
        role: 'farmer',
        avatar: form.name.trim()[0].toUpperCase(),
      });
      if (!result.ok) {
        setErrors({ email: result.error });
        setLoading(false);
      } else {
        toast({ title: 'Account created!', sub: 'You can now sign in.', type: 'success' });
        setLoading(false);
        onBack();
      }
    }, 600);
  };

  const iStyle = (k) => ({
    width: '100%', padding: '10px 13px',
    border: `1.5px solid ${errors[k] ? '#ef4444' : 'rgba(255,255,255,.12)'}`,
    background: 'rgba(255,255,255,.06)',
    color: '#fff',
    fontSize: 13,
    fontFamily: 'var(--font-b)',
    borderRadius: 7,
    outline: 'none',
    transition: 'border-color .2s',
    WebkitTextFillColor: '#fff',
  });

  const Label = ({ children }) => (
    <div style={{
      fontSize: 11, fontFamily: 'var(--font-m)',
      textTransform: 'uppercase', letterSpacing: '.08em',
      color: 'rgba(255,255,255,.45)', marginBottom: 6,
    }}>
      {children}
    </div>
  );

  const ErrMsg = ({ k }) => errors[k]
    ? <div style={{ fontSize: 11, color: '#fca5a5', fontFamily: 'var(--font-m)', marginTop: 4 }}>{errors[k]}</div>
    : null;

  const focusStyle = (k) => ({
    onFocus: e => { e.target.style.borderColor = errors[k] ? '#ef4444' : 'rgba(45,155,144,.7)'; e.target.style.background = 'rgba(255,255,255,.09)'; },
    onBlur:  e => { e.target.style.borderColor = errors[k] ? '#ef4444' : 'rgba(255,255,255,.12)'; e.target.style.background = 'rgba(255,255,255,.06)'; },
  });

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0d1a0c',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse at 20% 30%, rgba(45,155,144,.2) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(77,158,77,.15) 0%, transparent 45%)
        `,
      }}/>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px)
        `,
        backgroundSize: '36px 36px',
      }}/>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 620, animation: 'slideUp .4s both' }}>
        {/* Back link */}
        <button onClick={onBack} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 28,
          fontSize: 12, fontFamily: 'var(--font-m)', color: 'rgba(255,255,255,.35)',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color .15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,.7)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.35)'}
        >
          ← Back to Sign In
        </button>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48,
            background: 'linear-gradient(135deg, #2d9b90, #357a35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, marginBottom: 16,
            clipPath: 'polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)',
            boxShadow: '0 8px 24px rgba(45,155,144,.35)',
          }}>🌱</div>
          <div style={{
            fontFamily: 'var(--font-d)', fontSize: 28, fontWeight: 800,
            color: '#fff', letterSpacing: '-.03em', marginBottom: 4,
          }}>
            Create your account
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', fontFamily: 'var(--font-m)' }}>
            Calbayog Farmers Crop Log System
          </div>
        </div>

        {/* Form card */}
        <div style={{
          background: 'rgba(255,255,255,.05)',
          border: '1px solid rgba(255,255,255,.1)',
          borderTop: '3px solid #2d9b90',
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          <div style={{ height: 2, background: 'linear-gradient(to right, #2d9b90, #f59e0b)' }}/>
          <div style={{ padding: '28px 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              {/* Full Name */}
              <div style={{ gridColumn: 'span 2' }}>
                <Label>Full Name *</Label>
                <input
                  style={iStyle('name')} value={form.name} onChange={set('name')}
                  placeholder="Juan dela Cruz"
                  {...focusStyle('name')}
                />
                <ErrMsg k="name"/>
              </div>

              {/* Email */}
              <div style={{ gridColumn: 'span 2' }}>
                <Label>Email Address *</Label>
                <input
                  type="email" style={iStyle('email')} value={form.email} onChange={set('email')}
                  placeholder="you@example.com"
                  {...focusStyle('email')}
                />
                <ErrMsg k="email"/>
              </div>

              {/* Password */}
              <div>
                <Label>Password *</Label>
                <input
                  type="password" style={iStyle('password')} value={form.password} onChange={set('password')}
                  placeholder="Min. 6 characters"
                  {...focusStyle('password')}
                />
                <ErrMsg k="password"/>
              </div>

              {/* Confirm Password */}
              <div>
                <Label>Confirm Password *</Label>
                <input
                  type="password" style={iStyle('confirm')} value={form.confirm} onChange={set('confirm')}
                  placeholder="Re-enter password"
                  {...focusStyle('confirm')}
                />
                <ErrMsg k="confirm"/>
              </div>

              {/* Contact */}
              <div>
                <Label>Contact Number *</Label>
                <input
                  style={iStyle('contact')} value={form.contact} onChange={set('contact')}
                  placeholder="09XX XXX XXXX"
                  {...focusStyle('contact')}
                />
                <ErrMsg k="contact"/>
              </div>

              {/* Barangay */}
              <div>
                <Label>Barangay *</Label>
                <select
                  style={{ ...iStyle('barangay'), cursor: 'pointer' }}
                  value={form.barangay} onChange={set('barangay')}
                  {...focusStyle('barangay')}
                >
                  <option value="" style={{ background: '#1a2218' }}>Select barangay…</option>
                  {BARANGAYS.map(b => <option key={b} style={{ background: '#1a2218' }}>{b}</option>)}
                </select>
                <ErrMsg k="barangay"/>
              </div>

              {/* Farm Location — spans full width */}
              <div style={{ gridColumn: 'span 2' }}>
                <Label>Farm Land Location *</Label>
                <input
                  style={iStyle('farmLocation')} value={form.farmLocation} onChange={set('farmLocation')}
                  placeholder="e.g. Sitio Mapalad, near the river / Purok 3, upper barangay area"
                  {...focusStyle('farmLocation')}
                />
                <ErrMsg k="farmLocation"/>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', fontFamily: 'var(--font-m)', marginTop: 4 }}>
                  Describe where your farm is located (sitio, landmark, or area)
                </div>
              </div>

              {/* Farm Size — optional */}
              <div style={{ gridColumn: 'span 2' }}>
                <Label>Farm Size (optional)</Label>
                <input
                  style={iStyle('farmSize')} value={form.farmSize} onChange={set('farmSize')}
                  placeholder="e.g. 0.5 hectares, 2 hectares, etc."
                  {...focusStyle('farmSize')}
                />
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={submit}
                disabled={loading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '11px 28px',
                  background: loading ? 'rgba(45,155,144,.4)' : '#2d9b90',
                  color: '#fff',
                  fontSize: 13, fontFamily: 'var(--font-d)', fontWeight: 700,
                  border: 'none', borderRadius: 7,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background .2s',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(45,155,144,.35)',
                  opacity: loading ? .7 : 1,
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#25857b'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#2d9b90'; }}
              >
                {loading ? 'Creating account…' : '🌱 Create Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}