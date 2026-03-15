import { useState } from 'react';
import { Btn, useToast } from '../../components/UIComponents';
import { CROPS } from '../../data/constants';
import { emojiFor } from '../../utils/helpers';

export default function UserAddEntryPage({ user, onAdd, onNav }) {
  const [form, setForm] = useState({
    crop: '',
    farmer: user.name,
    barangay: user.barangay,
    planted: '',
    expectedHarvest: '',
    notes: '',
  });
  const [success, setSuccess] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const toast = useToast();

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const iStyle = {
    width: '100%', padding: '10px 13px',
    border: '1.5px solid var(--border)', borderRadius: 8,
    fontSize: 13, fontFamily: 'var(--font-b)', color: 'var(--text-1)',
    background: '#fff', outline: 'none', transition: 'border-color .15s',
  };

  const Label = ({ children, required }) => (
    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
      {children}{required && <span style={{ color: 'var(--red-500)', marginLeft: 2 }}>*</span>}
    </div>
  );

  const save = async () => {
    if (!form.crop || !form.farmer || !form.planted || !form.expectedHarvest) {
      toast({ title: 'Please fill all required fields', type: 'error' }); return;
    }
    if (new Date(form.expectedHarvest) <= new Date(form.planted)) {
      toast({ title: 'Harvest date must be after planting date', type: 'error' }); return;
    }
    setSaving(true);
    try {
      const id = await onAdd({ ...form });
      setSuccess(id);
      toast({ title: 'Crop entry saved!', sub: `${form.crop} — ${id}`, type: 'success' });
    } catch (err) {
      toast({ title: 'Failed to save entry', sub: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (success) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: 'calc(100vh - var(--topbar-h) - 48px)',
      animation: 'slideUp .4s both',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480, padding: '40px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--forest-50), var(--forest-100))',
          border: '2px solid var(--forest-200)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, margin: '0 auto 24px',
          boxShadow: '0 8px 24px rgba(53,122,53,.15)',
        }}>✅</div>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 26, fontWeight: 800, marginBottom: 8, color: 'var(--text-1)' }}>Entry Saved!</h2>
        <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 6 }}>
          Record ID: <span style={{ fontFamily: 'var(--font-m)', color: 'var(--forest-600)', fontWeight: 600 }}>{success}</span>
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 36 }}>
          {form.crop} has been logged for Brgy. {form.barangay}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Btn variant="secondary" onClick={() => {
            setSuccess(null);
            setForm({ crop: '', farmer: user.name, barangay: user.barangay, planted: '', expectedHarvest: '', notes: '' });
          }}>
            Add Another
          </Btn>
          <Btn variant="primary" onClick={() => onNav('user-croplog')}>View My Log →</Btn>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'slideUp .35s both', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page header */}
      <div style={{
        background: 'var(--sand-900)', borderRadius: 6, padding: '20px 26px',
        position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 50%,rgba(45,155,144,.2),transparent 55%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>New Crop Entry</h2>
          <p style={{ fontSize: 12, color: 'var(--sand-400)', marginTop: 3 }}>
            Logging for <strong style={{ color: 'var(--teal-300)' }}>Brgy. {user.barangay}</strong>
          </p>
        </div>
        <div style={{ position: 'relative', zIndex: 1, fontSize: 32 }}>🌱</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* Left column — main form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Crop picker */}
          <div style={{
            background: '#fff', border: '1px solid var(--border)',
            borderTop: '3px solid var(--forest-400)', borderRadius: 4, overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)',
              fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 14, color: 'var(--text-1)',
            }}>
              Select Crop Type *
              {form.crop && (
                <span style={{
                  marginLeft: 10, fontSize: 12, fontFamily: 'var(--font-b)', fontWeight: 400,
                  color: 'var(--forest-600)',
                }}>
                  ✓ {emojiFor(form.crop)} {form.crop} selected
                </span>
              )}
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(88px,1fr))', gap: 8 }}>
                {CROPS.map(c => {
                  const selected = form.crop === c;
                  return (
                    <div
                      key={c}
                      onClick={() => setForm(p => ({ ...p, crop: c }))}
                      style={{
                        padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                        border: `2px solid ${selected ? 'var(--forest-400)' : 'var(--border)'}`,
                        background: selected ? 'var(--forest-50)' : '#fff',
                        borderRadius: 9, transition: 'all .15s',
                        boxShadow: selected ? '0 2px 8px rgba(53,122,53,.15)' : 'none',
                      }}
                      onMouseEnter={e => { if (!selected) { e.currentTarget.style.border = '2px solid var(--forest-200)'; e.currentTarget.style.background = 'var(--forest-50)'; }}}
                      onMouseLeave={e => { if (!selected) { e.currentTarget.style.border = '2px solid var(--border)'; e.currentTarget.style.background = '#fff'; }}}
                    >
                      <div style={{ fontSize: 28, marginBottom: 6 }}>{emojiFor(c)}</div>
                      <div style={{ fontSize: 11, fontWeight: 500, color: selected ? 'var(--forest-600)' : 'var(--text-2)' }}>{c}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Entry Details */}
          <div style={{
            background: '#fff', border: '1px solid var(--border)',
            borderTop: '3px solid var(--earth-400)', borderRadius: 4, overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)',
              fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 14, color: 'var(--text-1)',
            }}>
              Entry Details
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Farmer name */}
              <div>
                <Label required>Farmer Name</Label>
                <input style={iStyle} value={form.farmer} onChange={set('farmer')}
                  onFocus={e => e.target.style.borderColor = 'var(--forest-400)'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'}/>
              </div>

              {/* Barangay — read-only */}
              <div>
                <Label>Barangay (Auto-linked)</Label>
                <div style={{
                  padding: '10px 13px', border: '1.5px solid var(--border)', borderRadius: 8,
                  fontSize: 13, fontFamily: 'var(--font-b)', color: 'var(--text-3)',
                  background: 'var(--slate-50)', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span>📍</span>
                  <span style={{ fontWeight: 500, color: 'var(--text-2)' }}>{user.barangay}</span>
                </div>
              </div>

              {/* Planted */}
              <div>
                <Label required>Date Planted</Label>
                <input type="date" style={iStyle} value={form.planted} onChange={set('planted')}
                  onFocus={e => e.target.style.borderColor = 'var(--forest-400)'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'}/>
              </div>

              {/* Expected harvest */}
              <div>
                <Label required>Expected Harvest Date</Label>
                <input type="date" style={iStyle} value={form.expectedHarvest} onChange={set('expectedHarvest')}
                  onFocus={e => e.target.style.borderColor = 'var(--forest-400)'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'}/>
              </div>

              {/* Notes */}
              <div style={{ gridColumn: 'span 2' }}>
                <Label>Notes (optional)</Label>
                <textarea
                  style={{ ...iStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.6 }}
                  value={form.notes}
                  onChange={set('notes')}
                  placeholder="Variety, methods, field observations…"
                  onFocus={e => e.target.style.borderColor = 'var(--forest-400)'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'}/>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" onClick={() => onNav('user-croplog')}>Cancel</Btn>
            <Btn variant="primary" icon="💾" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save Entry'}
            </Btn>
          </div>
        </div>

        {/* Right sidebar — tips & summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Selected crop preview */}
          <div style={{
            background: '#fff', border: '1px solid var(--border)',
            borderTop: '3px solid var(--teal-400)',
            borderRadius: 4, padding: '18px 20px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Selected Crop
            </div>
            {form.crop ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ fontSize: 56, marginBottom: 10 }}>{emojiFor(form.crop)}</div>
                <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 20, color: 'var(--text-1)' }}>{form.crop}</div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--font-m)', marginTop: 4 }}>Ready to log</div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-4)' }}>
                <div style={{ fontSize: 36, marginBottom: 8, opacity: .3 }}>🌱</div>
                <div style={{ fontSize: 12 }}>No crop selected yet</div>
              </div>
            )}
          </div>

          {/* Form summary */}
          <div style={{
            background: '#fff', border: '1px solid var(--border)',
            borderRadius: 4, padding: '18px 20px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Entry Summary
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Farmer',   value: form.farmer || '—',           icon: '👤' },
                { label: 'Barangay', value: user.barangay,                icon: '📍' },
                { label: 'Planted',  value: form.planted || '—',          icon: '🌱' },
                { label: 'Harvest',  value: form.expectedHarvest || '—',  icon: '🌾' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-m)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick tips */}
          <div style={{
            background: 'var(--forest-50)', border: '1px solid var(--forest-100)',
            borderLeft: '3px solid var(--forest-400)',
            borderRadius: '0 4px 4px 0', padding: '16px 18px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--forest-700)', marginBottom: 10 }}>💡 Quick Tips</div>
            {[
              'Select the correct crop type first.',
              'Harvest date must be after planting date.',
              'Add notes for variety, method, or observations.',
            ].map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 11, color: 'var(--forest-600)', lineHeight: 1.5 }}>
                <span style={{ flexShrink: 0 }}>•</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}