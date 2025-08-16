import { User, UserRole } from './auth';

// Extend the base User interface with additional user management properties
export interface UserWithManagement extends User {
  isActive: boolean;
  lastLoginAt?: Date;
}

export interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  password?: string;
  isActive: boolean;
}

export interface UserSearchParams {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
} 