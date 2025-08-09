// lib/supabase.ts
// This file provides a singleton instance of the Supabase client for the browser.
// It is safe to import and use in any client component.

import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// Declare a global variable to hold the client instance.
// We use a 'let' so it can be initialized once.
let supabaseSingleton: SupabaseClient | undefined = undefined

function createSupabaseClient() {
  // If the client is already created, return it.
  if (supabaseSingleton) {
    return supabaseSingleton
  }

  // If not created, create a new one.
  // These environment variables must be available in the browser.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase environment variables are not set. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    )
  }

  supabaseSingleton = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return supabaseSingleton
}

// The main export is a function that returns the singleton instance.
export const createClient = () => {
  return createSupabaseClient()
}
