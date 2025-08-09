export const runtime = "nodejs"
export const dynamic = "force-dynamic" // Ensure fresh data on every request

import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import { createServerSupabase } from "@/lib/supabase-server"

export async function GET() {
  console.log("API /api/admin/users: Received GET request.")

  try {
    // 1. Create a server client to check the current user's authentication
    const supabase = createServerSupabase()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("API /api/admin/users: Authentication failed.", { authError })
      return NextResponse.json({ error: "Unauthorized: Not logged in." }, { status: 401 })
    }
    console.log(`API /api/admin/users: User ${user.id} is authenticated.`)

    // 2. Verify the authenticated user is an admin
    const { data: currentUserProfile, error: profileError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error(`API /api/admin/users: Could not fetch profile for user ${user.id}.`, { profileError })
      return NextResponse.json({ error: "Forbidden: Could not verify admin status." }, { status: 403 })
    }

    if (!currentUserProfile?.is_admin) {
      console.warn(`API /api/admin/users: Non-admin user ${user.id} attempted to access all users.`)
      return NextResponse.json({ error: "Forbidden: User is not an admin." }, { status: 403 })
    }
    console.log(`API /api/admin/users: User ${user.id} is confirmed as an admin.`)

    // 3. If confirmed as admin, use the admin client (with service role) to fetch all users
    const adminSupabase = createSupabaseAdminClient()
    console.log("API /api/admin/users: Admin client created. Fetching all users...")

    const { data: allUsers, error: allUsersError } = await adminSupabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })

    if (allUsersError) {
      console.error("API /api/admin/users: Error fetching all users with admin client.", { allUsersError })
      return NextResponse.json({ error: `Database error: ${allUsersError.message}` }, { status: 500 })
    }

    console.log(`API /api/admin/users: Successfully fetched ${allUsers?.length || 0} users.`)
    return NextResponse.json(allUsers || [])
  } catch (e: any) {
    console.error("API /api/admin/users: An unexpected error occurred in the handler.", { error: e.message })
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 })
  }
}
