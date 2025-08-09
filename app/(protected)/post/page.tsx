import { createServerSupabase } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import CreatePostClient from "@/components/pages/create-post-client"
import type { User } from "@/lib/supabase"

export default async function CreatePostPage() {
  const supabase = createServerSupabase()

  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      console.error("CreatePostPage: User not authenticated or auth error:", authError?.message)
      redirect("/login")
    }

    // Fetch the full user profile from the 'users' table
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select<"*", User>("*")
      .eq("id", authUser.id)
      .single()

    if (profileError || !userProfile) {
      console.error("CreatePostPage: Could not fetch user profile:", profileError?.message)
      // Redirect or show an error. For now, redirecting to login.
      redirect("/login?error=Failed to load user profile.")
    }

    // Check if user is approved
    if (!userProfile.is_approved || userProfile.is_rejected) {
      console.log("CreatePostPage: User not approved, redirecting to pending")
      redirect("/pending")
    }

    return (
      <main className="flex min-h-[calc(100vh-64px)] flex-col items-center p-4 md:p-6 bg-neobrutal-background text-neobrutal-primary">
        <div className="w-full max-w-2xl">
          <h1 className="text-4xl font-bold mb-8 text-center text-neobrutal-primary">Create New Post</h1>
          <CreatePostClient user={userProfile} />
        </div>
      </main>
    )
  } catch (error) {
    console.error("CreatePostPage: Unexpected error:", error)
    redirect("/login?error=An unexpected error occurred.")
  }
}
