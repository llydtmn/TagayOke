import { TableShell } from '../../components/UIComponents';

export default function AdminAuditPage({ auditLog }) {
  return (
    <div style={{ animation:'slideUp .35s both' }}>
      <TableShell title="System Audit Log" subtitle="All user actions recorded with timestamps" accentColor="var(--teal-400)">
        <div style={{ maxHeight:600, overflowY:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--sand-900)', position:'sticky', top:0, zIndex:2 }}>
                {['Time','User','Action'].map(h => (
                  <th key={h} style={{ padding:'9px 16px', textAlign:'left', fontSize:10, fontFamily:'var(--font-m)',
                    textTransform:'uppercase', letterSpacing:'.08em', color:'var(--sand-400)', fontWeight:400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auditLog.length === 0
                ? <tr><td colSpan={3} style={{ padding:'40px', textAlign:'center', color:'var(--sand-400)', fontSize:13 }}>No activity recorded yet</td></tr>
                : auditLog.map((log, i) => (
                  <tr key={log.id} style={{ borderBottom:'1px solid var(--border)', animation:`slideUp .2s ${i*.025}s both` }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--sand-50)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'10px 16px', fontSize:11, fontFamily:'var(--font-m)', color:'var(--sand-500)', whiteSpace:'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString('en-PH', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' })}
                    </td>
                    <td style={{ padding:'10px 16px', fontSize:13, fontWeight:500 }}>{log.userName}</td>
                    <td style={{ padding:'10px 16px', fontSize:13, color:'var(--sand-600)' }}>{log.action}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </TableShell>
    </div>
  );
}
