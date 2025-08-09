import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("Testing Supabase connection...")

    // Test basic connection
    const { data: session, error: sessionError } = await supabase.auth.getSession()
    console.log("Session check:", { session: !!session?.session, error: sessionError })

    // Test if we can query users table (this might fail due to RLS)
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, is_approved, is_admin")
      .limit(1)

    console.log("Users query:", { users, error: usersError })

    return NextResponse.json({
      success: true,
      session: !!session?.session,
      sessionError: sessionError?.message,
      usersError: usersError?.message,
      userCount: users?.length || 0,
    })
  } catch (error: any) {
    console.error("Test auth error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
