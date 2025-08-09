import { Loader2 } from "lucide-react"

export default function SearchLoading() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-neobrutal-background">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-neobrutal-primary mx-auto mb-4" />
        <p className="text-neobrutal-secondary">Searching posts...</p>
      </div>
    </div>
  )
}
