import { createSupabaseServerClient } from "@/lib/supabase-server"
import PostCard from "@/components/post-card"
import type { Post } from "@/lib/supabase"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { redirect } from "next/navigation"

export default async function FeedPage() {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: posts, error } = await supabase
    .from("posts_with_comment_count")
    .select("*, user:users(*)")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching posts:", error)
    return <div className="text-center text-red-500">Failed to load posts.</div>
  }

  return (
    <main className="container mx-auto p-4 md:p-8 min-h-[calc(100vh-64px)]">
      <h1 className="text-3xl font-bold mb-8 text-center text-foreground">Community Feed</h1>
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {posts?.map((post: Post) => (
            <PostCard key={post.id} post={post} currentUserId={user.id} />
          ))}
        </div>
      </Suspense>
    </main>
  )
}
