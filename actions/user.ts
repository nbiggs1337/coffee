"use server"

import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server"
import type { User as AppUser } from "@/lib/supabase"

export async function fetchAppUserServer(userId: string, userEmail: string): Promise<AppUser | null> {
  const supabase = createSupabaseServerClient()
  const supabaseAdmin = createSupabaseAdminClient()

  console.log("Server Action: fetchAppUserServer called for userId:", userId)

  try {
    // Try to fetch existing user
    const { data: existingUser, error: fetchError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 means "no rows found", which is expected for new users
      console.error("Server Action: Error fetching existing user:", fetchError)
      return null
    }

    if (existingUser) {
      console.log("Server Action: Found existing user:", existingUser)
      return existingUser as AppUser
    } else {
      // User does not exist, create a new one
      console.log("Server Action: User not found, creating new user for:", userEmail)

      // Determine if the user should be an admin based on email
      const isAdmin = userEmail === "nbiggs1337@gmail.com"

      const { data: newUser, error: createError } = await supabaseAdmin
        .from("users")
        .insert({
          id: userId,
          email: userEmail,
          is_approved: isAdmin, // Admins are auto-approved
          is_admin: isAdmin,
          is_rejected: false,
        })
        .select("*")
        .single()

      if (createError) {
        console.error("Server Action: Error creating new user:", createError)
        return null
      }

      console.log("Server Action: Successfully created new user:", newUser)
      return newUser as AppUser
    }
  } catch (e) {
    console.error("Server Action: Unhandled exception in fetchAppUserServer:", e)
    return null
  }
}

export async function updateAppUser(userId: string, updates: Partial<AppUser>) {
  const supabase = createSupabaseServerClient()
  const supabaseAdmin = createSupabaseAdminClient() // Use admin client to bypass RLS for user updates

  console.log("Server Action: updateAppUser called for userId:", userId, "with updates:", updates)

  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select("*")
      .single()

    if (error) {
      console.error("Server Action: Error updating user:", error)
      return { success: false, message: error.message }
    }

    console.log("Server Action: User updated successfully:", data)
    return { success: true, user: data as AppUser }
  } catch (e: any) {
    console.error("Server Action: Unhandled exception in updateAppUser:", e.message, e)
    return { success: false, message: e.message || "An unexpected error occurred." }
  }
}

export async function deleteAppUser(userId: string) {
  const supabaseAdmin = createSupabaseAdminClient()

  console.log("Server Action: deleteAppUser called for userId:", userId)

  try {
    // First, delete related data (e.g., posts, comments, votes, notifications, alerts)
    // This assumes CASCADE DELETE is not set up or you want explicit control.
    // If CASCADE DELETE is set up in your DB, these might not be necessary.
    await supabaseAdmin.from("posts").delete().eq("user_id", userId)
    await supabaseAdmin.from("comments").delete().eq("user_id", userId)
    await supabaseAdmin.from("votes").delete().eq("user_id", userId)
    await supabaseAdmin.from("notifications").delete().eq("user_id", userId)
    await supabaseAdmin.from("alerts").delete().eq("user_id", userId)

    // Then, delete the user from the 'users' table
    const { error: deleteUserError } = await supabaseAdmin.from("users").delete().eq("id", userId)

    if (deleteUserError) {
      console.error("Server Action: Error deleting user from 'users' table:", deleteUserError)
      return { success: false, message: deleteUserError.message }
    }

    // Finally, delete the user from Supabase Auth
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      console.error("Server Action: Error deleting user from Supabase Auth:", deleteAuthError)
      return { success: false, message: deleteAuthError.message }
    }

    console.log("Server Action: User and related data deleted successfully for userId:", userId)
    return { success: true, message: "User and related data deleted successfully." }
  } catch (e: any) {
    console.error("Server Action: Unhandled exception in deleteAppUser:", e.message, e)
    return { success: false, message: e.message || "An unexpected error occurred." }
  }
}
