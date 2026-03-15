import { useState } from 'react';
import { Btn, useToast } from '../../components/UIComponents';
import { ROLE_LABELS } from '../../data/constants';

export default function UserProfilePage({ user, onUpdateUser }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    contact: user?.contact || '',
    farmLocation: user?.farmLocation || '',
    farmSize: user?.farmSize || '',
  });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwErr,  setPwErr]  = useState('');
  const toast = useToast();

  const set   = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setPw = k => e => { setPwForm(p => ({ ...p, [k]: e.target.value })); setPwErr(''); };

  const saveProfile = () => {
    if (!form.name.trim()) { toast({ title: 'Name cannot be empty', type: 'error' }); return; }
    onUpdateUser({
      ...user,
      name: form.name.trim(),
      contact: form.contact.trim(),
      farmLocation: form.farmLocation.trim(),
      farmSize: form.farmSize.trim(),
      avatar: form.name.trim()[0].toUpperCase(),
    });
    toast({ title: 'Profile updated', type: 'success' });
    setEditing(false);
  };

  const savePassword = () => {
    if (!pwForm.current) { setPwErr('Enter your current password.'); return; }
    if (pwForm.current !== user.password) { setPwErr('Current password is incorrect.'); return; }
    if (pwForm.next.length < 6) { setPwErr('New password must be at least 6 characters.'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwErr('Passwords do not match.'); return; }
    onUpdateUser({ ...user, password: pwForm.next });
    toast({ title: 'Password updated', type: 'success' });
    setPwForm({ current: '', next: '', confirm: '' });
    setPwErr('');
  };

  const iStyle = {
    width: '100%', padding: '10px 13px', border: '1px solid var(--border)',
    background: 'var(--sand-50)', fontSize: 13, fontFamily: 'var(--font-b)',
    borderRadius: 7, outline: 'none', transition: 'border-color .2s', color: 'var(--text-1)',
  };
  const readStyle = { ...iStyle, background: 'var(--sand-100)', color: 'var(--sand-500)', cursor: 'not-allowed' };

  const Label = ({ children }) => (
    <div style={{ fontSize: 11, fontFamily: 'var(--font-m)', textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--sand-600)', marginBottom: 5 }}>
      {children}
    </div>
  );

  const cropCount = 0; // placeholder — would use crops prop if passed

  return (
    <div style={{ animation: 'slideUp .35s both' }}>
      {/* Full-width Profile Hero */}
      <div style={{
        background: 'var(--sand-900)', borderRadius: 6, padding: '28px 32px',
        marginBottom: 24, position: 'relative', overflow: 'hidden',
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 24,
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 50%,rgba(45,155,144,.22),transparent 55%), radial-gradient(ellipse at 80% 30%,rgba(77,158,77,.12),transparent 45%)', pointerEvents: 'none' }}/>

        {/* Avatar */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 78, height: 78, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--terra-400), var(--amber-400))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-d)', fontWeight: 800, color: '#fff', fontSize: 30,
            border: '3px solid rgba(255,255,255,.15)',
            boxShadow: '0 8px 24px rgba(0,0,0,.3)',
          }}>
            {user?.avatar || user?.name?.[0]?.toUpperCase()}
          </div>
        </div>

        {/* Info */}
        <div style={{ position: 'relative', zIndex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-d)', fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-.03em', marginBottom: 4 }}>
            {user?.name}
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 10, fontFamily: 'var(--font-m)', color: 'var(--teal-300)',
              textTransform: 'uppercase', letterSpacing: '.1em',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--teal-400)' }}/>
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
            {user?.barangay && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', fontFamily: 'var(--font-m)' }}>
                📍 Brgy. {user.barangay}
              </span>
            )}
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', fontFamily: 'var(--font-m)' }}>
              {user?.email}
            </span>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 20 }}>
          {[
            { label: 'Barangay', value: user?.barangay || '—', icon: '📍' },
            { label: 'User ID',  value: user?.id || '—',       icon: '🪪' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3-column grid below */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* Account Info */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: '3px solid var(--teal-400)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 14 }}>Account Info</div>
            <Btn small variant={editing ? 'danger' : 'ghost'} icon={editing ? '✕' : '✏️'}
              onClick={() => { setEditing(!editing); setForm({ name: user?.name || '', contact: user?.contact || '', farmLocation: user?.farmLocation || '', farmSize: user?.farmSize || '' }); }}>
              {editing ? 'Cancel' : 'Edit'}
            </Btn>
          </div>
          <div style={{ padding: '18px 20px' }}>
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <Label>Full Name</Label>
                  <input style={iStyle} value={form.name} onChange={set('name')}
                    onFocus={e => e.target.style.borderColor = 'var(--teal-400)'}
                    onBlur={e  => e.target.style.borderColor = 'var(--border)'}/>
                </div>
                <div>
                  <Label>Contact Number</Label>
                  <input style={iStyle} value={form.contact} onChange={set('contact')} placeholder="09XX XXX XXXX"
                    onFocus={e => e.target.style.borderColor = 'var(--teal-400)'}
                    onBlur={e  => e.target.style.borderColor = 'var(--border)'}/>
                </div>
                <div>
                  <Label>Email (read-only)</Label>
                  <input style={readStyle} value={user?.email} readOnly/>
                </div>
                <div>
                  <Label>Barangay (read-only)</Label>
                  <input style={readStyle} value={user?.barangay || 'All Barangays'} readOnly/>
                </div>
                <Btn variant="teal" onClick={saveProfile} icon="💾">Save Changes</Btn>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  ['User ID',   user?.id],
                  ['Full Name', user?.name],
                  ['Role',      ROLE_LABELS[user?.role] || user?.role],
                  ['Email',     user?.email],
                  ['Contact',   user?.contact || '—'],
                  ['Barangay',  user?.barangay || 'All Barangays (Admin)'],
                ].map(([label, value]) => (
                  <div key={label} style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-m)', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--sand-400)', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 13, color: 'var(--sand-800)', fontWeight: label === 'Full Name' ? 600 : 400, wordBreak: 'break-word' }}>{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Farm Land Info */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: '3px solid var(--earth-400)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            padding: '14px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)',
            fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 14,
          }}>
            Farm Land Info
          </div>
          <div style={{ padding: '18px 20px' }}>
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <Label>Farm Location</Label>
                  <input style={iStyle} value={form.farmLocation} onChange={set('farmLocation')}
                    placeholder="e.g. Sitio Mapalad, near the creek"
                    onFocus={e => e.target.style.borderColor = 'var(--earth-400)'}
                    onBlur={e  => e.target.style.borderColor = 'var(--border)'}/>
                </div>
                <div>
                  <Label>Farm Size</Label>
                  <input style={iStyle} value={form.farmSize} onChange={set('farmSize')}
                    placeholder="e.g. 1.5 hectares"
                    onFocus={e => e.target.style.borderColor = 'var(--earth-400)'}
                    onBlur={e  => e.target.style.borderColor = 'var(--border)'}/>
                </div>
                <div style={{ padding: '10px 12px', background: 'var(--earth-50)', border: '1px solid var(--earth-100)', borderRadius: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--earth-700)', fontFamily: 'var(--font-m)' }}>
                    Save in Account Info section to apply changes.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-m)', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--sand-400)', marginBottom: 3 }}>Farm Location</div>
                  <div style={{ fontSize: 13, color: 'var(--sand-800)' }}>
                    {user?.farmLocation
                      ? <span>📍 {user.farmLocation}</span>
                      : <span style={{ fontStyle: 'italic', color: 'var(--sand-400)' }}>Not specified</span>
                    }
                  </div>
                </div>
                <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-m)', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--sand-400)', marginBottom: 3 }}>Farm Size</div>
                  <div style={{ fontSize: 13, color: 'var(--sand-800)' }}>
                    {user?.farmSize
                      ? <span>🗺️ {user.farmSize}</span>
                      : <span style={{ fontStyle: 'italic', color: 'var(--sand-400)' }}>Not specified</span>
                    }
                  </div>
                </div>
                <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-m)', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--sand-400)', marginBottom: 3 }}>Assigned Barangay</div>
                  <div style={{ fontSize: 13, color: 'var(--sand-800)' }}>📍 {user?.barangay || '—'}</div>
                </div>
                <div style={{
                  padding: '12px 14px', background: 'var(--earth-50)', border: '1px solid var(--earth-100)',
                  borderRadius: 6, display: 'flex', gap: 10, alignItems: 'center',
                }}>
                  <span style={{ fontSize: 18 }}>🌾</span>
                  <div style={{ fontSize: 11, color: 'var(--earth-700)', lineHeight: 1.5 }}>
                    Keep your farm location up to date so admins can manage land records per barangay.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: '3px solid var(--terra-400)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            padding: '14px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)',
            fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 14,
          }}>
            Change Password
          </div>
          <div style={{ padding: '18px 20px' }}>
            {pwErr && (
              <div style={{
                background: 'var(--terra-100)', borderLeft: '3px solid var(--terra-400)', padding: '9px 12px',
                fontSize: 12, color: 'var(--terra-700)', marginBottom: 14, borderRadius: '0 4px 4px 0',
              }}>{pwErr}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['Current Password', 'current'], ['New Password', 'next'], ['Confirm New Password', 'confirm']].map(([label, key]) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <input type="password" placeholder="••••••••" style={iStyle} value={pwForm[key]} onChange={setPw(key)}
                    onFocus={e => e.target.style.borderColor = 'var(--terra-400)'}
                    onBlur={e  => e.target.style.borderColor = 'var(--border)'}/>
                </div>
              ))}
              <Btn variant="primary" onClick={savePassword} icon="🔒">Update Password</Btn>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}