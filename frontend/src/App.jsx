import './css/main.css';
import { useMemo, useState } from 'react';
import { ToastProvider } from './components/UIComponents';
import Sidebar from './components/Sidebar';
import { useAppState } from './hooks/useAppState';
import { classify, todayStr } from './utils/helpers';

// ── Auth / Portal ──────────────────────────────────────
import PortalSelectPage  from './pages/auth/PortalSelectPage';
import AdminLoginPage    from './pages/auth/AdminLoginPage';
import UserLoginPage     from './pages/auth/UserLoginPage';
import UserSignupPage    from './pages/auth/UserSignupPage';

// ── Admin Pages ────────────────────────────────────────
import AdminDashboardPage  from './pages/admin/AdminDashboardPage';
import AdminCropLogPage    from './pages/admin/AdminCropLogPage';
import AdminHarvestPage    from './pages/admin/AdminHarvestPage';
import AdminBarangayPage   from './pages/admin/AdminBarangayPage';
import AdminFarmersPage    from './pages/admin/Adminfarmerspage';
import AdminUsersPage      from './pages/admin/AdminUsersPage';
import AdminReportsPage    from './pages/admin/AdminReportsPage';
import AdminAuditPage      from './pages/admin/AdminAuditPage';
import AdminSettingsPage   from './pages/admin/AdminSettingsPage';
import AdminLandPage       from './pages/admin/Adminlandpage';

// ── User Pages ─────────────────────────────────────────
import UserDashboardPage   from './pages/user/UserDashboardPage';
import UserCropLogPage     from './pages/user/UserCropLogPage';
import UserAddEntryPage    from './pages/user/UserAddEntryPage';
import UserHarvestPage     from './pages/user/UserHarvestPage';
import UserBarangayPage    from './pages/user/UserBarangayPage';
import UserFieldGuidePage  from './pages/user/UserFieldGuidePage';
import UserProfilePage     from './pages/user/UserProfilePage';
// Reuse the admin farmers page for the user-facing farmers list (read-only view)
import UserFarmersPage     from './pages/admin/Adminfarmerspage';

/* ─── PAGE TITLES ─────────────────────────────────────── */
const TITLES = {
  'admin-dashboard': ['Dashboard',          'City Agriculture Overview'],
  'admin-croplog':   ['Crop Logs',          'All City-Wide Records'],
  'admin-harvest':   ['Harvest Records',    'City-Wide Progress'],
  'admin-barangay':  ['By Barangay',        'Location Analytics'],
  'admin-farmers':   ['Farmers List',       'All Registered Farmers'],
  'admin-users':     ['User Management',    'Accounts & Access'],
  'admin-reports':   ['Reports',            'Analytics & Exports'],
  'admin-audit':     ['Audit Log',          'System Activity'],
  'admin-settings':  ['Settings',           'System Configuration'],
  'admin-land':      ['Land Management',    'Farm Land Records per Barangay'],
  'user-dashboard':  ['My Dashboard',       'Farmer Overview'],
  'user-croplog':    ['My Crop Logs',       'My Entries'],
  'user-addentry':   ['Add Crop Entry',     'New Record'],
  'user-harvest':    ['Harvest Tracker',    'My Progress'],
  'user-barangay':   ['My Barangay',        'Barangay Overview'],
  'user-farmers':    ['Farmers List',       'All Farmers in the System'],  // ← NEW
  'user-guide':      ['Field Guide',        'Reference & Tips'],
  'user-profile':    ['My Profile',         'Account Settings'],
};

function TopBar({ page, user }) {
  const [title, subtitle] = TITLES[page] || ['—', '—'];
  return (
    <header style={{
      position: 'fixed', top: 0, left: 'var(--sidebar-w)', right: 0,
      height: 'var(--topbar-h)', background: 'rgba(255,255,255,.96)',
      backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', zIndex: 90,
    }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 17, color: 'var(--text-1)', letterSpacing: '-.02em' }}>{title}</h1>
        <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>{subtitle}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--text-3)',
          background: 'var(--slate-100)', padding: '4px 10px', borderRadius: 6,
        }}>
          {todayStr()}
        </div>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--forest-400), var(--earth-400))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-d)', fontWeight: 700, color: '#fff', fontSize: 13, cursor: 'pointer',
        }} title={user?.name}>
          {user?.avatar}
        </div>
      </div>
    </header>
  );
}

function Shell({
  user, page, onNav, onLogout,
  crops, users, auditLog,
  addCrop, deleteCrop, toggleStatus,
  addUser, deleteUser, updateCurrentUser,
}) {
  const isAdmin = user.role === 'admin';
  const myCrops = isAdmin ? crops : crops.filter(c => c.barangay === user.barangay);

  const stats = useMemo(() => ({
    total:     myCrops.length,
    growing:   myCrops.filter(c => classify(c) === 'growing').length,
    harvested: myCrops.filter(c => c.status === 'harvested').length,
    overdue:   myCrops.filter(c => classify(c) === 'overdue').length,
  }), [myCrops]);

  const renderPage = () => {
    if (isAdmin) {
      switch (page) {
        case 'admin-croplog':  return <AdminCropLogPage   crops={crops} onDelete={deleteCrop} onToggle={toggleStatus}/>;
        case 'admin-harvest':  return <AdminHarvestPage   crops={crops} onToggle={toggleStatus}/>;
        case 'admin-barangay': return <AdminBarangayPage  crops={crops}/>;
        case 'admin-farmers':  return <AdminFarmersPage   users={users} crops={crops} onAddUser={addUser} onDeleteUser={deleteUser}/>;
        case 'admin-users':    return <AdminUsersPage     users={users} onAddUser={addUser} onDeleteUser={deleteUser}/>;
        case 'admin-reports':  return <AdminReportsPage   crops={crops}/>;
        case 'admin-audit':    return <AdminAuditPage     auditLog={auditLog}/>;
        case 'admin-settings': return <AdminSettingsPage/>;
        case 'admin-land':     return <AdminLandPage      users={users} crops={crops}/>;
        default:               return <AdminDashboardPage crops={crops} users={users} onNav={onNav}/>;
      }
    } else {
      switch (page) {
        case 'user-croplog':  return <UserCropLogPage  user={user} crops={crops} onDelete={deleteCrop} onToggle={toggleStatus}/>;
        case 'user-addentry': return <UserAddEntryPage user={user} onAdd={addCrop} onNav={onNav}/>;
        case 'user-harvest':  return <UserHarvestPage  user={user} crops={crops} onToggle={toggleStatus}/>;
        case 'user-barangay': return <UserBarangayPage user={user} crops={crops}/>;
        case 'user-farmers':  return <UserFarmersPage  users={users} crops={crops} onAddUser={addUser} onDeleteUser={deleteUser}/>;  // ← NEW
        case 'user-guide':    return <UserFieldGuidePage/>;
        case 'user-profile':  return <UserProfilePage  user={user} onUpdateUser={updateCurrentUser}/>;
        default:              return <UserDashboardPage user={user} crops={crops} onNav={onNav}/>;
      }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar user={user} active={page} onNav={onNav} stats={stats} onLogout={onLogout}/>
      <div style={{ marginLeft: 'var(--sidebar-w)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar page={page} user={user}/>
        <main style={{
          marginTop: 'var(--topbar-h)', padding: '24px 28px',
          flex: 1, background: 'var(--bg)',
        }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const state = useAppState();
  const [authView, setAuthView] = useState(null);

  if (state.currentUser) {
    return (
      <ToastProvider>
        <Shell
          user={state.currentUser}
          page={state.page}
          onNav={state.setPage}
          onLogout={() => { state.logout(); setAuthView(null); }}
          crops={state.crops}
          users={state.users}
          auditLog={state.auditLog}
          addCrop={state.addCrop}
          deleteCrop={state.deleteCrop}
          toggleStatus={state.toggleStatus}
          addUser={state.addUser}
          deleteUser={state.deleteUser}
          updateCurrentUser={state.updateCurrentUser}
        />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      {authView === null && (
        <PortalSelectPage onSelect={portal => setAuthView(`${portal}-login`)}/>
      )}
      {authView === 'admin-login' && (
        <AdminLoginPage onLogin={state.login} onBack={() => setAuthView(null)}/>
      )}
      {authView === 'user-login' && (
        <UserLoginPage onLogin={state.login} onBack={() => setAuthView(null)} onSignUp={() => setAuthView('user-signup')}/>
      )}
      {authView === 'user-signup' && (
        <UserSignupPage onSignUp={state.signUp} onBack={() => setAuthView('user-login')}/>
      )}
    </ToastProvider>
  );
}