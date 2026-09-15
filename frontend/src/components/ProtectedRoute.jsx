import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardPath } from '../utils/roles';

export default function ProtectedRoute({ roles = [] }) {
  const { user, isLoggedIn } = useAuth();
  const location = useLocation();

  // اگر لاگین نکرده باشد
  if (!isLoggedIn || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  // اگر Role اجازه ورود نداشته باشد
  if (roles.length > 0 && !roles.includes(user.role)) {
    return (
      <Navigate
        to={dashboardPath(user.role)}
        replace
      />
    );
  }

  // اجازه ورود دارد
  return <Outlet />;
}