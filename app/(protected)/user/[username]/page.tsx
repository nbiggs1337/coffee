import { createServerSupabase } from "@/lib/supabase-server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "lucide-react"
import PostCard from "@/components/post-card"
import { formatDistanceToNow } from "date-fns"

type UserProfilePageProps = {
  params: {
    username: string
  }
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const supabase = createServerSupabase()
  const { username } = params

  // Check if username looks like a UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username)

  if (!isUUID) {
    notFound()
  }

  // Find user by ID
  const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", username).single()

  if (userError || !user) {
    console.error("Error finding user:", userError?.message)
    notFound()
  }

  // Get user's posts
  const { data: posts, error: postsError } = await supabase
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
        display_name,
        avatar_url
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (postsError) {
    console.error("Error fetching user posts:", postsError)
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "A"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="container mx-auto max-w-4xl">
      {/* User Profile Header */}
      <Card className="neobrutal-card mb-8">
        <CardHeader>
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 neobrutal-avatar">
              <AvatarImage
                src={user.avatar_url || "/placeholder.svg?height=96&width=96&query=user profile"}
                alt={`${user.display_name || "User"}'s avatar`}
              />
              <AvatarFallback className="bg-neobrutal-secondary text-neobrutal-primary font-bold text-2xl">
                {getInitials(user.display_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold text-neobrutal-primary mb-2">
                {user.display_name || "Anonymous User"}
              </CardTitle>
              <div className="flex items-center gap-4 text-neobrutal-secondary">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                </span>
                {user.is_admin && (
                  <span className="bg-neobrutal-blue text-white px-2 py-1 rounded text-sm font-bold">ADMIN</span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="neobrutal-card p-4">
              <div className="text-2xl font-bold text-neobrutal-primary">{posts?.length || 0}</div>
              <div className="text-neobrutal-secondary">Posts</div>
            </div>
            <div className="neobrutal-card p-4">
              <div className="text-2xl font-bold text-neobrutal-green">
                {posts?.reduce((sum, post) => sum + post.green_flags, 0) || 0}
              </div>
              <div className="text-neobrutal-secondary">Green Flags</div>
            </div>
            <div className="neobrutal-card p-4">
              <div className="text-2xl font-bold text-neobrutal-red">
                {posts?.reduce((sum, post) => sum + post.red_flags, 0) || 0}
              </div>
              <div className="text-neobrutal-secondary">Red Flags</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User's Posts */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-neobrutal-primary">
          {user.display_name ? `${user.display_name}'s Posts` : "User's Posts"}
        </h2>

        {posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="neobrutal-card p-8 text-center">
            <h3 className="text-xl font-bold mb-2">No posts yet</h3>
            <p className="text-neobrutal-secondary">
              {user.display_name || "This user"} hasn't shared anything with the community yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
