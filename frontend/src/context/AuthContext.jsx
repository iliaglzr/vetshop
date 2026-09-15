import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { api } from '../api';
import { dashboardPath } from '../utils/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('user') || 'null'
      );
    } catch {
      return null;
    }
  });

  // -------------------------
  // Login
  // -------------------------
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', {
      email,
      password,
    });

    localStorage.setItem('token', data.token);
    localStorage.setItem(
      'user',
      JSON.stringify(data.user)
    );

    setUser(data.user);

    return data.user;
  };

  // -------------------------
  // Register
  // -------------------------
  const register = async (payload) => {
    const { data } = await api.post(
      '/auth/register',
      payload
    );

    localStorage.setItem('token', data.token);
    localStorage.setItem(
      'user',
      JSON.stringify(data.user)
    );

    setUser(data.user);

    return data.user;
  };

  // -------------------------
  // Logout
  // -------------------------
  const logout = async () => {
    try {
      if (localStorage.getItem('token')) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.log('Logout API error:', error);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setUser(null);
  };

  // -------------------------
  // Check current user
  // -------------------------
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      return;
    }

    api
      .get('/me')
      .then(({ data }) => {
        localStorage.setItem(
          'user',
          JSON.stringify(data)
        );

        setUser(data);
      })
      .catch(() => {
        logout();
      });
  }, []);

  // -------------------------
  // Context value
  // -------------------------
  const value = useMemo(
    () => ({
      user,

      login,

      register,

      logout,

      isLoggedIn:
        !!user &&
        !!localStorage.getItem('token'),

      // مسیر داشبورد کاربر
      dashboardPath: dashboardPath(
        user?.role
      ),
    }),
    [user]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}