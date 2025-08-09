import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Server-only Supabase admin client using the Service Role key.
 * IMPORTANT: Never import this in client components. It is for Server Actions and Route Handlers only.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  throw new Error(
    "Missing Supabase env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in the environment.",
  )
}

// Create a single admin client instance.
// Note: We disable session persistence since this runs on the server.
export const supabaseAdmin: SupabaseClient = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
