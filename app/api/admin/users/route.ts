import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase-server"

// Force Node.js runtime to avoid Edge Runtime issues with Supabase
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()

    // Check if user is authenticated and is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch all users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select(`
        id,
        email,
        full_name,
        display_name,
        avatar_url,
        is_admin,
        is_approved,
        is_rejected,
        agreed_to_terms,
        verification_photo_url,
        phone_number,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false })

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
