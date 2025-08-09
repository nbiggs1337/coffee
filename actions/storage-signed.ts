"use server"

import { createSupabaseAdminClient } from "@/lib/supabase-admin"

type SignedUploadResponse = { success: true; path: string; token: string } | { success: false; message: string }

/**
 * Creates a signed upload URL for Supabase Storage so the client can upload
 * directly to Storage without sending the file through your server.
 *
 * This is a known-working solution for camera photo uploads in production:
 * - Avoids sending large binaries through server actions/API routes
 * - Eliminates sporadic server errors due to request body limits
 */
export async function createSignedVerificationUpload(
  userId: string,
  originalFileName: string,
): Promise<SignedUploadResponse> {
  try {
    if (!userId) {
      return { success: false, message: "Missing userId." }
    }

    const supabaseAdmin = createSupabaseAdminClient()
    const bucket = "verification-photos"

    // Ensure a .jpg filename (we normalize HEIC/HEIF to JPEG on the client)
    const base = (originalFileName || "photo").replace(/\.[^/.]+$/, "") || "photo"
    const safeBase = base.replace(/[^a-zA-Z0-9._-]/g, "_")
    const fileName = `${safeBase}.jpg`
    const path = `${userId}/${Date.now()}-${fileName}`

    const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path)
    if (error || !data) {
      const message = error?.message || "Failed to create signed upload URL."
      return { success: false, message }
    }

    return { success: true, path: data.path, token: data.token }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown server error creating signed upload URL."
    console.error("[createSignedVerificationUpload] ERROR:", message)
    return { success: false, message }
  }
}
