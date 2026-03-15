import { useState, useMemo } from 'react';
import { StatCard, PBar, Badge, Btn, useToast } from '../../components/UIComponents';
import { classify, emojiFor, growPct, daysLeft } from '../../utils/helpers';

export default function UserHarvestPage({ user, crops, onToggle }) {
  const myCrops = useMemo(() => crops.filter(c => c.barangay === user.barangay), [crops, user]);
  const [tab, setTab] = useState('all');
  const toast = useToast();

  const filtered = useMemo(() => tab === 'all' ? myCrops : myCrops.filter(c => classify(c) === tab), [myCrops, tab]);
  const stats = {
    total:     myCrops.length,
    growing:   myCrops.filter(c => classify(c) === 'growing').length,
    harvested: myCrops.filter(c => c.status === 'harvested').length,
    overdue:   myCrops.filter(c => classify(c) === 'overdue').length,
  };
  const tabs = ['all','growing','harvested','overdue'];

  return (
    <div style={{ animation:'slideUp .35s both' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[{l:'Total',n:stats.total,c:'var(--terra-400)',icon:'🌱'},{l:'Growing',n:stats.growing,c:'var(--teal-400)',icon:'📈'},
          {l:'Harvested',n:stats.harvested,c:'var(--amber-400)',icon:'✅'},{l:'Overdue',n:stats.overdue,c:'var(--terra-500)',icon:'⚠️'}].map((s,i) => (
          <StatCard key={s.l} icon={s.icon} num={s.n} label={s.l} color={s.c} i={i}/>
        ))}
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:14, background:'var(--surface)', border:'1px solid var(--border)',
        padding:5, borderRadius:6, width:'fit-content' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'6px 16px', background: tab===t?'var(--sand-900)':'transparent',
              color: tab===t?'#fff':'var(--sand-600)', border:'none', borderRadius:4,
              fontSize:12, fontFamily:'var(--font-m)', cursor:'pointer', textTransform:'capitalize', transition:'all .15s' }}>
            {t==='all'?`All (${stats.total})`:t==='growing'?`Growing (${stats.growing})`:
             t==='harvested'?`Done (${stats.harvested})`:`Overdue (${stats.overdue})`}
          </button>
        ))}
      </div>

      {filtered.length === 0
        ? <div style={{ textAlign:'center', padding:'60px', color:'var(--sand-400)', fontSize:14 }}>No {tab!=='all'?tab:''} entries found</div>
        : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
            {filtered.map((c,i) => {
              const st   = classify(c);
              const dl   = daysLeft(c.expectedHarvest);
              const pct  = c.status === 'harvested' ? 100 : growPct(c.planted, c.expectedHarvest);
              const barC = st==='overdue'?'var(--terra-400)':st==='harvested'?'var(--amber-400)':'var(--teal-400)';
              return (
                <div key={c.id} style={{ background:'var(--surface)', border:'1px solid var(--border)',
                  borderTop:`3px solid ${barC}`, padding:16, animation:`scaleIn .3s ${i*.05}s both`,
                  transition:'transform .2s, box-shadow .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(26,21,16,.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <div style={{ width:36, height:36, background:'var(--sand-100)', borderRadius:5,
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:19 }}>{emojiFor(c.crop)}</div>
                      <div>
                        <div style={{ fontFamily:'var(--font-d)', fontWeight:700, fontSize:14 }}>{c.crop}</div>
                        <div style={{ fontSize:11, color:'var(--sand-500)', fontFamily:'var(--font-m)' }}>{c.id}</div>
                      </div>
                    </div>
                    <Badge status={st}/>
                  </div>
                  <div style={{ fontSize:12, color:'var(--sand-600)', marginBottom:8 }}>👤 {c.farmer}</div>
                  <div style={{ display:'flex', gap:5, marginBottom:9, alignItems:'center' }}>
                    <PBar pct={pct} color={barC}/>
                    <span style={{ fontSize:10, fontFamily:'var(--font-m)', color:'var(--sand-400)', flexShrink:0 }}>{pct}%</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:11, fontFamily:'var(--font-m)', fontWeight:500,
                      color: st==='overdue'?'var(--terra-500)':st==='harvested'?'var(--amber-600)':'var(--teal-600)' }}>
                      {c.status==='harvested'?'✅ Done':dl===null?'—':dl<0?`${Math.abs(dl)}d overdue`:`${dl}d left`}
                    </span>
                    {c.status !== 'harvested' && (
                      <Btn small variant="teal" icon="✅" onClick={() => { onToggle(c.id); toast({ title:'Marked as harvested!', type:'success' }); }}>Harvest</Btn>
                    )}
                  </div>
                  {c.notes && (
                    <div style={{ marginTop:8, fontSize:11, color:'var(--sand-400)', fontStyle:'italic', borderTop:'1px solid var(--border)', paddingTop:6 }}>{c.notes}</div>
                  )}
                </div>
              );
            })}
          </div>
      }
    </div>
  );
}
