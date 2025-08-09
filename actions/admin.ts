"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createServerSupabase } from "@/lib/supabase-server"
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"

/**
 * Build a guaranteed Service Role (admin) client.
 * This bypasses RLS and ensures DB mutations persist.
 */
function getAdminClient() {
  const url = process.env.SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) {
    throw new Error("Supabase admin client misconfigured: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  }
  return createSupabaseAdmin(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Verify the requesting user is an admin using the regular (session-aware) client.
 */
async function verifyAdmin(userId: string) {
  const supabase = createServerSupabase()

  let retryCount = 0
  const maxRetries = 3

  while (retryCount < maxRetries) {
    try {
      const { data: adminUser, error: adminError } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", userId)
        .single()

      if (adminError) {
        // Handle transient rate limiting
        if (
          adminError.message?.toLowerCase().includes("too many") ||
          adminError.message?.toLowerCase().includes("rate")
        ) {
          retryCount++
          await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
          continue
        }
        throw adminError
      }

      return adminUser?.is_admin === true
    } catch (error: any) {
      console.error(`Admin verification error (attempt ${retryCount + 1}):`, error?.message || error)
      retryCount++
      if (retryCount >= maxRetries) return false
      await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
    }
  }

  return false
}

/**
 * Approve or unapprove a user.
 * Uses Service Role client to ensure persistence; checks rows affected.
 */
export async function toggleApproval(userId: string, isApproved: boolean) {
  const supabase = createServerSupabase()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect("/login")
    }

    const isRequesterAdmin = await verifyAdmin(user.id)
    if (!isRequesterAdmin) {
      return { success: false, error: "Unauthorized: Not an admin." }
    }

    const admin = getAdminClient()
    const targetId = (userId || "").trim()

    // Perform the update and request returning representation.
    const { data, error } = await admin
      .from("users")
      .update({ is_approved: isApproved, is_rejected: false, updated_at: new Date().toISOString() })
      .eq("id", targetId)
      .select("id, is_approved, is_rejected")

    if (error) {
      console.error("Error toggling approval:", error.message)
      return { success: false, error: error.message }
    }

    if (!Array.isArray(data) || data.length === 0) {
      // No rows updated -> likely bad id or constraints
      return { success: false, error: "No user was updated. Please verify the user id exists." }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error in toggleApproval:", error?.message || error)
    return { success: false, error: "An unexpected error occurred." }
  }
}

/**
 * Reject a user.
 * Uses Service Role client to ensure persistence; checks rows affected.
 */
export async function rejectUser(userId: string) {
  const supabase = createServerSupabase()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect("/login")
    }

    const isRequesterAdmin = await verifyAdmin(user.id)
    if (!isRequesterAdmin) {
      return { success: false, error: "Unauthorized: Not an admin." }
    }

    const admin = getAdminClient()
    const targetId = (userId || "").trim()

    const { data, error } = await admin
      .from("users")
      .update({ is_approved: false, is_rejected: true, updated_at: new Date().toISOString() })
      .eq("id", targetId)
      .select("id, is_approved, is_rejected")

    if (error) {
      console.error("Error rejecting user:", error.message)
      return { success: false, error: error.message }
    }

    if (!Array.isArray(data) || data.length === 0) {
      return { success: false, error: "No user was updated. Please verify the user id exists." }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error in rejectUser:", error?.message || error)
    return { success: false, error: "An unexpected error occurred." }
  }
}

/**
 * Toggle admin status for a user.
 */
export async function toggleAdmin(userId: string, isAdmin: boolean) {
  const supabase = createServerSupabase()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect("/login")
    }

    const isRequesterAdmin = await verifyAdmin(user.id)
    if (!isRequesterAdmin) {
      return { success: false, error: "Unauthorized: Not an admin." }
    }

    const admin = getAdminClient()
    const targetId = (userId || "").trim()

    const { error, data } = await admin.from("users").update({ is_admin: isAdmin }).eq("id", targetId).select("id")
    if (error) {
      console.error("Error toggling admin status:", error.message)
      return { success: false, error: error.message }
    }
    if (!Array.isArray(data) || data.length === 0) {
      return { success: false, error: "No user was updated. Please verify the user id exists." }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error in toggleAdmin:", error?.message || error)
    return { success: false, error: "An unexpected error occurred." }
  }
}

/**
 * Delete a user and related records.
 */
export async function deleteUser(userId: string) {
  const supabase = createServerSupabase()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect("/login")
    }

    const isRequesterAdmin = await verifyAdmin(user.id)
    if (!isRequesterAdmin) {
      return { success: false, error: "Unauthorized: Not an admin." }
    }

    const admin = getAdminClient()
    const targetId = (userId || "").trim()

    await admin.from("votes").delete().eq("user_id", targetId)
    await admin.from("comments").delete().eq("user_id", targetId)
    await admin.from("notifications").delete().eq("user_id", targetId)
    await admin.from("alerts").delete().eq("user_id", targetId)
    await admin.from("posts").delete().eq("user_id", targetId)

    const { error: deleteUserError } = await admin.from("users").delete().eq("id", targetId)
    if (deleteUserError) {
      console.error("Error deleting user from users table:", deleteUserError.message)
      return { success: false, error: deleteUserError.message }
    }

    try {
      await admin.auth.admin.deleteUser(targetId)
    } catch (authDeleteError: any) {
      console.warn("Could not delete user from auth (non-critical):", authDeleteError.message)
    }

    revalidatePath("/admin")
    revalidatePath("/feed")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error in deleteUser:", error?.message || error)
    return { success: false, error: "An unexpected error occurred during deletion." }
  }
}

/**
 * Delete a post and related records.
 */
export async function deletePost(postId: string) {
  const supabase = createServerSupabase()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect("/login")
    }

    const isRequesterAdmin = await verifyAdmin(user.id)
    if (!isRequesterAdmin) {
      return { success: false, error: "Unauthorized: Not an admin." }
    }

    const admin = getAdminClient()
    const targetPostId = (postId || "").trim()

    await admin.from("votes").delete().eq("post_id", targetPostId)
    await admin.from("comments").delete().eq("post_id", targetPostId)
    await admin.from("notifications").delete().eq("post_id", targetPostId)

    const { error, data } = await admin.from("posts").delete().eq("id", targetPostId).select("id")
    if (error) {
      console.error("Error deleting post:", error.message)
      return { success: false, error: error.message }
    }
    if (!Array.isArray(data) || data.length === 0) {
      return { success: false, error: "No post was deleted. Please verify the post id exists." }
    }

    revalidatePath("/admin")
    revalidatePath("/feed")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error in deletePost:", error?.message || error)
    return { success: false, error: "An unexpected error occurred." }
  }
}
