import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/inventory(.*)',
  '/patients(.*)',
  '/sales(.*)',
  '/payments(.*)',
  '/reports(.*)',
  '/profile(.*)',
]);

export default clerkMiddleware((auth, req) => {
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
    '/((?!.+\\.[\\w]+$|_next|api).*)',
    '/',
  ],
};