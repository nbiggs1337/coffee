"use client"

import type React from "react"

import { useCallback, useEffect, useMemo, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThumbsUp, ThumbsDown, MapPin, Phone } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

type User = {
  id: string
  display_name?: string | null
  full_name?: string | null
  avatar_url?: string | null
}

type Post = {
  id: string
  user_id: string
  subject_name: string
  subject_age: number
  caption: string
  photos?: string[] | null
  red_flags: number | null
  green_flags: number | null
  city?: string | null
  state?: string | null
  phone_number?: string | null
  created_at: string
  user?: User | null
}

interface SwipeClientProps {
  initialPosts?: Post[]
  currentUserId?: string
}

export default function SwipeClient({ initialPosts = [], currentUserId = "" }: SwipeClientProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [userId, setUserId] = useState<string>(currentUserId)
  const [posts, setPosts] = useState<Post[]>(Array.isArray(initialPosts) ? initialPosts : [])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [isVoting, setIsVoting] = useState<boolean>(false)

  // Swipe gesture state
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const log = (...args: any[]) => console.log("[/swipe CLIENT]", ...args)

  const { toast } = useToast()

  // On mount, ensure we have the user ID from client auth if not provided
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        log("Mount: Resolving user...")
        const { data, error } = await supabase.auth.getUser()
        if (error) {
          log("auth.getUser error:", error.message)
        }
        const u = data?.user
        if (!cancelled) {
          if (!u) {
            log("No user found on client, redirecting to /login")
            router.replace("/login")
            return
          }
          setUserId(u.id)
          log("Resolved user id:", u.id)
        }
      } catch (e) {
        log("Unexpected auth error:", e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router, supabase])

  // Data loader
  const loadPosts = useCallback(
    async (uid: string) => {
      setLoading(true)
      setError(null)
      try {
        log("Loading posts for user:", uid)

        const { data: voted, error: votesError } = await supabase.from("votes").select("post_id").eq("user_id", uid)

        if (votesError) {
          log("Votes query error:", votesError.message)
        } else {
          log("Votes fetched:", voted?.length || 0)
        }

        const votedIds = new Set((voted || []).map((v: any) => v.post_id as string))

        const { data: fetched, error: postsError } = await supabase
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
              id,
              display_name,
              full_name,
              avatar_url
            )
          `,
          )
          .neq("user_id", uid)
          .order("created_at", { ascending: false })

        if (postsError) {
          log("Posts query error:", postsError.message)
          setError(postsError.message)
          setPosts([])
          setCurrentIndex(0)
          setLoading(false)
          return
        }

        log("Fetched posts count:", fetched?.length || 0)

        const available = (fetched || []).filter((p: Post) => !votedIds.has(p.id))
        log("Available posts after filtering votes:", available.length)

        setPosts(available)
        setCurrentIndex(0)
      } catch (e: any) {
        log("Unexpected load error:", e?.message || e)
        setError(e?.message || "Unexpected error")
        setPosts([])
        setCurrentIndex(0)
      } finally {
        setLoading(false)
      }
    },
    [supabase],
  )

  useEffect(() => {
    if (!userId) return
    loadPosts(userId)
  }, [loadPosts, userId])

  const currentPost = posts[currentIndex]
  const remaining = Math.max(0, posts.length - currentIndex)

  // Handle vote with animation
  const handleVote = useCallback(
    async (voteType: "green" | "red", fromSwipe = false) => {
      if (!currentPost || !userId || isVoting) return

      setIsVoting(true)

      // Animate card out if not from swipe gesture
      if (!fromSwipe && cardRef.current) {
        const direction = voteType === "green" ? 1 : -1
        cardRef.current.style.transform = `translateX(${direction * 100}%) rotate(${direction * 15}deg)`
        cardRef.current.style.opacity = "0.3"
      }

      try {
        log(`Voting ${voteType} on post ${currentPost.id} by user ${userId}`)
        const { error } = await supabase.from("votes").insert({
          post_id: currentPost.id,
          user_id: userId,
          vote_type: voteType,
        })

        if (error) {
          log("Vote insert error:", error.message)
          toast({
            title: "Error",
            description: "Failed to record vote. Please try again.",
            variant: "destructive",
          })
        } else {
          log("Vote recorded")
          toast({
            title: voteType === "green" ? "Green Flag!" : "Red Flag!",
            description: `You ${voteType === "green" ? "liked" : "passed on"} this post.`,
          })
        }

        // Wait for animation, then advance
        setTimeout(
          () => {
            setCurrentIndex((i) => i + 1)
            setDragOffset({ x: 0, y: 0 })
            if (cardRef.current) {
              cardRef.current.style.transform = ""
              cardRef.current.style.opacity = "1"
            }
            setIsVoting(false)
          },
          fromSwipe ? 0 : 300,
        )
      } catch (e: any) {
        log("Unexpected vote error:", e?.message || e)
        setCurrentIndex((i) => i + 1)
        setIsVoting(false)
      }
    },
    [currentPost, supabase, userId, isVoting, toast],
  )

  // Mouse/Touch handlers for swipe gestures
  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (isVoting) return
      setIsDragging(true)
      setStartPos({ x: clientX, y: clientY })
      setDragOffset({ x: 0, y: 0 })
    },
    [isVoting],
  )

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging || isVoting) return
      const deltaX = clientX - startPos.x
      const deltaY = clientY - startPos.y
      setDragOffset({ x: deltaX, y: deltaY })
    },
    [isDragging, startPos, isVoting],
  )

  const handleEnd = useCallback(() => {
    if (!isDragging || isVoting) return
    setIsDragging(false)

    const threshold = 100
    const { x } = dragOffset

    if (Math.abs(x) > threshold) {
      // Swipe detected
      const voteType = x > 0 ? "green" : "red"
      handleVote(voteType, true)
    } else {
      // Snap back
      setDragOffset({ x: 0, y: 0 })
    }
  }, [isDragging, dragOffset, handleVote, isVoting])

  // Mouse events
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      handleStart(e.clientX, e.clientY)
    },
    [handleStart],
  )

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY)
    },
    [handleMove],
  )

  const onMouseUp = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  // Touch events
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      handleStart(touch.clientX, touch.clientY)
    },
    [handleStart],
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      handleMove(touch.clientX, touch.clientY)
    },
    [handleMove],
  )

  const onTouchEnd = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  // Global mouse events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
      return () => {
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
      }
    }
  }, [isDragging, onMouseMove, onMouseUp])

  // UI states
  if (loading && posts.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Loading…</h2>
            <p className="text-neobrutal-secondary">Fetching posts to swipe.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6">
        <Card className="w-full max-w-md neobrutal-card">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Couldn't load posts</h2>
            <p className="text-neobrutal-secondary">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentPost) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6">
        <Card className="w-full max-w-md neobrutal-card">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">{posts.length === 0 ? "No Posts Available" : "All Done!"}</h2>
            <p className="text-neobrutal-secondary">
              {posts.length === 0
                ? "There are no new posts to swipe through. Check back later!"
                : "You've swiped through all available posts. Great job!"}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const firstPhoto = currentPost.photos?.[0] || null
  const author = currentPost.user
  const authorInitial = (
    author?.display_name?.[0] ||
    author?.full_name?.[0] ||
    currentPost.subject_name?.[0] ||
    "?"
  ).toUpperCase()

  // Calculate card transform
  const rotation = dragOffset.x * 0.1
  const opacity = isDragging ? Math.max(0.7, 1 - Math.abs(dragOffset.x) / 300) : 1
  const cardTransform = `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`

  // Calculate indicator opacities
  const greenOpacity = Math.max(0, Math.min(1, dragOffset.x / 100))
  const redOpacity = Math.max(0, Math.min(1, -dragOffset.x / 100))

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-neobrutal-background text-neobrutal-primary">
      <div className="w-full max-w-md relative">
        {/* Progress */}
        <div className="mb-4 text-center text-sm text-neobrutal-secondary">{remaining} remaining</div>

        {/* Swipe indicators */}
        <div
          className="absolute top-20 left-4 bg-green-500 text-white px-4 py-2 rounded-lg font-bold z-30 pointer-events-none"
          style={{ opacity: greenOpacity }}
        >
          GREEN FLAG
        </div>
        <div
          className="absolute top-20 right-4 bg-red-500 text-white px-4 py-2 rounded-lg font-bold z-30 pointer-events-none"
          style={{ opacity: redOpacity }}
        >
          RED FLAG
        </div>

        <Card
          ref={cardRef}
          className="neobrutal-card select-none cursor-grab active:cursor-grabbing"
          style={{
            transform: cardTransform,
            opacity,
            transition: isDragging ? "none" : "all 0.3s ease-out",
          }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <CardContent className="p-6 space-y-4">
            {/* Author */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 neobrutal-avatar">
                <AvatarImage src={author?.avatar_url || "/placeholder.svg?height=40&width=40&query=user avatar"} />
                <AvatarFallback className="neobrutal-avatar-fallback">{authorInitial}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{author?.display_name || author?.full_name || "Anonymous"}</p>
                <p className="text-sm text-neobrutal-secondary">
                  {new Date(currentPost.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Image */}
            {firstPhoto && (
              <div className="rounded-lg overflow-hidden border-4 border-black">
                <img
                  src={firstPhoto || "/placeholder.svg"}
                  alt={currentPost.subject_name}
                  className="w-full h-64 object-cover"
                  crossOrigin="anonymous"
                />
              </div>
            )}

            {/* Content */}
            <div>
              <h3 className="text-xl font-bold">
                {currentPost.subject_name}
                {Number.isFinite(currentPost.subject_age) ? `, ${currentPost.subject_age}` : ""}
              </h3>
              <p className="text-neobrutal-secondary mt-2">{currentPost.caption}</p>

              {(currentPost.city || currentPost.state) && (
                <div className="flex items-center gap-1 text-sm text-neobrutal-secondary mt-2">
                  <MapPin className="h-4 w-4" />
                  <span>{[currentPost.city, currentPost.state].filter(Boolean).join(", ")}</span>
                </div>
              )}

              {currentPost.phone_number && (
                <div className="flex items-center gap-1 text-sm text-neobrutal-secondary mt-1">
                  <Phone className="h-4 w-4" />
                  <span>{currentPost.phone_number}</span>
                </div>
              )}
            </div>

            {/* Vote counts */}
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1 text-green-600">
                <ThumbsUp className="h-4 w-4" />
                <span>{currentPost.green_flags || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-red-600">
                <ThumbsDown className="h-4 w-4" />
                <span>{currentPost.red_flags || 0}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-2">
              <Button
                onClick={() => handleVote("red")}
                disabled={isVoting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white neobrutal-button"
              >
                <ThumbsDown className="h-5 w-5 mr-2" />
                RED FLAG
              </Button>
              <Button
                onClick={() => handleVote("green")}
                disabled={isVoting}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white neobrutal-button"
              >
                <ThumbsUp className="h-5 w-5 mr-2" />
                GREEN FLAG
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Position indicator */}
        <div className="mt-3 text-center text-sm text-neobrutal-secondary">
          {currentIndex + 1} of {posts.length}
        </div>
      </div>
    </div>
  )
}
