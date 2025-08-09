import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// This function creates a new Supabase client with admin privileges.
// It should ONLY be used in server-side code (API routes, server actions).
export function createSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log("createSupabaseAdminClient: Checking environment variables...")
  // Check for essential environment variables.
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("CRITICAL: Missing Supabase environment variables for admin client.")
    console.error(`NEXT_PUBLIC_SUPABASE_URL is ${supabaseUrl ? "found" : "MISSING"}.`)
    console.error(`SUPABASE_SERVICE_ROLE_KEY is ${supabaseServiceRoleKey ? "found" : "MISSING"}.`)
    throw new Error("Server configuration error: Missing Supabase credentials.")
  }
  console.log("createSupabaseAdminClient: Environment variables found. Creating client.")

  // Create and return the admin client.
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
