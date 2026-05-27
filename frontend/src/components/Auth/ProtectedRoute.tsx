import { Navigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const from = `${location.pathname}${location.search}${location.hash}`;

  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from }} />;
  if (adminOnly && !isAdmin) return <Navigate to={unauthorizedTo} replace />;
  return <>{children}</>;
}
