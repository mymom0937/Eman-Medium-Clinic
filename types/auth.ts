export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'SUPER_ADMIN' | 'NURSE' | 'LABORATORIST' | 'PHARMACIST';

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: Date;
  isAuthenticated?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  password: string;
} 