"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatDuration } from "@/lib/time"
import { Play, TrendingUp, Heart } from "lucide-react"
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
    duration_ms?: number // Duration in milliseconds
  }>
  getAlbumHref?: (album: { id?: string }) => string
}

export default function SongListing({ tracks, getAlbumHref }: SongListingProps) {
  const { areTracksSaved } = useSpotify()
  const [savedStatuses, setSavedStatuses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    
    if (tracks && tracks.length > 0) {
      const trackIds = tracks.map(track => track.id).filter(Boolean);
      if (trackIds.length > 0) {
        areTracksSaved(trackIds).then(statuses => {
          if (mounted) {
            const statusMap: Record<string, boolean> = {};
            trackIds.forEach((id, index) => {
              statusMap[id] = statuses[index];
            });
            setSavedStatuses(statusMap);
          }
        });
      }
    } else {
      setSavedStatuses({});
    }

    return () => {
      mounted = false;
    };
  }, [tracks, areTracksSaved]);

  return (
    <div className="w-full">
      {/* Column headers */}
      <div className="grid grid-cols-[48px_auto_1fr_auto] gap-4 px-4 py-2 text-xs text-zinc-400 border-b border-zinc-800">
        <div className="text-center">#</div>
        <div>Title</div>
        <div></div> {/* Empty space for artist info */}
        <div className="text-right">Duration</div>
      </div>
      
      {/* Tracks */}
      <div className="grid gap-1 mt-2">
        {tracks.map((track, i) => (
          <TrackRow
            key={track.id}
            track={track}
            index={i + 1}
            getAlbumHref={getAlbumHref}
            isSaved={savedStatuses[track.id] || false}
            onToggleSave={(trackId, newSavedState) => {
              setSavedStatuses(prev => ({
                ...prev,
                [trackId]: newSavedState
              }));
            }}
          />
        ))}
      </div>
    </div>
  )
}

interface TrackRowProps {
  track: SongListingProps['tracks'][0];
  getAlbumHref?: SongListingProps['getAlbumHref'];
  isSaved: boolean;
  index: number;
  onToggleSave: (trackId: string, newSavedState: boolean) => void;
}

function TrackRow({ track, getAlbumHref, isSaved, index, onToggleSave }: TrackRowProps) {
  const { play, toggleSaveTrack } = useSpotify();

  const handleToggleLike = async () => {
    if (track.id) {
      try {
        // Optimistically update UI through parent
        onToggleSave(track.id, !isSaved);
        await toggleSaveTrack(track.id, !isSaved);
      } catch (error) {
        console.error("Failed to toggle like status:", error);
        // Revert optimistic update
        onToggleSave(track.id, isSaved);
      }
    }
  };



  return (
    <div
      key={track.id}
      className="grid grid-cols-[48px_40px_1fr_auto] gap-4 items-center bg-zinc-800/30 hover:bg-zinc-800/60 p-3 rounded-md group transition-colors"
    >
      {/* Track number / Play button */}
      <div className="flex justify-center">
        <span className="relative flex items-center justify-center w-8 h-8 text-sm text-muted-foreground group-hover:text-transparent">
          {index}
          <Button
            size="icon"
            variant="ghost"
            className="absolute inset-0 opacity-0 group-hover:opacity-100 text-white h-8 w-8"
            onClick={() => play(track.uri)}
          >
            <Play className="h-4 w-4" fill="currentColor" />
          </Button>
        </span>
      </div>
      
      {/* Album artwork */}
      <img
        src={track.album.images?.[0]?.url || "/placeholder.svg?height=40&width=40"}
        alt={track.name}
        className="h-10 w-10 rounded object-cover"
        loading="lazy"
      />
      
      {/* Track info */}
      <div className="min-w-0 flex flex-col justify-center">
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
            <React.Fragment key={id || name || i}>
              {id ? (
                <UniversalContextMenu type="artist" id={id}>
                  <Link href={`/artists/${id}`} className="hover:underline">
                    {name}
                  </Link>
                </UniversalContextMenu>
              ) : (
                <span>{name}</span>
              )}
              {i < track.artists.length - 1 && ', '}
            </React.Fragment>
          ))}
          {track.album && (
            <span className="text-zinc-500"> • {track.album.name}</span>
          )}
        </div>
      </div>
      
      {/* Track metadata and Like button */}
      <div className="flex items-center gap-3 justify-end">
        {/* Like button */}
        {track.id && (
          <Button
            size="icon"
            variant="ghost"
            className={`h-8 w-8 ${isSaved ? 'text-green-500 hover:text-green-400' : 'text-zinc-400 hover:text-white'}`}
            onClick={handleToggleLike}
            title={isSaved ? "Remove from Liked Songs" : "Add to Liked Songs"}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </Button>
        )}
        
        {typeof track.playcount === 'number' && (
          <span className="text-xs text-zinc-400 tabular-nums whitespace-nowrap" title="Play count">
            {track.playcount.toLocaleString()}
          </span>
        )}
        {typeof track.popularity === 'number' && (
          <span className="flex items-center gap-1 text-xs text-zinc-400 whitespace-nowrap" title="Popularity (0-100)">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{track.popularity}</span>
          </span>
        )}
        {typeof track.duration_ms === 'number' && (
          <span className="text-xs text-zinc-400 tabular-nums whitespace-nowrap" title="Duration">
            {formatDuration(track.duration_ms)}
          </span>
        )}
      </div>
    </div>
  );
}