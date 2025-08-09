import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function GET() {
  try {
    console.log("Testing permissions after fix...")

    // Test basic schema access by querying a simple system view
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from("pg_tables")
      .select("schemaname, tablename")
      .eq("schemaname", "public")
      .limit(1) // Just check if we can read any table info

    console.log("Schema access test (pg_tables):", { tables, tablesError })

    // Test users table access
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, email, is_approved, is_admin")
      .limit(5)

    console.log("Users table access:", { users, usersError })

    return NextResponse.json({
      success: true,
      pgTablesAccess: !!tables,
      pgTablesError: tablesError?.message,
      users: users || [],
      usersError: usersError?.message,
    })
  } catch (error: any) {
    console.error("Test permissions error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
