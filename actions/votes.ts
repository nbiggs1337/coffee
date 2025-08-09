"use server"

import { createServerSupabase } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

export async function voteOnPost(postId: string, voteType: "green" | "red") {
  const supabase = createServerSupabase()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("You must be logged in to vote")
  }

  try {
    // Check if user already voted on this post
    const { data: existingVote, error: voteCheckError } = await supabase
      .from("votes")
      .select("id, vote_type")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (voteCheckError) {
      throw new Error("Failed to check existing vote")
    }

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Remove vote if clicking same type
        const { error: deleteError } = await supabase.from("votes").delete().eq("id", existingVote.id)

        if (deleteError) {
          throw new Error("Failed to remove vote")
        }
      } else {
        // Update vote type
        const { error: updateError } = await supabase
          .from("votes")
          .update({ vote_type: voteType })
          .eq("id", existingVote.id)

        if (updateError) {
          throw new Error("Failed to update vote")
        }
      }
    } else {
      // Create new vote
      const { error: insertError } = await supabase.from("votes").insert({
        post_id: postId,
        user_id: user.id,
        vote_type: voteType,
      })

      if (insertError) {
        throw new Error("Failed to create vote")
      }

      // Get post details for notification
      const { data: post } = await supabase.from("posts").select("user_id, subject_name").eq("id", postId).single()

      // Create notification for post owner (if not voting on own post)
      if (post && post.user_id !== user.id) {
        const { data: voter } = await supabase
          .from("users")
          .select("display_name, full_name")
          .eq("id", user.id)
          .single()

        const voterName = voter?.display_name || voter?.full_name || "Someone"
        const voteEmoji = voteType === "green" ? "👍" : "👎"

        await supabase.from("notifications").insert({
          user_id: post.user_id,
          title: `${voteEmoji} New ${voteType === "green" ? "Green Flag" : "Red Flag"}`,
          message: `${voterName} gave your post about ${post.subject_name} a ${voteType === "green" ? "green flag" : "red flag"}`,
          type: "vote",
          related_post_id: postId,
        })
      }
    }

    revalidatePath("/feed")
    revalidatePath(`/post/${postId}`)

    return { success: true }
  } catch (error: any) {
    console.error("Vote error:", error)
    throw new Error(error.message || "Failed to process vote")
  }
}
