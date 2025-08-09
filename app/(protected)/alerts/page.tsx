import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import AlertsClient from "@/components/pages/alerts-client"

export default async function AlertsPage() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch user's existing alerts
  const { data: alerts, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching alerts:", error)
  }

  return <AlertsClient initialAlerts={alerts || []} userId={user.id} />
}
