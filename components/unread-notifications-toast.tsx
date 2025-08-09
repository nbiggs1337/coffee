"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

type Props = {
  unreadCount: number
}

export default function UnreadNotificationsToast({ unreadCount }: Props) {
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!unreadCount || unreadCount <= 0) return

    // Only show once per session on feed
    const key = "feed-unread-notifications-shown"
    if (sessionStorage.getItem(key) === "1") return
    sessionStorage.setItem(key, "1")

    toast({
      title: "You have new notifications",
      description:
        unreadCount === 1 ? "You have 1 unread notification." : `You have ${unreadCount} unread notifications.`,
    })
  }, [unreadCount, router])

  return null
}
