import { useCallback, useEffect, useState } from 'react';
import { MemoryRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Host from './pages/Host';
import Remote from './pages/Remote';
import Admin from './pages/Admin';
import Splash from './components/Splash';

// The address bar always stays at the plain site address (no "#/r/ABCD").
// QR / shared links still carry the room in the hash (#/r/ABCD): we read it once on load, then clear it.
// The current page is remembered per tab, so refreshing keeps you in the same room.
const KEY = 'tagayoke:route';

function startPath() {
  const fromLink = location.hash.replace(/^#/, '');
  if (fromLink.startsWith('/')) return fromLink;
  try { return sessionStorage.getItem(KEY) || '/'; } catch { return '/'; }
}

// The splash plays once per tab, and only when the app opens on the start page (not when a QR link drops you straight into a room).
// To play it on every page load instead, remove the sessionStorage lines in shouldSplash() and finishSplash().
const SPLASH_KEY = 'tagayoke:splash';

function shouldSplash() {
  if (startPath() !== '/') return false;
  try { return !sessionStorage.getItem(SPLASH_KEY); } catch { return true; }
}

function RouteKeeper() {
  const { pathname } = useLocation();
  useEffect(() => {
    try { sessionStorage.setItem(KEY, pathname); } catch { /* private mode: refresh just goes home */ }
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  }, [pathname]);
  return null;
}

export default function App() {
  const [splash, setSplash] = useState(shouldSplash);
  const finishSplash = useCallback(() => {
    try { sessionStorage.setItem(SPLASH_KEY, '1'); } catch { /* private mode: splash may replay on refresh */ }
    setSplash(false);
  }, []);
  return (
    <>
      {splash && <Splash onDone={finishSplash} />}
      <MemoryRouter initialEntries={[startPath()]}>
        <RouteKeeper />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/host/:code" element={<Host />} />
          <Route path="/r/:code" element={<Remote />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MemoryRouter>
    </>
  );
}