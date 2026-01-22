import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths - Auth pages and API endpoints that don't require authentication
const PUBLIC_PATHS = [
  // Root path (handles its own redirect logic)
  "/",
  // Auth pages
  "/login",
  "/register",
  "/reset-password",
  "/update-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/reset-password",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create server-side Supabase client with cookie handling
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Attach Supabase client to locals
  locals.supabase = supabase;

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Attach user to locals if authenticated
  if (user) {
    locals.user = {
      email: user.email!,
      id: user.id,
    };
  }

  // If accessing a public path, continue without redirect
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  // For protected routes, redirect to login if not authenticated
  if (!user) {
    return redirect("/login");
  }

  return next();
});
