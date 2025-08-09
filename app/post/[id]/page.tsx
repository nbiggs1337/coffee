import { createSupabaseServerClient } from "@/lib/supabase-server"
import { notFound } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { MessageCircle, Phone } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import CommentForm from "@/components/comment-form"
import CommentList from "@/components/comment-list"
import type { CommentWithUser } from "@/lib/types"

interface PostDetailPageProps {
  params: {
    id: string
  }
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const supabase = createSupabaseServerClient()
  const postId = params.id

  // Get current user first
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch current user's app data if authenticated
  let currentUser = null
  if (user) {
    const { data: appUser } = await supabase.from("users").select("*").eq("id", user.id).single()
    currentUser = appUser
  }

  // Fetch post details with photos array
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select(
      `
      id,
      created_at,
      city,
      state,
      phone_number,
      user_id,
      photos,
      subject_name,
      subject_age,
      caption,
      users (
        full_name,
        avatar_url
      )
    `,
    )
    .eq("id", postId)
    .single()

  if (postError || !post) {
    console.error("Error fetching post:", postError?.message || "Post not found")
    notFound()
  }

  // Fetch comments for the post with user ID
  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select(
      `
      id,
      content,
      created_at,
      user_id,
      users (
        id,
        full_name,
        display_name,
        avatar_url
      )
    `,
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true })

  if (commentsError) {
    console.error("Error fetching comments:", commentsError.message)
  }

  const isAuthor = user?.id === post.user_id

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true })

  return (
    <main className="flex min-h-[calc(100vh-64px)] flex-col items-center p-4 md:p-6 bg-neobrutal-background text-neobrutal-primary">
      <Card className="w-full max-w-3xl neobrutal-card mb-6">
        <CardHeader className="flex flex-row items-center gap-4 p-4 border-b-2 border-black">
          <Avatar className="h-10 w-10 neobrutal-avatar">
            <AvatarImage src={post.users?.avatar_url || "/placeholder.svg?height=40&width=40&query=user avatar"} />
            <AvatarFallback className="neobrutal-avatar-fallback">
              {post.users?.full_name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-bold text-neobrutal-primary">{post.users?.full_name || "Anonymous"}</p>
            <p className="text-sm text-neobrutal-secondary">
              {post.city}, {post.state} • {timeAgo}
            </p>
          </div>
        </CardHeader>

        {/* Photos as main content */}
        {post.photos && post.photos.length > 0 && (
          <div className="relative">
            <Image
              src={post.photos[0] || "/placeholder.svg?height=400&width=600&query=post photo"}
              alt={`Photo of ${post.subject_name}`}
              width={600}
              height={400}
              className="w-full h-80 object-cover border-b-2 border-black"
            />
            {post.photos.length > 1 && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                +{post.photos.length - 1} more
              </div>
            )}
          </div>
        )}

        <CardContent className="p-4 space-y-3">
          {/* Subject info */}
          <h1 className="text-2xl font-bold text-neobrutal-primary">
            {post.subject_name}, {post.subject_age}
          </h1>

          {/* Caption */}
          <p className="text-neobrutal-secondary">{post.caption}</p>

          {post.phone_number && (
            <div className="flex items-center gap-2 text-neobrutal-secondary">
              <Phone className="h-4 w-4" />
              <span>{post.phone_number}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between p-4 border-t-2 border-black">
          <div className="flex items-center gap-2 text-neobrutal-secondary">
            <MessageCircle className="h-5 w-5" />
            <span>{comments?.length || 0} Comments</span>
          </div>
        </CardFooter>
      </Card>

      <div className="w-full max-w-3xl space-y-6">
        <CommentForm postId={postId} currentUser={currentUser} />
        <CommentList comments={comments as CommentWithUser[]} />
      </div>

      {isAuthor && (
        <div className="mt-4 text-center">
          <p className="text-sm text-neobrutal-secondary">You are the author of this post</p>
        </div>
      )}
    </main>
  )
}
