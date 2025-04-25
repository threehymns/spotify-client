"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Home, Library, Plus, LogOut, Music2, AlertCircle, RefreshCw } from "lucide-react"
import { checkAuth, checkSpotifyConnection } from "@/lib/auth-helpers"
import SearchResults from "@/components/search-results"
import PlaylistView from "@/components/playlist-view"
import Player from "@/components/player"
import UserProfile from "@/components/user-profile"
import { SpotifyProvider } from "@/context/spotify-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function Dashboard() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    checking: true,
    error: null,
  })

  useEffect(() => {
    // Simple function to check if we have tokens in localStorage
    const checkLocalTokens = () => {
      const accessToken = localStorage.getItem("spotify_access_token")
      const refreshToken = localStorage.getItem("spotify_refresh_token")
      return !!(accessToken && refreshToken)
    }

    const verifyAuth = async () => {
      console.log("Verifying authentication...")
      try {
        // First check if we have tokens in localStorage
        if (checkLocalTokens()) {
          console.log("Tokens found in localStorage")
          setIsAuthenticated(true)
        } else {
          console.log("No tokens in localStorage, checking auth status...")
          const authenticated = await checkAuth()

          if (!authenticated) {
            console.log("Not authenticated, redirecting to login")
            router.push("/login")
            return
          }

          setIsAuthenticated(true)
        }

        // Check Spotify API connection
        setConnectionStatus((prev) => ({ ...prev, checking: true }))
        const connected = await checkSpotifyConnection()
        setConnectionStatus({
          connected,
          checking: false,
          error: connected ? null : "Could not connect to Spotify API. Please check your credentials.",
        })

        setIsLoading(false)
      } catch (error) {
        console.error("Auth verification error:", error)
        setIsAuthenticated(false)
        setConnectionStatus({
          connected: false,
          checking: false,
          error: `Authentication error: ${error.message}`,
        })
        setIsLoading(false)
      }
    }

    verifyAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      console.log("Logging out...")
      // Clear localStorage
      localStorage.removeItem("spotify_access_token")
      localStorage.removeItem("spotify_refresh_token")
      localStorage.removeItem("spotify_token_expires_at")
      localStorage.removeItem("spotify_client_id")
      localStorage.removeItem("spotify_client_secret")

      // Call logout API to clear cookies
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const retryConnection = async () => {
    setConnectionStatus((prev) => ({ ...prev, checking: true, error: null }))
    try {
      const connected = await checkSpotifyConnection()
      setConnectionStatus({
        connected,
        checking: false,
        error: connected ? null : "Could not connect to Spotify API. Please check your credentials.",
      })

      if (!connected) {
        // If still not connected, redirect to login
        router.push("/login?error=connection_failed")
      }
    } catch (error) {
      console.error("Connection retry failed:", error)
      setConnectionStatus({
        connected: false,
        checking: false,
        error: `Connection error: ${error.message}`,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>
              You are not authenticated. Please log in again.
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={() => router.push("/login")}>
                  Go to Login
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <SpotifyProvider>
      <div className="flex flex-col h-screen bg-black text-white">
        {/* Connection status alert */}
        {connectionStatus.checking && (
          <Alert className="m-4 bg-blue-900/20 border-blue-900">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            <AlertTitle>Checking Spotify connection...</AlertTitle>
            <AlertDescription>Please wait while we verify your connection to the Spotify API.</AlertDescription>
          </Alert>
        )}

        {!connectionStatus.checking && !connectionStatus.connected && (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              {connectionStatus.error}
              <Button variant="outline" size="sm" onClick={retryConnection} className="ml-2 mt-2">
                Retry Connection
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push("/login")} className="ml-2 mt-2">
                Return to Login
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-zinc-950 p-4 hidden md:block">
            <div className="flex items-center mb-8">
              <Music2 className="h-8 w-8 text-green-500 mr-2" />
              <h1 className="text-xl font-bold">Spotify Client</h1>
            </div>
            <nav className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <div>
                  <Home className="mr-2 h-5 w-5" />
                  Home
                </div>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <div>
                  <Search className="mr-2 h-5 w-5" />
                  Search
                </div>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <div>
                  <Library className="mr-2 h-5 w-5" />
                  Your Library
                </div>
              </Button>
              <div className="pt-4">
                <Button variant="outline" className="w-full justify-start border-zinc-800" asChild>
                  <div>
                    <Plus className="mr-2 h-5 w-5" />
                    Create Playlist
                  </div>
                </Button>
              </div>
            </nav>
            <div className="absolute bottom-24 left-4 right-4">
              <UserProfile />
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-zinc-400 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Logout
              </Button>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-auto bg-gradient-to-b from-zinc-900 to-black">
            <div className="p-6">
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="search"
                    placeholder="Search for songs, artists, or albums..."
                    className="pl-10 bg-zinc-800 border-none focus-visible:ring-green-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {connectionStatus.connected ? (
                <Tabs defaultValue="search" className="w-full">
                  <TabsList className="bg-zinc-800 mb-6">
                    <TabsTrigger value="search">Search</TabsTrigger>
                    <TabsTrigger value="playlists">Your Playlists</TabsTrigger>
                  </TabsList>
                  <TabsContent value="search" className="mt-0">
                    <SearchResults query={searchQuery} />
                  </TabsContent>
                  <TabsContent value="playlists" className="mt-0">
                    <PlaylistView />
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-12">
                  <p className="text-zinc-400 mb-4">Waiting for Spotify connection...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Player */}
        <div className="h-20 bg-zinc-900 border-t border-zinc-800">
          <Player />
        </div>
      </div>
    </SpotifyProvider>
  )
}
