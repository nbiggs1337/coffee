import { createServerSupabase } from "@/lib/supabase-server"
import PostCard from "@/components/post-card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle, ChevronLeft, ChevronRight } from "lucide-react"
import UnreadNotificationsToast from "@/components/unread-notifications-toast"

// Updated type to match actual schema
type PostWithUser = {
  id: string
  user_id: string
  subject_name: string
  subject_age: number
  caption: string
  photos: string[]
  red_flags: number
  green_flags: number
  city?: string | null
  state?: string | null
  phone_number?: string | null
  created_at: string
  user?: {
    full_name?: string | null
    avatar_url?: string | null
  } | null
}

type FeedPageProps = {
  searchParams: { page?: string }
}

const POSTS_PER_PAGE = 12

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const supabase = createServerSupabase()

  // Determine current page from URL
  const currentPage = Number.parseInt(searchParams.page || "1", 10)
  const offset = (currentPage - 1) * POSTS_PER_PAGE

  // Get current auth user to compute unread notifications
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  // Compute unread notifications count for this user
  let unreadCount = 0
  if (authUser) {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", authUser.id)
      .eq("is_read", false)

    unreadCount = count ?? 0
  }

  // Total posts for pagination
  const { count: totalPosts } = await supabase.from("posts").select("*", { count: "exact", head: true })

  const totalPages = Math.ceil((totalPosts || 0) / POSTS_PER_PAGE)

  // Fetch posts with pagination
  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      `
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
        full_name,
        avatar_url
      )
    `,
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + POSTS_PER_PAGE - 1)

  if (error) {
    console.error("Error fetching posts:", error)
    return (
      <div className="container mx-auto max-w-2xl">
        <UnreadNotificationsToast unreadCount={unreadCount} />
        <div className="neobrutal-card p-8 text-center">
          <h2 className="text-2xl font-bold text-neobrutal-red mb-4">Error Loading Feed</h2>
          <p className="text-neobrutal-secondary">Could not load posts. Please try again later.</p>
          <p className="text-sm text-neobrutal-secondary mt-2">Error: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl">
      {/* Show unread notifications toast (client) */}
      <UnreadNotificationsToast unreadCount={unreadCount} />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Community Feed</h1>
        <Button asChild className="neobrutal-button bg-coffee-600 hover:bg-coffee-700 text-white">
          <Link href="/post">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Pagination info */}
      {totalPosts && totalPosts > 0 && (
        <div className="mb-4 text-center">
          <p className="text-neobrutal-secondary">
            Showing {offset + 1}-{Math.min(offset + POSTS_PER_PAGE, totalPosts)} of {totalPosts} posts
          </p>
        </div>
      )}

      <div className="space-y-6">
        {posts && posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post as PostWithUser} />)
        ) : (
          <div className="neobrutal-card p-8 text-center">
            <h2 className="text-xl font-bold">No posts yet!</h2>
            <p className="text-neobrutal-secondary">Be the first to share something with the community.</p>
            <Link href="/post" className="mt-4 inline-block">
              <Button className="neobrutal-button bg-coffee-600 hover:bg-coffee-700 text-white">
                Create First Post
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-2">
          {/* Previous Button */}
          <Button
            asChild
            variant="outline"
            className={`neobrutal-button ${currentPage <= 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-coffee-100"}`}
            disabled={currentPage <= 1}
          >
            {currentPage <= 1 ? (
              <span>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </span>
            ) : (
              <Link href={`/feed?page=${currentPage - 1}`}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Link>
            )}
          </Button>

          {/* Page Numbers */}
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number

              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              const isCurrentPage = pageNum === currentPage

              return (
                <Button
                  key={pageNum}
                  asChild={!isCurrentPage}
                  variant={isCurrentPage ? "default" : "outline"}
                  size="sm"
                  className={`neobrutal-button min-w-[40px] ${
                    isCurrentPage ? "bg-coffee-600 text-white" : "hover:bg-coffee-100"
                  }`}
                >
                  {isCurrentPage ? <span>{pageNum}</span> : <Link href={`/feed?page=${pageNum}`}>{pageNum}</Link>}
                </Button>
              )
            })}
          </div>

          {/* Next Button */}
          <Button
            asChild
            variant="outline"
            className={`neobrutal-button ${
              currentPage >= totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-coffee-100"
            }`}
            disabled={currentPage >= totalPages}
          >
            {currentPage >= totalPages ? (
              <span>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </span>
            ) : (
              <Link href={`/feed?page=${currentPage + 1}`}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            )}
          </Button>
        </div>
      )}

      {/* Page info at bottom */}
      {totalPages > 1 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-neobrutal-secondary">
            Page {currentPage} of {totalPages}
          </p>
        </div>
      )}
    </div>
  )
}
