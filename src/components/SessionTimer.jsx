import { formatLeft } from '../utils/hostCode';

const WARN_MS = 10 * 60 * 1000;

// Small pill on the host screen: time left in this session. Turns pink in the last 10 minutes.
export default function SessionTimer({ left }) {
  if (left == null) return null;
  const warn = left <= WARN_MS;
  return (
    <p className={`session-timer ${warn ? 'warn' : ''}`} role="timer" aria-live="off">
      {warn ? 'Session ends in ' : 'Time left '}<b>{formatLeft(left)}</b>
    </p>
  );
}
