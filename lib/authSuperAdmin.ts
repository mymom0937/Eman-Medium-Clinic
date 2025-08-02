import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

interface AuthSuperAdminResult {
  success: boolean;
  message?: string;
}

const authSuperAdmin = async (userId: string): Promise<boolean> => {
    try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(userId);

        if (user.publicMetadata.role === 'SUPER_ADMIN') {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error in authSuperAdmin:', error);
        return false;
    }
}

export default authSuperAdmin; 