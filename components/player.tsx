"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import MotionAlbumArt, { MotionLink } from "@/components/motion-components"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2 } from "lucide-react"
import { useSpotify } from "@/context/spotify-context"
import UniversalContextMenu from "./universal-context-menu"

export default function Player() {
  const {
    currentTrack,
    isPlaying,
    togglePlayback,
    skipToNext,
    skipToPrevious,
    setVolume,
    seekTo,
    volume,
    position,
    duration
  } = useSpotify()

  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);
  const [currentPosition, setCurrentPosition] = useState(position);

  useEffect(() => {
    setCurrentPosition(position);
  }, [position]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentPosition((prev) => {
          if (prev < duration) {
            return prev + 1;
          }
          return prev;
        });
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, duration]);


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  }

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  }

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0]
    seekTo(newProgress)
    setCurrentPosition(newProgress);
  }

  // Always show player controls, even if nothing is playing
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-20 bg-zinc-950/90 backdrop-saturate-200 backdrop-blur-md border-t border-zinc-800"
    >
      {/* Track info */}
      <div className="flex items-center w-1/3">
        <div className="relative h-14 w-14 mr-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          <UniversalContextMenu type="track" id={currentTrack?.id || ""} albumId={currentTrack?.album.id || ""} artists={currentTrack?.artists || []}>
            <MotionAlbumArt
              src={currentTrack?.album?.images[0]?.url || "/placeholder.svg?height=48&width=48"}
              alt={currentTrack?.album?.name ? currentTrack.album.name + " Album cover" : "No album"}
              fill
              className="object-cover rounded shadow-lg ring-1 ring-zinc-400/10"
              style={!currentTrack ? { filter: 'grayscale(1)' } : {}}
              layoutId="now-playing-album-art"
            />
          </UniversalContextMenu>
        </div>
        <motion.div className="min-w-0" layoutId="now-playing-track-info">
          <div className={`font-semibold truncate text-base ${!currentTrack ? 'text-zinc-400' : 'text-white drop-shadow'} transition-colors duration-150`}>
            {currentTrack ? (
              (() => {
                let albumId = currentTrack.album?.id;
                if (!albumId && currentTrack.album?.uri?.startsWith('spotify:album:')) {
                  albumId = currentTrack.album.uri.split(':')[2];
                }
                return albumId ? (
                  <UniversalContextMenu type="track" id={currentTrack.id} albumId={albumId} artists={currentTrack.artists}>
                    <Link href={`/albums/${albumId}`} className="hover:underline">{currentTrack.name}</Link>
                  </UniversalContextMenu>
                ) : (
                  <span>{currentTrack.name}</span>
                );
              })()
            ) : (
              <span>No track playing</span>
            )}
          </div>
          <div className="text-xs text-zinc-400 truncate mt-0.5">
            {currentTrack && currentTrack.artists
              ? currentTrack.artists.map((a: { id?: string; name: string; uri?: string }, i: number) => {
                let artistId = a.id;
                if (!artistId && a.uri?.startsWith('spotify:artist:')) {
                  artistId = a.uri.split(':')[2];
                }
                return (
                  <span key={artistId || a.name}>
                    {artistId ? (
                      <UniversalContextMenu type="artist" id={artistId}>
                        <Link href={`/artists/${artistId}`} className="hover:underline">{a.name}</Link>
                      </UniversalContextMenu>
                    ) : (
                      <span>{a.name}</span>
                    )}
                    {i < currentTrack.artists.length - 1 && ', '}
                  </span>
                );
              })
              : <span>&nbsp;</span>
            }
          </div>
        </motion.div>
      </div>

      {/* Playback controls */}
      <div className="flex flex-col items-center w-1/3">
        {/* Controls group with layoutId */}
        <motion.div layoutId="now-playing-controls" className="flex items-center gap-4 mb-2">
          <Button size="icon" variant="ghost" onClick={skipToPrevious} disabled={!currentTrack}>
            <SkipBack className="h-6 w-6" />
          </Button>
          <Button
            size="icon"
            className="text-black hover:bg-green-300 rounded-full h-10 w-10 shadow-lg transition-all focus:ring-2 focus:ring-green-400/40"
            onClick={togglePlayback}
            disabled={!currentTrack}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={skipToNext} disabled={!currentTrack}
            className="hover:bg-green-900/20 focus:ring-2 focus:ring-green-400/40 transition-all">
            <SkipForward className="h-6 w-6" />
          </Button>
        </motion.div>
        {/* Progress bar group with layoutId */}
        <motion.div layoutId="now-playing-progress" className="flex items-center gap-2 w-full">
          <div className="text-xs text-zinc-400 w-10 text-right font-mono tracking-tight">{formatTime(currentTrack ? currentPosition : 0)}</div>
          <div className="w-full group">
            <Slider
              value={[currentTrack ? currentPosition : 0]}
              max={currentTrack ? duration : 100}
              step={1}
              onValueChange={handleProgressChange}
              disabled={!currentTrack}
              className="w-full [&>span:first-child]:h-1.5 [&>span:first-child]:bg-zinc-600 [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-2 [&_[role=slider]]:border-zinc-400 [&_[role=slider]]:bg-white [&_[role=slider]]:shadow-lg transition-all [&_[role=slider]]:opacity-0 group-hover:[&_[role=slider]]:opacity-100 group-focus-within:[&_[role=slider]]:opacity-100"
            />
          </div>
          <div className="text-xs text-zinc-400 w-10 font-mono tracking-tight">{formatTime(currentTrack ? duration : 0)}</div>
        </motion.div>
      </div>

      {/* Volume controls */}
      <div className="flex items-center justify-end gap-4 w-1/3">
        <motion.div layoutId="now-playing-volume" className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={toggleMute} disabled={!currentTrack}
            className="hover:bg-green-900/20 focus:ring-2 focus:ring-green-400/40 transition-all">
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          <div className="w-28 group">
            <Slider
              value={[volume]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              disabled={!currentTrack}
              className="w-28 [&>span:first-child]:h-1.5 [&>span:first-child]:bg-zinc-600 [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-2 [&_[role=slider]]:border-zinc-400 [&_[role=slider]]:bg-white [&_[role=slider]]:shadow-lg transition-all [&_[role=slider]]:opacity-0 group-hover:[&_[role=slider]]:opacity-100 group-focus-within:[&_[role=slider]]:opacity-100"
            />
          </div>
        </motion.div>
        {/* Fullscreen button */}
        <MotionLink href="/now-playing" aria-label="Fullscreen Now Playing" layoutId="now-playing-toggle">
          <Button size="icon" variant="ghost">
            <Maximize2 className="h-5 w-5" />
          </Button>
        </MotionLink>
      </div>
    </div>
  )
}