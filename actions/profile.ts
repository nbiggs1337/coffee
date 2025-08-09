"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"

export async function updateUserProfile(formData: FormData) {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  const displayName = formData.get("display_name") as string
  const fullName = formData.get("full_name") as string
  const phoneNumber = formData.get("phone_number") as string
  const avatarFile = formData.get("avatar") as File

  let avatarUrl = null

  // Handle avatar upload if provided
  if (avatarFile && avatarFile.size > 0) {
    // Validate file type
    if (!avatarFile.type.startsWith("image/")) {
      redirect("/profile/edit?error=" + encodeURIComponent("Please upload a valid image file (JPG, PNG, etc.)"))
    }

    // Validate file size (5MB max)
    if (avatarFile.size > 5 * 1024 * 1024) {
      redirect("/profile/edit?error=" + encodeURIComponent("Image file must be smaller than 5MB"))
    }

    // Generate unique filename
    const fileExt = avatarFile.name.split(".").pop()
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, avatarFile, {
        upsert: true,
        contentType: avatarFile.type,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      redirect(
        "/profile/edit?error=" +
          encodeURIComponent("Failed to upload avatar. Please try again with a different image."),
      )
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(fileName)

    avatarUrl = publicUrl
  }

  // Update user profile
  const updateData: any = {
    display_name: displayName?.trim() || null,
    full_name: fullName?.trim() || null,
    phone_number: phoneNumber?.trim() || null,
  }

  if (avatarUrl) {
    updateData.avatar_url = avatarUrl
  }

  const { error: updateError } = await supabase.from("users").update(updateData).eq("id", user.id)

  if (updateError) {
    console.error("Profile update error:", updateError)
    redirect("/profile/edit?error=" + encodeURIComponent("Failed to update profile. Please try again."))
  }

  revalidatePath("/profile")
  revalidatePath("/profile/edit")
  redirect("/profile?success=" + encodeURIComponent("Profile updated successfully! Your changes are now visible."))
}

export async function completeUserProfile(formData: FormData) {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  const fullName = formData.get("full_name") as string
  const displayName = formData.get("display_name") as string
  const verificationFile = formData.get("verification_photo") as File

  if (!fullName || !verificationFile || verificationFile.size === 0) {
    redirect("/agreement?error=" + encodeURIComponent("Please provide your full name and verification photo"))
  }

  // Validate file type
  if (!verificationFile.type.startsWith("image/")) {
    redirect("/agreement?error=" + encodeURIComponent("Please upload a valid image file (JPG, PNG, etc.)"))
  }

  // Validate file size (10MB max for verification photos)
  if (verificationFile.size > 10 * 1024 * 1024) {
    redirect("/agreement?error=" + encodeURIComponent("Verification photo file must be smaller than 10MB"))
  }

  // Generate unique filename for verification photo
  const fileExt = verificationFile.name.split(".").pop()
  const fileName = `verification/${user.id}/photo-${Date.now()}.${fileExt}`

  // Upload verification photo
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("verification-photos")
    .upload(fileName, verificationFile, {
      upsert: true,
      contentType: verificationFile.type,
    })

  if (uploadError) {
    console.error("Verification photo upload error:", uploadError)
    redirect(
      "/agreement?error=" +
        encodeURIComponent("Failed to upload verification photo. Please try again with a different image."),
    )
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("verification-photos").getPublicUrl(fileName)

  // Update user profile
  const { error: updateError } = await supabase
    .from("users")
    .update({
      full_name: fullName?.trim(),
      display_name: displayName?.trim() || fullName?.trim(),
      verification_photo_url: publicUrl,
      agreed_to_terms: true,
    })
    .eq("id", user.id)

  if (updateError) {
    console.error("Profile completion error:", updateError)
    redirect("/agreement?error=" + encodeURIComponent("Failed to complete profile. Please try again."))
  }

  revalidatePath("/pending")
  redirect(
    "/pending?success=" + encodeURIComponent("Profile completed successfully! Your verification photo is now visible."),
  )
}
