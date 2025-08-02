import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

interface AuthPharmacistResult {
  success: boolean;
  message?: string;
}

const authPharmacist = async (userId: string): Promise<boolean> => {
    try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(userId);

        if (user.publicMetadata.role === 'PHARMACIST') {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error in authPharmacist:', error);
        return false;
    }
}

export default authPharmacist; 