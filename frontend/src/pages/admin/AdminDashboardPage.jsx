import { useMemo, useState } from 'react';
import { StatCard, TableShell, Table, TR, TD, PBar, Btn, Badge, Modal, Card } from '../../components/UIComponents';
import { classify, emojiFor, fmtShort } from '../../utils/helpers';

export default function AdminDashboardPage({ crops, users, onNav }) {
  const [bgyDetail, setBgyDetail] = useState(null);

  const stats = useMemo(() => ({
    total:     crops.length,
    growing:   crops.filter(c => classify(c) === 'growing').length,
    harvested: crops.filter(c => c.status === 'harvested').length,
    overdue:   crops.filter(c => classify(c) === 'overdue').length,
    barangays: [...new Set(crops.map(c => c.barangay).filter(Boolean))].length,
    // Unique farmers = unique `farmer` names in crop entries (NOT system users)
    farmers:   [...new Set(crops.map(c => (c.farmer || '').trim()).filter(Boolean))].length,
  }), [crops]);

  const bgyData = useMemo(() => {
    const m = {};
    crops.forEach(c => {
      if (!c.barangay) return;
      if (!m[c.barangay]) m[c.barangay] = { crops: [], barangay: c.barangay };
      m[c.barangay].crops.push(c);
    });
    return Object.values(m)
      .map(b => ({
        ...b,
        total:        b.crops.length,
        growing:      b.crops.filter(c => classify(c) === 'growing').length,
        harvested:    b.crops.filter(c => c.status === 'harvested').length,
        overdue:      b.crops.filter(c => classify(c) === 'overdue').length,
        // Unique farmer names from entries in this barangay
        farmerNames:  [...new Set(b.crops.map(c => (c.farmer || '').trim()).filter(Boolean))],
        lastActivity: [...b.crops].sort((a, x) => new Date(x.planted) - new Date(a.planted))[0]?.planted,
      }))
      .sort((a, b) => b.total - a.total);
  }, [crops]);

  const cropTypes = useMemo(() => {
    const m = {};
    crops.forEach(c => { m[c.crop] = (m[c.crop] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [crops]);

  const recent  = crops.slice(0, 8);
  const maxBgy  = bgyData[0]?.total || 1;

  return (
    <div style={{ animation: 'slideUp .35s both' }}>

      {/* ── KPI row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard icon="🌱" num={stats.total}     label="Total Entries" color="var(--forest-400)" i={0}/>
        <StatCard icon="📈" num={stats.growing}   label="Growing"       color="var(--earth-400)"  i={1}/>
        <StatCard icon="🌾" num={stats.harvested} label="Harvested"     color="var(--amber-500)"  i={2}/>
        <StatCard icon="⚠️" num={stats.overdue}   label="Overdue"       color="#ef4444"
          badge={stats.overdue > 0 ? 'Needs attention' : null} i={3}/>
      </div>

      {/* ── Main grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, marginBottom: 20 }}>

        {/* Recent entries */}
        <TableShell
          title="Recent Crop Entries"
          subtitle={`Latest ${recent.length} records city-wide`}
          accentColor="var(--forest-400)"
          right={<Btn small onClick={() => onNav('admin-croplog')}>View All</Btn>}
        >
          <Table headers={['Crop', 'Farmer', 'Barangay', 'Planted', 'Status']} minWidth={480}>
            {recent.map((c, i) => (
              <TR key={c.id} i={i}>
                <TD bold>{emojiFor(c.crop)} {c.crop}</TD>
                <TD>{c.farmer || '—'}</TD>
                <TD muted>{c.barangay}</TD>
                <TD muted mono>{fmtShort(c.planted)}</TD>
                <TD><Badge status={classify(c)}/></TD>
              </TR>
            ))}
          </Table>
        </TableShell>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Crop distribution */}
          <Card style={{ padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 14 }}>
              Crop Distribution
            </div>
            {cropTypes.map(([crop, count]) => (
              <div key={crop} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>{emojiFor(crop)}</span>
                <span style={{ flex: 1, fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{crop}</span>
                <PBar pct={(count / stats.total) * 100} color="var(--forest-400)" h={5}/>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--text-3)', width: 20, textAlign: 'right' }}>{count}</span>
              </div>
            ))}
          </Card>

          {/* System summary */}
          <Card style={{ padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 12 }}>
              System Summary
            </div>
            {[
              { label: 'Active Barangays',  value: stats.barangays, icon: '📍' },
              { label: 'Unique Farmers',    value: stats.farmers,   icon: '👨‍🌾', sub: 'from crop entries' },
              { label: 'System Users',      value: users.length,    icon: '👥', sub: 'registered accounts' },
            ].map(s => (
              <div key={s.label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0', borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{s.label}</div>
                  {s.sub && <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-m)' }}>{s.sub}</div>}
                </div>
                <span style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 16, color: 'var(--text-1)' }}>
                  {s.value}
                </span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* ── Barangay Overview ── */}
      <TableShell
        title="Barangay Overview"
        subtitle={`${bgyData.length} active barangays with crop entries`}
        accentColor="var(--earth-400)"
        right={<Btn small onClick={() => onNav('admin-barangay')}>View All</Btn>}
      >
        <Table headers={['Barangay', 'Farmers', 'Total', 'Growing', 'Harvested', 'Overdue', 'Activity', 'Actions']} minWidth={720}>
          {bgyData.slice(0, 10).map((b, i) => (
            <TR key={b.barangay} i={i}>
              <TD bold>📍 {b.barangay}</TD>
              {/* Farmer count from entries */}
              <TD>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: 12, color: 'var(--forest-700)', fontWeight: 600 }}>
                  {b.farmerNames.length}
                </span>
              </TD>
              <TD>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PBar pct={(b.total / maxBgy) * 100} color="var(--forest-400)" h={5}/>
                  <span style={{ fontFamily: 'var(--font-m)', fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>{b.total}</span>
                </div>
              </TD>
              <TD><span style={{ fontFamily: 'var(--font-m)', fontSize: 12, color: 'var(--forest-600)', fontWeight: 600 }}>{b.growing}</span></TD>
              <TD><span style={{ fontFamily: 'var(--font-m)', fontSize: 12, color: 'var(--amber-600)', fontWeight: 600 }}>{b.harvested}</span></TD>
              <TD>
                {b.overdue > 0
                  ? <span style={{ fontFamily: 'var(--font-m)', fontSize: 12, color: '#dc2626', fontWeight: 600 }}>{b.overdue}</span>
                  : <span style={{ fontFamily: 'var(--font-m)', fontSize: 12, color: 'var(--text-4)' }}>0</span>
                }
              </TD>
              <TD muted mono>{fmtShort(b.lastActivity)}</TD>
              <TD>
                <Btn small variant="ghost" onClick={() => setBgyDetail(b)}>Details</Btn>
              </TD>
            </TR>
          ))}
        </Table>
      </TableShell>

      {/* Barangay Detail Modal */}
      {bgyDetail && (
        <BarangayDetailModal
          data={bgyDetail}
          onClose={() => setBgyDetail(null)}
        />
      )}
    </div>
  );
}

/* ── Barangay Detail Modal ── */
function BarangayDetailModal({ data, onClose }) {
  const [tab, setTab] = useState('crops');

  return (
    <Modal title={`Brgy. ${data.barangay}`} onClose={onClose} maxWidth={660}>
      <div style={{ padding: '16px 24px 0' }}>
        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Total',     value: data.total,               color: 'var(--forest-400)', icon: '🌱' },
            { label: 'Farmers',   value: data.farmerNames.length,  color: 'var(--earth-500)',  icon: '👨‍🌾' },
            { label: 'Harvested', value: data.harvested,           color: 'var(--amber-500)',  icon: '✅' },
            { label: 'Overdue',   value: data.overdue,             color: '#ef4444',           icon: '⚠️' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '12px 14px', background: 'var(--surface-2)',
              border: '1px solid var(--border)', borderRadius: 9, textAlign: 'center',
              borderTop: `3px solid ${s.color}`,
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 800, color: 'var(--text-1)' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
          {[
            { key: 'crops',   label: `Crop Entries (${data.crops.length})` },
            { key: 'farmers', label: `Farmers (${data.farmerNames.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: '8px 16px', fontSize: 12, fontFamily: 'var(--font-b)', cursor: 'pointer',
                border: 'none', background: 'none', fontWeight: tab === t.key ? 700 : 400,
                color: tab === t.key ? 'var(--forest-600)' : 'var(--text-3)',
                borderBottom: tab === t.key ? '2px solid var(--forest-500)' : '2px solid transparent',
                marginBottom: -1, transition: 'all .15s',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 24px 20px', overflowY: 'auto', maxHeight: 360, marginTop: 0 }}>

        {/* Crop entries tab */}
        {tab === 'crops' && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 9, overflow: 'hidden', marginTop: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)' }}>
                  {['Crop', 'Farmer', 'Planted', 'Status'].map(h => (
                    <th key={h} style={{
                      padding: '8px 14px', textAlign: 'left', fontSize: 11,
                      color: 'var(--text-3)', fontFamily: 'var(--font-m)', fontWeight: 500,
                      textTransform: 'uppercase', letterSpacing: '.07em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.crops.map((c) => (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '8px 14px', fontSize: 13, fontWeight: 500 }}>{emojiFor(c.crop)} {c.crop}</td>
                    <td style={{ padding: '8px 14px', fontSize: 13 }}>{c.farmer || '—'}</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-m)' }}>{fmtShort(c.planted)}</td>
                    <td style={{ padding: '8px 14px' }}><Badge status={classify(c)}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Farmers tab — from crop entries, NOT system users */}
        {tab === 'farmers' && (
          <div style={{ marginTop: 16 }}>
            {data.farmerNames.length === 0
              ? <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                  No farmer names recorded in this barangay.
                </div>
              : <div style={{ border: '1px solid var(--border)', borderRadius: 9, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-2)' }}>
                        {['#', 'Farmer Name', 'Entries', 'Crops Grown'].map(h => (
                          <th key={h} style={{
                            padding: '8px 14px', textAlign: 'left', fontSize: 11,
                            color: 'var(--text-3)', fontFamily: 'var(--font-m)', fontWeight: 500,
                            textTransform: 'uppercase', letterSpacing: '.07em',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.farmerNames.map((name, i) => {
                        const farmerCrops = data.crops.filter(c => (c.farmer || '').trim() === name);
                        const cropTypes   = [...new Set(farmerCrops.map(c => c.crop).filter(Boolean))];
                        return (
                          <tr key={name} style={{ borderTop: '1px solid var(--border)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '9px 14px', fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--font-m)', width: 32 }}>
                              {i + 1}
                            </td>
                            <td style={{ padding: '9px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                  background: 'linear-gradient(135deg,var(--forest-400),var(--earth-400))',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#fff', fontWeight: 800, fontSize: 12,
                                }}>
                                  {name[0]?.toUpperCase() || '?'}
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '9px 14px', fontSize: 13, fontWeight: 700, color: 'var(--forest-600)' }}>
                              {farmerCrops.length}
                            </td>
                            <td style={{ padding: '9px 14px' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {cropTypes.map(ct => (
                                  <span key={ct} style={{
                                    fontSize: 10, padding: '2px 8px', borderRadius: 20,
                                    background: 'rgba(74,124,89,.1)', color: 'var(--forest-700)',
                                    border: '1px solid rgba(74,124,89,.2)', fontFamily: 'var(--font-m)',
                                  }}>
                                    {emojiFor(ct)} {ct}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
            }
          </div>
        )}
      </div>

      <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
        <Btn variant="secondary" onClick={onClose}>Close</Btn>
      </div>
    </Modal>
  );
}