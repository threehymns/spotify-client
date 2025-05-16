"use client"

import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from "react"
import { getAccessToken } from "@/lib/auth-helpers"
import { spotifyFetch, checkSavedAlbums, saveAlbums, removeSavedAlbums, checkPlaylistFollowed, followPlaylist, unfollowPlaylist, checkFollowingArtists, followArtists, unfollowArtists, checkSavedTracks, saveTracks, removeSavedTracks, getUserProfile } from "@/lib/spotify-api"

// Declare Spotify Web Playback SDK types
declare global {
  interface Window {
    Spotify: any; // TODO: Replace 'any' with proper Spotify types if available
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

type SpotifyContextType = {
  currentTrack: any
  isPlaying: boolean
  playTrack: (uri: string) => void
  playUri: (uri: string) => void
  togglePlayback: () => void
  skipToNext: () => void
  skipToPrevious: () => void
  setVolume: (volume: number) => void
  setMute: (mute: boolean) => void
  seekTo: (position: number) => void
  volume: number
  isMuted: boolean
  position: number
  duration: number
  isAlbumSaved: (albumId: string) => Promise<boolean>
  toggleSaveAlbum: (albumId: string, save: boolean) => Promise<void>
  isPlaylistFollowed: (playlistId: string) => Promise<boolean>
  toggleFollowPlaylist: (playlistId: string, follow: boolean) => Promise<void>
  isArtistFollowed: (artistId: string) => Promise<boolean>;
  toggleFollowArtist: (artistId: string, follow: boolean) => Promise<void>;
  isTrackSaved: (trackId: string) => Promise<boolean>;
  areTracksSaved: (trackIds: string[]) => Promise<boolean[]>;
  toggleSaveTrack: (trackId: string, save: boolean) => Promise<void>;
};

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined)

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const playerRef = useRef<any>(null)
  const [player, setPlayer] = useState<any>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [volume, setVolumeState] = useState<number>(50)
  const [isMuted, setIsMuted] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  // Flag to ensure initial sync workaround runs only once
  const initialSyncDone = useRef(false)

  // Memoized API functions
  const isAlbumSaved = useCallback(async (albumId: string) => {
    try {
      const response = await checkSavedAlbums([albumId]);
      return Array.isArray(response) ? response[0] || false : false;
    } catch (error) {
      console.error("Failed to check album saved status:", error);
      return false;
    }
  }, [])

  const toggleSaveAlbum = useCallback(async (albumId: string, save: boolean) => {
    try {
      if (save) {
        await saveAlbums([albumId]);
      } else {
        await removeSavedAlbums([albumId]);
      }
    } catch (error) {
      console.error("Failed to toggle album save status:", error);
    }
  }, [])

  const isPlaylistFollowed = useCallback(async (playlistId: string) => {
    try {
      const user = await getUserProfile();
      const response = await checkPlaylistFollowed(playlistId, [user.id]);
      return Array.isArray(response) ? response[0] || false : false;
    } catch (error) {
      console.error("Failed to check playlist follow status:", error);
      return false;
    }
  }, [])

  const toggleFollowPlaylist = useCallback(async (playlistId: string, follow: boolean) => {
    try {
      if (follow) {
        await followPlaylist(playlistId);
      } else {
        await unfollowPlaylist(playlistId);
      }
    } catch (error) {
      console.error("Failed to toggle playlist follow status:", error);
    }
  }, [])

  const isArtistFollowed = useCallback(async (artistId: string) => {
    try {
      const response = await checkFollowingArtists([artistId]);
      return Array.isArray(response) ? response[0] || false : false;
    } catch (error) {
      console.error("Failed to check artist follow status:", error);
      return false;
    }
  }, [])

  const toggleFollowArtist = useCallback(async (artistId: string, follow: boolean) => {
    try {
      if (follow) {
        await followArtists([artistId]);
      } else {
        await unfollowArtists([artistId]);
      }
    } catch (error) {
      console.error("Failed to toggle artist follow status:", error);
    }
  }, [])

  const isTrackSaved = useCallback(async (trackId: string) => {
    try {
      const response = await checkSavedTracks([trackId]);
      return Array.isArray(response) ? response[0] || false : false;
    } catch (error) {
      console.error("Failed to check track saved status:", error);
      return false;
    }
  }, [])

  const areTracksSaved = useCallback(async (trackIds: string[]) => {
    try {
      const batchSize = 100;
      const results: boolean[] = [];
      
      // Split trackIds into chunks of batchSize
      for (let i = 0; i < trackIds.length; i += batchSize) {
        const chunk = trackIds.slice(i, i + batchSize);
        const chunkResults = await checkSavedTracks(chunk);
        results.push(...chunkResults);
      }
      
      return results;
    } catch (error) {
      console.error("Failed to check tracks saved status:", error);
      return trackIds.map(() => false);
    }
  }, [])

  const toggleSaveTrack = useCallback(async (trackId: string, save: boolean) => {
    try {
      if (save) {
        await saveTracks([trackId]);
      } else {
        await removeSavedTracks([trackId]);
      }
    } catch (error) {
      console.error("Failed to toggle track save status:", error);
    }
  }, [])



  // Progress bar update interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isPlaying) {
      interval = setInterval(() => {
        setPosition((prev) => {
          if (prev < duration) {
            return prev + 1
          }
          return prev
        })
      }, 1000)
    } else if (!isPlaying && interval) {
      clearInterval(interval)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying, duration])

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
              name: "Pulse Web Player",
              getOAuthToken: (cb: (token: string) => void) => {
                cb(token)
              },
            })

            // Error handling
            player.addListener("initialization_error", ({ message }: { message: string }) => {
              console.error("Initialization error:", message)
            })

            player.addListener("authentication_error", ({ message }: { message: string }) => {
              console.error("Authentication error:", message)
            })

            player.addListener("account_error", ({ message }: { message: string }) => {
              console.error("Account error:", message)
            })

            player.addListener("playback_error", ({ message }: { message: string }) => {
              console.error("Playback error:", message)
            })

            // Playback status updates
            player.addListener("player_state_changed", (state: any) => { // TODO: Replace 'any' with proper Spotify types if available
              if (state) {
                const currentState = state as any; // TODO: Replace 'any' with proper Spotify types if available
                setCurrentTrack(currentState.track_window.current_track)
                setIsPlaying(!currentState.paused)
                setPosition(currentState.position / 1000)
                setDuration(currentState.duration / 1000)
                setVolumeState(currentState.volume_percent)
                setIsMuted(currentState.volume_percent === 0)
              }
            })

            // Ready
            player.addListener("ready", async ({ device_id }: { device_id: string }) => {
              console.log("Ready with Device ID", device_id)
              playerRef.current = player
          setPlayer(player)
              setDeviceId(device_id)
              setIsReady(true)

              // Initial sync: get current state from SDK
              try {
                const state = await player.getCurrentState();
                if (state) {
                  setCurrentTrack(state.track_window.current_track);
                  setIsPlaying(!state.paused);
                  setPosition(state.position / 1000);
                  setDuration(state.duration / 1000);
                  setVolumeState(state.volume_percent);
                  setIsMuted(state.volume_percent === 0);
                }
              } catch (err) {
                // Ignore
              }
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
      playerRef.current?.disconnect()
    }
  }, [])

  const playTrack = async (uri: string) => {
    if (!player || !isReady || !deviceId) return
    try {
      // 1. Transfer playback to this device
      await spotifyFetch(`/me/player`, {
        method: "PUT",
        body: JSON.stringify({ device_ids: [deviceId], play: false }),
      });
      // 2. Play the track
      await spotifyFetch(`/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        body: JSON.stringify({
          uris: [uri],
        }),
      })
      // 3. Initial workaround: sync state and force SDK event only once
      if (!initialSyncDone.current) {
        setTimeout(async () => {
          if (player && isReady) {
            const state = await player.getCurrentState(); // TODO: Replace 'any' with proper Spotify types if available
            if (state) {
              setCurrentTrack(state.track_window.current_track);
              setIsPlaying(!state.paused);
              setPosition(state.position / 1000);
              setDuration(state.duration / 1000);
              setVolumeState(state.volume_percent);
              setIsMuted(state.volume_percent === 0);
              // Force SDK to emit player_state_changed
              player.seek(0);
              initialSyncDone.current = true
            }
          }
        }, 500);
      }
    } catch (error) {
      console.error("Failed to play track:", error)
    }
  }

  // Play a URI (track, album, or playlist)
  const playUri = async (uri: string) => {
    if (!player || !isReady || !deviceId) return
    try {
      // 1. Transfer playback to this device
      await spotifyFetch(`/me/player`, {
        method: "PUT",
        body: JSON.stringify({ device_ids: [deviceId], play: false }),
      });
      // 2. Play context or track
      let body: any = {}
      if (uri.startsWith("spotify:track:")) {
        body.uris = [uri]
      } else if (uri.startsWith("spotify:album:") || uri.startsWith("spotify:playlist:")) {
        body.context_uri = uri
      } else if (uri.startsWith("spotify:artist:")) {
        // Play artist radio (top tracks/shuffle)
        body.context_uri = uri
        body.shuffle = true // Optional: let Spotify shuffle artist radio
      } else {
        console.error("Unsupported URI type for playUri:", uri)
        return
      }
      await spotifyFetch(`/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      })
      // 3. Initial workaround: sync state and force SDK event only once
      if (!initialSyncDone.current) {
        setTimeout(async () => {
          if (player && isReady) {
            const state = await player.getCurrentState(); // TODO: Replace 'any' with proper Spotify types if available
            if (state) {
              setCurrentTrack(state.track_window.current_track);
              setIsPlaying(!state.paused);
              setPosition(state.position / 1000);
              setDuration(state.duration / 1000);
              setVolumeState(state.volume_percent);
              setIsMuted(state.volume_percent === 0);
              player.seek(0);
              initialSyncDone.current = true
            }
          }
        }, 500);
      }
    } catch (error) {
      console.error("Failed to play URI:", error)
    }
  }

  const togglePlayback = async () => {
    if (!player || !isReady) return
    if (isPlaying) {
      player.pause();
    } else {
      player.resume();
    }
    // No re-fetch needed; SDK event will update state
  }

  // Global spacebar play/pause shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space") {
        const active = document.activeElement;
        const isInput = active && (
          active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          (active as HTMLElement).isContentEditable
        );
        if (!isInput) {
          e.preventDefault();
          togglePlayback();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlayback]);

  // Set volume (0-100)
  const setVolume = (vol: number) => {
    if (player && isReady) {
      player.setVolume(vol / 100)
      setVolumeState(vol)
      setIsMuted(vol === 0)
    }
  }

  // Mute/unmute
  const setMute = (mute: boolean) => {
    if (player && isReady) {
      if (mute) {
        player.setVolume(0)
        setVolumeState(0)
        setIsMuted(true)
      } else {
        player.setVolume(0.5)
        setVolumeState(50)
        setIsMuted(false)
      }
    }
  }

  // Seek to position (seconds)
  const seekTo = (pos: number) => {
    if (player && isReady) {
      player.seek(pos * 1000)
      setPosition(pos)
    }
  }

  const skipToNext = () => {
    if (!player || !isReady) return
    player.nextTrack();
    // No re-fetch needed; SDK event will update state
  }

  const skipToPrevious = () => {
    if (!player || !isReady) return
    player.previousTrack();
    // No re-fetch needed; SDK event will update state
  }

  // Store stable callback functions in a ref to prevent unnecessary re-renders
  const stableCallbacksRef = useRef({
    playTrack,
    playUri,
    togglePlayback,
    skipToNext,
    skipToPrevious,
    setVolume,
    setMute,
    seekTo,
    isAlbumSaved,
    toggleSaveAlbum,
    isPlaylistFollowed,
    toggleFollowPlaylist,
    isArtistFollowed,
    toggleFollowArtist,
    isTrackSaved,
    areTracksSaved,
    toggleSaveTrack,
  }).current

  const contextValue = useMemo(() => ({
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    position,
    duration,
    ...stableCallbacksRef,
  }), [
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    position,
    duration,
  ]);

  return (
    <SpotifyContext.Provider value={contextValue}>

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
