import { useState, useMemo } from 'react';
import { TableShell, Btn, Modal, useToast, StatCard } from '../../components/UIComponents';
import { BARANGAYS } from '../../data/constants';

// Derive land parcels from users (farmers have farmLocation/farmSize)
function buildLandData(users, crops, barangayFilter) {
  const farmers = users.filter(u => u.role !== 'admin');

  return BARANGAYS
    .filter(b => !barangayFilter || b.toLowerCase().includes(barangayFilter.toLowerCase()))
    .map(barangay => {
      const bgyFarmers = farmers.filter(u => u.barangay === barangay);
      const bgyCrops   = crops.filter(c => c.barangay === barangay);
      const parcels    = bgyFarmers
        .filter(u => u.farmLocation)
        .map(u => ({
          farmer: u.name,
          farmerId: u.id,
          location: u.farmLocation,
          size: u.farmSize || 'Not specified',
          crops: bgyCrops.filter(c => c.farmerId === u.id || c.farmer === u.name).length,
        }));
      return {
        barangay,
        totalFarmers: bgyFarmers.length,
        totalCrops: bgyCrops.length,
        parcels,
        registeredLand: parcels.length,
      };
    })
    .filter(b => b.totalFarmers > 0 || b.totalCrops > 0);
}

export default function AdminLandPage({ users, crops }) {
  const [search,  setSearch]  = useState('');
  const [detail,  setDetail]  = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addBgy,  setAddBgy]  = useState('');
  const toast = useToast();

  const landData = useMemo(() => buildLandData(users, crops, search), [users, crops, search]);
  const totalParcels  = useMemo(() => landData.reduce((a, b) => a + b.registeredLand, 0), [landData]);
  const totalFarmers  = useMemo(() => [...new Set(users.filter(u => u.role !== 'admin'))].length, [users]);
  const coveredBgys   = landData.filter(b => b.registeredLand > 0).length;

  return (
    <div style={{ animation: 'slideUp .35s both' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard icon="🗺️" num={landData.length}  label="Active Barangays"    color="var(--teal-400)"  i={0}/>
        <StatCard icon="🌾" num={totalParcels}      label="Registered Parcels"  color="var(--forest-400)" i={1}/>
        <StatCard icon="📍" num={coveredBgys}       label="Barangays w/ Land Data" color="var(--earth-400)" i={2}/>
      </div>

      {/* Search */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px 16px',
        marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', borderRadius: 4,
      }}>
        <input
          placeholder="🔍  Search barangay…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, padding: '7px 12px', border: '1px solid var(--border)',
            background: 'var(--sand-50)', fontSize: 13, fontFamily: 'var(--font-b)', borderRadius: 3, outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--teal-400)'}
          onBlur={e  => e.target.style.borderColor = 'var(--border)'}
        />
        <span style={{ fontSize: 11, fontFamily: 'var(--font-m)', color: 'var(--sand-500)' }}>
          {landData.length} barangay{landData.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Main grid — barangay cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14, marginBottom: 24 }}>
        {landData.map((b, i) => (
          <div
            key={b.barangay}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderTop: `3px solid ${b.registeredLand > 0 ? 'var(--teal-400)' : 'var(--border)'}`,
              padding: '18px 20px', borderRadius: 4,
              animation: `scaleIn .3s ${i * .03}s both`,
              transition: 'transform .2s, box-shadow .2s',
              cursor: 'pointer',
            }}
            onClick={() => setDetail(b)}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(26,21,16,.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>
                  📍 {b.barangay}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--font-m)', marginTop: 2 }}>
                  Calbayog City, Samar
                </div>
              </div>
              {b.registeredLand > 0 && (
                <span style={{
                  fontSize: 10, fontFamily: 'var(--font-m)', padding: '2px 8px',
                  borderRadius: 100, background: 'var(--teal-50)', color: 'var(--teal-600)',
                  border: '1px solid var(--teal-100)',
                }}>
                  {b.registeredLand} parcel{b.registeredLand !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              {[
                { label: 'Farmers', value: b.totalFarmers, color: 'var(--forest-400)' },
                { label: 'Crops',   value: b.totalCrops,   color: 'var(--earth-400)'  },
                { label: 'Land',    value: b.registeredLand, color: 'var(--teal-400)' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 18, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-m)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {b.parcels.length > 0 ? (
              <div style={{
                fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-m)',
                borderTop: '1px solid var(--border)', paddingTop: 10,
              }}>
                {b.parcels.slice(0, 2).map(p => (
                  <div key={p.farmerId} style={{ marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    👤 {p.farmer} — {p.location}
                  </div>
                ))}
                {b.parcels.length > 2 && (
                  <div style={{ color: 'var(--teal-500)', fontWeight: 500 }}>+{b.parcels.length - 2} more…</div>
                )}
              </div>
            ) : (
              <div style={{
                fontSize: 11, color: 'var(--text-4)', fontStyle: 'italic',
                borderTop: '1px solid var(--border)', paddingTop: 10,
              }}>
                No farm land data registered
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Barangay Land Detail Modal */}
      {detail && (
        <LandDetailModal
          data={detail}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

/* ── Land Detail Modal ── */
function LandDetailModal({ data, onClose }) {
  return (
    <Modal title={`Land Records — Brgy. ${data.barangay}`} onClose={onClose} maxWidth={620}>
      <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Registered Farmers', value: data.totalFarmers, icon: '👨‍🌾', color: 'var(--forest-400)' },
            { label: 'Total Crops',        value: data.totalCrops,   icon: '🌾',   color: 'var(--earth-400)'  },
            { label: 'Land Parcels',       value: data.registeredLand, icon: '🗺️', color: 'var(--teal-400)'  },
          ].map(s => (
            <div key={s.label} style={{
              padding: '14px', background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderTop: `3px solid ${s.color}`, borderRadius: 8, textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-d)', fontSize: 24, fontWeight: 800, color: 'var(--text-1)' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Parcels list */}
        <div style={{ marginBottom: 12 }}>
          <div style={{
            fontSize: 11, fontFamily: 'var(--font-m)', textTransform: 'uppercase',
            letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: 12,
          }}>
            Registered Farm Parcels ({data.parcels.length})
          </div>

          {data.parcels.length === 0 ? (
            <div style={{
              padding: '40px', textAlign: 'center', color: 'var(--text-4)',
              background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8,
            }}>
              <div style={{ fontSize: 32, marginBottom: 8, opacity: .3 }}>🗺️</div>
              <div style={{ fontSize: 13 }}>No farm land data registered for this barangay.</div>
              <div style={{ fontSize: 11, marginTop: 4, fontFamily: 'var(--font-m)' }}>
                Farmers can add their land location when signing up.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.parcels.map((p, i) => (
                <div key={p.farmerId} style={{
                  display: 'flex', gap: 14, padding: '14px 16px',
                  background: '#fff', border: '1px solid var(--border)',
                  borderLeft: '3px solid var(--teal-400)',
                  borderRadius: '0 8px 8px 0',
                  animation: `slideUp .2s ${i * .04}s both`,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--teal-400), var(--forest-400))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
                  }}>
                    {p.farmer[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)', marginBottom: 2 }}>{p.farmer}</div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                        <span style={{ color: 'var(--text-4)', fontFamily: 'var(--font-m)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 1 }}>Location</span>
                        📍 {p.location}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                        <span style={{ color: 'var(--text-4)', fontFamily: 'var(--font-m)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 1 }}>Farm Size</span>
                        🗺️ {p.size}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                        <span style={{ color: 'var(--text-4)', fontFamily: 'var(--font-m)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 1 }}>Crops</span>
                        🌱 {p.crops} entr{p.crops !== 1 ? 'ies' : 'y'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
        <Btn variant="secondary" onClick={onClose}>Close</Btn>
      </div>
    </Modal>
  );
}