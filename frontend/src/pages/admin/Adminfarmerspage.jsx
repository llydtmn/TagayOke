import { useState, useMemo } from 'react';
import {
  StatCard, TableShell, Table, TR, TD,
  Btn, IconBtn, Modal,
  ConfirmDialog, Badge, useToast, EmptyState,
} from '../../components/UIComponents';
import { BARANGAYS } from '../../data/constants';
import { emojiFor, fmtShort, classify } from '../../utils/helpers';

function buildFarmerRows(users, crops) {
  return users
    .filter(u => {
      if (u.role === 'admin') return false;
      // Exclude pure signup-only accounts (email+password login users with no crop/farm data)
      // A farmer belongs in this list only if they:
      //   1. Have crop entries linked by their user ID (registered via Add Entry), OR
      //   2. Have contact info filled (added via Add Farmer modal), OR
      //   3. Have farm location info (added via Add Entry or admin modal)
      const hasCrops    = crops.some(c => c.farmerId === u.id);
      const hasContact  = !!(u.contact && u.contact.trim());
      const hasFarmInfo = !!(u.farmLocation && u.farmLocation.trim());
      return hasCrops || hasContact || hasFarmInfo;
    })
    .map(u => {
      // Match by farmerId only — NOT by name — to avoid false matches with seed data
      const farmerCrops = crops.filter(c => c.farmerId === u.id);
      const harvested   = farmerCrops.filter(c => c.status === 'harvested').length;
      const overdue     = farmerCrops.filter(c => classify(c) === 'overdue').length;
      const lastCrop    = farmerCrops[0];
      const cropTypes   = [...new Set(farmerCrops.map(c => c.crop))];
      return {
        ...u,
        totalCrops: farmerCrops.length,
        harvested,
        overdue,
        cropTypes,
        lastCrop: lastCrop?.planted || null,
        barangay: u.barangay || '—',
        farmLocation: u.farmLocation || null,
        farmSize: u.farmSize || null,
        contact: u.contact || null,
      };
    });
}

export default function AdminFarmersPage({ users, crops, onAddUser, onDeleteUser }) {
  const [search,  setSearch]  = useState('');
  const [bgyF,    setBgyF]    = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [detail,  setDetail]  = useState(null);
  const [del,        setDel]       = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const toast = useToast();

  const farmers  = useMemo(() => buildFarmerRows(users, crops), [users, crops]);
  const filtered = useMemo(() => farmers.filter(f => {
    const q = search.toLowerCase();
    if (q && !f.name.toLowerCase().includes(q) &&
        !(f.email || '').toLowerCase().includes(q) &&
        !f.barangay.toLowerCase().includes(q) &&
        !(f.contact || '').toLowerCase().includes(q)) return false;
    if (bgyF !== 'All' && f.barangay !== bgyF) return false;
    return true;
  }), [farmers, search, bgyF]);

  const allBgys = [...new Set(farmers.map(f => f.barangay).filter(b => b && b !== '—'))].sort();
  const stats = {
    total:   farmers.length,
    active:  farmers.filter(f => f.totalCrops > 0).length,
    harvest: farmers.reduce((a, f) => a + f.harvested, 0),
  };

  const handleDelete = () => {
    onDeleteUser(del.id);
    toast({ title: 'Farmer removed', sub: del.name, type: 'success' });
    setDel(null);
    setDetail(null);
  };

  const selStyle = {
    padding: '7px 12px', border: '1px solid var(--border)',
    background: 'var(--sand-50)', fontSize: 12, fontFamily: 'var(--font-m)',
    color: 'var(--sand-700)', borderRadius: 3, cursor: 'pointer', outline: 'none',
  };

  return (
    <div style={{ animation: 'slideUp .35s both' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard icon="👨‍🌾" num={stats.total}   label="Total Farmers"       color="var(--forest-400)" i={0}/>
        <StatCard icon="🌱"   num={stats.active}  label="Active (with crops)"  color="var(--earth-400)"  i={1}/>
        <StatCard icon="🌾"   num={stats.harvest} label="Total Harvests"       color="var(--amber-500)"  i={2}/>
      </div>

      {/* Filter bar */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px 16px',
        marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', borderRadius: 4,
      }}>
        <input
          placeholder="🔍  Search name, contact or barangay…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: '7px 12px', border: '1px solid var(--border)',
            background: 'var(--sand-50)', fontSize: 13, fontFamily: 'var(--font-b)', borderRadius: 3, outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--forest-400)'}
          onBlur={e  => e.target.style.borderColor = 'var(--border)'}
        />
        <select value={bgyF} onChange={e => setBgyF(e.target.value)} style={selStyle}>
          <option value="All">All Barangays</option>
          {allBgys.map(b => <option key={b}>{b}</option>)}
        </select>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-m)', color: 'var(--sand-500)' }}>
          {filtered.length} farmer{filtered.length !== 1 ? 's' : ''}
        </span>
        <div style={{ marginLeft: 'auto' }}>
          <Btn variant="primary" icon="➕" onClick={() => setShowAdd(true)}>Add Farmer</Btn>
        </div>
      </div>

      <TableShell title="Farmers List" subtitle="All registered farmers and their farm details" accentColor="var(--forest-400)">
        <Table headers={['', 'Farmer', 'Contact', 'Barangay', 'Farm Info', 'Crop Types', 'Total', 'Actions']} minWidth={900}>
          {filtered.length === 0
            ? <tr><td colSpan={8}><EmptyState icon="👨‍🌾" text="No farmers found. Add crop entries to populate this list."/></td></tr>
            : filtered.map((f, i) => {
              const isExpanded = expandedId === f.id;
              return (
                <>
                  <TR key={f.id} i={i}>
                    {/* Expand toggle */}
                    <TD>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : f.id)}
                        title={isExpanded ? 'Hide details' : 'Show details'}
                        style={{
                          width: 22, height: 22, border: '1px solid var(--border)',
                          borderRadius: 4, background: isExpanded ? 'var(--forest-50)' : '#fff',
                          cursor: 'pointer', fontSize: 10, color: 'var(--text-3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all .15s',
                        }}
                      >{isExpanded ? '▲' : '▼'}</button>
                    </TD>
                    <TD>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--forest-400), var(--earth-400))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0,
                        }}>{f.avatar || (f.name?.[0]?.toUpperCase() ?? '?')}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{f.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--font-m)' }}>
                            {f.role || 'farmer'}
                          </div>
                        </div>
                      </div>
                    </TD>
                    <TD muted>
                      {f.contact
                        ? <span style={{ fontSize: 12 }}>📞 {f.contact}</span>
                        : <span style={{ fontSize: 11, color: 'var(--text-4)', fontStyle: 'italic' }}>—</span>
                      }
                    </TD>
                    <TD muted>{f.barangay}</TD>
                    <TD>
                      {f.farmLocation
                        ? <span style={{ fontSize: 12, color: 'var(--text-2)' }}>📍 {f.farmLocation}</span>
                        : <span style={{ fontSize: 11, color: 'var(--text-4)', fontStyle: 'italic' }}>Not specified</span>
                      }
                      {f.farmSize && (
                        <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-m)', marginTop: 2 }}>
                          🌾 {f.farmSize}
                        </div>
                      )}
                    </TD>
                    <TD>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {f.cropTypes.length === 0
                          ? <span style={{ fontSize: 11, color: 'var(--text-4)' }}>—</span>
                          : f.cropTypes.slice(0, 3).map(c => (
                            <span key={c} style={{
                              fontSize: 11, padding: '2px 7px', borderRadius: 100,
                              background: 'var(--forest-50)', color: 'var(--forest-600)',
                              border: '1px solid var(--forest-100)', whiteSpace: 'nowrap',
                            }}>{emojiFor(c)} {c}</span>
                          ))
                        }
                        {f.cropTypes.length > 3 && <span style={{ fontSize: 11, color: 'var(--text-4)' }}>+{f.cropTypes.length - 3}</span>}
                      </div>
                    </TD>
                    <TD mono bold>{f.totalCrops}</TD>
                    <TD>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <IconBtn icon="👁" title="View full details" onClick={() => setDetail(f)}/>
                        <IconBtn icon="🗑" title="Delete farmer" danger onClick={() => setDel(f)}/>
                      </div>
                    </TD>
                  </TR>

                  {/* ── Inline farmer info panel ── */}
                  {isExpanded && (
                    <tr key={f.id + '-info'}>
                      <td colSpan={8} style={{ padding: 0, borderBottom: '2px solid var(--forest-100)' }}>
                        <div style={{
                          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0,
                          background: 'linear-gradient(to bottom, var(--forest-50), #fff)',
                          padding: '18px 24px', borderLeft: '3px solid var(--forest-400)',
                          animation: 'slideUp .2s both',
                        }}>
                          {[
                            { icon: '👤', label: 'Full Name',     value: f.name },
                            { icon: '📞', label: 'Contact No.',   value: f.contact || 'Not provided' },
                            { icon: '📍', label: 'Barangay',      value: f.barangay },
                            { icon: '🗺️',  label: 'Farm Location', value: f.farmLocation || 'Not specified' },
                            { icon: '📐', label: 'Farm Size',     value: f.farmSize || 'Not specified' },
                            { icon: '🌱', label: 'Total Entries', value: `${f.totalCrops} crop${f.totalCrops !== 1 ? 's' : ''}` },
                            { icon: '✅', label: 'Harvested',     value: `${f.harvested} time${f.harvested !== 1 ? 's' : ''}` },
                            { icon: '🏷️',  label: 'Role',         value: f.role || 'farmer' },
                          ].map(item => (
                            <div key={item.label} style={{
                              padding: '10px 16px',
                              borderRight: '1px solid var(--border)',
                              borderBottom: '1px solid var(--border)',
                            }}>
                              <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-m)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
                                {item.icon} {item.label}
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: item.value === 'Not provided' || item.value === 'Not specified' ? 'var(--text-4)' : 'var(--text-1)' }}>
                                {item.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })
          }
        </Table>
      </TableShell>

      {showAdd && <AddFarmerModal onClose={() => setShowAdd(false)} onAdd={onAddUser} toast={toast}/>}
      {detail && (
        <FarmerDetailModal
          farmer={detail}
          crops={crops.filter(c => c.farmerId === detail.id || c.farmer === detail.name)}
          onClose={() => setDetail(null)}
          onDelete={() => setDel(detail)}
        />
      )}
      {del && (
        <ConfirmDialog
          title="Remove Farmer"
          desc={`Remove "${del.name}"? Their crop entries will remain but they will be removed from the list.`}
          onConfirm={handleDelete}
          onCancel={() => setDel(null)}
        />
      )}
    </div>
  );
}

/* ── Add Farmer Modal — no password, just contact info ── */
function AddFarmerModal({ onClose, onAdd, toast }) {
  const [form, setForm] = useState({
    name: '', contact: '', barangay: '',
    farmLocation: '', farmSize: '', role: 'farmer',
  });
  const [errors, setErrors] = useState({});
  const set = k => e => { setForm(p => ({ ...p, [k]: e.target.value })); setErrors(p => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Full name is required.';
    if (!form.contact.trim()) e.contact = 'Contact number is required.';
    if (!form.barangay)       e.barangay = 'Please select a barangay.';
    if (!form.farmLocation.trim()) e.farmLocation = 'Farm location is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    onAdd({ ...form, avatar: form.name.trim()[0].toUpperCase() });
    toast({ title: 'Farmer added', sub: form.name, type: 'success' });
    onClose();
  };

  const iStyle = k => ({
    width: '100%', padding: '9px 12px',
    border: `1.5px solid ${errors[k] ? 'var(--red-400)' : 'var(--border)'}`,
    borderRadius: 7, fontSize: 13, fontFamily: 'var(--font-b)', color: 'var(--text-1)',
    background: '#fff', outline: 'none', transition: 'border-color .15s',
  });
  const FLabel = ({ children }) => (
    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 5 }}>{children}</div>
  );
  const FErr = ({ k }) => errors[k]
    ? <p style={{ fontSize: 11, color: 'var(--red-500)', marginTop: 4, fontFamily: 'var(--font-m)' }}>{errors[k]}</p>
    : null;

  return (
    <Modal title="Add New Farmer" onClose={onClose} maxWidth={500}>
      <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          {/* Full Name */}
          <div style={{ gridColumn: 'span 2' }}>
            <FLabel>Full Name *</FLabel>
            <input style={iStyle('name')} value={form.name} onChange={set('name')} placeholder="Juan dela Cruz"
              onFocus={e => { if (!errors.name) e.target.style.borderColor = 'var(--forest-400)'; }}
              onBlur={e  => { if (!errors.name) e.target.style.borderColor = 'var(--border)'; }}/>
            <FErr k="name"/>
          </div>

          {/* Contact */}
          <div>
            <FLabel>Contact Number *</FLabel>
            <input style={iStyle('contact')} value={form.contact} onChange={set('contact')} placeholder="09XX XXX XXXX"
              onFocus={e => { if (!errors.contact) e.target.style.borderColor = 'var(--forest-400)'; }}
              onBlur={e  => { if (!errors.contact) e.target.style.borderColor = 'var(--border)'; }}/>
            <FErr k="contact"/>
          </div>

          {/* Barangay */}
          <div>
            <FLabel>Barangay *</FLabel>
            <select style={{ ...iStyle('barangay'), cursor: 'pointer' }} value={form.barangay} onChange={set('barangay')}>
              <option value="">Select barangay…</option>
              {BARANGAYS.map(b => <option key={b}>{b}</option>)}
            </select>
            <FErr k="barangay"/>
          </div>

          {/* Farm Location */}
          <div style={{ gridColumn: 'span 2' }}>
            <FLabel>Farm Land Location *</FLabel>
            <input style={iStyle('farmLocation')} value={form.farmLocation} onChange={set('farmLocation')}
              placeholder="e.g. Sitio Mapalad, near the creek"
              onFocus={e => { if (!errors.farmLocation) e.target.style.borderColor = 'var(--forest-400)'; }}
              onBlur={e  => { if (!errors.farmLocation) e.target.style.borderColor = 'var(--border)'; }}/>
            <FErr k="farmLocation"/>
          </div>

          {/* Farm Size */}
          <div style={{ gridColumn: 'span 2' }}>
            <FLabel>Farm Size <span style={{ fontWeight: 400, color: 'var(--text-4)', fontSize: 11 }}>(optional)</span></FLabel>
            <input style={iStyle('farmSize')} value={form.farmSize} onChange={set('farmSize')} placeholder="e.g. 1.5 hectares"
              onFocus={e => e.target.style.borderColor = 'var(--forest-400)'}
              onBlur={e  => e.target.style.borderColor = 'var(--border)'}/>
          </div>

          {/* Role */}
          <div style={{ gridColumn: 'span 2' }}>
            <FLabel>Role *</FLabel>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ k: 'farmer', label: 'Farmer' }, { k: 'farm-manager', label: 'Farm Manager' }].map(r => (
                <label key={r.k} style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                  border: `1.5px solid ${form.role === r.k ? 'var(--forest-400)' : 'var(--border)'}`,
                  borderRadius: 7, cursor: 'pointer',
                  background: form.role === r.k ? 'var(--forest-50)' : '#fff',
                }}>
                  <input type="radio" name="role" value={r.k} checked={form.role === r.k}
                    onChange={() => setForm(p => ({ ...p, role: r.k }))}
                    style={{ accentColor: 'var(--forest-500)' }}/>
                  <span style={{ fontSize: 13, fontWeight: 500, color: form.role === r.k ? 'var(--forest-600)' : 'var(--text-2)' }}>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '16px 24px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)' }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save}>Add Farmer</Btn>
      </div>
    </Modal>
  );
}

/* ── Farmer Detail Modal ── */
function FarmerDetailModal({ farmer, crops, onClose, onDelete }) {
  const [tab, setTab] = useState('overview');

  return (
    <Modal title={`${farmer.name}`} onClose={onClose} maxWidth={600}>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
        {[{ k: 'overview', label: 'Overview' }, { k: 'farms', label: `Farm Records (${crops.length})` }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{
            padding: '10px 18px', border: 'none', borderBottom: `2px solid ${tab === t.k ? 'var(--forest-400)' : 'transparent'}`,
            background: 'none', fontSize: 13, fontFamily: 'var(--font-b)',
            fontWeight: tab === t.k ? 600 : 400,
            color: tab === t.k ? 'var(--forest-600)' : 'var(--text-3)',
            cursor: 'pointer', marginBottom: -1, transition: 'all .15s',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: '20px 24px', overflowY: 'auto', minHeight: 300 }}>
        {tab === 'overview' ? (
          <>
            {/* Profile hero */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
              background: 'var(--forest-50)', border: '1px solid var(--forest-100)',
              borderRadius: 10, marginBottom: 20,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--forest-400), var(--earth-400))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 20, flexShrink: 0,
              }}>{farmer.avatar || farmer.name?.[0]?.toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 17, color: 'var(--text-1)' }}>{farmer.name}</div>
                {farmer.contact && (
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>📞 {farmer.contact}</div>
                )}
                <div style={{ fontSize: 11, color: 'var(--forest-600)', fontFamily: 'var(--font-m)', marginTop: 4 }}>
                  📍 {farmer.barangay}
                </div>
              </div>
            </div>

            {/* Farm land details */}
            <div style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderLeft: '3px solid var(--earth-400)', borderRadius: '0 8px 8px 0',
              padding: '14px 18px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-m)', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: 10 }}>
                Farm Land Info
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-m)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Location</div>
                  <div style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500 }}>
                    {farmer.farmLocation || <span style={{ color: 'var(--text-4)', fontStyle: 'italic' }}>Not specified</span>}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-m)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Farm Size</div>
                  <div style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500 }}>
                    {farmer.farmSize || <span style={{ color: 'var(--text-4)', fontStyle: 'italic' }}>Not specified</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Total Crops', value: farmer.totalCrops,        icon: '🌱', color: 'var(--forest-400)' },
                { label: 'Harvested',   value: farmer.harvested,          icon: '✅', color: 'var(--amber-500)' },
                { label: 'Crop Types',  value: farmer.cropTypes.length,   icon: '📊', color: 'var(--earth-400)' },
              ].map(s => (
                <div key={s.label} style={{
                  padding: '12px 14px', background: '#fff', border: '1px solid var(--border)',
                  borderTop: `3px solid ${s.color}`, borderRadius: 8, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 800, color: 'var(--text-1)' }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Farm Records Tab */
          <div>
            {crops.length === 0
              ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-4)' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>🌾</div>
                  <div style={{ fontSize: 13 }}>No crop entries yet for this farmer.</div>
                </div>
              )
              : crops.map((c, i) => {
                  const st = classify(c);
                  return (
                    <div key={c.id} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                      background: i % 2 === 0 ? 'var(--surface-2)' : '#fff',
                      border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8,
                      animation: `slideUp .2s ${i * .03}s both`,
                    }}>
                      <div style={{
                        width: 40, height: 40, background: 'var(--forest-50)', borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
                      }}>{emojiFor(c.crop)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{c.crop}</div>
                        <div style={{ fontSize: 11, fontFamily: 'var(--font-m)', color: 'var(--text-3)', marginTop: 2 }}>
                          📍 {c.barangay} · 🌱 {fmtShort(c.planted)} → 🌾 {fmtShort(c.expectedHarvest)}
                        </div>
                        {c.notes && (
                          <div style={{ fontSize: 11, color: 'var(--text-4)', fontStyle: 'italic', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.notes}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <Badge status={st}/>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-m)', color: 'var(--text-4)' }}>{c.id}</span>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, padding: '14px 24px', justifyContent: 'space-between', borderTop: '1px solid var(--border)' }}>
        <Btn variant="danger" icon="🗑" onClick={onDelete}>Remove Farmer</Btn>
        <Btn variant="secondary" onClick={onClose}>Close</Btn>
      </div>
    </Modal>
  );
}