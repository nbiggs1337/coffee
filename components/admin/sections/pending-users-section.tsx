"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, X, Eye, Calendar, Mail, User, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import Image from "next/image"
import { toggleApproval, rejectUser } from "@/actions/admin"

type PendingUser = {
  id: string
  email: string
  full_name: string | null
  verification_photo_url: string | null
  created_at: string
  agreed_to_terms: boolean
}

interface PendingUsersSectionProps {
  onStatsChange: () => void
}

export default function PendingUsersSection({ onStatsChange }: PendingUsersSectionProps) {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; userName: string } | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadPendingUsers()
  }, [])

  const loadPendingUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name, verification_photo_url, created_at, agreed_to_terms")
        .eq("is_approved", false)
        .eq("is_rejected", false)
        .order("created_at", { ascending: true })

      if (error) throw error
      setPendingUsers(data || [])
    } catch (error: any) {
      console.error("Error loading pending users:", error)
      toast({
        title: "Error loading pending users",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (userId: string, action: "approve" | "reject") => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }))

    try {
      let result
      if (action === "approve") {
        result = await toggleApproval(userId, true)
      } else {
        result = await rejectUser(userId)
      }

      if (result.success) {
        setPendingUsers((prev) => prev.filter((user) => user.id !== userId))
        onStatsChange()
        toast({
          title: `User ${action}d successfully`,
          description: `The user has been ${action}d.`,
          className: `neobrutal-card ${action === "approve" ? "bg-neobrutal-green" : "bg-neobrutal-red"} text-white border-neobrutal-primary`,
        })
      } else {
        toast({
          title: `Error ${action}ing user`,
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Unexpected error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }))
    }
  }

  if (loading) {
    return (
      <Card className="neobrutal-card">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-neobrutal-primary" />
          <span className="ml-2">Loading pending users...</span>
        </CardContent>
      </Card>
    )
  }

  if (pendingUsers.length === 0) {
    return (
      <Card className="neobrutal-card">
        <CardContent className="text-center p-8">
          <Check className="h-16 w-16 text-neobrutal-green mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">All caught up!</h3>
          <p className="text-neobrutal-secondary">No users pending approval at the moment.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Users Pending Approval</h2>
        <Badge variant="outline" className="neobrutal-card">
          {pendingUsers.length} pending
        </Badge>
      </div>

      <div className="grid gap-4">
        {pendingUsers.map((user) => (
          <Card key={user.id} className="neobrutal-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 neobrutal-avatar">
                    <AvatarImage
                      src={user.verification_photo_url || "/placeholder.svg?height=64&width=64&query=user avatar"}
                    />
                    <AvatarFallback className="neobrutal-avatar-fallback text-lg">
                      {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-neobrutal-secondary" />
                      <span className="font-bold text-lg">{user.full_name || "No name provided"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-neobrutal-secondary" />
                      <span className="text-neobrutal-secondary">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-neobrutal-secondary" />
                      <span className="text-sm text-neobrutal-secondary">
                        Applied {format(new Date(user.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.agreed_to_terms ? (
                    <Badge className="bg-neobrutal-green text-white">Terms Agreed</Badge>
                  ) : (
                    <Badge variant="destructive">Terms Not Agreed</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {user.verification_photo_url && (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Image
                          src={user.verification_photo_url || "/placeholder.svg"}
                          alt={`Verification photo for ${user.full_name || user.email}`}
                          width={80}
                          height={80}
                          className="object-cover rounded border-2 border-neobrutal-primary cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() =>
                            setSelectedPhoto({
                              url: user.verification_photo_url!,
                              userName: user.full_name || user.email,
                            })
                          }
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSelectedPhoto({
                            url: user.verification_photo_url!,
                            userName: user.full_name || user.email,
                          })
                        }
                        className="neobrutal-button bg-neobrutal-blue text-white"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Photo
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleAction(user.id, "approve")}
                    disabled={actionLoading[user.id]}
                    className="neobrutal-button bg-neobrutal-green text-white"
                  >
                    {actionLoading[user.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleAction(user.id, "reject")}
                    disabled={actionLoading[user.id]}
                    className="neobrutal-button bg-neobrutal-red text-white"
                  >
                    {actionLoading[user.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <X className="h-4 w-4 mr-1" />
                    )}
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <Image
                src={selectedPhoto.url || "/placeholder.svg"}
                alt={`Verification photo for ${selectedPhoto.userName}`}
                width={800}
                height={600}
                className="max-w-full max-h-[80vh] object-contain neobrutal-card"
              />
              <Button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-2 right-2 neobrutal-button bg-neobrutal-red text-white"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-bold text-white">Verification Photo for {selectedPhoto.userName}</h3>
              <p className="text-gray-300 text-sm">Click outside to close</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
