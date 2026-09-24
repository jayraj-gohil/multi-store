import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/domain';

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: Role[] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}
