import { createServerSupabase } from "@/lib/supabase-server"
import SearchClient from "@/components/pages/search-client"

type PostWithUser = {
  id: string
  user_id: string
  subject_name: string
  subject_age: number
  caption: string
  photos: string[]
  red_flags: number
  green_flags: number
  city?: string | null
  state?: string | null
  phone_number?: string | null
  created_at: string
  user?: {
    full_name?: string | null
    avatar_url?: string | null
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { query?: string; city?: string; state?: string; phone?: string; type?: string }
}) {
  const supabase = createServerSupabase()
  const { query, city, state, phone, type } = searchParams

  let posts: PostWithUser[] = []
  let fetchError: any = null

  if (query || city || state || phone) {
    try {
      let qb = supabase.from("posts").select(`
        id,
        user_id,
        subject_name,
        subject_age,
        caption,
        photos,
        red_flags,
        green_flags,
        city,
        state,
        phone_number,
        created_at,
        user:users (
          full_name,
          avatar_url
        )
      `)

      if (query && query.trim()) {
        const term = query.trim()
        if (type === "subject_name") qb = qb.ilike("subject_name", `%${term}%`)
        else if (type === "caption") qb = qb.ilike("caption", `%${term}%`)
        else if (type === "city") qb = qb.ilike("city", `%${term}%`)
        else if (type === "state") qb = qb.ilike("state", `%${term}%`)
        else if (type === "phone_number") qb = qb.ilike("phone_number", `%${term}%`)
        else {
          qb = qb.or(
            `subject_name.ilike.%${term}%,caption.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%,phone_number.ilike.%${term}%`,
          )
        }
      }

      if (city && city.trim()) qb = qb.ilike("city", `%${city.trim()}%`)
      if (state && state.trim() && state !== "any") qb = qb.ilike("state", `%${state.trim()}%`)
      if (phone && phone.trim()) qb = qb.ilike("phone_number", `%${phone.trim()}%`)

      const { data, error } = await qb.order("created_at", { ascending: false }).limit(50)

      if (error) {
        console.error("Search query error:", error)
        fetchError = error
      } else {
        posts = (data as PostWithUser[]) || []
      }
    } catch (e) {
      console.error("Search exception:", e)
      fetchError = e
    }
  }

  if (fetchError) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-4 md:p-6 bg-neobrutal-background text-neobrutal-primary">
        <div className="neobrutal-card p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Search Error</h2>
          <p className="text-neobrutal-red">{fetchError.message || "Unknown error"}</p>
          <p className="mt-4 text-neobrutal-secondary">Please adjust your search and try again.</p>
        </div>
      </main>
    )
  }

  return <SearchClient initialPosts={posts} initialSearchParams={searchParams} />
}
