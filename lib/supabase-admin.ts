import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Creates a new Supabase client with admin privileges (service_role key).
 * This should ONLY be used in server-side code (Server Actions, API routes).
 * It always creates a new client to avoid state issues in serverless environments.
 */
export function createSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // This check is critical. If it fails, the action will throw an error.
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("CRITICAL ERROR: Missing Supabase admin environment variables.")
    throw new Error("Server is not configured correctly for uploads.")
  }

  // Create and return a new client instance.
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
