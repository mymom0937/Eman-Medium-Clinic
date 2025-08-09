import { getAuth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { USER_ROLES } from '@/constants/user-roles';

interface AuthResult {
  userId: string | null;
  error: string | null;
}

export const verifyAuth = async (request: NextRequest): Promise<AuthResult> => {
  try {
    // Use getAuth with the request parameter
    const { userId } = getAuth(request);
    
    if (!userId) {
      return { error: 'Unauthorized: Please sign in to continue', userId: null };
    }
    
    return { userId, error: null };
  } catch (error) {
    return { error: 'Authentication failed', userId: null };
  }
}; 

export const AUTHORIZED_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.NURSE,
  USER_ROLES.LABORATORIST,
  USER_ROLES.PHARMACIST,
] as const;

export function hasDashboardAccess(userRole: string | null | undefined): boolean {
  if (!userRole) return false;
  return AUTHORIZED_ROLES.includes(userRole as any);
}

export function isAuthorizedRole(userRole: string | null | undefined): boolean {
  return hasDashboardAccess(userRole);
} 