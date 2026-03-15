import { useState, useCallback, useEffect } from 'react';
import { authAPI, cropsAPI, usersAPI, auditAPI, getToken, setToken, clearToken } from '../utils/api';

export function useAppState() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users,       setUsers]       = useState([]);
  const [crops,       setCrops]       = useState([]);
  const [auditLog,    setAuditLog]    = useState([]);
  const [page,        setPage]        = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) { clearToken(); return; }
      setCurrentUser({ id: payload.id, name: payload.name, role: payload.role, barangay_id: payload.barangayId });
      setPage(payload.role === 'admin' ? 'admin-dashboard' : 'user-dashboard');
    } catch { clearToken(); }
  }, []);

  const refreshCrops = useCallback(async () => {
    try { setCrops(await cropsAPI.getAll()); } catch (e) { console.error(e); }
  }, []);

  const refreshUsers = useCallback(async () => {
    try { setUsers(await usersAPI.getAll()); } catch (e) { console.error(e); }
  }, []);

  const refreshAudit = useCallback(async () => {
    try { setAuditLog(await auditAPI.getAll()); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    refreshCrops();
    refreshUsers(); // ✅ FIX 1: fetch users for ALL roles, not just admin
    if (currentUser.role === 'admin') { refreshAudit(); }
  }, [currentUser, refreshCrops, refreshUsers, refreshAudit]);

  const login = async (email, password, portal = null) => {
    try {
      const res = await authAPI.login(email, password, portal);
      if (!res.ok) return { ok: false, error: res.error };
      setToken(res.token);
      setCurrentUser(res.user);
      setPage(res.user.role === 'admin' ? 'admin-dashboard' : 'user-dashboard');
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message || 'Login failed.' }; }
  };

  const logout = () => {
    clearToken();
    setCurrentUser(null);
    setCrops([]); setUsers([]); setAuditLog([]);
    setPage(null);
  };

  const signUp = async (data) => {
    try {
      const res = await authAPI.signup(data);
      return res.ok ? { ok: true } : { ok: false, error: res.error }; 
    } catch (err) { return { ok: false, error: err.message }; }
  };

  const addCrop = async (data) => {
    const created = await cropsAPI.create(data);
    setCrops(p => [created, ...p]);
    return created.id;
  };

  const deleteCrop = async (id) => {
    await cropsAPI.remove(id);
    setCrops(p => p.filter(c => c.id !== id));
  };

  const toggleStatus = async (id) => {
    const res = await cropsAPI.toggleStatus(id);
    setCrops(p => p.map(c => c.id === id ? { ...c, status: res.status } : c));
  };

  const addUser = async (data) => {
    const created = await usersAPI.create(data);
    setUsers(p => [...p, created]);
  };

  const deleteUser = async (id) => {
    await usersAPI.remove(id);
    setUsers(p => p.filter(u => u.id !== id));
  };

  const updateCurrentUser = async (updated) => {
    const res = await usersAPI.update(updated.id, updated);
    setCurrentUser(res);
    setUsers(p => p.map(u => u.id === res.id ? res : u));
  };

  return {
    currentUser, users, crops, auditLog, page, setPage,
    login, logout, signUp,
    addCrop, deleteCrop, toggleStatus,
    addUser, deleteUser, updateCurrentUser,
  };
}