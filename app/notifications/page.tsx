import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import NotificationsClient from "@/components/pages/notifications-client"

export default async function NotificationsPage() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return <NotificationsClient userId={user.id} />
}
