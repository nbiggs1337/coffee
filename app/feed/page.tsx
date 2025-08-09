import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import PostCard from "@/components/post-card"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

export default async function FeedPage() {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // Fetch posts with user data
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      *,
      user:users(id, display_name, full_name, avatar_url)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching posts:", error)
    return <div className="text-center text-red-500 p-8">Failed to load posts.</div>
  }

  // Get vote counts and comment counts for each post
  const postsWithCounts = await Promise.all(
    (posts || []).map(async (post) => {
      // Get vote counts
      const { data: greenVotes } = await supabase
        .from("votes")
        .select("id")
        .eq("post_id", post.id)
        .eq("vote_type", "green")

      const { data: redVotes } = await supabase.from("votes").select("id").eq("post_id", post.id).eq("vote_type", "red")

      // Get comment count
      const { data: comments } = await supabase.from("comments").select("id").eq("post_id", post.id)

      return {
        ...post,
        green_flags: greenVotes?.length || 0,
        red_flags: redVotes?.length || 0,
        comment_count: comments?.length || 0,
      }
    }),
  )

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
        {postsWithCounts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No posts yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {postsWithCounts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={user.id} />
            ))}
          </div>
        )}
      </Suspense>
    </main>
  )
}
