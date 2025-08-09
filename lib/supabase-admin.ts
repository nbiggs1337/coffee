import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// This is a server-only function to create a Supabase client with the service role key.
// It's used for operations that need to bypass RLS, like creating buckets or fetching all users.
// It should never be exposed to the client.

// Log the environment variables to ensure they are available in the Vercel environment.
console.log("Supabase Admin: NEXT_PUBLIC_SUPABASE_URL available:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log("Supabase Admin: SUPABASE_SERVICE_ROLE_KEY available:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)

let adminClient: SupabaseClient | undefined

export function createSupabaseAdminClient(): SupabaseClient {
  if (adminClient) {
    return adminClient
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase environment variables for admin client.")
  }

  adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClient
}
