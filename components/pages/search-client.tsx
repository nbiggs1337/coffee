"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, MapPin, Phone, User, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import PostCard from "@/components/post-card"
import type { Post, User as UserType } from "@/lib/supabase"

interface SearchClientProps {
  currentUser: UserType
}

export default function SearchClient({ currentUser }: SearchClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<"name" | "location" | "phone">("name")
  const [results, setResults] = useState<Post[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const supabase = createClient()
  const { toast } = useToast()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      toast({
        title: "⚠️ Empty Search",
        description: "Please enter a search term.",
        variant: "destructive",
      })
      return
    }

    if (searchQuery.trim().length < 2) {
      toast({
        title: "⚠️ Search Too Short",
        description: "Please enter at least 2 characters to search.",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    try {
      toast({
        title: "🔍 Searching...",
        description: `Looking for ${searchType} matching "${searchQuery.trim()}"`,
        className: "neobrutal-card bg-neobrutal-blue text-white border-neobrutal-primary",
      })

      let query = supabase
        .from("posts")
        .select(`
          *,
          user:users(*)
        `)
        .order("created_at", { ascending: false })
        .limit(50)

      const searchTerm = searchQuery.trim().toLowerCase()

      switch (searchType) {
        case "name":
          query = query.ilike("subject_name", `%${searchTerm}%`)
          break
        case "location":
          query = query.or(`city.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%`)
          break
        case "phone":
          query = query.ilike("phone_number", `%${searchTerm}%`)
          break
      }

      const { data, error } = await query

      if (error) throw error

      setResults(data || [])

      const resultCount = data?.length || 0
      toast({
        title: resultCount > 0 ? "✅ Search Complete" : "📭 No Results",
        description:
          resultCount > 0
            ? `Found ${resultCount} result${resultCount === 1 ? "" : "s"} for "${searchQuery.trim()}"`
            : `No posts found matching "${searchQuery.trim()}" in ${searchType}.`,
        className: `neobrutal-card ${resultCount > 0 ? "bg-neobrutal-green" : "bg-neobrutal-yellow"} ${resultCount > 0 ? "text-white" : "text-black"} border-neobrutal-primary`,
      })

      // Create alert if results found
      if (resultCount > 0) {
        try {
          await supabase.from("alerts").insert({
            user_id: currentUser.id,
            alert_term: searchQuery.trim(),
            alert_type: searchType,
            is_active: true,
          })
        } catch (alertError) {
          console.error("Error creating alert:", alertError)
        }
      }
    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: "❌ Search Failed",
        description: "Unable to perform search. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleClearResults = () => {
    setResults([])
    setSearchQuery("")
    setHasSearched(false)
    toast({
      title: "🧹 Results Cleared",
      description: "Search results have been cleared.",
      className: "neobrutal-card bg-neobrutal-yellow text-black border-neobrutal-primary",
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="neobrutal-card bg-white border-neobrutal-primary shadow-neobrutal">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-neobrutal-primary flex items-center">
            <Search className="mr-2 h-6 w-6" />
            Search Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="search" className="text-neobrutal-primary font-semibold">
                  Search Term
                </Label>
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Enter ${searchType} to search for...`}
                  className="neobrutal-input"
                  disabled={isSearching}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-neobrutal-primary font-semibold flex items-center">
                  <Filter className="mr-1 h-4 w-4" />
                  Search Type
                </Label>
                <Select
                  value={searchType}
                  onValueChange={(value: "name" | "location" | "phone") => setSearchType(value)}
                >
                  <SelectTrigger className="neobrutal-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Name
                      </div>
                    </SelectItem>
                    <SelectItem value="location">
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4" />
                        Location
                      </div>
                    </SelectItem>
                    <SelectItem value="phone">
                      <div className="flex items-center">
                        <Phone className="mr-2 h-4 w-4" />
                        Phone
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="neobrutal-button bg-neobrutal-blue text-white hover:bg-blue-600"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>

              {hasSearched && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearResults}
                  className="neobrutal-button border-neobrutal-primary text-neobrutal-primary hover:bg-neobrutal-primary hover:text-white bg-transparent"
                >
                  Clear Results
                </Button>
              )}
            </div>
          </form>

          {/* Safety Warning */}
          <div className="mt-4 p-3 bg-yellow-50 border-2 border-neobrutal-yellow rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <strong>Community Safety:</strong> Search responsibly and report any concerning content. Creating alerts
                will notify you of new matching posts.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-neobrutal-primary">
              Search Results {results.length > 0 && `(${results.length})`}
            </h2>
          </div>

          {results.length > 0 ? (
            <div className="grid gap-6">
              {results.map((post) => (
                <PostCard key={post.id} post={post} currentUserId={currentUser.id} showVoting={true} />
              ))}
            </div>
          ) : hasSearched && !isSearching ? (
            <Card className="neobrutal-card bg-gray-50 border-neobrutal-primary">
              <CardContent className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Results Found</h3>
                <p className="text-gray-500">
                  No posts found matching "{searchQuery}" in {searchType}. Try a different search term or search type.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  )
}
