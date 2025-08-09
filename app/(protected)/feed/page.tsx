import { createServerSupabase } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import PostCard from "@/components/post-card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function FeedPage() {
  const supabase = createServerSupabase()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // Get user's approval status
  const { data: appUser } = await supabase.from("users").select("is_approved, is_rejected").eq("id", user.id).single()

  if (!appUser?.is_approved) {
    redirect("/pending")
  }

  // Fetch posts with user data, vote counts, and comment counts
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      *,
      users!posts_user_id_fkey (
        id,
        display_name,
        full_name,
        avatar_url
      ),
      votes (
        id,
        user_id,
        vote_type
      ),
      _count:comments(count)
    `)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    console.error("Error fetching posts:", error)
    throw new Error(`Error fetching posts: ${error.message}`)
  }

  // Calculate vote counts for each post
  const postsWithCounts =
    posts?.map((post) => ({
      ...post,
      green_flags: post.votes?.filter((vote: any) => vote.vote_type === "green").length || 0,
      red_flags: post.votes?.filter((vote: any) => vote.vote_type === "red").length || 0,
      comment_count: post._count?.[0]?.count || 0,
    })) || []

  return (
    <div className="min-h-screen bg-neobrutal-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-neobrutal-primary">Community Feed</h1>
          <Link href="/post">
            <Button className="neobrutal-button bg-neobrutal-primary text-white hover:bg-neobrutal-blue">
              <Plus className="h-5 w-5 mr-2" />
              Create Post
            </Button>
          </Link>
        </div>

        {postsWithCounts.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-neobrutal-primary mb-4">No posts yet</h2>
            <p className="text-gray-600 mb-6">Be the first to share something with the community!</p>
            <Link href="/post">
              <Button className="neobrutal-button bg-neobrutal-primary text-white hover:bg-neobrutal-blue">
                <Plus className="h-5 w-5 mr-2" />
                Create First Post
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {postsWithCounts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={user.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
