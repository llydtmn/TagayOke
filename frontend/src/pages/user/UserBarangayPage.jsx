import { useMemo } from 'react';
import { StatCard, TableShell, PBar, Badge } from '../../components/UIComponents';
import { classify, emojiFor, growPct, fmtShort } from '../../utils/helpers';

export default function UserBarangayPage({ user, crops }) {
  const myCrops = useMemo(() => crops.filter(c => c.barangay === user.barangay), [crops, user]);
  const stats = {
    total:     myCrops.length,
    growing:   myCrops.filter(c => classify(c) === 'growing').length,
    harvested: myCrops.filter(c => c.status === 'harvested').length,
    overdue:   myCrops.filter(c => classify(c) === 'overdue').length,
  };

  return (
    <div style={{ animation:'slideUp .35s both' }}>
      {/* Barangay hero */}
      <div style={{ background:'var(--sand-900)', padding:'22px 26px', marginBottom:22,
        position:'relative', overflow:'hidden', borderRadius:6, display:'flex', alignItems:'center', gap:20 }}>
        <div style={{ position:'absolute', inset:0,
          background:'radial-gradient(ellipse at 30% 50%,rgba(45,155,144,.2),transparent 60%)', pointerEvents:'none' }}/>
        <div style={{ width:56, height:56, background:'rgba(45,155,144,.2)', border:'2px solid rgba(45,155,144,.4)',
          borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0, position:'relative', zIndex:1 }}>📍</div>
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontSize:11, fontFamily:'var(--font-m)', color:'var(--teal-300)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:3 }}>
            Your assigned barangay
          </div>
          <div style={{ fontFamily:'var(--font-d)', fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'-.03em' }}>
            Brgy. {user.barangay}
          </div>
          <div style={{ fontSize:12, color:'var(--sand-400)', marginTop:2 }}>Calbayog City, Samar</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:22 }}>
        <StatCard icon="🌱" num={stats.total}     label="Total Crops" color="var(--terra-400)" i={0}/>
        <StatCard icon="📈" num={stats.growing}   label="Growing"     color="var(--teal-400)"  i={1}/>
        <StatCard icon="✅" num={stats.harvested} label="Harvested"   color="var(--amber-400)" i={2}/>
        <StatCard icon="⚠️" num={stats.overdue}   label="Overdue"     color="var(--terra-500)" i={3}/>
      </div>

      <TableShell title={`All Crops in Brgy. ${user.barangay}`} subtitle={`${myCrops.length} entries`} accentColor="var(--teal-400)">
        {myCrops.length === 0
          ? <div style={{ padding:'40px', textAlign:'center', color:'var(--sand-400)', fontSize:13 }}>No crop entries for this barangay yet.</div>
          : <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:500 }}>
                <thead>
                  <tr style={{ background:'var(--sand-900)' }}>
                    {['Crop','Farmer','Planted','Harvest','Progress','Status'].map(h => (
                      <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:10, fontFamily:'var(--font-m)',
                        textTransform:'uppercase', letterSpacing:'.08em', color:'var(--sand-400)', fontWeight:400, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myCrops.map((c,i) => {
                    const st  = classify(c);
                    const pct = c.status === 'harvested' ? 100 : growPct(c.planted, c.expectedHarvest);
                    return (
                      <tr key={c.id} style={{ borderBottom:'1px solid var(--border)', animation:`slideUp .25s ${i*.04}s both` }}
                        onMouseEnter={e => e.currentTarget.style.background='var(--sand-50)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <td style={{ padding:'9px 14px', fontSize:13, fontWeight:500 }}>{emojiFor(c.crop)} {c.crop}</td>
                        <td style={{ padding:'9px 14px', fontSize:13, color:'var(--sand-700)' }}>{c.farmer}</td>
                        <td style={{ padding:'9px 14px', fontSize:11, fontFamily:'var(--font-m)', color:'var(--sand-500)' }}>{fmtShort(c.planted)}</td>
                        <td style={{ padding:'9px 14px', fontSize:11, fontFamily:'var(--font-m)', color:'var(--sand-500)' }}>{fmtShort(c.expectedHarvest)}</td>
                        <td style={{ padding:'9px 14px', minWidth:90 }}>
                          <PBar pct={pct} color={st==='overdue'?'var(--terra-400)':st==='harvested'?'var(--amber-400)':'var(--teal-400)'} h={4}/>
                        </td>
                        <td style={{ padding:'9px 14px' }}><Badge status={st}/></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        }
      </TableShell>
    </div>
  );
}
