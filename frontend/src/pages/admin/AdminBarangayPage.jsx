import { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { TableShell, PBar, Btn, Badge } from '../../components/UIComponents';
import { classify, emojiFor, growPct, daysLeft, fmtShort } from '../../utils/helpers';
import { BARANGAYS } from '../../data/constants';

export default function AdminBarangayPage({ crops }) {
  const [modal,  setModal]  = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!modal) return;
    const h = e => { if (e.key === 'Escape') setModal(null); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [modal]);

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modal]);

  const bgyData = useMemo(() => BARANGAYS.map(name => {
    const list = crops.filter(c => c.barangay === name);
    return {
      name,
      total:     list.length,
      growing:   list.filter(c => classify(c) === 'growing').length,
      harvested: list.filter(c => c.status === 'harvested').length,
      overdue:   list.filter(c => classify(c) === 'overdue').length,
      crops:     list,
    };
  }), [crops]);

  const active   = bgyData.filter(b => b.total > 0);
  const filtered = useMemo(() => bgyData.filter(b => b.name.toLowerCase().includes(search.toLowerCase())), [bgyData, search]);
  const maxC     = Math.max(...active.map(b => b.total), 1);

  return (
    <div style={{ animation:'slideUp .35s both' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:'var(--font-d)', fontSize:13, color:'var(--sand-500)' }}>
          {active.length} of {BARANGAYS.length} barangays have active entries
        </div>
      </div>

      {/* Active barangay cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12, marginBottom:28 }}>
        {active.map((b,i) => (
          <div key={b.name} onClick={() => setModal(b)} style={{ cursor:'pointer', animation:`scaleIn .35s ${i*.04}s both` }}>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)',
              padding:'18px 20px', height:'100%', position:'relative', overflow:'hidden',
              transition:'transform .2s, box-shadow .2s, border-color .2s',
              borderRadius: i%2===0 ? '8px 0 8px 0' : '0 8px 0 8px' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(26,21,16,.1)'; e.currentTarget.style.borderColor='var(--terra-300)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor='var(--border)'; }}>
              {b.overdue > 0 && (
                <span style={{ position:'absolute', top:8, right:8, fontSize:9, fontFamily:'var(--font-m)',
                  padding:'2px 6px', borderRadius:100, background:'var(--terra-100)', color:'var(--terra-600)' }}>
                  ⚠ {b.overdue}
                </span>
              )}
              <div style={{ fontFamily:'var(--font-d)', fontSize:36, fontWeight:800, letterSpacing:'-.05em', lineHeight:1 }}>{b.total}</div>
              <div style={{ fontFamily:'var(--font-d)', fontWeight:700, fontSize:13, margin:'6px 0 2px' }}>{b.name}</div>
              <div style={{ fontSize:11, color:'var(--sand-500)', fontFamily:'var(--font-m)' }}>{b.growing}g · {b.harvested}h</div>
              <div style={{ marginTop:12, height:4, background:'var(--sand-100)', borderRadius:100, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${(b.total/maxC)*100}%`,
                  background:'linear-gradient(to right,var(--terra-400),var(--amber-300))', borderRadius:100, transition:'width 1s' }}/>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary table */}
      <div style={{ marginBottom:8, display:'flex', gap:10, alignItems:'center' }}>
        <input placeholder="Search barangay…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding:'7px 12px', border:'1px solid var(--border)', background:'var(--sand-50)',
            fontSize:12, fontFamily:'var(--font-m)', borderRadius:3, outline:'none', width:240 }}
          onFocus={e => e.target.style.borderColor='var(--terra-400)'}
          onBlur={e  => e.target.style.borderColor='var(--border)'}/>
        <span style={{ fontSize:11, fontFamily:'var(--font-m)', color:'var(--sand-500)' }}>
          {filtered.filter(b => b.total > 0).length} with entries
        </span>
      </div>

      <TableShell title="All 117 Barangays" subtitle="Click any active row to view details" accentColor="var(--teal-400)">
        <div style={{ maxHeight:380, overflowY:'auto', overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:500 }}>
            <thead>
              <tr style={{ background:'var(--sand-900)', position:'sticky', top:0, zIndex:2 }}>
                {['Barangay','Total','Growing','Harvested','Overdue','Distribution'].map(h => (
                  <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:10, fontFamily:'var(--font-m)',
                    textTransform:'uppercase', letterSpacing:'.08em', color:'var(--sand-400)', fontWeight:400, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.name} onClick={() => b.total > 0 && setModal(b)}
                  style={{ cursor: b.total>0?'pointer':'default', borderBottom:'1px solid var(--border)', opacity: b.total===0?.45:1 }}
                  onMouseEnter={e => { if(b.total>0) e.currentTarget.style.background='var(--sand-50)'; }}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'9px 14px', fontSize:13, fontWeight: b.total>0?500:400 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:7 }}>
                      {b.total > 0 && <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--teal-400)', display:'inline-block', flexShrink:0 }}/>}
                      {b.name}
                    </span>
                  </td>
                  <td style={{ padding:'9px 14px', fontFamily:'var(--font-m)', fontSize:12, color:'var(--sand-600)' }}>{b.total||'—'}</td>
                  <td style={{ padding:'9px 14px', fontFamily:'var(--font-m)', fontSize:12, color:'var(--teal-600)' }}>{b.growing||'—'}</td>
                  <td style={{ padding:'9px 14px', fontFamily:'var(--font-m)', fontSize:12, color:'var(--amber-600)' }}>{b.harvested||'—'}</td>
                  <td style={{ padding:'9px 14px', fontFamily:'var(--font-m)', fontSize:12, color: b.overdue>0?'var(--terra-500)':'var(--sand-400)' }}>{b.overdue||'—'}</td>
                  <td style={{ padding:'9px 14px', minWidth:120 }}>
                    {b.total > 0
                      ? <PBar pct={(b.total/maxC)*100} color="var(--terra-400)" h={4}/>
                      : <span style={{ fontSize:10, fontFamily:'var(--font-m)', color:'var(--sand-300)' }}>no data</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableShell>

      {/* Barangay Modal */}
      {modal && ReactDOM.createPortal(
        <div onClick={() => setModal(null)} style={{ position:'fixed', inset:0, background:'rgba(26,21,16,.68)',
          backdropFilter:'blur(5px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center',
          padding:20, animation:'fadeIn .18s ease' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'var(--surface)', width:'100%', maxWidth:760,
            height:'82vh', display:'flex', flexDirection:'column', borderRadius:8,
            borderLeft:'5px solid var(--terra-500)', boxShadow:'0 24px 60px rgba(26,21,16,.25)',
            animation:'bounceIn .3s', overflow:'hidden', position:'relative', margin:'auto' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
              background:'linear-gradient(to right,var(--terra-500),var(--teal-400),var(--amber-400))', zIndex:5 }}/>

            {/* Modal header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
              padding:'18px 22px 14px', background:'var(--sand-900)', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
                <div style={{ width:40, height:40, minWidth:40, background:'rgba(201,92,32,.2)',
                  border:'1px solid rgba(201,92,32,.4)', borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>📍</div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontFamily:'var(--font-d)', fontSize:19, fontWeight:800, color:'#fff',
                    letterSpacing:'-.03em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    Brgy. {modal.name}
                  </div>
                  <div style={{ fontSize:11, color:'var(--sand-500)', fontFamily:'var(--font-m)', marginTop:2 }}>Calbayog City, Samar</div>
                </div>
              </div>
              <button onClick={() => setModal(null)}
                style={{ width:34, height:34, minWidth:34, display:'flex', alignItems:'center', justifyContent:'center',
                  background:'rgba(255,255,255,.08)', color:'var(--sand-400)', border:'none', borderRadius:4,
                  cursor:'pointer', fontSize:15, transition:'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,.18)'; e.currentTarget.style.color='#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,.08)'; e.currentTarget.style.color='var(--sand-400)'; }}>✕</button>
            </div>

            {/* Stats strip */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              {[{n:modal.total,l:'Total',c:'var(--sand-900)'},{n:modal.growing,l:'Growing',c:'var(--teal-500)'},
                {n:modal.harvested,l:'Harvested',c:'var(--amber-500)'},{n:modal.overdue,l:'Overdue',c:'var(--terra-500)'}].map(s => (
                <div key={s.l} style={{ padding:'13px 10px', textAlign:'center', borderRight:'1px solid var(--border)' }}>
                  <div style={{ fontFamily:'var(--font-d)', fontSize:26, fontWeight:800, letterSpacing:'-.04em', lineHeight:1, color:s.c }}>{s.n}</div>
                  <div style={{ fontSize:10, fontFamily:'var(--font-m)', textTransform:'uppercase', letterSpacing:'.08em', color:'var(--sand-400)', marginTop:4 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Scrollable body */}
            <div style={{ flex:1, overflowY:'auto', overscrollBehavior:'contain', minHeight:0 }}>
              {modal.crops.length === 0
                ? <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'60px 24px', color:'var(--sand-400)', textAlign:'center' }}>
                    <span style={{ fontSize:40, opacity:.2 }}>🌾</span>
                    <div>No crop entries for this barangay yet.</div>
                  </div>
                : modal.crops.map((c,i) => {
                    const st   = classify(c);
                    const dl   = daysLeft(c.expectedHarvest);
                    const pct  = c.status === 'harvested' ? 100 : growPct(c.planted, c.expectedHarvest);
                    const barC = st==='overdue'?'var(--terra-400)':st==='harvested'?'var(--amber-400)':'var(--teal-400)';
                    return (
                      <div key={c.id} style={{ display:'grid', gridTemplateColumns:'180px 1fr auto', alignItems:'center',
                        gap:16, padding:'14px 22px', borderBottom:'1px solid var(--border)',
                        transition:'background .15s', animation:`slideUp .25s ${i*.04}s both` }}
                        onMouseEnter={e => e.currentTarget.style.background='var(--sand-50)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:38, height:38, minWidth:38, background:'var(--sand-100)', borderRadius:6,
                            display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{emojiFor(c.crop)}</div>
                          <div>
                            <div style={{ fontWeight:700, fontSize:13, fontFamily:'var(--font-d)' }}>{c.crop}</div>
                            <div style={{ fontSize:11, color:'var(--sand-500)', fontFamily:'var(--font-m)', marginTop:1 }}>👤 {c.farmer}</div>
                          </div>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:5, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, fontFamily:'var(--font-m)', color:'var(--sand-600)', flexWrap:'wrap' }}>
                            <span>🌱 {fmtShort(c.planted)}</span>
                            <span style={{ color:'var(--sand-400)' }}>→</span>
                            <span>🌾 {fmtShort(c.expectedHarvest)}</span>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <PBar pct={pct} color={barC}/>
                            <span style={{ fontSize:10, fontFamily:'var(--font-m)', color:'var(--sand-400)', flexShrink:0 }}>{pct}%</span>
                          </div>
                          {c.notes && <div style={{ fontSize:11, color:'var(--sand-400)', fontStyle:'italic', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.notes}</div>}
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5, flexShrink:0 }}>
                          <Badge status={st}/>
                          <span style={{ fontFamily:'var(--font-m)', fontSize:11, fontWeight:600,
                            color: st==='overdue'?'var(--terra-500)':st==='harvested'?'var(--amber-600)':'var(--teal-600)' }}>
                            {c.status==='harvested'?'✅ Done':dl===null?'—':dl<0?`${Math.abs(dl)}d overdue`:`${dl}d left`}
                          </span>
                        </div>
                      </div>
                    );
                  })
              }
            </div>

            {/* Footer */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
              padding:'12px 22px', borderTop:'1px solid var(--border)', background:'var(--sand-50)', flexShrink:0 }}>
              <span style={{ fontSize:11, fontFamily:'var(--font-m)', color:'var(--sand-400)' }}>Press Esc or click outside to close</span>
              <Btn onClick={() => setModal(null)}>Close</Btn>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
