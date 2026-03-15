import { useState, useMemo } from 'react';
import { StatCard, PBar, Btn, Badge, useToast } from '../../components/UIComponents';
import { classify, emojiFor, growPct, daysLeft } from '../../utils/helpers';

export default function AdminHarvestPage({ crops, onToggle }) {
  const [tab, setTab] = useState('all');
  const toast = useToast();

  const filtered = useMemo(() => tab === 'all' ? crops : crops.filter(c => classify(c) === tab), [crops, tab]);
  const stats = {
    total:     crops.length,
    growing:   crops.filter(c => classify(c) === 'growing').length,
    harvested: crops.filter(c => c.status === 'harvested').length,
    overdue:   crops.filter(c => classify(c) === 'overdue').length,
  };
  const tabs = ['all','growing','harvested','overdue'];

  return (
    <div style={{ animation:'slideUp .35s both' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {[{l:'Total',n:stats.total,c:'var(--terra-400)',icon:'🌾'},{l:'Growing',n:stats.growing,c:'var(--teal-400)',icon:'📈'},
          {l:'Harvested',n:stats.harvested,c:'var(--amber-400)',icon:'✅'},{l:'Overdue',n:stats.overdue,c:'var(--terra-500)',icon:'⚠️'}].map((s,i) => (
          <StatCard key={s.l} icon={s.icon} num={s.n} label={s.l} color={s.c} i={i}/>
        ))}
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:16, background:'var(--surface)', border:'1px solid var(--border)',
        padding:6, borderRadius:6, width:'fit-content' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'7px 18px', background: tab===t?'var(--sand-900)':'transparent',
              color: tab===t?'#fff':'var(--sand-600)', border:'none', borderRadius:4,
              fontSize:12, fontFamily:'var(--font-m)', cursor:'pointer', textTransform:'capitalize', transition:'all .15s' }}>
            {t==='all'?`All (${stats.total})`:t==='growing'?`Growing (${stats.growing})`:
             t==='harvested'?`Harvested (${stats.harvested})`:`Overdue (${stats.overdue})`}
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
        {filtered.map((c,i) => {
          const st   = classify(c);
          const dl   = daysLeft(c.expectedHarvest);
          const pct  = c.status === 'harvested' ? 100 : growPct(c.planted, c.expectedHarvest);
          const barC = st==='overdue'?'var(--terra-400)':st==='harvested'?'var(--amber-400)':'var(--teal-400)';
          return (
            <div key={c.id} style={{ background:'var(--surface)', border:'1px solid var(--border)',
              borderTop:`3px solid ${barC}`, padding:18, animation:`scaleIn .3s ${i*.04}s both`,
              transition:'transform .2s, box-shadow .2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(26,21,16,.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:38, height:38, background:'var(--sand-100)', borderRadius:6,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{emojiFor(c.crop)}</div>
                  <div>
                    <div style={{ fontFamily:'var(--font-d)', fontWeight:700, fontSize:14 }}>{c.crop}</div>
                    <div style={{ fontSize:11, color:'var(--sand-500)', fontFamily:'var(--font-m)' }}>{c.barangay}</div>
                  </div>
                </div>
                <Badge status={st}/>
              </div>
              <div style={{ fontSize:12, color:'var(--sand-600)', marginBottom:8 }}>👤 {c.farmer}</div>
              <div style={{ display:'flex', gap:4, marginBottom:10, alignItems:'center' }}>
                <PBar pct={pct} color={barC}/>
                <span style={{ fontSize:10, fontFamily:'var(--font-m)', color:'var(--sand-400)', flexShrink:0 }}>{pct}%</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11, fontFamily:'var(--font-m)', fontWeight:500,
                  color: st==='overdue'?'var(--terra-500)':st==='harvested'?'var(--amber-600)':'var(--teal-600)' }}>
                  {c.status==='harvested'?'✅ Completed':dl===null?'—':dl<0?`${Math.abs(dl)}d overdue`:`${dl}d left`}
                </span>
                {c.status !== 'harvested' && (
                  <Btn small variant="teal" icon="✅" onClick={() => { onToggle(c.id); toast({ title:'Marked harvested!', type:'success' }); }}>Harvest</Btn>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
