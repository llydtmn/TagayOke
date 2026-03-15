import { CROP_EMOJI } from '../data/constants';

export const fmtDate  = d => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
export const fmtShort = d => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : '—';
export const todayStr = () => new Date().toLocaleDateString('en-PH', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });

export const daysLeft = d => {
  if (!d) return null;
  const n = new Date(); n.setHours(0,0,0,0);
  const t = new Date(d); t.setHours(0,0,0,0);
  return Math.round((t - n) / 86400000);
};

export const genId = ids => {
  const nums = ids.map(id => parseInt(id.replace('CF-',''), 10)).filter(n => !isNaN(n));
  return `CF-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3,'0')}`;
};

export const growPct = (p, h) => {
  if (!p || !h) return 0;
  const s = new Date(p).getTime(), e = new Date(h).getTime(), n = Date.now();
  if (n >= e) return 100;
  if (n <= s) return 0;
  return Math.round((n - s) / (e - s) * 100);
};

export const emojiFor = c => CROP_EMOJI[c] ?? '🌱';

export const classify = c => {
  if (c.status === 'harvested') return 'harvested';
  return (daysLeft(c.expectedHarvest) ?? 0) < 0 ? 'overdue' : 'growing';
};
