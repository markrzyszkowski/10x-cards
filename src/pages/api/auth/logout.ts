import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async ({ cookies, request }) => {
  try {
    // Create server-side Supabase client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Sign out the user
    const { error } = await supabase.auth.signOut();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Successful logout
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Logout error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred during logout" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
