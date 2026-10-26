import { useEffect, useState } from 'react';
import { api } from '../services';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'DEL', '0', 'RES'];

// Videoke-style remote: type a 5-digit song number, see the song, then reserve it.
export default function Keypad({ onReserve, onList }) {
  const [digits, setDigits] = useState('');
  const [song, setSong] = useState(null); // null = still typing or loading, false = no such number

  useEffect(() => {
    setSong(null);
    if (digits.length !== 5) return undefined;
    let live = true;
    api.listSongs(digits).then((r) => live && setSong(r.find((s) => String(s.code) === digits) || false));
    return () => { live = false; };
  }, [digits]);

  const reserve = (first) => {
    if (!song) return;
    onReserve(song, { first });
    setDigits('');
  };
  const press = (k) => {
    if (k === 'DEL') return setDigits((d) => d.slice(0, -1));
    if (k === 'RES') return reserve(false);
    return setDigits((d) => (d.length < 5 ? d + k : d));
  };

  let line = 'Enter a 5-digit song number';
  if (digits.length === 5) line = song === null ? 'Looking up…' : song ? `${song.title} · ${song.artist}` : 'No song with that number';

  return (
    <section className="keypad">
      <div className="lcd">
        <p className="lcd-num" aria-live="polite">{digits.padEnd(5, '–')}</p>
        <p className="lcd-song">{line}</p>
      </div>
      <div className="keys">
        {KEYS.map((k) => (
          <button key={k} className={`key ${k === 'RES' ? 'res' : ''} ${k === 'DEL' ? 'del' : ''}`} onClick={() => press(k)}>{k}</button>
        ))}
      </div>
      <div className="keys-row">
        <button className="key first" disabled={!song} onClick={() => reserve(true)}>FIRST</button>
        <button className="key list" onClick={onList}>LIST</button>
      </div>
    </section>
  );
}
