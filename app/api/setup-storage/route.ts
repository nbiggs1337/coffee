import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

// One-time storage setup endpoint: creates the 'photos' bucket if missing.
// Safe to call multiple times: it no-ops if bucket already exists.
export async function GET() {
  try {
    // Check if bucket exists
    const { data: bucket, error: getErr } = await supabaseAdmin.storage.getBucket("photos")
    if (getErr && getErr.message && !getErr.message.toLowerCase().includes("not found")) {
      // Unexpected error checking bucket
      console.error("Error checking bucket existence:", getErr.message)
      return NextResponse.json({ ok: false, step: "getBucket", error: getErr.message }, { status: 500 })
    }

    if (!bucket) {
      // Bucket does not exist, attempt to create
      const { error: createErr } = await supabaseAdmin.storage.createBucket("photos", { public: true })
      if (createErr) {
        // If another process created it between check and create, or other error
        if (!createErr.message.toLowerCase().includes("already exists")) {
          console.error("Error creating bucket:", createErr.message)
          return NextResponse.json({ ok: false, step: "createBucket", error: createErr.message }, { status: 500 })
        }
      }
      console.log("Photos bucket created or already existed.")
      return NextResponse.json({ ok: true, created: true })
    }

    // If bucket exists, ensure it's public (idempotent update)
    if (bucket.public !== true) {
      const { error: updateErr } = await supabaseAdmin.storage.updateBucket("photos", { public: true })
      if (updateErr) {
        console.error("Error updating bucket public status:", updateErr.message)
        return NextResponse.json({ ok: false, step: "updateBucket", error: updateErr.message }, { status: 500 })
      }
      console.log("Photos bucket updated to public.")
    }

    console.log("Photos bucket already exists and is public.")
    return NextResponse.json({ ok: true, created: false })
  } catch (e: any) {
    console.error("Unhandled error in setup-storage API:", e.message)
    return NextResponse.json({ ok: false, error: e?.message || "unknown error" }, { status: 500 })
  }
}
