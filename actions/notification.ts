"use server"

import { createSupabaseServerClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

export async function clearNotifications() {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "User not authenticated." }
  }

  try {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id)

    if (error) {
      console.error("Error clearing notifications:", error)
      return { success: false, message: error.message }
    }

    revalidatePath("/notifications")
    return { success: true, message: "Notifications cleared." }
  } catch (e: any) {
    console.error("Unhandled error clearing notifications:", e)
    return { success: false, message: e.message || "An unexpected error occurred." }
  }
}
