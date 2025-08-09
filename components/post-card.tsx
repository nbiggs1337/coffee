"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThumbsUp, ThumbsDown, MessageCircle, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { voteOnPost } from "@/actions/votes"
import type { Post } from "@/lib/supabase"

interface PostCardProps {
  post: Post
  currentUserId?: string
}

export default function PostCard({ post, currentUserId }: PostCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [optimisticVotes, setOptimisticVotes] = useState({
    green: post.green_flags || 0,
    red: post.red_flags || 0,
  })

  const handleVote = (voteType: "green" | "red") => {
    if (!currentUserId) return

    // Optimistic update
    setOptimisticVotes((prev) => ({
      ...prev,
      [voteType]: prev[voteType] + 1,
    }))

    startTransition(async () => {
      try {
        await voteOnPost(post.id, voteType)
        toast({
          title: voteType === "green" ? "💚 Green Flag!" : "❤️ Red Flag!",
          description: `Your ${voteType === "green" ? "green flag" : "red flag"} has been recorded.`,
          className: `neobrutal-card ${voteType === "green" ? "bg-neobrutal-green" : "bg-neobrutal-red"} text-white border-neobrutal-primary`,
        })
      } catch (error: any) {
        // Revert optimistic update on error
        setOptimisticVotes({
          green: post.green_flags || 0,
          red: post.red_flags || 0,
        })
        toast({
          title: "❌ Vote Failed",
          description: error.message || "Unable to record your vote. Please try again.",
          variant: "destructive",
        })
      }
    })
  }

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (post.user?.id) {
      router.push(`/user/${post.user.id}`)
    }
  }

  const handleUsernameClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (post.user?.id) {
      router.push(`/user/${post.user.id}`)
    }
  }

  const handleCardClick = () => {
    router.push(`/post/${post.id}`)
  }

  const primaryPhoto = post.photos?.[0] || `/placeholder.svg?height=500&width=400&query=post+about+${post.subject_name}`
  const userDisplayName = post.user?.display_name || post.user?.full_name || "Anonymous"
  const userAvatarUrl = post.user?.avatar_url || "/diverse-user-avatars.png"

  return (
    <Card
      className="w-full overflow-hidden rounded-lg border-2 border-neobrutal-primary shadow-neobrutalism group relative cursor-pointer transition-all hover:shadow-neobrutalism-lg hover:-translate-y-1"
      onClick={handleCardClick}
    >
      {/* Main image container */}
      <div className="relative w-full aspect-[3/4]">
        <img
          src={primaryPhoto || "/placeholder.svg"}
          alt={`Post about ${post.subject_name}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* User info overlay - top */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar
              className="h-10 w-10 border-2 border-white cursor-pointer hover:scale-105 transition-transform"
              onClick={handleAvatarClick}
            >
              <AvatarImage src={userAvatarUrl || "/placeholder.svg"} alt={userDisplayName} />
              <AvatarFallback className="bg-neobrutal-yellow text-neobrutal-primary font-bold">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p
                className="font-bold text-white drop-shadow-md cursor-pointer hover:underline"
                onClick={handleUsernameClick}
              >
                {userDisplayName}
              </p>
            </div>
          </div>

          {/* Comment count */}
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 hover:text-white"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/post/${post.id}`)
            }}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            {post.comment_count || 0}
          </Button>
        </div>

        {/* Post details overlay - bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-xl font-bold mb-1 drop-shadow-lg">
            {post.subject_name}, {post.subject_age}
          </h3>
          <p className="text-sm text-gray-300 drop-shadow-md mb-2">
            {post.city}, {post.state}
          </p>
          {post.caption && <p className="text-sm text-white/90 drop-shadow-md line-clamp-2">{post.caption}</p>}
        </div>
      </div>

      {/* Vote buttons footer */}
      <div className="p-3 bg-neobrutal-background border-t-2 border-neobrutal-primary flex items-center justify-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleVote("green")
          }}
          disabled={isPending}
          className="neobrutal-button border-neobrutal-green text-neobrutal-green hover:bg-neobrutal-green hover:text-white flex-1"
        >
          <ThumbsUp className="h-4 w-4 mr-2" />
          <span className="font-bold">{optimisticVotes.green}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleVote("red")
          }}
          disabled={isPending}
          className="neobrutal-button border-neobrutal-red text-neobrutal-red hover:bg-neobrutal-red hover:text-white flex-1"
        >
          <ThumbsDown className="h-4 w-4 mr-2" />
          <span className="font-bold">{optimisticVotes.red}</span>
        </Button>
      </div>
    </Card>
  )
}
