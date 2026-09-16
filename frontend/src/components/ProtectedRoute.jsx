import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardPath } from '../utils/roles';

export default function ProtectedRoute({ roles }) {
  const { user, isLoggedIn, booting } = useAuth();
  const location = useLocation();

  if (booting) return <div className="auth"><div className="panel center">در حال بررسی حساب...</div></div>;

  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles?.length && !roles.includes(user.role)) return <Navigate to={dashboardPath(user.role)} replace />;
  return <Outlet />;
}
