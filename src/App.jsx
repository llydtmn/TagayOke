import { useEffect } from 'react';
import { MemoryRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Host from './pages/Host';
import Remote from './pages/Remote';

// The address bar always stays at the plain site address (no "#/r/ABCD").
// QR / shared links still carry the room in the hash (#/r/ABCD): we read it once on load, then clear it.
// The current page is remembered per tab, so refreshing keeps you in the same room.
const KEY = 'tagayoke:route';

function startPath() {
  const fromLink = location.hash.replace(/^#/, '');
  if (fromLink.startsWith('/')) return fromLink;
  try { return sessionStorage.getItem(KEY) || '/'; } catch { return '/'; }
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
  return (
    <MemoryRouter initialEntries={[startPath()]}>
      <RouteKeeper />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/host/:code" element={<Host />} />
        <Route path="/r/:code" element={<Remote />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MemoryRouter>
  );
}