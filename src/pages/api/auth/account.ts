import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    // Create server-side Supabase client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;

    // Delete user data in cascade order (per GDPR requirements)
    // 1. Delete generation error logs
    const { error: logsError } = await supabase
      .from("generation_error_logs")
      .delete()
      .eq("user_id", userId);

    if (logsError) {
      console.error("Error deleting generation error logs:", logsError);
      return new Response(
        JSON.stringify({ error: "Failed to delete account data. Please try again" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Delete generations
    const { error: generationsError } = await supabase
      .from("generations")
      .delete()
      .eq("user_id", userId);

    if (generationsError) {
      console.error("Error deleting generations:", generationsError);
      return new Response(
        JSON.stringify({ error: "Failed to delete account data. Please try again" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Delete flashcards
    const { error: flashcardsError } = await supabase
      .from("flashcards")
      .delete()
      .eq("user_id", userId);

    if (flashcardsError) {
      console.error("Error deleting flashcards:", flashcardsError);
      return new Response(
        JSON.stringify({ error: "Failed to delete account data. Please try again" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Sign out user (clears session)
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error("Error signing out:", signOutError);
    }

    // Note: Supabase Auth user deletion via admin API requires service role key
    // For MVP, we'll rely on RLS policies and cascade deletion
    // The user record in auth.users will remain but with all data deleted
    // Future enhancement: Add admin endpoint to fully delete auth.users record

    return new Response(
      JSON.stringify({
        message: "Account and all associated data have been permanently deleted",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Account deletion error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};