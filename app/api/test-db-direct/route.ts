import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function GET() {
  try {
    console.log("Testing direct database access with admin client...")

    // Test if we can query users table with admin client
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, email, is_approved, is_admin")
      .limit(5)

    console.log("Admin users query:", { users, error: usersError })

    // Test if we can check RLS status
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .from("pg_tables")
      .select("tablename, rowsecurity")
      .eq("schemaname", "public")
      .eq("tablename", "users")

    console.log("RLS status query:", { rlsStatus, error: rlsError })

    return NextResponse.json({
      success: true,
      users: users || [],
      usersError: usersError?.message,
      rlsStatus: rlsStatus || [],
      rlsError: rlsError?.message,
    })
  } catch (error: any) {
    console.error("Test DB direct error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
