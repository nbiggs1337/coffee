import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// This file is for creating a Supabase client with admin privileges (service_role key).
// It should ONLY be used in server-side code (API routes, server actions).

// Cached admin client to avoid creating a new one for every request.
let adminSupabase: SupabaseClient | undefined

export function createSupabaseAdminClient(): SupabaseClient {
  // If a client is already created, return it.
  if (adminSupabase) {
    return adminSupabase
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Check for essential environment variables.
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables for admin client. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file or Vercel environment.",
    )
  }

  // Create and cache the admin client.
  adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      // These options are recommended for server-side clients.
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminSupabase
}
