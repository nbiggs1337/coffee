// Universal module that provides a BROWSER Supabase client for Client Components.
// Do not import this in Server Components; use "@/lib/supabase-server" instead.

import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// This ensures we have only one instance of the client in the browser.
let clientInstance: SupabaseClient | undefined

function getSupabaseBrowserClient() {
  if (clientInstance) {
    return clientInstance
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.",
    )
  }

  clientInstance = createBrowserClient(url, anonKey)

  return clientInstance
}

// This is the function to be used in client components to get the singleton instance.
export function createClient() {
  return getSupabaseBrowserClient()
}

// This is for backward compatibility for any imports like `import { supabase } from ...`
// It's guarded to only run in the browser, preventing SSR errors.
export const supabase = typeof window !== "undefined" ? createClient() : (null as unknown as SupabaseClient)
