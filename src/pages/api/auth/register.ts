import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate email length
    if (email.length > 255) {
      return new Response(JSON.stringify({ error: "Email must be less than 255 characters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create server-side Supabase client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt to sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Map Supabase errors to user-friendly messages
      let errorMessage = "Registration failed. Please try again";

      if (error.message.includes("already registered")) {
        errorMessage = "This email is already registered. Please sign in instead";
      } else if (error.message.includes("password")) {
        errorMessage = error.message;
      } else if (error.message.includes("email")) {
        errorMessage = "Please enter a valid email address";
      } else if (error.message.includes("rate limit")) {
        errorMessage = "Too many registration attempts. Please try again later";
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Successful registration - Supabase sends confirmation email automatically
    return new Response(
      JSON.stringify({
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
        message: "Registration successful. Please check your email to confirm your account.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred. Please try again" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
