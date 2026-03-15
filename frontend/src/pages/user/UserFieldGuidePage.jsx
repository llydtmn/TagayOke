import { useState } from 'react';
import { CROPS } from '../../data/constants';
import { emojiFor } from '../../utils/helpers';

const TABS = ['All Crops','Planting Tips','Harvest Guide','About'];

const PLANTING_TIPS = [
  ['Rice',    'Lowland: Oct–Nov. Upland: Jun–Jul. Use certified seeds, 20-30 seeds/sqm.'],
  ['Corn',    'Dry season: Nov–Jan. Wet season: May–Jun. Plant 75cm x 25cm spacing.'],
  ['Banana',  'Year-round. Space 3x3m. Use tissue culture or suckers for propagation.'],
  ['Coconut', 'Best rainy season. 9x9m triangular spacing. Regular fertilization needed.'],
  ['Tomato',  'Oct–Feb (cool dry). Raised beds, drip irrigation recommended.'],
  ['Eggplant','Sep–Feb. Stake plants at 30cm. Watch for fruit borer pest.'],
];

const HARVEST_GUIDE = [
  ['Rice',    'Harvest 110–120 days after transplanting. Moisture 20–25%.'],
  ['Corn',    'Harvest 70–90 days after planting when husks are dry.'],
  ['Banana',  'Harvest 9–12 months. Pick when fingers are full and rounded.'],
  ['Cassava', 'Harvest 8–12 months after planting. Check root size before pulling.'],
  ['Tomato',  'Harvest 60–70 days. Pick when 50–75% color change.'],
  ['Pechay',  'Harvest 30–40 days. Cut when 4–6 leaves are fully formed.'],
];

export default function UserFieldGuidePage() {
  const [tab, setTab] = useState(0);

  const content = [
    /* All Crops */
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12 }}>
      {CROPS.map(c => (
        <div key={c} style={{ background:'var(--surface)', border:'1px solid var(--border)',
          padding:'16px 12px', textAlign:'center', borderRadius:6, transition:'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='2px 4px 12px rgba(26,21,16,.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
          <div style={{ fontSize:32, marginBottom:8 }}>{emojiFor(c)}</div>
          <div style={{ fontFamily:'var(--font-d)', fontWeight:700, fontSize:13 }}>{c}</div>
        </div>
      ))}
    </div>,

    /* Planting Tips */
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
      {PLANTING_TIPS.map(([crop, tip]) => (
        <div key={crop} style={{ background:'var(--surface)', border:'1px solid var(--border)',
          borderLeft:'3px solid var(--teal-400)', padding:16, borderRadius:'0 6px 6px 0',
          transition:'transform .15s, box-shadow .15s' }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(26,21,16,.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
          <div style={{ fontFamily:'var(--font-d)', fontWeight:700, fontSize:13, marginBottom:6 }}>{emojiFor(crop)} {crop}</div>
          <div style={{ fontSize:12, color:'var(--sand-600)', lineHeight:1.7 }}>{tip}</div>
        </div>
      ))}
    </div>,

    /* Harvest Guide */
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
      {HARVEST_GUIDE.map(([crop, guide]) => (
        <div key={crop} style={{ background:'var(--surface)', border:'1px solid var(--border)',
          borderLeft:'3px solid var(--amber-400)', padding:16, borderRadius:'0 6px 6px 0',
          transition:'transform .15s, box-shadow .15s' }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(26,21,16,.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
          <div style={{ fontFamily:'var(--font-d)', fontWeight:700, fontSize:13, marginBottom:6 }}>{emojiFor(crop)} {crop}</div>
          <div style={{ fontSize:12, color:'var(--sand-600)', lineHeight:1.7 }}>{guide}</div>
        </div>
      ))}
    </div>,

    /* About */
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderTop:'3px solid var(--terra-400)', padding:28, maxWidth:600 }}>
      <div style={{ width:48, height:48, background:'var(--terra-500)', display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:24, marginBottom:18, clipPath:'polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)' }}>🌱</div>
      <div style={{ fontFamily:'var(--font-d)', fontSize:20, fontWeight:800, marginBottom:8 }}>Calbayog Farmers Crop Log System</div>
      <div style={{ fontSize:13, color:'var(--sand-600)', lineHeight:1.8, marginBottom:14 }}>
        A digital crop tracking solution built for the farmers and agriculture office of Calbayog City, Samar.
        Log crop entries, track harvest progress, and get actionable insights across all 117 barangays.
      </div>
      <div style={{ fontSize:12, fontFamily:'var(--font-m)', color:'var(--sand-400)' }}>
        Version 2.0 · City Agriculture Office · Calbayog City, Samar, PH
      </div>
    </div>,
  ];

  return (
    <div style={{ animation:'slideUp .35s both' }}>
      <div style={{ display:'flex', gap:4, marginBottom:18, background:'var(--surface)', border:'1px solid var(--border)',
        padding:5, borderRadius:6, width:'fit-content' }}>
        {TABS.map((t,i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding:'7px 18px', background: tab===i?'var(--sand-900)':'transparent',
              color: tab===i?'#fff':'var(--sand-600)', border:'none', borderRadius:4,
              fontSize:12, fontFamily:'var(--font-m)', cursor:'pointer', transition:'all .15s' }}>{t}</button>
        ))}
      </div>
      <div style={{ animation:'fadeIn .25s both' }}>{content[tab]}</div>
    </div>
  );
}
