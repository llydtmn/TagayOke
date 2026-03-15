import { useState } from 'react';
import { Modal, ConfirmDialog, Btn, IconBtn, useToast, Card, TableShell, Table, TR, TD } from '../../components/UIComponents';
import { BARANGAYS } from '../../data/constants';

const ALLOWED_ROLES = [
  { value: 'admin',        label: 'Admin',        desc: 'Full system access — City Agriculture Office staff' },
  { value: 'farm-manager', label: 'Farm Manager', desc: 'Manages crop logs for assigned barangay' },
];

const ROLE_COLOR = {
  admin:          { bg: 'var(--forest-50)',  border: 'var(--forest-200)', text: 'var(--forest-600)', dot: 'var(--forest-400)' },
  'farm-manager': { bg: 'var(--earth-50)',   border: 'var(--earth-200)',  text: 'var(--earth-600)',  dot: 'var(--earth-400)' },
};

export default function AdminUsersPage({ users, onAddUser, onDeleteUser }) {
  const [showForm, setShowForm] = useState(false);
  const [del,      setDel]      = useState(null);
  const [form,     setForm]     = useState({ name: '', email: '', password: '', role: 'farm-manager', barangay: '' });
  const [errors,   setErrors]   = useState({});
  const toast = useToast();

  const setF = k => e => { setForm(p => ({ ...p, [k]: e.target.value })); setErrors(p => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name     = 'Full name is required.';
    if (!form.email.trim())   e.email    = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.password)       e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'At least 6 characters.';
    if (form.role === 'farm-manager' && !form.barangay) e.barangay = 'Barangay is required for Farm Manager.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    onAddUser({ ...form, avatar: form.name.trim()[0].toUpperCase() });
    toast({ title: 'User created', sub: form.name, type: 'success' });
    setForm({ name: '', email: '', password: '', role: 'farm-manager', barangay: '' });
    setErrors({});
    setShowForm(false);
  };

  const confirmDel = () => {
    onDeleteUser(del.id);
    toast({ title: 'User deleted', sub: del.name, type: 'success' });
    setDel(null);
  };

  const iStyle = (k) => ({
    width: '100%', padding: '9px 12px',
    border: `1.5px solid ${errors[k] ? 'var(--red-400)' : 'var(--border)'}`,
    borderRadius: 7, fontSize: 13, fontFamily: 'var(--font-b)', color: 'var(--text-1)',
    background: '#fff', outline: 'none', transition: 'border-color .15s',
  });

  const FLabel = ({ children }) => (
    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>{children}</div>
  );
  const FErr = ({ k }) => errors[k]
    ? <p style={{ fontSize: 11, color: 'var(--red-500)', marginTop: 4, fontFamily: 'var(--font-m)' }}>{errors[k]}</p>
    : null;

  const admins   = users.filter(u => u.role === 'admin');
  const managers = users.filter(u => u.role !== 'admin');

  return (
    <div style={{ animation: 'slideUp .35s both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>User Management</h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{users.length} total users across {ALLOWED_ROLES.length} roles</p>
        </div>
        <Btn variant="primary" icon="➕" onClick={() => setShowForm(true)}>Add User</Btn>
      </div>

      {/* Admins */}
      {admins.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-m)', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', marginBottom: 10 }}>
            Administrators ({admins.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
            {admins.map((u, i) => <UserCard key={u.id} user={u} i={i}/>)}
          </div>
        </div>
      )}

      {/* Farm Managers */}
      <div>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-m)', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', marginBottom: 10 }}>
          Farm Managers ({managers.length})
        </div>
        {managers.length === 0
          ? (
            <div style={{
              padding: '40px', textAlign: 'center', background: '#fff',
              border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-3)', fontSize: 14,
            }}>
              No farm managers yet. Click "Add User" to create one.
            </div>
          )
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
              {managers.map((u, i) => (
                <UserCard key={u.id} user={u} i={i} onDelete={() => setDel(u)}/>
              ))}
            </div>
          )
        }
      </div>

      {/* Add User Modal */}
      {showForm && (
        <Modal title="Add New User" onClose={() => { setShowForm(false); setErrors({}); }} maxWidth={480}>
          <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Role selector */}
            <div>
              <FLabel>Role *</FLabel>
              <div style={{ display: 'flex', gap: 10 }}>
                {ALLOWED_ROLES.map(r => (
                  <label key={r.value} style={{
                    flex: 1, padding: '12px 14px', cursor: 'pointer',
                    border: `1.5px solid ${form.role === r.value ? 'var(--forest-400)' : 'var(--border)'}`,
                    borderRadius: 8,
                    background: form.role === r.value ? 'var(--forest-50)' : '#fff',
                    transition: 'all .15s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <input type="radio" name="role" value={r.value} checked={form.role === r.value}
                        onChange={() => setForm(p => ({ ...p, role: r.value }))}
                        style={{ accentColor: 'var(--forest-500)', flexShrink: 0 }}/>
                      <span style={{ fontSize: 13, fontWeight: 600, color: form.role === r.value ? 'var(--forest-600)' : 'var(--text-1)' }}>
                        {r.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4, paddingLeft: 20 }}>{r.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* Form grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <FLabel>Full Name *</FLabel>
                <input style={iStyle('name')} placeholder="Juan dela Cruz" value={form.name} onChange={setF('name')}
                  onFocus={e => { if (!errors.name) e.target.style.borderColor = 'var(--forest-400)'; }}
                  onBlur={e  => { if (!errors.name) e.target.style.borderColor = 'var(--border)'; }}/>
                <FErr k="name"/>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <FLabel>Email Address *</FLabel>
                <input type="email" style={iStyle('email')} placeholder="user@example.com" value={form.email} onChange={setF('email')}
                  onFocus={e => { if (!errors.email) e.target.style.borderColor = 'var(--forest-400)'; }}
                  onBlur={e  => { if (!errors.email) e.target.style.borderColor = 'var(--border)'; }}/>
                <FErr k="email"/>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <FLabel>Password *</FLabel>
                <input type="password" style={iStyle('password')} placeholder="Min. 6 characters" value={form.password} onChange={setF('password')}
                  onFocus={e => { if (!errors.password) e.target.style.borderColor = 'var(--forest-400)'; }}
                  onBlur={e  => { if (!errors.password) e.target.style.borderColor = 'var(--border)'; }}/>
                <FErr k="password"/>
              </div>
              {form.role === 'farm-manager' && (
                <div style={{ gridColumn: 'span 2' }}>
                  <FLabel>Assigned Barangay *</FLabel>
                  <select style={{ ...iStyle('barangay'), cursor: 'pointer' }} value={form.barangay} onChange={setF('barangay')}>
                    <option value="">Select barangay…</option>
                    {BARANGAYS.map(b => <option key={b}>{b}</option>)}
                  </select>
                  <FErr k="barangay"/>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, padding: '16px 24px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)' }}>
            <Btn variant="secondary" onClick={() => { setShowForm(false); setErrors({}); }}>Cancel</Btn>
            <Btn variant="primary" onClick={save}>Create User</Btn>
          </div>
        </Modal>
      )}

      {del && (
        <ConfirmDialog
          title="Delete User"
          desc={`Remove "${del.name}"? They will immediately lose system access.`}
          onConfirm={confirmDel}
          onCancel={() => setDel(null)}
        />
      )}
    </div>
  );
}

function UserCard({ user, i, onDelete }) {
  const colors = ROLE_COLOR[user.role] || ROLE_COLOR['farm-manager'];
  const roleLabel = user.role === 'admin' ? 'Administrator' : user.role === 'farm-manager' ? 'Farm Manager' : user.role;
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderTop: `3px solid ${colors.dot}`, borderRadius: 10,
      padding: '18px 20px', animation: `scaleIn .35s ${i * .05}s both`,
      transition: 'box-shadow .2s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: '50%',
          background: `linear-gradient(135deg, ${colors.dot}, ${colors.text})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0,
        }}>{user.avatar}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{user.email}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 100, width: 'fit-content',
          background: colors.bg, border: `1px solid ${colors.border}`,
          fontSize: 11, color: colors.text, fontWeight: 500,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.dot }}/>
          {roleLabel}
        </span>
        {user.barangay && (
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-m)' }}>📍 {user.barangay}</div>
        )}
        <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--font-m)' }}>🪪 {user.id}</div>
      </div>
      {onDelete && (
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <Btn small variant="danger" icon="🗑" onClick={onDelete}>Remove</Btn>
        </div>
      )}
    </div>
  );
}