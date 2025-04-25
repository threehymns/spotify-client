"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Plus } from "lucide-react"
import { useSpotify } from "@/context/spotify-context"
import { searchSpotify } from "@/lib/spotify-api"

type SearchResultsProps = {
  query: string
}

export default function SearchResults({ query }: SearchResultsProps) {
  const { playTrack, addToPlaylist } = useSpotify()
  const [results, setResults] = useState({
    tracks: { items: [] },
    artists: { items: [] },
    albums: { items: [] },
  })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("tracks")

  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim().length < 2) {
        setResults({ tracks: { items: [] }, artists: { items: [] }, albums: { items: [] } })
        return
      }

      setLoading(true)
      try {
        const data = await searchSpotify(query, ["track", "artist", "album"])
        setResults(data)
      } catch (error) {
        console.error("Search failed:", error)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchResults, 500)
    return () => clearTimeout(debounce)
  }, [query])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (query.trim().length < 2) {
    return <div className="text-center py-12 text-zinc-400">Enter at least 2 characters to search</div>
  }

  if (results.tracks.items.length === 0 && results.artists.items.length === 0 && results.albums.items.length === 0) {
    return <div className="text-center py-12 text-zinc-400">No results found for "{query}"</div>
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="bg-zinc-800 mb-6">
        <TabsTrigger value="tracks">Songs</TabsTrigger>
        <TabsTrigger value="artists">Artists</TabsTrigger>
        <TabsTrigger value="albums">Albums</TabsTrigger>
      </TabsList>

      <TabsContent value="tracks" className="mt-0">
        <div className="grid gap-4">
          {results.tracks.items.map((track) => (
            <Card key={track.id} className="bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors border-zinc-800">
              <CardContent className="p-4 flex items-center">
                <div className="relative h-12 w-12 mr-4 flex-shrink-0">
                  <Image
                    src={track.album.images[0]?.url || "/placeholder.svg?height=48&width=48"}
                    alt={track.album.name}
                    fill
                    className="object-cover rounded"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{track.name}</div>
                  <div className="text-sm text-zinc-400 truncate">{track.artists.map((a) => a.name).join(", ")}</div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button size="icon" variant="ghost" onClick={() => playTrack(track.uri)}>
                    <Play className="h-5 w-5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => addToPlaylist(track)}>
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="artists" className="mt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.artists.items.map((artist) => (
            <Card key={artist.id} className="bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors border-zinc-800">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="relative h-32 w-32 mb-4 rounded-full overflow-hidden">
                  <Image
                    src={artist.images[0]?.url || "/placeholder.svg?height=128&width=128"}
                    alt={artist.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="font-medium truncate w-full">{artist.name}</div>
                <div className="text-sm text-zinc-400">Artist</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="albums" className="mt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.albums.items.map((album) => (
            <Card key={album.id} className="bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors border-zinc-800">
              <CardContent className="p-4 flex flex-col">
                <div className="relative aspect-square mb-4">
                  <Image
                    src={album.images[0]?.url || "/placeholder.svg?height=200&width=200"}
                    alt={album.name}
                    fill
                    className="object-cover rounded"
                  />
                </div>
                <div className="font-medium truncate">{album.name}</div>
                <div className="text-sm text-zinc-400 truncate">{album.artists.map((a) => a.name).join(", ")}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}
