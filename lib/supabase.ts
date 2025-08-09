// Universal module that provides a BROWSER Supabase client for Client Components.
// Do not import this in Server Components; use "@/lib/supabase-server" instead.

import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | undefined

function getSupabaseBrowserClient() {
  if (client) {
    return client
  }

  client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  return client
}

// This is the function to be used in client components to get the singleton instance.
export function createClient() {
  return getSupabaseBrowserClient()
}

// This is for backward compatibility for any imports like `import { supabase } from ...`
// It's guarded to only run in the browser, preventing SSR errors.
export const supabase = typeof window !== "undefined" ? createClient() : (null as unknown as SupabaseClient)
