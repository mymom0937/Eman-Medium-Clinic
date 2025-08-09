import { USER_ROLES } from '@/constants/user-roles';

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
