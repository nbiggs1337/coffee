import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Coffee, Users, MessageSquare, Shield, Heart, Search } from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neobrutal-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="p-6 bg-neobrutal-yellow rounded-full border-4 border-neobrutal-primary shadow-neobrutalism">
              <Coffee className="h-16 w-16 text-neobrutal-background" />
            </div>
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-neobrutal-primary mb-6 leading-tight">Coffee</h1>

          <p className="text-2xl md:text-3xl text-neobrutal-secondary font-bold mb-8 max-w-3xl mx-auto">
            Connect with your community through authentic conversations and shared experiences
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup">
              <Button className="neobrutal-button text-xl px-8 py-4 h-auto">Join the Community</Button>
            </Link>
            <Link href="/login">
              <Button className="neobrutal-button bg-neobrutal-blue text-xl px-8 py-4 h-auto">Sign In</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-coffee-gradient-light">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-neobrutal-primary text-center mb-16">
            Why Choose Coffee?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="neobrutal-card hover:shadow-neobrutalism-lg transition-all duration-200">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 bg-neobrutal-green rounded-lg border-2 border-neobrutal-primary">
                  <Users className="h-8 w-8 text-neobrutal-background" />
                </div>
                <CardTitle className="text-2xl font-bold text-neobrutal-primary">Community Safety</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neobrutal-secondary font-medium text-center">
                  Every member is verified and approved by our community moderators to ensure a safe, authentic
                  environment.
                </p>
              </CardContent>
            </Card>

            <Card className="neobrutal-card hover:shadow-neobrutalism-lg transition-all duration-200">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 bg-neobrutal-blue rounded-lg border-2 border-neobrutal-primary">
                  <MessageSquare className="h-8 w-8 text-neobrutal-background" />
                </div>
                <CardTitle className="text-2xl font-bold text-neobrutal-primary">Real Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neobrutal-secondary font-medium text-center">
                  Share stories, ask questions, and connect with people who share your interests and values.
                </p>
              </CardContent>
            </Card>

            <Card className="neobrutal-card hover:shadow-neobrutalism-lg transition-all duration-200">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 bg-neobrutal-red rounded-lg border-2 border-neobrutal-primary">
                  <Shield className="h-8 w-8 text-neobrutal-background" />
                </div>
                <CardTitle className="text-2xl font-bold text-neobrutal-primary">Privacy First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neobrutal-secondary font-medium text-center">
                  Your personal information stays private. Only display names are public, keeping your identity secure.
                </p>
              </CardContent>
            </Card>

            <Card className="neobrutal-card hover:shadow-neobrutalism-lg transition-all duration-200">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 bg-neobrutal-yellow rounded-lg border-2 border-neobrutal-primary">
                  <Heart className="h-8 w-8 text-neobrutal-background" />
                </div>
                <CardTitle className="text-2xl font-bold text-neobrutal-primary">Community Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neobrutal-secondary font-medium text-center">
                  Give and receive feedback through our green flag / red flag system to help build trust.
                </p>
              </CardContent>
            </Card>

            <Card className="neobrutal-card hover:shadow-neobrutalism-lg transition-all duration-200">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 bg-neobrutal-green rounded-lg border-2 border-neobrutal-primary">
                  <Search className="h-8 w-8 text-neobrutal-background" />
                </div>
                <CardTitle className="text-2xl font-bold text-neobrutal-primary">Smart Discovery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neobrutal-secondary font-medium text-center">
                  Find people and content that matters to you with our intelligent search and recommendation system.
                </p>
              </CardContent>
            </Card>

            <Card className="neobrutal-card hover:shadow-neobrutalism-lg transition-all duration-200">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 bg-neobrutal-blue rounded-lg border-2 border-neobrutal-primary">
                  <Coffee className="h-8 w-8 text-neobrutal-background" />
                </div>
                <CardTitle className="text-2xl font-bold text-neobrutal-primary">Local Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neobrutal-secondary font-medium text-center">
                  Connect with people in your area and discover local events, meetups, and community activities.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Showcase */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-neobrutal-primary mb-8">Join Our Growing Community</h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="neobrutal-card p-8">
                <h3 className="text-2xl font-bold text-neobrutal-primary mb-4">Authentic Connections</h3>
                <p className="text-neobrutal-secondary font-medium text-lg">
                  Every conversation starts with real people sharing genuine experiences. Our verification process
                  ensures you're connecting with authentic community members.
                </p>
              </div>

              <div className="neobrutal-card p-8">
                <h3 className="text-2xl font-bold text-neobrutal-primary mb-4">Safe Environment</h3>
                <p className="text-neobrutal-secondary font-medium text-lg">
                  Community moderators review all new members and maintain a respectful, welcoming space for meaningful
                  conversations.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="neobrutal-card p-8 bg-coffee-gradient">
                <Image
                  src="/diverse-group-conversation.png"
                  alt="Diverse group having a conversation"
                  width={400}
                  height={300}
                  className="rounded-lg border-2 border-neobrutal-primary"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4 bg-neobrutal-yellow">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-neobrutal-background mb-6">Ready to Connect?</h2>

          <p className="text-xl text-neobrutal-background font-bold mb-8 opacity-90">
            Join thousands of community members who are building meaningful relationships every day.
          </p>

          <Link href="/signup">
            <Button className="neobrutal-button bg-neobrutal-background text-neobrutal-primary text-xl px-12 py-6 h-auto hover:bg-coffee-100">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-neobrutal-primary">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Coffee className="h-12 w-12 text-neobrutal-yellow" />
          </div>

          <p className="text-neobrutal-background font-medium text-lg mb-4">
            Building authentic communities, one conversation at a time.
          </p>

          <div className="flex justify-center space-x-8 text-neobrutal-background">
            <Link href="/about" className="hover:text-neobrutal-yellow font-medium">
              About
            </Link>
            <Link href="/privacy" className="hover:text-neobrutal-yellow font-medium">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-neobrutal-yellow font-medium">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-neobrutal-yellow font-medium">
              Contact
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t-2 border-neobrutal-yellow">
            <p className="text-neobrutal-background opacity-75">© 2024 Coffee Community. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
