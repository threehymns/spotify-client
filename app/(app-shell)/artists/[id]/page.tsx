"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getArtist, getArtistTopTracks, getArtistAlbums } from "@/lib/spotify-api"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play } from "lucide-react"
import { useSpotify } from "@/context/spotify-context"
import SongListing from '@/components/song-listing'
import { AlbumCard } from '@/components/album-card';

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

  if (loading) return <div className="p-6">Loading...</div>
  if (!artist) return <div className="p-6">Artist not found.</div>

  return (
    <div className="p-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <div className="flex gap-6 items-center mb-6">
        <img src={artist.images?.[0]?.url || "/placeholder.svg?height=200&width=200"} alt={artist.name} className="w-48 h-48 object-cover rounded-lg" />
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{artist.name}</h1>
          <div className="text-zinc-400 mb-2">{artist.genres?.join(", ")}</div>
          <Button size="sm" variant="default" onClick={() => playUri(`spotify:artist:${artist.id}`)}>
            <Play className="h-4 w-4 mr-2" />
            Play Artist
          </Button>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Top Songs</h2>
        {tracksLoading ? (
          <div>Loading top songs…</div>
        ) : topTracks && topTracks.length > 0 ? (
          <SongListing tracks={topTracks} />
        ) : (
          <div className="text-zinc-400">No top songs found.</div>
        )}
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Albums</h2>
        {albumsLoading ? (
          <div>Loading albums…</div>
        ) : albums && albums.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {albums.map(album => (
              <AlbumCard
                key={album.id}
                album={album}
                href={`/albums/${album.id}`}
                showArtists={false}
                showPlayButton={true}
                className="h-full"
              />
            ))}
          </div>
        ) : (
          <div className="text-zinc-400">No albums found.</div>
        )}
      </div>
    </div>
  )
}
