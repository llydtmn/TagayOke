import { useMemo, useState } from 'react';
import { StatCard, PBar, Btn, Badge } from '../../components/UIComponents';
import { classify, emojiFor, growPct, fmtShort } from '../../utils/helpers';
import { ROLE_LABELS } from '../../data/constants';

export default function UserDashboardPage({ user, crops, onNav }) {
  const [farmerSearch, setFarmerSearch] = useState('');

  // All crops in this barangay
  const myCrops = useMemo(
    () => crops.filter(c => c.barangay === user.barangay),
    [crops, user]
  );

  const stats = {
    total:     myCrops.length,
    growing:   myCrops.filter(c => classify(c) === 'growing').length,
    harvested: myCrops.filter(c => c.status === 'harvested').length,
    overdue:   myCrops.filter(c => classify(c) === 'overdue').length,
  };

  const recent = myCrops.slice(0, 6);

  // ── Farmer list derived from the `farmer` field in crop entries ──
  // This is NOT the system users list — it's every unique farmer name
  // that was typed in when logging a crop entry for this barangay.
  const farmerList = useMemo(() => {
    const map = {};
    myCrops.forEach(c => {
      const name = (c.farmer || '').trim();
      if (!name || name === '—') return;
      if (!map[name]) map[name] = { name, crops: [], cropTypes: new Set() };
      map[name].crops.push(c);
      if (c.crop) map[name].cropTypes.add(c.crop);
    });
    return Object.values(map)
      .sort((a, b) => b.crops.length - a.crops.length)
      .map(f => ({
        name:      f.name,
        total:     f.crops.length,
        active:    f.crops.filter(c => classify(c) === 'growing').length,
        harvested: f.crops.filter(c => c.status === 'harvested').length,
        overdue:   f.crops.filter(c => classify(c) === 'overdue').length,
        cropTypes: [...f.cropTypes],
        lastEntry: f.crops.sort((a, b) => new Date(b.planted) - new Date(a.planted))[0]?.planted || null,
      }));
  }, [myCrops]);

  const filteredFarmers = farmerList.filter(f =>
    f.name.toLowerCase().includes(farmerSearch.toLowerCase())
  );

  const thStyle = {
    padding: '8px 12px', textAlign: 'left', fontSize: 10,
    fontFamily: 'var(--font-m)', textTransform: 'uppercase',
    letterSpacing: '.08em', color: 'var(--sand-400)', fontWeight: 400,
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ animation: 'slideUp .35s both' }}>

      {/* ── Hero ── */}
      <div style={{
        background: 'var(--sand-900)', padding: '24px 28px',
        margin: '-24px -32px 24px', position: 'relative',
        overflow: 'hidden', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 20% 50%,rgba(45,155,144,.2),transparent 55%)',
          pointerEvents: 'none',
        }}/>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: 11, fontFamily: 'var(--font-m)', color: 'var(--teal-300)',
            textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4,
          }}>
            Barangay {user.barangay} · {ROLE_LABELS[user.role]}
          </div>
          <div style={{
            fontFamily: 'var(--font-d)', fontSize: 24, fontWeight: 800,
            color: '#fff', letterSpacing: '-.03em',
          }}>
            Welcome, <span style={{ color: 'var(--teal-300)' }}>{user.name.split(' ')[0]}</span> 👋
          </div>
          <div style={{ fontSize: 13, color: 'var(--sand-400)', marginTop: 3 }}>
            Here's your farm activity overview
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Btn variant="teal" icon="➕" onClick={() => onNav('user-addentry')}>Add Entry</Btn>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard icon="🌱" num={stats.total}     label="Total Entries" color="var(--terra-400)" i={0}/>
        <StatCard icon="📈" num={stats.growing}   label="Growing"       color="var(--teal-400)"  i={1}/>
        <StatCard icon="✅" num={stats.harvested} label="Harvested"     color="var(--amber-400)" i={2}/>
        <StatCard icon="⚠️" num={stats.overdue}   label="Overdue"
          color="var(--terra-500)" badge={stats.overdue > 0 ? 'Action needed' : null} i={3}/>
      </div>

      {/* ── 2-col: Crop Table + Quick Nav ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 20, marginBottom: 24 }}>

        {/* Crop log table */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Crops in Brgy. {user.barangay}</div>
              <div style={{ fontSize: 11, color: 'var(--sand-500)', fontFamily: 'var(--font-m)', marginTop: 1 }}>
                {myCrops.length} entries
              </div>
            </div>
            <Btn small onClick={() => onNav('user-croplog')}>View All</Btn>
          </div>

          {recent.length === 0
            ? <div style={{ padding: '40px', textAlign: 'center', color: 'var(--sand-400)', fontSize: 13 }}>
                No entries yet.{' '}
                <span style={{ color: 'var(--teal-500)', cursor: 'pointer' }} onClick={() => onNav('user-addentry')}>
                  Add your first crop →
                </span>
              </div>
            : <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--sand-900)' }}>
                      {['Farmer', 'Crop', 'Planted', 'Harvest', 'Progress', 'Status'].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((c, i) => {
                      const st  = classify(c);
                      const pct = c.status === 'harvested' ? 100 : growPct(c.planted, c.expectedHarvest);
                      return (
                        <tr key={c.id}
                          style={{ borderBottom: '1px solid var(--border)', animation: `slideUp .25s ${i * .04}s both` }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--sand-50)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '9px 12px', fontSize: 12, color: 'var(--sand-600)', fontWeight: 500 }}>
                            {c.farmer || '—'}
                          </td>
                          <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 500 }}>
                            {emojiFor(c.crop)} {c.crop}
                          </td>
                          <td style={{ padding: '9px 12px', fontSize: 11, fontFamily: 'var(--font-m)', color: 'var(--sand-500)' }}>
                            {fmtShort(c.planted)}
                          </td>
                          <td style={{ padding: '9px 12px', fontSize: 11, fontFamily: 'var(--font-m)', color: 'var(--sand-500)' }}>
                            {fmtShort(c.expectedHarvest)}
                          </td>
                          <td style={{ padding: '9px 12px', minWidth: 80 }}>
                            <PBar pct={pct}
                              color={st === 'overdue' ? 'var(--terra-400)' : st === 'harvested' ? 'var(--amber-400)' : 'var(--teal-400)'}
                              h={4}/>
                          </td>
                          <td style={{ padding: '9px 12px' }}><Badge status={st}/></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
          }
        </div>

        {/* Quick nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: '➕', label: 'Add New Crop',    sub: 'Log a new entry',        key: 'user-addentry', c: 'var(--terra-500)' },
            { icon: '🌾', label: 'Harvest Tracker', sub: 'Track your progress',    key: 'user-harvest',  c: 'var(--teal-500)'  },
            { icon: '📍', label: 'My Barangay',     sub: `Brgy. ${user.barangay}`, key: 'user-barangay', c: 'var(--amber-500)' },
            { icon: '📁', label: 'Field Guide',     sub: 'Planting tips & more',   key: 'user-guide',    c: 'var(--sand-500)'  },
          ].map(a => (
            <div key={a.key} onClick={() => onNav(a.key)}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderLeft: `3px solid ${a.c}`, padding: '14px 16px', cursor: 'pointer',
                transition: 'all .15s', borderRadius: '0 6px 6px 0',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(3px)'; e.currentTarget.style.boxShadow = '2px 4px 12px rgba(26,21,16,.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
              <span style={{ fontSize: 22 }}>{a.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{a.label}</div>
                <div style={{ fontSize: 11, color: 'var(--sand-500)', fontFamily: 'var(--font-m)', marginTop: 1 }}>{a.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Farmers in Barangay (from crop entry names) ── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, overflow: 'hidden',
      }}>
        {/* Section header */}
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 10,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              👨‍🌾 Farmers in Brgy. {user.barangay}
            </div>
            <div style={{ fontSize: 11, color: 'var(--sand-500)', fontFamily: 'var(--font-m)', marginTop: 1 }}>
              {farmerList.length} farmer{farmerList.length !== 1 ? 's' : ''} · names recorded from crop log entries
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 10, top: '50%',
              transform: 'translateY(-50%)', fontSize: 12, pointerEvents: 'none',
            }}>🔍</span>
            <input
              placeholder="Search farmer name..."
              value={farmerSearch}
              onChange={e => setFarmerSearch(e.target.value)}
              style={{
                paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                fontSize: 12, border: '1px solid var(--border)', borderRadius: 6,
                background: 'var(--sand-50)', outline: 'none',
                fontFamily: 'var(--font-b)', width: 200,
              }}
            />
          </div>
        </div>

        {/* Farmer table */}
        {filteredFarmers.length === 0
          ? <div style={{ padding: '40px', textAlign: 'center', color: 'var(--sand-400)', fontSize: 13 }}>
              {farmerList.length === 0
                ? 'No farmers recorded yet. Farmer names are automatically added when crop entries are logged.'
                : 'No farmers match your search.'
              }
            </div>
          : <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--sand-900)' }}>
                    {['#', 'Farmer Name', 'Crops Grown', 'Total', 'Active', 'Harvested', 'Overdue', 'Last Entry'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredFarmers.map((f, i) => (
                    <tr key={f.name}
                      style={{ borderBottom: '1px solid var(--border)', animation: `slideUp .2s ${i * .04}s both` }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--sand-50)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                      {/* # */}
                      <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--sand-400)', fontFamily: 'var(--font-m)', width: 36 }}>
                        {i + 1}
                      </td>

                      {/* Name + avatar */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg,var(--teal-500),var(--teal-700))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 13,
                          }}>
                            {f.name[0]?.toUpperCase() || '?'}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{f.name}</span>
                        </div>
                      </td>

                      {/* Crop type tags */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {f.cropTypes.length === 0
                            ? <span style={{ fontSize: 11, color: 'var(--sand-400)' }}>—</span>
                            : f.cropTypes.map(ct => (
                              <span key={ct} style={{
                                fontSize: 10, padding: '2px 8px', borderRadius: 20,
                                background: 'rgba(45,155,144,.1)', color: 'var(--teal-700)',
                                border: '1px solid rgba(45,155,144,.2)', fontFamily: 'var(--font-m)',
                              }}>
                                {emojiFor(ct)} {ct}
                              </span>
                            ))
                          }
                        </div>
                      </td>

                      {/* Total */}
                      <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: 'var(--terra-500)' }}>
                        {f.total}
                      </td>

                      {/* Active */}
                      <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: 'var(--teal-600)' }}>
                        {f.active}
                      </td>

                      {/* Harvested */}
                      <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: 'var(--amber-600)' }}>
                        {f.harvested}
                      </td>

                      {/* Overdue */}
                      <td style={{ padding: '10px 12px' }}>
                        {f.overdue > 0
                          ? <span style={{
                              fontSize: 12, fontWeight: 700, color: '#fff',
                              background: 'var(--terra-500)', borderRadius: 20,
                              padding: '2px 10px',
                            }}>{f.overdue}</span>
                          : <span style={{ fontSize: 12, color: 'var(--sand-400)' }}>—</span>
                        }
                      </td>

                      {/* Last Entry */}
                      <td style={{ padding: '10px 12px', fontSize: 11, fontFamily: 'var(--font-m)', color: 'var(--sand-500)' }}>
                        {f.lastEntry ? fmtShort(f.lastEntry) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>

    </div>
  );
}