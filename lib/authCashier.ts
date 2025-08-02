import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

interface AuthCashierResult {
  success: boolean;
  message?: string;
}

const authCashier = async (userId: string): Promise<boolean> => {
    try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(userId);

        if (user.publicMetadata.role === 'CASHIER') {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error in authCashier:', error);
        return false;
    }
}

export default authCashier; 