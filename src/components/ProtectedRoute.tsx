import { ReactNode, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/store/useStore';
import type { UserRole } from '@/types/pos';
import { toast } from 'sonner';

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
  const deniedNotifiedRef = useRef(false);
  const isDenied = Boolean(allowedRoles && !allowedRoles.includes(role));

  useEffect(() => {
    if (!isDenied || deniedNotifiedRef.current) return;
    toast.error('Access denied for your current role');
    deniedNotifiedRef.current = true;
  }, [isDenied]);

  if (requireLicense && !isLicensed) return <Navigate to="/license" replace />;
  if (!hasValidSession) return <Navigate to="/login" replace />;
  if (isDenied) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
