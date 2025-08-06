import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/inventories(.*)',
  '/patients(.*)',
  '/payments(.*)',
  '/reports(.*)',
  '/profile(.*)',
  '/lab-results(.*)',
  '/drug-orders(.*)',
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
    return auth().then(({ userId }) => {
      if (!userId) {
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