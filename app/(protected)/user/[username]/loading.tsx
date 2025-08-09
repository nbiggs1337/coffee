import { Loader2 } from "lucide-react"

export default function UserProfileLoading() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-neobrutal-background">
      <Loader2 className="h-12 w-12 animate-spin text-neobrutal-primary" />
      <span className="sr-only">Loading user profile...</span>
    </div>
  )
}
