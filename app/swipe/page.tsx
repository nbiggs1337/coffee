import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import SwipeClient from "@/components/pages/swipe-client"

export default async function SwipePage() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return <SwipeClient userId={user.id} />
}
