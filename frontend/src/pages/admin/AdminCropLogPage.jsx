import { useState, useMemo } from 'react';
import { Badge, PBar, Btn, TableShell, ConfirmDialog, useToast } from '../../components/UIComponents';
import { classify, emojiFor, growPct, fmtShort } from '../../utils/helpers';
import { CROPS, BARANGAYS } from '../../data/constants';

export default function AdminCropLogPage({ crops, onDelete, onToggle }) {
  const [search,  setSearch]  = useState('');
  const [cropF,   setCropF]   = useState('All');
  const [statusF, setStatusF] = useState('All');
  const [bgyF,    setBgyF]    = useState('All');
  const [del,     setDel]     = useState(null);
  const toast = useToast();

  const filtered = useMemo(() => crops.filter(c => {
    const q = search.toLowerCase();
    if (q && !c.crop.toLowerCase().includes(q) && !c.farmer.toLowerCase().includes(q) &&
        !c.barangay.toLowerCase().includes(q) && !c.id.toLowerCase().includes(q)) return false;
    if (cropF   !== 'All' && c.crop        !== cropF)   return false;
    if (statusF !== 'All' && classify(c)   !== statusF) return false;
    if (bgyF    !== 'All' && c.barangay    !== bgyF)    return false;
    return true;
  }), [crops, search, cropF, statusF, bgyF]);

  const allBgys = [...new Set(crops.map(c => c.barangay))].sort();

  const confirmDel = () => { onDelete(del.id); toast({ title:'Entry deleted', sub:`${del.crop} removed`, type:'success' }); setDel(null); };

  const selStyle = { padding:'7px 12px', border:'1px solid var(--border)', background:'var(--sand-50)',
    fontSize:12, fontFamily:'var(--font-m)', color:'var(--sand-700)', borderRadius:3, cursor:'pointer' };

  return (
    <div style={{ animation:'slideUp .35s both' }}>
      {/* Filter bar */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', padding:'14px 18px',
        marginBottom:16, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', borderRadius:4 }}>
        <input placeholder="🔍  Search crop, farmer, barangay, ID…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex:1, minWidth:200, padding:'7px 12px', border:'1px solid var(--border)',
            background:'var(--sand-50)', fontSize:13, fontFamily:'var(--font-b)', borderRadius:3, outline:'none' }}
          onFocus={e => e.target.style.borderColor='var(--terra-400)'}
          onBlur={e  => e.target.style.borderColor='var(--border)'}/>
        <select value={cropF} onChange={e => setCropF(e.target.value)} style={selStyle}>
          <option>All</option>{CROPS.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={statusF} onChange={e => setStatusF(e.target.value)} style={selStyle}>
          {['All','growing','harvested','overdue'].map(s => <option key={s} value={s}>{s==='All'?'All Status':s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
        <select value={bgyF} onChange={e => setBgyF(e.target.value)} style={selStyle}>
          <option value="All">All Barangays</option>{allBgys.map(b => <option key={b}>{b}</option>)}
        </select>
        <span style={{ fontSize:11, fontFamily:'var(--font-m)', color:'var(--sand-500)' }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <TableShell title="All Crop Entries" subtitle="City-wide records across all barangays" accentColor="var(--terra-400)">
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
            <thead>
              <tr style={{ background:'var(--sand-900)' }}>
                {['ID','Crop','Farmer','Barangay','Planted','Est. Harvest','Progress','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:10, fontFamily:'var(--font-m)',
                    textTransform:'uppercase', letterSpacing:'.08em', color:'var(--sand-400)', fontWeight:400, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={9} style={{ padding:'40px', textAlign:'center', color:'var(--sand-400)', fontSize:13 }}>No entries found</td></tr>
                : filtered.map((c,i) => {
                    const st  = classify(c);
                    const pct = c.status === 'harvested' ? 100 : growPct(c.planted, c.expectedHarvest);
                    const barC = st==='overdue'?'var(--terra-400)':st==='harvested'?'var(--amber-400)':'var(--teal-400)';
                    return (
                      <tr key={c.id} style={{ animation:`slideUp .25s ${i*.03}s both`, borderBottom:'1px solid var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.background='var(--sand-50)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <td style={{ padding:'10px 14px', fontSize:11, fontFamily:'var(--font-m)', color:'var(--sand-500)' }}>{c.id}</td>
                        <td style={{ padding:'10px 14px', fontSize:13, fontWeight:500 }}>{emojiFor(c.crop)} {c.crop}</td>
                        <td style={{ padding:'10px 14px', fontSize:13 }}>{c.farmer}</td>
                        <td style={{ padding:'10px 14px', fontSize:11, fontFamily:'var(--font-m)', color:'var(--sand-600)' }}>{c.barangay}</td>
                        <td style={{ padding:'10px 14px', fontSize:11, fontFamily:'var(--font-m)', color:'var(--sand-500)' }}>{fmtShort(c.planted)}</td>
                        <td style={{ padding:'10px 14px', fontSize:11, fontFamily:'var(--font-m)', color:'var(--sand-500)' }}>{fmtShort(c.expectedHarvest)}</td>
                        <td style={{ padding:'10px 14px', minWidth:100 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <PBar pct={pct} color={barC} h={4}/>
                            <span style={{ fontSize:10, fontFamily:'var(--font-m)', color:'var(--sand-400)', whiteSpace:'nowrap' }}>{pct}%</span>
                          </div>
                        </td>
                        <td style={{ padding:'10px 14px' }}><Badge status={st}/></td>
                        <td style={{ padding:'10px 14px' }}>
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
      {del && <ConfirmDialog title="Delete Entry" desc={`Delete "${del.crop}" entry (${del.id})? This cannot be undone.`} onConfirm={confirmDel} onCancel={() => setDel(null)}/>}
    </div>
  );
}
