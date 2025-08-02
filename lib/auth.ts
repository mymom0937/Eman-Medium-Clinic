import { getAuth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

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