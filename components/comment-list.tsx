"use client"

import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import type { CommentWithUser } from "@/lib/types"
import Link from "next/link"

interface CommentListProps {
  comments: CommentWithUser[]
}

export default function CommentList({ comments }: CommentListProps) {
  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-neobrutal-secondary">No comments yet. Be the first to comment!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-neobrutal-primary">Comments</h3>
      {comments.map((comment) => {
        const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
        const displayName = comment.users?.display_name || "Anon"
        const userId = comment.users?.id

        return (
          <Card key={comment.id} className="neobrutal-card">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {userId ? (
                  <Link href={`/user/${userId}`} className="hover:opacity-80 transition-opacity">
                    <Avatar className="h-8 w-8 neobrutal-avatar">
                      <AvatarImage
                        src={comment.users?.avatar_url || "/placeholder.svg?height=32&width=32&query=user avatar"}
                      />
                      <AvatarFallback className="neobrutal-avatar-fallback text-xs">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                ) : (
                  <Avatar className="h-8 w-8 neobrutal-avatar">
                    <AvatarImage src="/diverse-user-avatars.png" />
                    <AvatarFallback className="neobrutal-avatar-fallback text-xs">A</AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {userId ? (
                      <Link href={`/user/${userId}`} className="font-semibold text-neobrutal-primary hover:underline">
                        {displayName}
                      </Link>
                    ) : (
                      <span className="font-semibold text-neobrutal-primary">{displayName}</span>
                    )}
                    <span className="text-sm text-neobrutal-secondary">•</span>
                    <span className="text-sm text-neobrutal-secondary">{timeAgo}</span>
                  </div>
                  <p className="text-neobrutal-secondary break-words">{comment.content}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
