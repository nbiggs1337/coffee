"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2, SearchIcon } from "lucide-react"
import type { PostWithAuthor } from "@/lib/types"
import { deletePost } from "@/actions/admin"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"

export default function AllPostsTab({ initialAllPosts }: { initialAllPosts: PostWithAuthor[] }) {
  const [posts, setPosts] = useState(initialAllPosts)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return
    }
    const result = await deletePost(postId)
    if (result.success) {
      setPosts(posts.filter((p) => p.id !== postId))
      toast({
        title: "Post Deleted",
        description: "The post has been successfully deleted.",
        className: "neobrutal-card bg-neobrutal-green border-neobrutal-primary",
      })
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
        className: "neobrutal-card bg-neobrutal-red text-white border-neobrutal-primary",
      })
    }
  }

  // Filter posts based on search term. Assuming 'content' might not exist,
  // we'll search by author name, email, city, state, phone_number, and post ID.
  const filteredPosts = posts.filter(
    (post) =>
      post.author?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // If 'content' exists, include it in search, otherwise ignore
      (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          placeholder="Search posts by author, location, phone, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="neobrutal-input flex-grow"
        />
        <Button className="neobrutal-button bg-neobrutal-blue">
          <SearchIcon className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="neobrutal-card p-8 text-center">
          <p className="text-neobrutal-secondary">No posts found matching your search.</p>
        </div>
      ) : (
        <div className="neobrutal-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-neobrutal-primary bg-neobrutal-yellow">
                <TableHead className="font-bold">Author</TableHead>
                <TableHead className="font-bold">Preview</TableHead>
                <TableHead className="font-bold">Location</TableHead>
                <TableHead className="font-bold">Phone</TableHead>
                <TableHead className="font-bold">Created At</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map((post) => (
                <TableRow key={post.id} className="border-b-2 border-neobrutal-primary last:border-b-0">
                  <TableCell>
                    {post.author?.full_name || "N/A"} ({post.author?.email || "N/A"})
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {post.content || post.image_url || `Post ID: ${post.id}`}
                  </TableCell>
                  <TableCell>{post.city && post.state ? `${post.city}, ${post.state}` : "N/A"}</TableCell>
                  <TableCell>{post.phone_number || "N/A"}</TableCell>
                  <TableCell>{format(new Date(post.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                      className="neobrutal-button bg-neobrutal-red text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
