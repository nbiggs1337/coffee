"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"

async function verifyAdmin(userId: string) {
  const supabase = createSupabaseServerClient()

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
        if (adminError.message.includes("Too Many") || adminError.message.includes("rate")) {
          retryCount++
          await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
          continue
        }
        throw adminError
      }

      return adminUser?.is_admin === true
    } catch (error: any) {
      console.error(`Admin verification error (attempt ${retryCount + 1}):`, error.message)
      retryCount++

      if (retryCount >= maxRetries) {
        return false
      }

      await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
    }
  }

  return false
}

export async function toggleApproval(userId: string, isApproved: boolean) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const isAdmin = await verifyAdmin(user.id)
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Not an admin." }
  }

  try {
    const { error } = await supabase
      .from("users")
      .update({ is_approved: isApproved, is_rejected: false })
      .eq("id", userId)

    if (error) {
      console.error("Error toggling approval:", error.message)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error in toggleApproval:", error.message)
    return { success: false, error: "An unexpected error occurred." }
  }
}

export async function toggleAdmin(userId: string, isAdmin: boolean) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const isCurrentUserAdmin = await verifyAdmin(user.id)
  if (!isCurrentUserAdmin) {
    return { success: false, error: "Unauthorized: Not an admin." }
  }

  try {
    const { error } = await supabase.from("users").update({ is_admin: isAdmin }).eq("id", userId)

    if (error) {
      console.error("Error toggling admin status:", error.message)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error in toggleAdmin:", error.message)
    return { success: false, error: "An unexpected error occurred." }
  }
}

export async function deleteUser(userId: string) {
  const supabaseAdmin = createSupabaseAdminClient()
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const isAdmin = await verifyAdmin(user.id)
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Not an admin." }
  }

  try {
    // Use admin client for deletions to avoid RLS issues
    // Delete in order to avoid foreign key constraints

    // 1. Delete user's votes
    await supabaseAdmin.from("votes").delete().eq("user_id", userId)

    // 2. Delete user's comments
    await supabaseAdmin.from("comments").delete().eq("user_id", userId)

    // 3. Delete user's notifications (both sent and received)
    await supabaseAdmin.from("notifications").delete().eq("user_id", userId)

    // 4. Delete user's alerts
    await supabaseAdmin.from("alerts").delete().eq("user_id", userId)

    // 5. Delete user's posts
    await supabaseAdmin.from("posts").delete().eq("user_id", userId)

    // 6. Finally, delete the user record
    const { error: deleteUserError } = await supabaseAdmin.from("users").delete().eq("id", userId)

    if (deleteUserError) {
      console.error("Error deleting user from users table:", deleteUserError.message)
      return { success: false, error: deleteUserError.message }
    }

    // 7. Delete from Supabase Auth (optional, but recommended)
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId)
    } catch (authDeleteError: any) {
      console.warn("Could not delete user from auth (non-critical):", authDeleteError.message)
      // This is non-critical since the user record is already deleted
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error in deleteUser:", error.message)
    return { success: false, error: "An unexpected error occurred during deletion." }
  }
}

export async function deletePost(postId: string) {
  const supabaseAdmin = createSupabaseAdminClient()
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const isAdmin = await verifyAdmin(user.id)
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Not an admin." }
  }

  try {
    // Delete related data first
    await supabaseAdmin.from("votes").delete().eq("post_id", postId)
    await supabaseAdmin.from("comments").delete().eq("post_id", postId)

    const { error } = await supabaseAdmin.from("posts").delete().eq("id", postId)

    if (error) {
      console.error("Error deleting post:", error.message)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error in deletePost:", error.message)
    return { success: false, error: "An unexpected error occurred." }
  }
}

export async function rejectUser(userId: string) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const isAdmin = await verifyAdmin(user.id)
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Not an admin." }
  }

  try {
    const { error } = await supabase.from("users").update({ is_approved: false, is_rejected: true }).eq("id", userId)

    if (error) {
      console.error("Error rejecting user:", error.message)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error in rejectUser:", error.message)
    return { success: false, error: "An unexpected error occurred." }
  }
}
