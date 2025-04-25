"use client"

import { getAccessToken, getCredentials } from "@/lib/auth-helpers"

const BASE_URL = "https://api.spotify.com/v1"

// Helper function to make authenticated API requests
async function spotifyFetch(endpoint: string, options: RequestInit = {}) {
  console.log(`Making Spotify API request to: ${endpoint}`)

  const accessToken = await getAccessToken()

  if (!accessToken) {
    console.error("No access token available for API request")
    throw new Error("No access token available")
  }

  const url = endpoint.startsWith("https://") ? endpoint : `${BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      console.error("Spotify API error:", errorData)

      // Check for specific error types
      if (errorData.error?.status === 401) {
        console.log("Authentication error - token might be expired or invalid")
        // Try to refresh the token automatically
        const newToken = await refreshTokenAndRetry()
        if (newToken) {
          // Retry the request with the new token
          return spotifyFetch(endpoint, options)
        }
      }

      throw new Error(errorData.error?.message || "Failed to fetch from Spotify API")
    }

    const data = await response.json()
    console.log(`Spotify API request to ${endpoint} successful`)
    return data
  } catch (error) {
    console.error(`Spotify API request to ${endpoint} failed:`, error)
    throw error
  }
}

// Helper function to refresh token and retry
async function refreshTokenAndRetry() {
  try {
    console.log("Attempting to refresh token for API request...")
    const credentials = await getCredentials()
    if (!credentials) {
      console.error("No credentials available for token refresh")
      return null
    }

    // This will trigger the token refresh logic in auth-helpers.ts
    const newToken = await getAccessToken()
    return newToken
  } catch (error) {
    console.error("Failed to refresh token for retry:", error)
    return null
  }
}

// Get current user's profile
export async function getUserProfile() {
  return spotifyFetch("/me")
}

// Get current user's playlists
export async function getUserPlaylists() {
  return spotifyFetch("/me/playlists")
}

// Create a new playlist
export async function createPlaylist(name: string, description = "") {
  const user = await getUserProfile()
  return spotifyFetch(`/users/${user.id}/playlists`, {
    method: "POST",
    body: JSON.stringify({
      name,
      description,
      public: false,
    }),
  })
}

// Get tracks in a playlist
export async function getPlaylistTracks(playlistId: string) {
  return spotifyFetch(`/playlists/${playlistId}/tracks`)
}

// Add tracks to a playlist
export async function addTracksToPlaylist(playlistId: string, uris: string[]) {
  return spotifyFetch(`/playlists/${playlistId}/tracks`, {
    method: "POST",
    body: JSON.stringify({ uris }),
  })
}

// Remove a track from a playlist
export async function removeTrackFromPlaylist(playlistId: string, uri: string, position: number) {
  return spotifyFetch(`/playlists/${playlistId}/tracks`, {
    method: "DELETE",
    body: JSON.stringify({
      tracks: [{ uri, positions: [position] }],
    }),
  })
}

// Search Spotify
export async function searchSpotify(query: string, types: string[] = ["track", "artist", "album"]) {
  const typeParam = types.join(",")
  return spotifyFetch(`/search?q=${encodeURIComponent(query)}&type=${typeParam}&limit=20`)
}

// Get recommendations based on seed tracks, artists, or genres
export async function getRecommendations(
  seedTracks: string[] = [],
  seedArtists: string[] = [],
  seedGenres: string[] = [],
) {
  const params = new URLSearchParams()

  if (seedTracks.length) params.append("seed_tracks", seedTracks.join(","))
  if (seedArtists.length) params.append("seed_artists", seedArtists.join(","))
  if (seedGenres.length) params.append("seed_genres", seedGenres.join(","))

  return spotifyFetch(`/recommendations?${params.toString()}`)
}

// Get a track
export async function getTrack(trackId: string) {
  return spotifyFetch(`/tracks/${trackId}`)
}

// Get an album
export async function getAlbum(albumId: string) {
  return spotifyFetch(`/albums/${albumId}`)
}

// Get an artist
export async function getArtist(artistId: string) {
  return spotifyFetch(`/artists/${artistId}`)
}
