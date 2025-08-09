"use server"

import { createClient } from "@supabase/supabase-js"

export async function ensurePostImagesBucket(): Promise<{ ok: boolean; message?: string }> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    const msg = "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    console.error("ensurePostImagesBucket:", msg)
    return { ok: false, message: msg }
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  })

  try {
    // Check if bucket exists
    const { data: existing, error: getErr } = await admin.storage.getBucket("post-images")
    if (getErr && !/not.*found/i.test(getErr.message)) {
      console.warn("ensurePostImagesBucket: getBucket error (continuing):", getErr.message)
    }
    if (existing) {
      return { ok: true, message: "Bucket already exists" }
    }

    // Create bucket as public with a 5MB size limit
    const { error: createErr } = await admin.storage.createBucket("post-images", {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
    })

    if (createErr && !/already exists/i.test(createErr.message)) {
      console.error("ensurePostImagesBucket: createBucket error:", createErr.message)
      return { ok: false, message: createErr.message }
    }

    return { ok: true, message: "Bucket ensured" }
  } catch (err: any) {
    console.error("ensurePostImagesBucket: unexpected error:", err?.message || err)
    return { ok: false, message: "Unexpected error ensuring bucket" }
  }
}
