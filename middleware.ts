import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { AUTHORIZED_ROLES } from "./lib/client-auth";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/inventories(.*)",
  "/patients(.*)",
  "/payments(.*)",
  "/reports(.*)",
  "/profile(.*)",
  "/lab-results(.*)",
  "/drug-orders(.*)",
  "/feedback(.*)",
  "/walk-in-services(.*)",
  "/sales(.*)",
]);

const isProtectedApiRoute = createRouteMatcher(["/api/(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // API protection
  if (isProtectedApiRoute(req)) {
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Optional: further per-endpoint permission checks
    return;
  }

  // Page protection
  if (isProtectedRoute(req)) {
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      return Response.redirect(signInUrl);
    }
    try {
      // Use Clerk publishable endpoint via request (edge-safe)
      const base = process.env.CLERK_API_URL || "https://api.clerk.com";
      const key = process.env.CLERK_SECRET_KEY;
      let role: string | undefined = undefined;
      if (key) {
        try {
          const userRes = await fetch(`${base}/v1/users/${userId}`, {
            headers: { Authorization: `Bearer ${key}` },
          });
          if (userRes.ok) {
            const userJson: any = await userRes.json();
            role = userJson?.public_metadata?.role as string | undefined;
          }
        } catch (e) {
          console.warn("Clerk user fetch failed, continuing with no role", e);
        }
      }
      if (!role || !AUTHORIZED_ROLES.includes(role as any)) {
        const noAccessUrl = new URL("/", req.url);
        noAccessUrl.searchParams.set("unauthorized", "1");
        return Response.redirect(noAccessUrl);
      }
    } catch (e) {
      console.error("Middleware role check failed", e);
      const signInUrl = new URL("/sign-in", req.url);
      return Response.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/"],
};
