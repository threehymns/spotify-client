"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, PlusCircle } from "lucide-react"
import { useSpotify } from "@/context/spotify-context"
import { searchSpotify } from "@/lib/spotify-api"

type SimplifiedPlaylistObject = {
  id: string;
  name: string;
  owner: { display_name?: string; id: string };
  images?: { url: string }[];
  tracks: { total: number };
  description?: string | null;
  collaborative?: boolean;
  external_urls?: { spotify: string };
  public?: boolean | null;
  uri: string;
};

type PaginatedResult<T> = {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
};

type SearchResultsState = {
  tracks: PaginatedResult<any>;
  artists: PaginatedResult<any>;
  albums: PaginatedResult<any>;
  playlists: PaginatedResult<SimplifiedPlaylistObject>;
};

type SearchResultsProps = {
  query: string;
};

export default function SearchResults({ query }: SearchResultsProps) {
  const { playTrack, addToPlaylist } = useSpotify();
  const [results, setResults] = useState<SearchResultsState>({
    tracks: { href: '', items: [], limit: 0, next: null, offset: 0, previous: null, total: 0 },
    artists: { href: '', items: [], limit: 0, next: null, offset: 0, previous: null, total: 0 },
    albums: { href: '', items: [], limit: 0, next: null, offset: 0, previous: null, total: 0 },
    playlists: { href: '', items: [], limit: 0, next: null, offset: 0, previous: null, total: 0 },
  });
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("tracks")

  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim().length < 2) {
        setResults({
          tracks: { href: '', items: [], limit: 0, next: null, offset: 0, previous: null, total: 0 },
          artists: { href: '', items: [], limit: 0, next: null, offset: 0, previous: null, total: 0 },
          albums: { href: '', items: [], limit: 0, next: null, offset: 0, previous: null, total: 0 },
          playlists: { href: '', items: [], limit: 0, next: null, offset: 0, previous: null, total: 0 },
        });
        return;
      }

      setLoading(true)
      try {
        const data = await searchSpotify(query, ["track", "artist", "album", "playlist"])
        setResults({
          ...data,
          playlists: data.playlists || { items: [] },
        })
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

  if (results.tracks.items.length === 0 && results.artists.items.length === 0 && results.albums.items.length === 0 && results.playlists.items.length === 0) {
    return <div className="text-center py-12 text-zinc-400">No results found for "{query}"</div>
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="tracks">Tracks</TabsTrigger>
        <TabsTrigger value="artists">Artists</TabsTrigger>
        <TabsTrigger value="albums">Albums</TabsTrigger>
        <TabsTrigger value="playlists">Playlists</TabsTrigger>
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
                  <div className="font-medium truncate">
                    <Link href={`/albums/${track.album.id}`} className="hover:underline">{track.name}</Link>
                  </div>
                  <div className="text-sm text-zinc-400 truncate">
                    {track.artists.map((a, i) => (
                      <span key={a.id}>
                        <Link href={`/artists/${a.id}`} className="hover:underline">
                          {a.name}
                        </Link>
                        {i < track.artists.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button size="icon" variant="ghost" onClick={() => playTrack(track.uri)}>
                    <Play className="h-5 w-5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => addToPlaylist(track)}>
                    <PlusCircle className="h-5 w-5" />
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
                <div className="font-medium truncate w-full">
                  <Link href={`/artists/${artist.id}`} className="hover:underline">{artist.name}</Link>
                </div>
                <div className="text-sm text-zinc-400">Artist</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="albums" className="mt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.albums.items.map((album: any) => (
            <Card key={album.id} className="group">
              <CardContent className="p-3 flex flex-col items-center">
                <Image
                  src={album.images?.[0]?.url || "/placeholder.svg?height=128&width=128"}
                  alt={album.name}
                  width={128}
                  height={128}
                  className="rounded shadow mb-2 object-cover"
                />
                <div className="font-medium truncate w-full text-center">
                  <Link href={`/albums/${album.id}`} className="hover:underline">{album.name}</Link>
                </div>
                <div className="text-xs text-zinc-400 text-center">{album.artists?.[0]?.name}</div>
                <div className="text-xs text-zinc-400 mt-1">{album.total_tracks ?? album.tracks?.total ?? 0} tracks</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="playlists" className="mt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.playlists.items
            .filter((playlist: any) => playlist && playlist.id)
            .map((playlist: any) => (
              <Card key={playlist.id} className="group">
                <CardContent className="p-3 flex flex-col items-center">
                  <Image
                    src={Array.isArray(playlist?.images) ? playlist.images[0]?.url : "/placeholder.svg?height=128&width=128"}
                    alt={playlist?.name}
                    width={128}
                    height={128}
                    className="rounded shadow mb-2 object-cover"
                  />
                  <div className="font-medium truncate w-full text-center">
                    <Link href={`/playlists/${playlist.id}`} className="hover:underline">{playlist.name}</Link>
                  </div>
                  <div className="text-xs text-zinc-400 text-center">By {playlist.owner?.display_name || playlist.owner?.id}</div>
                <div className="text-xs text-zinc-400 mt-1">{playlist.tracks?.total ?? 0} tracks</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}
