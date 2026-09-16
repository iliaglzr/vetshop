import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { dashboardPath } from '../utils/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const [booting, setBooting] = useState(!!localStorage.getItem('token'));

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { if (localStorage.getItem('token')) await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setBooting(false);
      return;
    }

    api.get('/me').then(({ data }) => {
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
    }).catch(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }).finally(() => setBooting(false));
  }, []);

  const value = useMemo(() => ({
    user,
    login,
    register,
    logout,
    isLoggedIn: !!user && !!localStorage.getItem('token'),
    booting,
    dashboardPath: dashboardPath(user?.role),
  }), [user, booting]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
