import { createServerSupabase } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import SwipeClient from "@/components/pages/swipe-client"

export const dynamic = "force-dynamic"

export default async function SwipePage() {
  console.log("=== SWIPE PAGE SERVER COMPONENT EXECUTING ===")

  const supabase = createServerSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.log("No user found, redirecting to login")
    redirect("/login")
  }

  console.log(`Authenticated user ID: ${user.id}`)

  // Get user profile to ensure they're approved
  const { data: userProfile } = await supabase
    .from("users")
    .select("is_approved, is_rejected")
    .eq("id", user.id)
    .single()

  if (!userProfile?.is_approved || userProfile?.is_rejected) {
    console.log("User not approved, redirecting to pending")
    redirect("/pending")
  }

  console.log("User is approved, proceeding with data fetch")

  // Get user's existing votes
  const { data: userVotes, error: votesError } = await supabase.from("votes").select("post_id").eq("user_id", user.id)

  if (votesError) {
    console.error("Error fetching votes:", votesError)
  }

  const votedPostIds = new Set((userVotes || []).map((v) => v.post_id))
  console.log(`User has voted on ${votedPostIds.size} posts`)

  // Get posts with user data - exact same query as feed page
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      id,
      user_id,
      subject_name,
      subject_age,
      caption,
      photos,
      red_flags,
      green_flags,
      city,
      state,
      phone_number,
      created_at,
      user:users (
        id,
        display_name,
        full_name,
        avatar_url
      )
    `)
    .neq("user_id", user.id) // Exclude own posts
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Database error:", error)
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Database Error</h2>
        <p>Error fetching posts: {error.message}</p>
      </div>
    )
  }

  console.log(`Fetched ${posts?.length || 0} posts from database`)

  // Filter out already voted posts
  const availablePosts = (posts || []).filter((post) => !votedPostIds.has(post.id))

  console.log(`${availablePosts.length} posts available for swipe after filtering`)
  console.log("=== SENDING TO CLIENT ===")

  return <SwipeClient initialPosts={availablePosts} currentUserId={user.id} />
}
