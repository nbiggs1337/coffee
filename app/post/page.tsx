import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import CreatePostClient from "@/components/pages/create-post-client"

export default async function CreatePostPage() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return <CreatePostClient userId={user.id} />
}
