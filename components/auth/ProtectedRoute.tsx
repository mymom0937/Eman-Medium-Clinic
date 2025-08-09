'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/useUserRole';
import { hasDashboardAccess } from '@/lib/client-auth';
import { PageLoader } from '@/components/common/loading-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { userRole, isLoaded } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !hasDashboardAccess(userRole)) {
      router.push('/');
    }
  }, [userRole, isLoaded, router]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <PageLoader text="Checking permissions..." />
      </div>
    );
  }

  if (!hasDashboardAccess(userRole)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">
            Access Denied
          </h1>
          <p className="text-text-secondary mb-6">
            You don't have permission to access this page. Please contact your administrator.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-accent-color text-white rounded-md hover:bg-accent-hover"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
