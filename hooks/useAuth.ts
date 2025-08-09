"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import type { User as SupabaseAuthUser } from "@supabase/supabase-js"
import type { User as AppUser } from "@/lib/supabase"

type AuthState = {
  user: SupabaseAuthUser | null
  appUser: AppUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

const supabase = createClient()

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    appUser: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        // If refresh token is invalid or any auth error occurs, clear local session and set unauthenticated
        if (error || !user) {
          try {
            // Clear only local session to avoid server-side cookie interference
            await supabase.auth.signOut({ scope: "local" })
          } catch {
            // ignore
          }
          if (mounted) {
            setState({ user: null, appUser: null, isLoading: false, isAuthenticated: false })
          }
          return
        }

        // Fetch the corresponding app user (RLS will enforce visibility)
        const { data: appUser } = await supabase.from("users").select("*").eq("id", user.id).single()

        if (!mounted) return
        setState({
          user,
          appUser: appUser || null,
          isLoading: false,
          isAuthenticated: true,
        })
      } catch {
        // Any unexpected failure — reset to a clean unauthenticated state
        try {
          await supabase.auth.signOut({ scope: "local" })
        } catch {
          // ignore
        }
        if (mounted) {
          setState({ user: null, appUser: null, isLoading: false, isAuthenticated: false })
        }
      }
    }

    load()

    // Keep state in sync with auth changes
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load()
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return state
}
