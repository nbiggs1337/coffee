// Universal module that provides a BROWSER Supabase client for Client Components.
// Do not import this in Server Components; use "@/lib/supabase-server" instead.

import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

let browserClient: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (browserClient) return browserClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }

  // This creates a client that uses browser storage (localStorage) for the session.
  browserClient = createBrowserClient(url, anon)
  return browserClient
}

// Some parts of the app may import a named "supabase" export.
// Guard it so it's only instantiated in the browser.
export const supabase: SupabaseClient =
  typeof window !== "undefined" ? createClient() : (null as unknown as SupabaseClient)
