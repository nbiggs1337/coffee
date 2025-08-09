"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Trash2, Search, Calendar, User, MapPin, Phone, MessageCircle, Flag, Eye, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { deletePost } from "@/actions/admin"
import Image from "next/image"
import Link from "next/link"

type PostWithAuthor = {
  id: string
  user_id: string
  subject_name: string
  subject_age: number
  caption: string
  photos: string[]
  red_flags: number
  green_flags: number
  city: string | null
  state: string | null
  phone_number: string | null
  created_at: string
  author: {
    full_name: string | null
    email: string
    avatar_url: string | null
  } | null
}

interface PostsManagementSectionProps {
  onStatsChange: () => void
}

export default function PostsManagementSection({ onStatsChange }: PostsManagementSectionProps) {
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [filteredPosts, setFilteredPosts] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadPosts()
  }, [])

  useEffect(() => {
    filterPosts()
  }, [posts, searchTerm])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
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
          author:users (
            full_name,
            email,
            avatar_url
          )
        `,
        )
        .order("created_at", { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error: any) {
      console.error("Error loading posts:", error)
      toast({
        title: "Error loading posts",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterPosts = () => {
    let filtered = posts

    if (searchTerm) {
      filtered = filtered.filter(
        (post) =>
          post.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.author?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.author?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.phone_number?.includes(searchTerm),
      )
    }

    setFilteredPosts(filtered)
  }

  const handleDelete = async (postId: string, subjectName: string) => {
    if (!confirm(`Are you sure you want to delete the post about "${subjectName}"? This action cannot be undone.`)) {
      return
    }

    setActionLoading((prev) => ({ ...prev, [postId]: true }))

    try {
      const result = await deletePost(postId)
      if (result.success) {
        setPosts((prev) => prev.filter((post) => post.id !== postId))
        onStatsChange()
        toast({
          title: "Post deleted",
          description: "The post has been successfully deleted.",
          className: "neobrutal-card bg-neobrutal-green text-white border-neobrutal-primary",
        })
      } else {
        toast({
          title: "Error deleting post",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Unexpected error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading((prev) => ({ ...prev, [postId]: false }))
    }
  }

  if (loading) {
    return (
      <Card className="neobrutal-card">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-neobrutal-primary" />
          <span className="ml-2">Loading posts...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Posts Management</h2>
          <p className="text-neobrutal-secondary">Monitor and manage community posts</p>
        </div>
        <Badge variant="outline" className="neobrutal-card">
          {filteredPosts.length} of {posts.length} posts
        </Badge>
      </div>

      {/* Search */}
      <Card className="neobrutal-card">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neobrutal-secondary" />
            <Input
              placeholder="Search posts by subject, author, location, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="neobrutal-input pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="grid gap-6">
        {filteredPosts.map((post) => (
          <Card key={post.id} className="neobrutal-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 neobrutal-avatar">
                    <AvatarImage
                      src={post.author?.avatar_url || "/placeholder.svg?height=48&width=48&query=user avatar"}
                    />
                    <AvatarFallback className="neobrutal-avatar-fallback">
                      {post.author?.full_name?.charAt(0)?.toUpperCase() ||
                        post.author?.email.charAt(0).toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-neobrutal-secondary" />
                      <span className="font-bold">{post.author?.full_name || "Anonymous"}</span>
                      <span className="text-neobrutal-secondary">({post.author?.email})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-neobrutal-secondary" />
                      <span className="text-sm text-neobrutal-secondary">
                        {format(new Date(post.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => handleDelete(post.id, post.subject_name)}
                  disabled={actionLoading[post.id]}
                  className="neobrutal-button bg-neobrutal-red text-white"
                  size="sm"
                >
                  {actionLoading[post.id] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Post Subject */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-neobrutal-primary">
                  {post.subject_name}, {post.subject_age}
                </h3>
                <Link href={`/post/${post.id}`} target="_blank">
                  <Button variant="outline" size="sm" className="neobrutal-button bg-neobrutal-blue text-white">
                    <Eye className="h-4 w-4 mr-1" />
                    View Post
                  </Button>
                </Link>
              </div>

              {/* Post Content */}
              <p className="text-neobrutal-secondary">{post.caption}</p>

              {/* Post Images */}
              {post.photos && post.photos.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {post.photos.slice(0, 3).map((photo, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={photo || "/placeholder.svg"}
                        alt={`Post photo ${index + 1}`}
                        width={100}
                        height={100}
                        className="object-cover rounded border-2 border-neobrutal-primary cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedImage(photo)}
                      />
                      {index === 2 && post.photos.length > 3 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                          <span className="text-white text-sm font-bold">+{post.photos.length - 3}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Post Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(post.city || post.state) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-neobrutal-secondary" />
                    <span className="text-sm">
                      {post.city}
                      {post.city && post.state && ", "}
                      {post.state}
                    </span>
                  </div>
                )}
                {post.phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-neobrutal-secondary" />
                    <span className="text-sm">{post.phone_number}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-neobrutal-green" />
                  <span className="text-sm">{post.green_flags} Green Flags</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-neobrutal-red" />
                  <span className="text-sm">{post.red_flags} Red Flags</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <Card className="neobrutal-card">
          <CardContent className="text-center p-8">
            <MessageCircle className="h-16 w-16 text-neobrutal-secondary mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No posts found</h3>
            <p className="text-neobrutal-secondary">Try adjusting your search criteria.</p>
          </CardContent>
        </Card>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <Image
                src={selectedImage || "/placeholder.svg"}
                alt="Post image"
                width={800}
                height={600}
                className="max-w-full max-h-[80vh] object-contain neobrutal-card"
              />
              <Button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 neobrutal-button bg-neobrutal-red text-white"
                size="sm"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 text-center">
              <p className="text-gray-300 text-sm">Click outside to close</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
