import type React from "react"
import { redirect } from "next/navigation"
import { createServerSupabase } from "@/lib/supabase-server"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = createServerSupabase()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // If no authenticated user, redirect to login
    if (authError || !user) {
      redirect("/login")
    }

    // Get user profile from database
    const { data: appUser, error: userError } = await supabase
      .from("users")
      .select("is_approved, is_rejected, agreed_to_terms, full_name, verification_photo_url, is_admin, email")
      .eq("id", user.id)
      .single()

    // If user doesn't exist in users table, send to agreement
    if (userError || !appUser) {
      redirect(`/agreement?email=${encodeURIComponent(user.email || "")}`)
    }

    // Special handling for admin users - auto-fix missing agreement fields
    if (
      appUser.is_admin &&
      appUser.is_approved &&
      (!appUser.agreed_to_terms || !appUser.full_name || !appUser.verification_photo_url)
    ) {
      try {
        await supabase
          .from("users")
          .update({
            agreed_to_terms: true,
            full_name: appUser.full_name || "Admin User",
            verification_photo_url: appUser.verification_photo_url || "/admin-interface.png",
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)

        console.log("Auto-fixed admin user agreement fields in protected layout")
        // Continue to render the protected content
        return <>{children}</>
      } catch (updateError) {
        console.warn("Failed to auto-fix admin user in protected layout:", updateError)
        // If we can't fix it, redirect to agreement
        redirect(`/agreement?email=${encodeURIComponent(user.email || "")}`)
      }
    }

    // For non-admin users, check if they need to complete agreement
    if (!appUser.agreed_to_terms || !appUser.full_name || !appUser.verification_photo_url) {
      redirect(`/agreement?email=${encodeURIComponent(user.email || "")}`)
    }

    // If user is rejected, send to pending (they'll see rejection message)
    if (appUser.is_rejected) {
      redirect(`/pending?email=${encodeURIComponent(user.email || "")}`)
    }

    // If user is not approved yet, send to pending
    if (!appUser.is_approved) {
      redirect(`/pending?email=${encodeURIComponent(user.email || "")}`)
    }

    // User is approved and can access protected routes
    return <>{children}</>
  } catch (error) {
    console.error("Protected layout error:", error)
    redirect("/login")
  }
}
