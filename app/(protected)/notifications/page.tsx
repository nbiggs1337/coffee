import { createServerSupabase } from "@/lib/supabase-server"
import NotificationsClient from "@/components/pages/notifications-client"

export default async function NotificationsPage() {
  const supabase = createServerSupabase()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error("[DEBUG] NotificationsPage: User not authenticated or auth error:", authError?.message || "No user")
    return (
      <main className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-4 md:p-6 bg-neobrutal-background text-neobrutal-primary">
        <div className="neobrutal-card p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-neobrutal-secondary">Please log in to view your notifications.</p>
        </div>
      </main>
    )
  }

  // Select all columns to avoid errors if some optional columns don't exist
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[DEBUG] NotificationsPage: Error fetching notifications:", error.message)
    return (
      <main className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-4 md:p-6 bg-neobrutal-background text-neobrutal-primary">
        <div className="neobrutal-card p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Notifications</h2>
          <p className="text-neobrutal-red">{error.message}</p>
          <p className="mt-4 text-neobrutal-secondary">Please try again later.</p>
        </div>
      </main>
    )
  }

  const initialNotifications = Array.isArray(data) ? data : []

  return (
    <main className="flex min-h-[calc(100vh-64px)] flex-col items-center p-4 md:p-6 bg-neobrutal-background text-neobrutal-primary">
      <h1 className="text-3xl font-bold mb-6 text-neobrutal-primary">Your Notifications</h1>
      <NotificationsClient userId={user.id} initialNotifications={initialNotifications} />
    </main>
  )
}
