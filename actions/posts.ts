"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabase } from "@/lib/supabase-server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

type CreatePostInput = {
  subject_name: string
  subject_age: number
  city: string
  state: string
  phone_number: string | null
  caption: string
  photos: string[]
}

export async function createPostAction(input: CreatePostInput) {
  // 1) Verify auth with the regular server client (uses user session)
  const supabase = createServerSupabase()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      message: authError?.message || "You must be signed in to create a post.",
    }
  }

  // 2) Ensure the user is approved to post
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("is_approved, is_rejected")
    .eq("id", user.id)
    .single()

  if (profileError) {
    return {
      success: false,
      message: "Failed to verify user status. Please try again.",
    }
  }

  if (!profile?.is_approved || profile?.is_rejected) {
    return {
      success: false,
      message: "Your account is not approved to create posts.",
    }
  }

  // 3) Insert using a Service Role client to avoid RLS violations after we validated authorization
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return {
      success: false,
      message: "Server is missing Supabase configuration.",
    }
  }

  const admin = createAdminClient(url, serviceRoleKey)

  const { data, error: insertError } = await admin
    .from("posts")
    .insert({
      user_id: user.id,
      subject_name: input.subject_name,
      subject_age: input.subject_age,
      city: input.city,
      state: input.state,
      phone_number: input.phone_number,
      caption: input.caption,
      photos: input.photos,
    })
    .select("id")
    .single()

  if (insertError) {
    return {
      success: false,
      message: insertError.message || "Failed to create post.",
    }
  }

  // 4) Revalidate the feed so the new post shows up
  revalidatePath("/feed")

  return {
    success: true,
    message: "Post created successfully.",
    id: data?.id as string | undefined,
  }
}
