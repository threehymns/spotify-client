"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"
import { useSpotify } from "@/context/spotify-context"

export default function Player() {
  const {
    currentTrack,
    isPlaying,
    togglePlayback,
    skipToNext,
    skipToPrevious,
    setVolume,
    setMute,
    seekTo,
    volume,
    isMuted,
    position,
    duration
  } = useSpotify()

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
  }

  const toggleMute = () => {
    setMute(!isMuted)
  }

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0]
    seekTo(newProgress)
  }

  if (!currentTrack) {
    return <div className="flex items-center justify-center h-full text-zinc-500">No track currently playing</div>
  }

  return (
    <div className="flex items-center justify-between px-4 h-full">
      {/* Track info */}
      <div className="flex items-center w-1/3">
        <div className="relative h-12 w-12 mr-3">
          <Image
            src={currentTrack.album?.images[0]?.url || "/placeholder.svg?height=48&width=48"}
            alt={currentTrack.album?.name || "Album cover"}
            fill
            className="object-cover rounded"
          />
        </div>
        <div className="min-w-0">
          <div className="font-medium truncate">{currentTrack.name}</div>
          <div className="text-xs text-zinc-400 truncate">{currentTrack.artists?.map((a) => a.name).join(", ")}</div>
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex flex-col items-center w-1/3">
        <div className="flex items-center gap-4 mb-2">
          <Button size="icon" variant="ghost" onClick={skipToPrevious}>
            <SkipBack className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            className="bg-white text-black hover:bg-zinc-200 rounded-full h-8 w-8"
            onClick={togglePlayback}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={skipToNext}>
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2 w-full">
          <div className="text-xs text-zinc-400 w-10 text-right">{formatTime(position)}</div>
          <Slider
            value={[position]}
            max={duration}
            step={1}
            onValueChange={handleProgressChange}
            className="w-full [&>span:first-child]:h-1 [&>span:first-child]:bg-zinc-600 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-white"
          />
          <div className="text-xs text-zinc-400 w-10">{formatTime(duration)}</div>
        </div>
      </div>

      {/* Volume controls */}
      <div className="flex items-center justify-end gap-2 w-1/3">
        <Button size="icon" variant="ghost" onClick={toggleMute}>
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
        <Slider
          value={[volume]}
          max={100}
          step={1}
          onValueChange={handleVolumeChange}
          className="w-28 [&>span:first-child]:h-1 [&>span:first-child]:bg-zinc-600 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-white"
        />
      </div>
    </div>
  )
}
