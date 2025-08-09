"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ThumbsDown, ThumbsUp, MessageCircle, User } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase"
import { handleVote as handleVoteAction } from "@/actions/votes"
import type { Post } from "@/lib/supabase"

interface PostCardProps {
  post: Post
  currentUserId?: string
}

type VoteType = "red" | "green"

export default function PostCard({ post, currentUserId }: PostCardProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [isVoting, setIsVoting] = useState(false)
  const [greenFlags, setGreenFlags] = useState<number>(post.green_flags)
  const [redFlags, setRedFlags] = useState<number>(post.red_flags)
  const [userVote, setUserVote] = useState<VoteType | null>(null)

  // Load current user's vote for this post, if any
  useEffect(() => {
    let isMounted = true
    async function loadVote() {
      if (!currentUserId) return
      const { data, error } = await supabase
        .from("votes")
        .select("id, vote_type")
        .eq("post_id", post.id)
        .eq("user_id", currentUserId)
        .maybeSingle()

      if (!isMounted) return
      if (error) {
        console.debug("loadVote error:", error.message)
        return
      }
      if (data?.vote_type) {
        setUserVote(data.vote_type as VoteType)
      }
    }
    loadVote()
    return () => {
      isMounted = false
    }
  }, [post.id, currentUserId, supabase])

  const handleVote = async (voteType: VoteType) => {
    if (!currentUserId || isVoting) return

    setIsVoting(true)

    // Save originals for rollback on error
    const prevVote = userVote
    const prevGreen = greenFlags
    const prevRed = redFlags

    // Optimistic UI
    if (prevVote === voteType) {
      // remove vote
      setUserVote(null)
      if (voteType === "green") setGreenFlags((g) => Math.max(0, g - 1))
      else setRedFlags((r) => Math.max(0, r - 1))
    } else {
      setUserVote(voteType)
      if (voteType === "green") {
        setGreenFlags((g) => g + 1)
        if (prevVote === "red") setRedFlags((r) => Math.max(0, r - 1))
      } else {
        setRedFlags((r) => r + 1)
        if (prevVote === "green") setGreenFlags((g) => Math.max(0, g - 1))
      }
    }

    try {
      const result = await handleVoteAction(post.id, voteType)

      if (!result.success) {
        throw new Error(result.message)
      }

      toast({
        title: voteType === "green" ? "💚 Green Flag!" : "❤️ Red Flag!",
        description: result.message,
        className: `neobrutal-card ${voteType === "green" ? "bg-neobrutal-green" : "bg-neobrutal-red"} text-white border-neobrutal-primary`,
      })
    } catch (err: any) {
      console.error("Error voting:", err)
      // Rollback optimistic UI on error
      setUserVote(prevVote)
      setGreenFlags(prevGreen)
      setRedFlags(prevRed)
      toast({
        title: "❌ Vote Failed",
        description: err.message || "We couldn't save your vote. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVoting(false)
    }
  }

  const handleCardClick = () => {
    router.push(`/post/${post.id}`)
  }

  const primaryPhoto =
    post.photos && post.photos.length > 0
      ? post.photos[0]
      : `/placeholder.svg?width=400&height=500&query=post+about+${post.subject_name}`

  const userDisplayName = post.user?.display_name || post.user?.full_name || "Anonymous"
  const userAvatarUrl = post.user?.avatar_url
  const userId = post.user?.id

  return (
    <Card
      className="w-full overflow-hidden rounded-lg border-2 border-neobrutal-primary shadow-neobrutalism group relative cursor-pointer transition-all hover:shadow-neobrutalism-lg hover:-translate-y-1"
      onClick={handleCardClick}
    >
      <div className="relative w-full aspect-[3/4]">
        <img
          src={primaryPhoto || "/placeholder.svg"}
          alt={`Post about ${post.subject_name}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          {userId ? (
            <a
              href={`/user/${userId}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center space-x-2 group/user z-10"
              aria-label={`View ${userDisplayName}'s profile`}
            >
              <Avatar className="h-10 w-10 border-2 border-white group-hover/user:border-neobrutal-yellow">
                <AvatarImage src={userAvatarUrl || undefined} alt={userDisplayName} />
                <AvatarFallback className="bg-neobrutal-primary text-white">
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-white drop-shadow-md group-hover/user:underline">{userDisplayName}</p>
            </a>
          ) : (
            <div
              className="flex items-center space-x-2 z-10 opacity-90 cursor-not-allowed"
              aria-disabled="true"
              title="Profile not available"
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar className="h-10 w-10 border-2 border-white">
                <AvatarImage src={userAvatarUrl || undefined} alt={userDisplayName} />
                <AvatarFallback className="bg-neobrutal-primary text-white">
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-white drop-shadow-md">{userDisplayName}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 hover:text-white z-10"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/post/${post.id}`)
            }}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="ml-1 font-bold">{post.comment_count || 0}</span>
          </Button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-xl font-bold mt-2 truncate drop-shadow-lg">
            {post.subject_name}, {post.subject_age}
          </h3>
          <p className="text-sm text-gray-300 drop-shadow-md">
            {post.city}, {post.state}
          </p>
        </div>
      </div>
      <div className="p-2 bg-neobrutal-background border-t-2 border-neobrutal-primary flex items-center justify-around space-x-2">
        <Button
          variant={userVote === "green" ? "default" : "ghost"}
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleVote("green")
          }}
          disabled={isVoting}
          className={`w-full neobrutal-button transition-colors ${
            userVote === "green"
              ? "bg-neobrutal-green text-white"
              : "bg-white text-neobrutal-green hover:bg-neobrutal-green/10"
          }`}
        >
          <ThumbsUp className="h-5 w-5 mr-2" />
          <span className="font-bold">{greenFlags}</span>
        </Button>
        <Button
          variant={userVote === "red" ? "default" : "ghost"}
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleVote("red")
          }}
          disabled={isVoting}
          className={`w-full neobrutal-button transition-colors ${
            userVote === "red" ? "bg-neobrutal-red text-white" : "bg-white text-neobrutal-red hover:bg-neobrutal-red/10"
          }`}
        >
          <ThumbsDown className="h-5 w-5 mr-2" />
          <span className="font-bold">{redFlags}</span>
        </Button>
      </div>
    </Card>
  )
}
