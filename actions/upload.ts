"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * Uploads a file to Supabase Storage using the admin (service role) client.
 * This works in production deployments and will create the bucket if it doesn't exist.
 */
export async function uploadFile(
  formData: FormData,
  bucket: string,
  folder?: string,
): Promise<{ success: boolean; url?: string; message: string }> {
  try {
    const file = formData.get("file") as File | null
    if (!file) {
      return { success: false, message: "No file provided" }
    }

    // Validate file type
    if (!file.type || !file.type.startsWith("image/")) {
      return { success: false, message: "File must be an image" }
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, message: "File size must be less than 5MB" }
    }

    // Ensure bucket exists (admin privileges bypass RLS)
    const { data: buckets, error: listErr } = await supabaseAdmin.storage.listBuckets()
    if (listErr) {
      console.error("uploadFile: listBuckets error:", listErr)
      // Proceed to try creating the bucket if list fails (may be transient)
    }
    const bucketExists = buckets?.some((b) => b.name === bucket) ?? false

    if (!bucketExists) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucket, {
        public: true,
        allowedMimeTypes: ["image/*"],
        // fileSizeLimit must be a string per Supabase API (bytes)
        fileSizeLimit: String(5 * 1024 * 1024),
      })
      if (createError) {
        // If bucket already exists race-conditionally, we can ignore specific codes,
        // otherwise return a helpful message.
        console.error("uploadFile: createBucket error:", createError)
        return { success: false, message: `Failed to ensure storage bucket (${bucket}) exists.` }
      }
    }

    // Generate unique filename and path
    const fileExt = (file.name?.split(".").pop() || "jpg").toLowerCase()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const filePath = folder ? `${folder}/${fileName}` : fileName

    // Upload file
    const { error: uploadError } = await supabaseAdmin.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    })
    if (uploadError) {
      console.error("uploadFile: upload error:", uploadError)
      return { success: false, message: "Upload failed. Please try again." }
    }

    // Get public URL
    const { data: pub, error: pubErr } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath)
    if (pubErr || !pub?.publicUrl) {
      console.error("uploadFile: getPublicUrl error:", pubErr)
      return { success: false, message: "File uploaded but failed to retrieve public URL." }
    }

    return {
      success: true,
      url: pub.publicUrl,
      message: "File uploaded successfully",
    }
  } catch (error) {
    console.error("uploadFile: unexpected error:", error)
    return {
      success: false,
      message: "Unexpected server error during upload. Please try again.",
    }
  }
}
