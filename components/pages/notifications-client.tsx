"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Bell, BellOff, Clock, CheckCircle, AlertCircle, Users, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/components/ui/use-toast"

type Notification = {
  id: string
  user_id: string
  message: string
  is_read?: boolean
  created_at: string
  type?: string
  related_user_id?: string | null
  related_post_id?: string | null
  post_id?: string | null
}

interface NotificationsClientProps {
  userId: string
  initialNotifications?: Notification[] | null
}

export default function NotificationsClient({ userId, initialNotifications = [] }: NotificationsClientProps) {
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const hasAnnouncedUnread = useRef(false)

  const isUnread = (n: Notification) => !n.is_read

  useEffect(() => {
    if (!initialized) {
      if (Array.isArray(initialNotifications) && initialNotifications.length > 0) {
        setNotifications(initialNotifications)
      } else {
        fetchNotifications()
      }
      setInitialized(true)
    }
  }, [initialized])

  const fetchNotifications = async () => {
    if (!userId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching notifications:", error)
        toast({
          title: "Error loading notifications",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      setNotifications((data as Notification[]) || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const hasNotifications = notifications.length > 0
  const unreadCount = notifications.reduce((acc, n) => (isUnread(n) ? acc + 1 : acc), 0)

  useEffect(() => {
    if (!hasAnnouncedUnread.current && unreadCount > 0) {
      hasAnnouncedUnread.current = true
      toast({
        title: "🔔 New notifications",
        description: `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`,
      })
    }
  }, [unreadCount, toast])

  const handleClearAll = async () => {
    if (!userId || !Array.isArray(notifications) || notifications.length === 0) {
      toast({
        title: "No notifications",
        description: "There are no notifications to clear.",
      })
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId)

      if (error) {
        console.error("Error clearing notifications:", error.message)
        toast({
          title: "Error clearing notifications",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))

      toast({
        title: "Notifications cleared!",
        description: "All notifications have been marked as read.",
      })
    } catch (error) {
      console.error("Error clearing notifications:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", userId)

      if (error) {
        console.error("Error marking notification as read:", error.message)
        toast({
          title: "Error updating notification",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))

      toast({
        title: "Marked as read",
        description: "Notification has been marked as read.",
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const handleOpenNotification = (n: Notification) => {
    const pid = n.related_post_id ?? n.post_id
    if (pid) {
      router.push(`/post/${pid}`)
    } else {
      toast({
        title: "No Linked Post",
        description: "This notification is not associated with a specific post.",
      })
    }
  }

  const getNotificationIcon = (message: string) => {
    if (message?.toLowerCase().includes("approved")) return <CheckCircle className="h-5 w-5 text-green-600" />
    if (message?.toLowerCase().includes("rejected")) return <AlertCircle className="h-5 w-5 text-red-600" />
    if (message?.toLowerCase().includes("comment")) return <MessageSquare className="h-5 w-5 text-blue-600" />
    if (message?.toLowerCase().includes("vote") || message?.toLowerCase().includes("flag"))
      return <Users className="h-5 w-5 text-purple-600" />
    return <Bell className="h-5 w-5 text-gray-600" />
  }

  const getNotificationCategory = (message: string) => {
    if (!message) return "System"
    const m = message.toLowerCase()
    if (m.includes("approved") || m.includes("rejected")) return "Account"
    if (m.includes("comment")) return "Comment"
    if (m.includes("vote") || m.includes("flag")) return "Vote"
    if (m.includes("post")) return "Post"
    return "System"
  }

  if (loading && !hasNotifications) {
    return (
      <div className="min-h-screen bg-neobrutal-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="neobrutal-card p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neobrutal-primary"></div>
              <span className="ml-3 text-neobrutal-primary font-bold">Loading notifications...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neobrutal-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {unreadCount > 0 && (
          <Alert className="neobrutal-card">
            <AlertTitle>New notifications</AlertTitle>
            <AlertDescription>
              You have {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}.
            </AlertDescription>
          </Alert>
        )}

        <div className="neobrutal-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-neobrutal-yellow rounded-lg border-2 border-neobrutal-primary">
                <Bell className="h-8 w-8 text-neobrutal-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-neobrutal-primary">Notifications</h1>
                <p className="text-neobrutal-secondary mt-1">
                  {hasNotifications ? `${notifications.length} total, ${unreadCount} unread` : "No notifications yet"}
                </p>
              </div>
            </div>

            {hasNotifications && unreadCount > 0 && (
              <Button
                onClick={handleClearAll}
                disabled={loading}
                className="neobrutal-button bg-neobrutal-blue text-neobrutal-primary font-bold px-6 py-3"
              >
                {loading ? "Marking..." : `Mark All Read (${unreadCount})`}
              </Button>
            )}
          </div>
        </div>

        {!hasNotifications ? (
          <div className="neobrutal-card p-12 text-center">
            <div className="p-4 bg-neobrutal-yellow rounded-full inline-block mb-6 border-2 border-neobrutal-primary">
              <BellOff className="h-12 w-12 text-neobrutal-primary" />
            </div>
            <h2 className="text-2xl font-bold text-neobrutal-primary mb-3">All Caught Up!</h2>
            <p className="text-neobrutal-secondary text-lg">
              No notifications to show. We'll let you know when something happens.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const unread = isUnread(notification)
              return (
                <Card
                  key={notification.id}
                  className={`neobrutal-card transition-all duration-200 hover:shadow-neobrutalism-sm cursor-pointer ${
                    unread ? "bg-neobrutal-yellow/10" : "opacity-75"
                  }`}
                  onClick={() => handleOpenNotification(notification)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.message)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className="border-2 border-neobrutal-primary bg-neobrutal-background text-neobrutal-primary font-bold"
                            >
                              {getNotificationCategory(notification.message || "")}
                            </Badge>
                            {unread && (
                              <Badge className="bg-neobrutal-red text-white border-2 border-neobrutal-primary font-bold">
                                NEW
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-neobrutal-secondary">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <p className="text-neobrutal-primary text-lg font-medium leading-relaxed mb-4">
                          {notification.message}
                        </p>
                        {unread && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkAsRead(notification.id)
                            }}
                            variant="outline"
                            size="sm"
                            className="neobrutal-button bg-neobrutal-green text-neobrutal-primary font-bold border-2 border-neobrutal-primary"
                          >
                            Mark as Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {hasNotifications && (
          <div className="neobrutal-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-neobrutal-primary">{notifications.length}</div>
                <div className="text-neobrutal-secondary font-medium">Total Notifications</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neobrutal-primary">{unreadCount}</div>
                <div className="text-neobrutal-secondary font-medium">Unread</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neobrutal-primary">{notifications.length - unreadCount}</div>
                <div className="text-neobrutal-secondary font-medium">Read</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
