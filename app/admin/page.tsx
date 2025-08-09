import { createServerSupabase } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import AdminDashboard from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
  const supabase = createServerSupabase()

  let user: any = null
  let isAdmin = false

  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      console.error("AdminPage: Auth error:", authError?.message)
      return redirect("/login")
    }

    user = authUser

    // Check admin status with retry logic
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        const { data: userData, error: profileError } = await supabase
          .from("users")
          .select("is_admin, is_approved")
          .eq("id", user.id)
          .single()

        if (profileError) {
          if (
            profileError.message.includes("Too Many") ||
            profileError.message.includes("rate") ||
            retryCount < maxRetries - 1
          ) {
            retryCount++
            await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
            continue
          } else {
            throw profileError
          }
        }

        isAdmin = userData?.is_admin === true
        break
      } catch (error: any) {
        retryCount++
        if (retryCount >= maxRetries) {
          console.error("AdminPage: Max retries exceeded, redirecting to feed")
          return redirect("/feed")
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
      }
    }

    if (!isAdmin) {
      console.error("AdminPage: User is not an admin")
      return redirect("/feed")
    }
  } catch (error: any) {
    console.error("AdminPage: Unexpected error:", error.message)
    return redirect("/feed")
  }

  return <AdminDashboard />
}
