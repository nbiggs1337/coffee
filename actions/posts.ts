"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { createClient } from "@supabase/supabase-js"

// Define the type for the post creation input, matching the client form
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
  const supabase = createSupabaseServerClient()
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return {
      success: false,
      message: "Server is missing Supabase configuration.",
    }
  }

  const admin = createClient(url, serviceRoleKey)

  const { data, error: insertError } = await admin
    .from("posts")
    .insert({
      user_id: user.id,
      subject_name: input.subject_name, // Correctly use input.subject_name
      subject_age: input.subject_age,
      city: input.city,
      state: input.state,
      phone_number: input.phone_number,
      caption: input.caption, // Correctly use input.caption
      photos: input.photos, // Correctly use input.photos
    })
    .select("id")
    .single()

  if (insertError) {
    console.error("Error creating post:", insertError)
    return {
      success: false,
      message: insertError.message || "Failed to create post.",
    }
  }

  // 4) Revalidate the feed so the new post shows up
  revalidatePath("/feed")
  revalidatePath("/post")

  return {
    success: true,
    message: "Post created successfully.",
    id: data?.id as string | undefined,
  }
}

export async function addComment(postId: string, content: string) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to comment." }
  }

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      content,
    })
    .select("*, user:users(*)")
    .single()

  if (error) {
    console.error("Error adding comment:", error)
    return { error: "Failed to add comment." }
  }

  // Create a notification for the post owner
  const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).single()

  if (post && post.user_id !== user.id) {
    await supabase.from("notifications").insert({
      user_id: post.user_id,
      title: "New Comment",
      message: `Someone commented on your post.`,
      type: "comment",
      related_post_id: postId, // Add the post ID here
    })
  }

  revalidatePath(`/post/${postId}`)
  return { success: true, comment }
}
