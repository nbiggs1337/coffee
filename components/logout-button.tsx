"use client"

import { useCallback } from "react"
import { LogOutIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const handleLogout = useCallback(async () => {
    toast({
      title: "Signing Out...",
      description: "Please wait while we sign you out.",
      className: "neobrutal-card bg-neobrutal-blue text-white border-neobrutal-primary",
    })

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("[DEBUG] LogoutButton (Client): Error during sign out:", error.message)
      toast({
        title: "❌ Sign Out Failed",
        description: "Unable to sign out. Please try again.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "✅ Signed Out Successfully",
      description: "You have been signed out. See you next time!",
      className: "neobrutal-card bg-neobrutal-green text-white border-neobrutal-primary",
    })

    // Replace to avoid going back into an authenticated page, and refresh to sync Server Components
    setTimeout(() => {
      router.replace("/login")
      router.refresh()
    }, 1000)
  }, [router, supabase, toast])

  return (
    <DropdownMenuItem className="neobrutal-dropdown-item" onClick={handleLogout}>
      <LogOutIcon className="mr-2 h-4 w-4" />
      {"Logout"}
    </DropdownMenuItem>
  )
}
