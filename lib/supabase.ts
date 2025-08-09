import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// Minimal app User type for rows in public.users
export type User = {
  id: string
  email: string | null
  full_name?: string | null
  display_name?: string | null
  username?: string | null
  avatar_url?: string | null
  is_admin?: boolean
  is_approved?: boolean
  is_rejected?: boolean
  agreed_to_terms?: boolean
  verification_photo_url?: string | null
  phone_number?: string | null
  created_at?: string | null
  updated_at?: string | null
}

let browserSupabase: SupabaseClient | null = null
let hasAuthListener = false

// Client-side Supabase singleton with session persistence and auto refresh
export function createClient(): SupabaseClient {
  if (browserSupabase) return browserSupabase

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
  }

  browserSupabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  })

  // Register a one-time auth listener to clean up broken sessions
  if (!hasAuthListener) {
    hasAuthListener = true
    browserSupabase.auth.onAuthStateChange(async (event) => {
      // If the library signs the user out (e.g., after a failed refresh), ensure local state is cleared
      if (event === "SIGNED_OUT" || event === "USER_DELETED") {
        try {
          await browserSupabase!.auth.signOut({ scope: "local" })
        } catch {
          // ignore
        }
      }
    })
  }

  return browserSupabase
}
