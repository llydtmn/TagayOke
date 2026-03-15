import { useMemo } from 'react';
import { StatCard, TableShell, PBar, useToast } from '../../components/UIComponents';
import { classify, emojiFor } from '../../utils/helpers';

function exportCSV(crops) {
  const headers = ['ID', 'Crop', 'Farmer', 'Barangay', 'Planted', 'Expected Harvest', 'Status', 'Notes'];
  const rows = crops.map(c => [
    c.id,
    c.crop,
    c.farmer,
    c.barangay,
    c.planted,
    c.expectedHarvest,
    classify(c),
    (c.notes || '').replace(/,/g, ';'),
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `calbayog-crops-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminReportsPage({ crops }) {
  const toast = useToast();

  const stats = useMemo(() => {
    const total = crops.length;
    const byStatus = { growing: 0, harvested: 0, overdue: 0 };
    crops.forEach(c => { const s = classify(c); byStatus[s] = (byStatus[s] || 0) + 1; });
    const byCrop = {};
    crops.forEach(c => { byCrop[c.crop] = (byCrop[c.crop] || 0) + 1; });
    const byBgy = {};
    crops.forEach(c => { byBgy[c.barangay] = (byBgy[c.barangay] || 0) + 1; });
    const topBgy  = Object.entries(byBgy).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const topCrop = Object.entries(byCrop).sort((a, b) => b[1] - a[1]);
    const successRate = total > 0 ? Math.round((byStatus.harvested / total) * 100) : 0;
    return { total, byStatus, topBgy, topCrop, successRate, activeBgy: [...new Set(crops.map(c => c.barangay))].length };
  }, [crops]);

  const maxBgy = stats.topBgy[0]?.[1] || 1;

  const handleExport = (type) => {
    if (type === 'CSV') {
      exportCSV(crops);
      toast({ title: 'CSV exported', sub: `${crops.length} records downloaded`, type: 'success' });
    } else {
      toast({ title: `${type} export coming soon`, sub: 'This feature is under development', type: 'info' });
    }
  };

  return (
    <div style={{ animation: 'slideUp .35s both' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard icon="📊" num={stats.total}            label="Total Records"    color="var(--terra-400)" i={0}/>
        <StatCard icon="📍" num={stats.activeBgy}        label="Active Barangays" color="var(--teal-400)"  i={1}/>
        <StatCard icon="✅" num={`${stats.successRate}%`} label="Harvest Rate"    color="var(--amber-400)" i={2}/>
        <StatCard icon="⚠️" num={stats.byStatus.overdue} label="Overdue"          color="var(--terra-500)" i={3}/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Status breakdown */}
        <TableShell title="Status Breakdown" accentColor="var(--teal-400)">
          <div style={{ padding: 20 }}>
            {[
              { l: 'Growing',   n: stats.byStatus.growing,   c: 'var(--teal-400)'  },
              { l: 'Harvested', n: stats.byStatus.harvested, c: 'var(--amber-400)' },
              { l: 'Overdue',   n: stats.byStatus.overdue,   c: 'var(--terra-400)' },
            ].map(s => (
              <div key={s.l} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{s.l}</span>
                  <span style={{ fontFamily: 'var(--font-m)', fontSize: 12, color: 'var(--sand-500)' }}>
                    {s.n} ({stats.total ? Math.round((s.n / stats.total) * 100) : 0}%)
                  </span>
                </div>
                <PBar pct={stats.total ? Math.round((s.n / stats.total) * 100) : 0} color={s.c} h={10}/>
              </div>
            ))}
          </div>
        </TableShell>

        {/* Crop distribution */}
        <TableShell title="Crop Distribution" accentColor="var(--amber-400)">
          <div style={{ padding: 20 }}>
            {stats.topCrop.map(([crop, n]) => (
              <div key={crop} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 18, width: 26, textAlign: 'center' }}>{emojiFor(crop)}</span>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--sand-700)' }}>{crop}</span>
                <div style={{ width: 100 }}><PBar pct={Math.round((n / stats.total) * 100)} color="var(--terra-400)" h={5}/></div>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: 12, color: 'var(--sand-500)', width: 24, textAlign: 'right' }}>{n}</span>
              </div>
            ))}
          </div>
        </TableShell>
      </div>

      {/* Top barangays */}
      <TableShell title="Top Barangays by Activity" subtitle="Ranked by total crop entries" accentColor="var(--terra-400)">
        <div style={{ padding: 20 }}>
          {stats.topBgy.map(([name, count], i) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--sand-400)', width: 18, textAlign: 'right' }}>{i + 1}</span>
              <span style={{ fontSize: 13, color: 'var(--sand-700)', width: 160, flexShrink: 0, fontWeight: 500 }}>{name}</span>
              <div style={{ flex: 1 }}><PBar pct={(count / maxBgy) * 100} color="var(--terra-400)" h={8}/></div>
              <span style={{ fontFamily: 'var(--font-m)', fontSize: 12, color: 'var(--sand-500)', width: 24, textAlign: 'right' }}>{count}</span>
            </div>
          ))}
        </div>
      </TableShell>

      {/* Export panel */}
      <div style={{ marginTop: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--teal-400)', borderRadius: '0 8px 8px 0', padding: 22 }}>
        <div style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>📁 Export Reports</div>
        <div style={{ fontSize: 12, color: 'var(--sand-500)', fontFamily: 'var(--font-m)', marginBottom: 18 }}>
          Download crop data in your preferred format. CSV export includes all {crops.length} records.
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Export CSV',   icon: '📄', type: 'CSV',   desc: 'Download real .csv file', color: 'var(--teal-400)',  active: true  },
            { label: 'Export PDF',   icon: '📋', type: 'PDF',   desc: 'Coming soon',             color: 'var(--sand-400)', active: false },
            { label: 'Export Excel', icon: '📊', type: 'Excel', desc: 'Coming soon',             color: 'var(--sand-400)', active: false },
          ].map(btn => (
            <div key={btn.type} onClick={() => handleExport(btn.type)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
                background: btn.active ? 'var(--teal-100)' : 'var(--sand-50)',
                border: `1px solid ${btn.active ? 'var(--teal-400)' : 'var(--border)'}`,
                borderRadius: 4, cursor: 'pointer',
                transition: 'transform .15s, box-shadow .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,21,16,.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
              <span style={{ fontSize: 22 }}>{btn.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: btn.active ? 'var(--teal-600)' : 'var(--sand-600)' }}>{btn.label}</div>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-m)', color: btn.active ? 'var(--teal-500)' : 'var(--sand-400)', marginTop: 1 }}>{btn.desc}</div>
              </div>
              {btn.active && (
                <span style={{ marginLeft: 4, fontSize: 10, fontFamily: 'var(--font-m)', padding: '2px 7px', borderRadius: 100, background: 'var(--teal-400)', color: '#fff' }}>
                  Ready
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}