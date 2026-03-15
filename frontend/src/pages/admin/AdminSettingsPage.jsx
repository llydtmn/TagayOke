import { useState } from 'react';
import { Btn, useToast } from '../../components/UIComponents';

const SECTIONS = [
  {
    title: 'System Information', color: 'var(--terra-400)',
    fields: [
      { l:'System Name',      v:'Calbayog Farmers Crop Log System' },
      { l:'City/Municipality', v:'Calbayog City' },
      { l:'Province',          v:'Samar' },
      { l:'Region',            v:'Region VIII (Eastern Visayas)' },
    ],
  },
  {
    title: 'Notification Settings', color: 'var(--teal-400)',
    fields: [
      { l:'Days before harvest alert',           v:'7' },
      { l:'Overdue reminder interval (days)',     v:'3' },
      { l:'Admin email for reports',             v:'admin@calbayog.gov.ph' },
    ],
  },
  {
    title: 'Data Management', color: 'var(--amber-400)',
    fields: [
      { l:'Records per page',      v:'25' },
      { l:'Export format',         v:'CSV, PDF' },
      { l:'Data retention (years)', v:'5' },
    ],
  },
];

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const toast = useToast();

  const save = () => {
    toast({ title:'Settings saved', type:'success' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const iStyle = { width:'100%', padding:'10px 13px', border:'1px solid var(--border)',
    background:'var(--sand-50)', fontSize:13, fontFamily:'var(--font-b)', borderRadius:3, outline:'none' };

  return (
    <div style={{ animation:'slideUp .35s both', display:'flex', flexDirection:'column', gap:18 }}>
      {SECTIONS.map(s => (
        <div key={s.title} style={{ background:'var(--surface)', border:'1px solid var(--border)',
          borderLeft:`3px solid ${s.color}`, borderRadius:'0 8px 8px 0', overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', background:'var(--sand-50)', borderBottom:'1px solid var(--border)',
            fontFamily:'var(--font-d)', fontWeight:700, fontSize:14 }}>{s.title}</div>
          <div style={{ padding:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {s.fields.map(f => (
              <div key={f.l}>
                <div style={{ fontSize:10, fontFamily:'var(--font-m)', textTransform:'uppercase', letterSpacing:'.07em', color:'var(--sand-600)', marginBottom:5 }}>{f.l}</div>
                <input defaultValue={f.v} style={iStyle}
                  onFocus={e => e.target.style.borderColor='var(--terra-400)'}
                  onBlur={e  => e.target.style.borderColor='var(--border)'}/>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
        <Btn variant="secondary">Reset Defaults</Btn>
        <Btn variant="primary" onClick={save} icon={saved ? '✅' : '💾'}>{saved ? 'Saved!' : 'Save Settings'}</Btn>
      </div>
    </div>
  );
}
