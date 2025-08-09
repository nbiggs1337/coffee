import { createSupabaseServerClient } from "@/lib/supabase-server"
import NavigationClient from "./navigation-client"

// Server Component: Reads auth on the server and renders stable client sub-component.
export default async function Navigation() {
  let isAuthenticated = false
  let appUser: {
    full_name?: string | null
    display_name?: string | null
    avatar_url?: string | null
    is_admin?: boolean | null
  } | null = null
  let userEmail: string | null = null

  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (!authError && user) {
      isAuthenticated = true
      userEmail = user.email ?? null

      const { data: appUserData, error: appUserError } = await supabase
        .from("users")
        .select("full_name, display_name, avatar_url, is_admin")
        .eq("id", user.id)
        .single()

      if (!appUserError && appUserData) {
        appUser = appUserData
      }
    }
  } catch {
    isAuthenticated = false
  }

  return <NavigationClient isAuthenticated={isAuthenticated} appUser={appUser} userEmail={userEmail} />
}
