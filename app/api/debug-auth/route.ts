import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Test auth session
    const { data: session, error: sessionError } = await supabase.auth.getSession()

    console.log("Session data:", {
      hasSession: !!session?.session,
      userId: session?.session?.user?.id,
      userEmail: session?.session?.user?.email,
      sessionError: sessionError?.message,
    })

    // Test if we can query with a specific user context
    if (session?.session?.user) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.session.user.id)
        .single()

      console.log("User data query:", {
        userData,
        userError: userError?.message,
      })

      return NextResponse.json({
        success: true,
        hasSession: !!session?.session,
        userId: session?.session?.user?.id,
        userEmail: session?.session?.user?.email,
        userData,
        userError: userError?.message,
      })
    }

    return NextResponse.json({
      success: true,
      hasSession: false,
      message: "No active session",
    })
  } catch (error: any) {
    console.error("Debug auth error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
