"use client"

import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Play, TrendingUp } from "lucide-react"
import { useSpotify } from "@/context/spotify-context"
import UniversalContextMenu from "./universal-context-menu"

/**
 * SongListingProps: accepts an array of tracks. Each track should have id, name, uri, artists, and album fields.
 * To support playlist tracks, pass tracks as: playlistTracks.map(item => ({ ...item.track, album: item.track.album }))
 * Optionally, provide getAlbumHref to customize the album link.
 */
export interface SongListingProps {
  tracks: Array<{
    id: string
    name: string
    uri: string
    artists: { name: string; id?: string }[]
    album: { id?: string; name: string; images: any[] }
    popularity?: number // Spotify API: 0-100
    playcount?: number // Sometimes available for some endpoints
  }>
  getAlbumHref?: (album: { id?: string }) => string
}

export default function SongListing({ tracks, getAlbumHref }: SongListingProps) {
  const { playUri } = useSpotify()
  return (
    <div className="grid gap-2">
      {tracks.map((track) => (
        <div key={track.id} className="flex items-center bg-zinc-800/50 p-3 rounded-md group">
          <span className="relative mr-3 px-3 py-2 text-muted-foreground group-hover:text-transparent">
            {tracks.indexOf(track) + 1}
            <Button
              size="icon"
              variant="ghost"
              className="absolute inset-0 opacity-0 group-hover:opacity-100 text-white"
              onClick={() => playUri(track.uri)}
            >
              <Play className="h-5 w-5" fill="currentColor" />
            </Button>
          </span>
          <img src={track.album.images?.[0]?.url || "/placeholder.svg?height=40&width=40"} alt={track.name} className="h-10 w-10 rounded mr-3 object-cover" />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">
              <UniversalContextMenu type="track" id={track.id || ""} albumId={track.album.id || ""} artists={track.artists}>
                <Link
                  href={getAlbumHref ? getAlbumHref(track.album) : track.album.id ? `/albums/${track.album.id}` : "#"}
                  className="hover:underline"
                >
                  {track.name}
                </Link>
              </UniversalContextMenu>
            </div>
            <div className="text-xs text-zinc-400 truncate">
              {track.artists.map(({ id, name }, i) => (
                <React.Fragment key={id}>
                  <UniversalContextMenu type="artist" id={id || ""}>
                    <Link href={`/artists/${id}`} className="hover:underline">
                      {name}
                    </Link>
                  </UniversalContextMenu>
                  {track.artists.length > 1 && i < track.artists.length - 1 ? ", " : ""}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 min-w-max pl-2">
            {typeof track.playcount === 'number' ? (
              <span className="text-xs text-zinc-400 tabular-nums" title="Play count">{track.playcount.toLocaleString()}</span>
            ) : typeof track.popularity === 'number' ? (
              <span className="text-xs text-center text-zinc-400" title="Popularity (0-100)">
                <TrendingUp className="h-4 w-4" />
                {track.popularity}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
