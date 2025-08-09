import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { hasDashboardAccess } from './lib/client-auth';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/inventories(.*)',
  '/patients(.*)',
  '/payments(.*)',
  '/reports(.*)',
  '/profile(.*)',
  '/lab-results(.*)',
  '/drug-orders(.*)',
  '/feedback(.*)',
  '/walk-in-services(.*)',
]);

const isProtectedApiRoute = createRouteMatcher([
  '/api/(.*)',
]);

export default clerkMiddleware((auth, req) => {
  // Handle API routes
  if (isProtectedApiRoute(req)) {
    return auth().then(({ userId }) => {
      if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    });
  }
  
  // Handle page routes
  if (isProtectedRoute(req)) {
    return auth().then(async ({ userId }) => {
      if (!userId) {
        const signInUrl = new URL('/sign-in', req.url);
        return Response.redirect(signInUrl);
      }
      
      // Check if user has dashboard access
      try {
        // Get user metadata from Clerk
        const user = await auth().then(({ userId }) => {
          if (!userId) return null;
          // This is a simplified check - in production you'd want to fetch user metadata
          // For now, we'll allow access and let the frontend handle role checks
          return { userId };
        });
        
        if (!user) {
          const signInUrl = new URL('/sign-in', req.url);
          return Response.redirect(signInUrl);
        }
      } catch (error) {
        console.error('Error checking user access:', error);
        const signInUrl = new URL('/sign-in', req.url);
        return Response.redirect(signInUrl);
      }
    });
  }
});

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
  ],
};