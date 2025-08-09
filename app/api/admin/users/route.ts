import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // 1. Verify the current user is authenticated
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("API /api/admin/users: Auth error or no user.", { authError })
      return new NextResponse("Unauthorized: Not logged in.", { status: 401 })
    }

    // 2. Verify the authenticated user is an admin
    const { data: currentUserProfile, error: profileError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error(`API /api/admin/users: Could not check admin status for user ${user.id}.`, { profileError })
      return new NextResponse("Forbidden: Could not verify admin status.", { status: 403 })
    }

    if (!currentUserProfile?.is_admin) {
      console.warn(`API /api/admin/users: Non-admin user ${user.id} attempted to access all users.`)
      return new NextResponse("Forbidden: User is not an admin.", { status: 403 })
    }

    // 3. If confirmed as admin, use the admin client to fetch all users
    const adminSupabase = createSupabaseAdminClient()
    if (!adminSupabase) {
      throw new Error("Failed to create Supabase admin client. Check server environment variables.")
    }

    const { data: allUsers, error: allUsersError } = await adminSupabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })

    if (allUsersError) {
      console.error("API /api/admin/users: Error fetching all users with admin client.", { allUsersError })
      return new NextResponse(`Error fetching users: ${allUsersError.message}`, { status: 500 })
    }

    return NextResponse.json(allUsers || [])
  } catch (e: any) {
    console.error("API /api/admin/users: An unexpected error occurred.", { error: e, message: e.message })
    return new NextResponse(e?.message || "An internal server error occurred.", { status: 500 })
  }
}
