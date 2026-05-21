import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function ProtectedRoute({
  children,
  adminOnly = false,
  unauthorizedTo = '/',
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
  unauthorizedTo?: string;
}) {
  const { isLoggedIn, isAdmin } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to={unauthorizedTo} replace />;
  return <>{children}</>;
}
