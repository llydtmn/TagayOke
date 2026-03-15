import { useState, useMemo } from 'react';
import { TableShell, PBar, Badge, Btn, ConfirmDialog, useToast } from '../../components/UIComponents';
import { classify, emojiFor, growPct, fmtShort } from '../../utils/helpers';

export default function UserCropLogPage({ user, crops, onDelete, onToggle }) {
  const myCrops = useMemo(() => crops.filter(c => c.barangay === user.barangay), [crops, user]);
  const [search,  setSearch]  = useState('');
  const [statusF, setStatusF] = useState('All');
  const [del,     setDel]     = useState(null);
  const toast = useToast();

  const filtered = useMemo(() => myCrops.filter(c => {
    if (search && !c.crop.toLowerCase().includes(search.toLowerCase()) && !c.farmer.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusF !== 'All' && classify(c) !== statusF) return false;
    return true;
  }), [myCrops, search, statusF]);

  const confirmDel = () => { onDelete(del.id); toast({ title:'Entry deleted', type:'success' }); setDel(null); };

  return (
    <div style={{ animation:'slideUp .35s both' }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', padding:'12px 16px',
        marginBottom:14, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', borderRadius:4 }}>
        <input placeholder="🔍  Search crop or farmer…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex:1, minWidth:180, padding:'7px 12px', border:'1px solid var(--border)',
            background:'var(--sand-50)', fontSize:13, fontFamily:'var(--font-b)', borderRadius:3, outline:'none' }}
          onFocus={e => e.target.style.borderColor='var(--terra-400)'}
          onBlur={e  => e.target.style.borderColor='var(--border)'}/>
        <select value={statusF} onChange={e => setStatusF(e.target.value)}
          style={{ padding:'7px 12px', border:'1px solid var(--border)', background:'var(--sand-50)', fontSize:12, fontFamily:'var(--font-m)', borderRadius:3 }}>
          {['All','growing','harvested','overdue'].map(s => <option key={s} value={s}>{s==='All'?'All Status':s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
        <span style={{ fontSize:11, fontFamily:'var(--font-m)', color:'var(--sand-500)' }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <TableShell title={`My Crop Log — Brgy. ${user.barangay}`} subtitle="Your personal entries" accentColor="var(--teal-400)">
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:500 }}>
            <thead>
              <tr style={{ background:'var(--sand-900)' }}>
                {['ID','Crop','Farmer','Planted','Est. Harvest','Progress','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:10, fontFamily:'var(--font-m)',
                    textTransform:'uppercase', letterSpacing:'.08em', color:'var(--sand-400)', fontWeight:400, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={8} style={{ padding:'40px', textAlign:'center', color:'var(--sand-400)', fontSize:13 }}>No entries found</td></tr>
                : filtered.map((c,i) => {
                    const st  = classify(c);
                    const pct = c.status === 'harvested' ? 100 : growPct(c.planted, c.expectedHarvest);
                    const barC = st==='overdue'?'var(--terra-400)':st==='harvested'?'var(--amber-400)':'var(--teal-400)';
                    return (
                      <tr key={c.id} style={{ animation:`slideUp .25s ${i*.03}s both`, borderBottom:'1px solid var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.background='var(--sand-50)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <td style={{ padding:'9px 14px', fontSize:11, fontFamily:'var(--font-m)', color:'var(--sand-500)' }}>{c.id}</td>
                        <td style={{ padding:'9px 14px', fontSize:13, fontWeight:500 }}>{emojiFor(c.crop)} {c.crop}</td>
                        <td style={{ padding:'9px 14px', fontSize:13 }}>{c.farmer}</td>
                        <td style={{ padding:'9px 14px', fontSize:11, fontFamily:'var(--font-m)', color:'var(--sand-500)' }}>{fmtShort(c.planted)}</td>
                        <td style={{ padding:'9px 14px', fontSize:11, fontFamily:'var(--font-m)', color:'var(--sand-500)' }}>{fmtShort(c.expectedHarvest)}</td>
                        <td style={{ padding:'9px 14px', minWidth:90 }}>
                          <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                            <PBar pct={pct} color={barC} h={4}/>
                            <span style={{ fontSize:10, fontFamily:'var(--font-m)', color:'var(--sand-400)' }}>{pct}%</span>
                          </div>
                        </td>
                        <td style={{ padding:'9px 14px' }}><Badge status={st}/></td>
                        <td style={{ padding:'9px 14px' }}>
                          <div style={{ display:'flex', gap:6 }}>
                            <Btn small variant="ghost" icon={c.status==='harvested'?'🌱':'🌾'}
                              onClick={() => { onToggle(c.id); toast({ title:'Status updated', type:'info' }); }}/>
                            <Btn small variant="danger" icon="🗑️" onClick={() => setDel(c)}/>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>
      </TableShell>
      {del && <ConfirmDialog title="Delete Entry" desc={`Delete "${del.crop}" (${del.id})? This cannot be undone.`} onConfirm={confirmDel} onCancel={() => setDel(null)}/>}
    </div>
  );
}
