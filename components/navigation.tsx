import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import {
  MenuIcon,
  ShieldCheckIcon,
  UserIcon,
  HeartIcon,
  PlusIcon,
  SearchIcon,
  BellIcon,
  HomeIcon,
  Coffee,
  AlertTriangleIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import LogoutButton from "@/components/logout-button"

// Server Component: Reads auth on the server and renders stable client sub-components.
export default async function Navigation() {
  let isAuthenticated = false
  let appUser: {
    full_name?: string | null
    display_name?: string | null
    avatar_url?: string | null
    is_admin?: boolean | null
  } | null = null
  let userEmail: string | null = null

  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Treat missing session as anonymous (not an error).
    if (!authError && user) {
      isAuthenticated = true
      userEmail = user.email ?? null

      // Fetch profile from users table
      const { data: appUserData, error: appUserError } = await supabase
        .from("users")
        .select("full_name, display_name, avatar_url, is_admin")
        .eq("id", user.id)
        .single()

      if (!appUserError && appUserData) {
        appUser = appUserData
      }
    }
  } catch {
    // Fail silently: navigation should still render for logged-out users
    isAuthenticated = false
  }

  const navItems = [
    { href: "/feed", icon: HomeIcon, label: "Feed" },
    { href: "/swipe", icon: HeartIcon, label: "Swipe" },
    { href: "/post", icon: PlusIcon, label: "Post" },
    { href: "/search", icon: SearchIcon, label: "Search" },
    { href: "/alerts", icon: AlertTriangleIcon, label: "Alerts" },
    { href: "/notifications", icon: BellIcon, label: "Notifications" },
  ]

  return (
    <header className="flex h-16 w-full shrink-0 items-center px-4 md:px-6 border-b-4 border-neobrutal-primary bg-neobrutal-background shadow-neobrutalism">
      {/* Mobile nav */}
      <Sheet>
        <SheetTrigger asChild>
          <Button className="lg:hidden neobrutal-button bg-neobrutal-yellow" size="icon" variant="outline">
            <MenuIcon className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col neobrutal-card bg-neobrutal-background">
          <Link className="mr-6 hidden lg:flex items-center gap-2" href="/">
            <Coffee className="h-8 w-8 text-neobrutal-yellow" />
            <span className="text-2xl font-black text-neobrutal-primary">Coffee</span>
          </Link>
          <nav className="grid gap-2 text-lg font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-neobrutal-secondary transition-all hover:text-neobrutal-primary hover:bg-neobrutal-yellow/20 font-bold"
                href={item.href}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}

            {appUser?.is_admin && (
              <Link
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-neobrutal-secondary transition-all hover:text-neobrutal-primary hover:bg-neobrutal-yellow/20 font-bold"
                href="/admin"
              >
                <ShieldCheckIcon className="h-5 w-5" />
                Admin
              </Link>
            )}

            {!isAuthenticated && (
              <>
                <Link
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-neobrutal-secondary transition-all hover:text-neobrutal-primary hover:bg-neobrutal-yellow/20 font-bold"
                  href="/login"
                >
                  Login
                </Link>
                <Link
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-neobrutal-secondary transition-all hover:text-neobrutal-primary hover:bg-neobrutal-yellow/20 font-bold"
                  href="/signup"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Brand */}
      <Link className="mr-6 hidden lg:flex items-center gap-2" href="/">
        <Coffee className="h-8 w-8 text-neobrutal-yellow" />
        <span className="text-2xl font-black text-neobrutal-primary">Coffee</span>
      </Link>

      {/* Desktop nav */}
      <nav className="hidden lg:flex gap-6">
        {navItems.map((item) => (
          <Link
            key={item.href}
            className="text-lg font-bold hover:underline underline-offset-4 text-neobrutal-secondary hover:text-neobrutal-primary transition-colors"
            href={item.href}
          >
            {item.label}
          </Link>
        ))}
        {appUser?.is_admin && (
          <Link
            className="text-lg font-bold hover:underline underline-offset-4 text-neobrutal-secondary hover:text-neobrutal-primary transition-colors"
            href="/admin"
          >
            Admin
          </Link>
        )}
      </nav>

      {/* Account menu */}
      <div className="ml-auto flex items-center gap-4">
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="rounded-full neobrutal-button bg-neobrutal-yellow p-2" size="icon" variant="ghost">
                <Avatar className="h-10 w-10 neobrutal-avatar">
                  <AvatarImage
                    src={appUser?.avatar_url || "/placeholder.svg?height=40&width=40&query=user avatar"}
                    alt="User avatar"
                  />
                  <AvatarFallback className="neobrutal-avatar-fallback font-bold text-lg">
                    {appUser?.display_name
                      ? appUser.display_name.charAt(0).toUpperCase()
                      : appUser?.full_name
                        ? appUser.full_name.charAt(0).toUpperCase()
                        : userEmail?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="neobrutal-dropdown-content">
              <DropdownMenuLabel className="neobrutal-dropdown-item font-bold">
                {appUser?.display_name || appUser?.full_name || userEmail}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="neobrutal-separator" />
              <DropdownMenuItem className="neobrutal-dropdown-item font-medium" asChild>
                <Link href="/profile" className="flex items-center w-full">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <LogoutButton />
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex gap-3">
            <Link href="/login">
              <Button className="neobrutal-button bg-neobrutal-blue font-bold">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="neobrutal-button font-bold">Sign Up</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
