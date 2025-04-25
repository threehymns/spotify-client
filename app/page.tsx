import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Music2 } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Your Music, Your Way
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
                  Connect with your Spotify account and enjoy a seamless music experience with advanced playlist
                  management and more.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/login">
                  <Button className="bg-green-500 hover:bg-green-600">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-zinc-900">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3 items-center">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-500/10 text-green-500 mb-4">
                  <Music2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Search & Discover</h3>
                <p className="text-zinc-400 mt-2">
                  Find your favorite songs, artists, and albums with our powerful search functionality.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-500/10 text-green-500 mb-4">
                  <Music2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Seamless Playback</h3>
                <p className="text-zinc-400 mt-2">
                  Play your music directly within the app with our integrated Spotify playback controls.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-500/10 text-green-500 mb-4">
                  <Music2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Playlist Management</h3>
                <p className="text-zinc-400 mt-2">
                  Create, edit, and manage your playlists with our intuitive drag-and-drop interface.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full py-6 bg-zinc-950 border-t border-zinc-800">
        <div className="container px-4 md:px-6">
          <div className="text-center text-zinc-500 text-sm">
            © {new Date().getFullYear()} Spotify Client. This is not the official Spotify app.
          </div>
        </div>
      </footer>
    </div>
  )
}
