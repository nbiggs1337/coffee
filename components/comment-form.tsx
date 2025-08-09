"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, User } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import type { User as UserType } from "@/lib/supabase"

interface CommentFormProps {
  postId: string
  currentUser?: UserType | null
}

export default function CommentForm({ postId, currentUser }: CommentFormProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) {
      toast({
        title: "⚠️ Authentication Required",
        description: "Please log in to post a comment.",
        variant: "destructive",
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: "⚠️ Empty Comment",
        description: "Please write something before posting your comment.",
        variant: "destructive",
      })
      return
    }

    if (content.length > 500) {
      toast({
        title: "⚠️ Comment Too Long",
        description: "Comments must be 500 characters or less.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: currentUser.id,
        content: content.trim(),
      })

      if (error) throw error

      setContent("")
      toast({
        title: "💬 Comment Posted!",
        description: "Your comment has been added successfully.",
        className: "neobrutal-card bg-neobrutal-green text-white border-neobrutal-primary",
      })
      router.refresh()
    } catch (error) {
      console.error("Error posting comment:", error)
      toast({
        title: "❌ Comment Failed",
        description: "Unable to post your comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!currentUser) {
    return (
      <Card className="neobrutal-card bg-white border-neobrutal-primary">
        <CardContent className="p-4 text-center">
          <p className="text-neobrutal-secondary">Please log in to post a comment.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="neobrutal-card bg-white border-neobrutal-primary">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-8 w-8 border-2 border-neobrutal-primary">
              <AvatarImage
                src={currentUser.avatar_url || "/placeholder.svg"}
                alt={currentUser.display_name || currentUser.full_name || "User"}
              />
              <AvatarFallback className="bg-neobrutal-yellow text-neobrutal-primary font-bold">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Share your thoughts..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="neobrutal-input resize-none"
                rows={3}
                maxLength={500}
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{content.length}/500 characters</span>
                <Button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="neobrutal-button bg-neobrutal-blue text-white hover:bg-blue-600"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Post Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
