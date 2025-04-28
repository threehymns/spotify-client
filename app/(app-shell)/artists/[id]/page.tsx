"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getArtist, getArtistTopTracks, getArtistAlbums } from "@/lib/spotify-api"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play, Heart, Clock, Music, Award, Album as AlbumIcon } from "lucide-react"
import { useSpotify } from "@/context/spotify-context"
import SongListing from '@/components/song-listing'
import { AlbumCard } from '@/components/album-card'
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDominantColorWorker } from '@/hooks/useDominantColorWorker'
import { cn } from "@/lib/utils"

export default function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const [artist, setArtist] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [topTracks, setTopTracks] = useState<any[] | null>(null)
  const [tracksLoading, setTracksLoading] = useState(true)
  const [albums, setAlbums] = useState<any[] | null>(null)
  const [albumsLoading, setAlbumsLoading] = useState(true)
  const { playUri } = useSpotify()
  const router = useRouter()
  
  // Extract dominant color from artist image
  const imgUrl = artist?.images?.[0]?.url
  const { color } = useDominantColorWorker(id, imgUrl)

  useEffect(() => {
    async function fetchArtist() {
      try {
        const data = await getArtist(id)
        setArtist(data)
      } catch (e) {
        setArtist(null)
      } finally {
        setLoading(false)
      }
    }
    fetchArtist()
  }, [id])

  useEffect(() => {
    async function fetchTopTracks() {
      setTracksLoading(true)
      try {
        const res = await getArtistTopTracks(id)
        setTopTracks(res?.tracks || [])
      } catch {
        setTopTracks([])
      } finally {
        setTracksLoading(false)
      }
    }
    if (id) fetchTopTracks()
  }, [id])

  useEffect(() => {
    async function fetchAlbums() {
      setAlbumsLoading(true)
      try {
        const res = await getArtistAlbums(id, { include_groups: 'album,single', market: 'from_token', limit: '12' })
        setAlbums(res?.items || [])
      } catch {
        setAlbums([])
      } finally {
        setAlbumsLoading(false)
      }
    }
    if (id) fetchAlbums()
  }, [id])

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-4 w-full">
        <div className="w-48 h-48 rounded-lg bg-zinc-800/60 animate-pulse"></div>
        <div className="h-8 w-64 rounded-md bg-zinc-800/60 animate-pulse"></div>
        <div className="h-4 w-48 rounded-md bg-zinc-800/60 animate-pulse"></div>
        <div className="h-10 w-32 rounded-md bg-zinc-800/60 animate-pulse mt-2"></div>
      </div>
    )
  }
  
  if (!artist) return (
    <div className="p-6 flex flex-col items-center justify-center h-[50vh]">
      <Music className="h-16 w-16 text-zinc-600 mb-4" />
      <h2 className="text-xl font-medium text-zinc-400">Artist not found.</h2>
      <Button 
        variant="outline" 
        className="mt-4" 
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Go Back
      </Button>
    </div>
  )

  // Generate background gradient from dominant color
  const gradientBg = color
    ? `linear-gradient(to bottom, rgba(${color[0]},${color[1]},${color[2]},0.7) 0%, rgba(18,18,18,1) 80%)`
    : 'linear-gradient(to bottom, rgba(80,80,80,0.7) 0%, rgba(18,18,18,1) 80%)';

  return (
    <div className="min-h-full">
      <div 
        className="relative px-6 pt-8 pb-24 mb-[-64px] overflow-hidden"
        style={{ background: gradientBg }}
      >
        {/* Back button */}
        <Button 
          variant="ghost" 
          size="icon"
          className="absolute top-4 left-4 bg-black/30 hover:bg-black/50 text-white z-10 rounded-full"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-end relative z-10 mt-12">
          {/* Artist image with shadow */}
          <div className="relative">
            <div className="w-48 h-48 md:w-56 md:h-56 rounded-lg overflow-hidden shadow-2xl">
              <img 
                src={artist.images?.[0]?.url || "/placeholder.svg?height=200&width=200"} 
                alt={artist.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div 
              className="absolute -inset-3 -z-10 opacity-30 blur-xl rounded-full" 
              style={{ 
                background: color ? `rgb(${color[0]},${color[1]},${color[2]})` : 'rgba(80,80,80,0.5)' 
              }}
            />
          </div>

          {/* Artist info */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2 text-white/60 mb-1">
              <Award className="h-5 w-5" /> 
              <span>Artist</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{artist.name}</h1>
            
            {artist.followers && (
              <div className="text-white/80 mb-4 text-sm">
                {artist.followers.total.toLocaleString()} followers
                {artist.genres?.length > 0 && ` • ${artist.genres.slice(0, 2).join(', ')}`}
              </div>
            )}
            
            <div className="flex gap-3 mt-2">
              <Button 
                size="lg"
                variant="default" 
                className="rounded-full shadow-lg" 
                onClick={() => playUri(`spotify:artist:${artist.id}`)}
              >
                <Play className="h-5 w-5 mr-2" fill="currentColor" />
                Play
              </Button>
              <Button 
                size="lg"
                variant="outline" 
                className="rounded-full bg-black/30 hover:bg-black/50 border-white/10"
              >
                <Heart className="h-5 w-5 mr-2" />
                Follow
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 pt-16 pb-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Music className="h-5 w-5 text-green-500" /> Popular Songs
            </h2>
            {(topTracks?.length || 0) > 5 && (
              <Button variant="link" className="text-white/60 hover:text-white">
                Show all
              </Button>
            )}
          </div>
          {tracksLoading ? (
            <div className="grid gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-zinc-800/50 rounded-md animate-pulse" />
              ))}
            </div>
          ) : topTracks && topTracks.length > 0 ? (
            <Card className="border-none bg-zinc-900/40 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                <SongListing tracks={topTracks.slice(0, 5)} />
              </CardContent>
            </Card>
          ) : (
            <div className="text-zinc-400 flex flex-col items-center justify-center py-10 bg-zinc-900/40 rounded-lg">
              <Music className="h-12 w-12 text-zinc-700 mb-2" />
              <p>No top songs found for this artist.</p>
            </div>
          )}
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <AlbumIcon className="h-5 w-5 text-purple-500" /> Albums & Singles
            </h2>
            {(albums?.length || 0) > 8 && (
              <Button variant="link" className="text-white/60 hover:text-white">
                Show all
              </Button>
            )}
          </div>
          {albumsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-zinc-800/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : albums && albums.length > 0 ? (
            <ScrollArea className="pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 pb-3">
                {albums.map(album => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    href={`/albums/${album.id}`}
                    showArtists={false}
                    showPlayButton={true}
                    className="h-full transition-transform duration-200 hover:scale-[1.02] focus-within:scale-[1.02]"
                  />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-zinc-400 flex flex-col items-center justify-center py-12 bg-zinc-900/40 rounded-lg">
              <AlbumIcon className="h-12 w-12 text-zinc-700 mb-2" />
              <p>No albums found for this artist.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
