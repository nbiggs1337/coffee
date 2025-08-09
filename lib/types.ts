export interface User {
  id: string
  email: string
  full_name: string
  display_name?: string
  avatar_url?: string
  is_approved: boolean
  is_rejected: boolean
  is_admin: boolean
  agreed_to_terms: boolean
  verification_photo_url?: string
  phone_number?: string
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  subject_name: string
  subject_age: number
  caption: string
  photos?: string[]
  red_flags?: number
  green_flags?: number
  city?: string
  state?: string
  phone_number?: string
  created_at: string
  updated_at: string
}

export interface PostWithAuthor extends Post {
  user: {
    id: string
    display_name?: string
    full_name: string
    avatar_url?: string
  }
}

export interface Vote {
  id: string
  post_id: string
  user_id: string
  vote_type: "green" | "red"
  created_at: string
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  user: {
    id: string
    display_name?: string
    full_name: string
    avatar_url?: string
  }
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}
