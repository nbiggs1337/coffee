export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Authentication required",
        },
        { status: 401 },
      )
    }

    // Test various permissions
    const tests = {
      readOwnUser: false,
      readPosts: false,
      createPost: false,
      readComments: false,
    }

    // Test reading own user record
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("id", user.id)
      .single()

    tests.readOwnUser = !userError && !!userData

    // Test reading posts
    const { data: postsData, error: postsError } = await supabase.from("posts").select("id").limit(1)

    tests.readPosts = !postsError

    // Test reading comments
    const { data: commentsData, error: commentsError } = await supabase.from("comments").select("id").limit(1)

    tests.readComments = !commentsError

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      permissions: tests,
      userData: userData || null,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
