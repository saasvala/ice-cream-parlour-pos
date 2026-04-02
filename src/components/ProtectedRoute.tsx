import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/store/useStore';
import type { UserRole } from '@/types/pos';

export default function ProtectedRoute({
  children,
  requireLicense = true,
  allowedRoles,
}: {
  children: ReactNode;
  requireLicense?: boolean;
  allowedRoles?: UserRole[];
}) {
  const { isLicensed, hasValidSession, role } = useAuth();

  if (requireLicense && !isLicensed) return <Navigate to="/license" replace />;
  if (!hasValidSession) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
