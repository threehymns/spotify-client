"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getAccessToken } from "@/lib/auth-helpers"

type SpotifyContextType = {
  currentTrack: any
  isPlaying: boolean
  playTrack: (uri: string) => void
  togglePlayback: () => void
  skipToNext: () => void
  skipToPrevious: () => void
  addToPlaylist: (track: any) => void
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined)

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const loadSpotifyPlayer = async () => {
      try {
        const token = await getAccessToken()
        setAccessToken(token)

        // Load Spotify Web Playback SDK
        if (!window.Spotify) {
          const script = document.createElement("script")
          script.src = "https://sdk.scdn.co/spotify-player.js"
          script.async = true
          document.body.appendChild(script)

          window.onSpotifyWebPlaybackSDKReady = () => {
            const player = new window.Spotify.Player({
              name: "Spotify Client Web Player",
              getOAuthToken: (cb) => {
                cb(token)
              },
            })

            // Error handling
            player.addListener("initialization_error", ({ message }) => {
              console.error("Initialization error:", message)
            })

            player.addListener("authentication_error", ({ message }) => {
              console.error("Authentication error:", message)
            })

            player.addListener("account_error", ({ message }) => {
              console.error("Account error:", message)
            })

            player.addListener("playback_error", ({ message }) => {
              console.error("Playback error:", message)
            })

            // Playback status updates
            player.addListener("player_state_changed", (state) => {
              if (state) {
                setCurrentTrack(state.track_window.current_track)
                setIsPlaying(!state.paused)
              }
            })

            // Ready
            player.addListener("ready", ({ device_id }) => {
              console.log("Ready with Device ID", device_id)
              setPlayer(player)
              setIsReady(true)
            })

            // Connect to the player
            player.connect()
          }
        }
      } catch (error) {
        console.error("Failed to initialize Spotify player:", error)
      }
    }

    loadSpotifyPlayer()

    return () => {
      if (player) {
        player.disconnect()
      }
    }
  }, [])

  const playTrack = async (uri: string) => {
    if (!player || !isReady || !accessToken) return

    try {
      await fetch("https://api.spotify.com/v1/me/player/play", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: [uri],
        }),
      })
    } catch (error) {
      console.error("Failed to play track:", error)
    }
  }

  const togglePlayback = () => {
    if (!player || !isReady) return

    if (isPlaying) {
      player.pause()
    } else {
      player.resume()
    }
  }

  const skipToNext = () => {
    if (!player || !isReady) return
    player.nextTrack()
  }

  const skipToPrevious = () => {
    if (!player || !isReady) return
    player.previousTrack()
  }

  const addToPlaylist = async (track: any) => {
    // This would open a dialog to select which playlist to add the track to
    console.log("Add to playlist:", track)
    // Implementation would depend on your UI for playlist selection
  }

  return (
    <SpotifyContext.Provider
      value={{
        currentTrack,
        isPlaying,
        playTrack,
        togglePlayback,
        skipToNext,
        skipToPrevious,
        addToPlaylist,
      }}
    >
      {children}
    </SpotifyContext.Provider>
  )
}

export function useSpotify() {
  const context = useContext(SpotifyContext)
  if (context === undefined) {
    throw new Error("useSpotify must be used within a SpotifyProvider")
  }
  return context
}
