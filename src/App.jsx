import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Host from './pages/Host';
import Remote from './pages/Remote';

// HashRouter keeps QR join links working on any static host with no rewrite rules.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/host/:code" element={<Host />} />
        <Route path="/r/:code" element={<Remote />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
