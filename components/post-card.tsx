"use client"

import type React from "react"

import { useState, useOptimistic } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, ThumbsDown, MessageCircle, MapPin, Phone, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import type { Post } from "@/lib/supabase"

interface PostCardProps {
  post: Post
  currentUserId?: string
  showVoting?: boolean
}

interface OptimisticVote {
  hasVoted: boolean
  voteType: "red" | "green" | null
  redFlags: number
  greenFlags: number
}

export default function PostCard({ post, currentUserId, showVoting = true }: PostCardProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [isVoting, setIsVoting] = useState(false)
  const [userVote, setUserVote] = useState<"red" | "green" | null>(null)

  const [optimisticVote, addOptimisticVote] = useOptimistic<OptimisticVote, { type: "red" | "green" }>(
    {
      hasVoted: false,
      voteType: userVote,
      redFlags: post.red_flags,
      greenFlags: post.green_flags,
    },
    (state, { type }) => ({
      hasVoted: true,
      voteType: type,
      redFlags:
        type === "red"
          ? state.redFlags + (state.voteType === "red" ? 0 : state.voteType === "green" ? 1 : 1)
          : state.voteType === "red"
            ? state.redFlags - 1
            : state.redFlags,
      greenFlags:
        type === "green"
          ? state.greenFlags + (state.voteType === "green" ? 0 : state.voteType === "red" ? 1 : 1)
          : state.voteType === "green"
            ? state.greenFlags - 1
            : state.greenFlags,
    }),
  )

  const handleVote = async (voteType: "red" | "green") => {
    if (!currentUserId || isVoting) return

    setIsVoting(true)
    addOptimisticVote({ type: voteType })

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from("votes")
        .select("vote_type")
        .eq("post_id", post.id)
        .eq("user_id", currentUserId)
        .single()

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote if clicking same type
          await supabase.from("votes").delete().eq("post_id", post.id).eq("user_id", currentUserId)

          setUserVote(null)
          toast({
            title: "🗳️ Vote Removed",
            description: "Your vote has been removed.",
            className: "neobrutal-card bg-neobrutal-yellow text-black border-neobrutal-primary",
          })
        } else {
          // Update vote type
          await supabase
            .from("votes")
            .update({ vote_type: voteType })
            .eq("post_id", post.id)
            .eq("user_id", currentUserId)

          setUserVote(voteType)
          toast({
            title: voteType === "green" ? "💚 Green Flag!" : "❤️ Red Flag!",
            description: `Your vote has been updated to ${voteType === "green" ? "Green Flag" : "Red Flag"}.`,
            className: `neobrutal-card ${voteType === "green" ? "bg-neobrutal-green" : "bg-neobrutal-red"} text-white border-neobrutal-primary`,
          })
        }
      } else {
        // Create new vote
        await supabase.from("votes").insert({
          post_id: post.id,
          user_id: currentUserId,
          vote_type: voteType,
        })

        setUserVote(voteType)
        toast({
          title: voteType === "green" ? "💚 Green Flag!" : "❤️ Red Flag!",
          description: `You voted ${voteType === "green" ? "Green Flag" : "Red Flag"} on this post.`,
          className: `neobrutal-card ${voteType === "green" ? "bg-neobrutal-green" : "bg-neobrutal-red"} text-white border-neobrutal-primary`,
        })
      }

      router.refresh()
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "❌ Vote Failed",
        description: "Unable to record your vote. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVoting(false)
    }
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

  // Safe user data with null checks
  const userDisplayName = post.user?.display_name || post.user?.full_name || "Anonymous"
  const userUsername = post.user?.display_name || "anonymous"
  const userAvatarUrl = post.user?.avatar_url || "/diverse-user-avatars.png"

  return (
    <Card
      className="neobrutal-card bg-white border-neobrutal-primary shadow-neobrutal hover:shadow-neobrutal-lg transition-all duration-200 cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar
              className="h-10 w-10 border-2 border-neobrutal-primary cursor-pointer hover:scale-105 transition-transform"
              onClick={handleAvatarClick}
            >
              <AvatarImage src={userAvatarUrl || "/placeholder.svg"} alt={userDisplayName} />
              <AvatarFallback className="bg-neobrutal-yellow text-neobrutal-primary font-bold">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p
                className="font-semibold text-neobrutal-primary cursor-pointer hover:text-neobrutal-blue transition-colors"
                onClick={handleUsernameClick}
              >
                {userDisplayName}
              </p>
              <p className="text-sm text-gray-600">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="border-neobrutal-primary text-neobrutal-primary">
              <MapPin className="h-3 w-3 mr-1" />
              {post.city}, {post.state}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-neobrutal-primary">
              {post.subject_name}, {post.subject_age}
            </h3>
            {post.phone_number && (
              <Badge variant="secondary" className="bg-neobrutal-blue text-white">
                <Phone className="h-3 w-3 mr-1" />
                {post.phone_number}
              </Badge>
            )}
          </div>
          <p className="text-gray-700 leading-relaxed">{post.caption}</p>
        </div>

        {post.photos && post.photos.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {post.photos.slice(0, 4).map((photo, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={photo || "/placeholder.svg"}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border-2 border-neobrutal-primary"
                />
                {index === 3 && post.photos.length > 4 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">+{post.photos.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t-2 border-neobrutal-primary">
          {showVoting && currentUserId ? (
            <div className="flex items-center space-x-4">
              <Button
                variant={optimisticVote.voteType === "green" ? "default" : "outline"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleVote("green")
                }}
                disabled={isVoting}
                className={`neobrutal-button ${
                  optimisticVote.voteType === "green"
                    ? "bg-neobrutal-green text-white"
                    : "border-neobrutal-green text-neobrutal-green hover:bg-neobrutal-green hover:text-white"
                }`}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                {optimisticVote.greenFlags}
              </Button>
              <Button
                variant={optimisticVote.voteType === "red" ? "default" : "outline"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleVote("red")
                }}
                disabled={isVoting}
                className={`neobrutal-button ${
                  optimisticVote.voteType === "red"
                    ? "bg-neobrutal-red text-white"
                    : "border-neobrutal-red text-neobrutal-red hover:bg-neobrutal-red hover:text-white"
                }`}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                {optimisticVote.redFlags}
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-neobrutal-green">
                <ThumbsUp className="h-4 w-4" />
                <span className="font-semibold">{post.green_flags}</span>
              </div>
              <div className="flex items-center space-x-1 text-neobrutal-red">
                <ThumbsDown className="h-4 w-4" />
                <span className="font-semibold">{post.red_flags}</span>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="neobrutal-button-ghost"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/post/${post.id}`)
            }}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            {post.comment_count || 0}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
