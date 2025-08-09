"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { createClient } from "@supabase/supabase-js"

export async function handleVote(postId: string, voteType: "red" | "green") {
  // 1) Verify auth with the regular server client
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      message: "You must be signed in to vote.",
    }
  }

  // 2) Check if user already voted
  const { data: existingVote, error: voteError } = await supabase
    .from("votes")
    .select("id, vote_type")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (voteError) {
    return {
      success: false,
      message: "Failed to check existing vote.",
    }
  }

  try {
    if (existingVote?.id) {
      if (existingVote.vote_type === voteType) {
        // Remove vote if clicking same type
        const { error: deleteError } = await supabase.from("votes").delete().eq("id", existingVote.id)

        if (deleteError) throw deleteError
      } else {
        // Update vote type
        const { error: updateError } = await supabase
          .from("votes")
          .update({ vote_type: voteType })
          .eq("id", existingVote.id)

        if (updateError) throw updateError
      }
    } else {
      // Create new vote
      const { error: insertError } = await supabase.from("votes").insert({
        post_id: postId,
        user_id: user.id,
        vote_type: voteType,
      })

      if (insertError) throw insertError
    }

    // 3) Get post details for notification
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("user_id, subject_name")
      .eq("id", postId)
      .single()

    if (postError) {
      console.error("Error fetching post for notification:", postError)
      // Don't fail the vote if we can't send notification
    } else if (post && post.user_id !== user.id) {
      // 4) Create notification using service role to bypass RLS
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (url && serviceRoleKey) {
        const admin = createClient(url, serviceRoleKey)

        const { error: notificationError } = await admin.from("notifications").insert({
          user_id: post.user_id,
          title: voteType === "green" ? "Green Flag" : "Red Flag",
          message: `Someone voted ${voteType === "green" ? "Green Flag" : "Red Flag"} on your post about ${post.subject_name}.`,
          type: "vote",
          related_post_id: postId,
        })

        if (notificationError) {
          console.error("Error creating notification:", notificationError)
          // Don't fail the vote if notification fails
        }
      }
    }

    // 5) Revalidate paths
    revalidatePath("/feed")
    revalidatePath(`/post/${postId}`)

    return {
      success: true,
      message: "Vote recorded successfully.",
    }
  } catch (error: any) {
    console.error("Error handling vote:", error)
    return {
      success: false,
      message: error.message || "Failed to record vote.",
    }
  }
}
