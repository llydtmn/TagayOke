const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ'; // no I, L, O to avoid mix-ups on a TV
export const makeRoomCode = () =>
  Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
export const joinUrl = (code) => `${location.origin}${location.pathname}#/r/${code}`;
