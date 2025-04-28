"use client"

import { getAccessToken, getCredentials } from "@/lib/auth-helpers"

const BASE_URL = "https://api.spotify.com/v1"

// Helper function to make authenticated API requests
export async function spotifyFetch(endpoint: string, options: RequestInit = {}) {
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
      // Only try to parse error body as JSON if present
      let errorData = { error: "Unknown error" };
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      }
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

    // Only parse JSON if there is content
    if (response.status === 204) {
      // No Content
      console.log(`Spotify API request to ${endpoint} successful (204 No Content)`)
      return null;
    }
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`Spotify API request to ${endpoint} successful`)
      return data;
    } else {
      // No JSON body
      console.log(`Spotify API request to ${endpoint} successful (no JSON body)`)
      return null;
    }
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

// Get a playlist by ID
export async function getPlaylist(playlistId: string) {
  return spotifyFetch(`/playlists/${playlistId}`);
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

// Get an artist's top tracks
export async function getArtistTopTracks(artistId: string, market = 'from_token') {
  return spotifyFetch(`/artists/${artistId}/top-tracks?market=${market}`);
}

// Get an artist's albums
export async function getArtistAlbums(artistId: string, params: Record<string, string> = {}) {
  const search = new URLSearchParams(params).toString();
  return spotifyFetch(`/artists/${artistId}/albums${search ? `?${search}` : ''}`);
}

// Get current user's saved tracks
export async function getUserSavedTracks() {
  return spotifyFetch("/me/tracks");
}

// Get current user's recently played tracks
export async function getRecentlyPlayedTracks() {
  return spotifyFetch("/me/player/recently-played");
}

// Get new releases (albums)
export async function getNewReleases() {
  return spotifyFetch("/browse/new-releases");
}

// Get current user's saved albums
export async function getUserSavedAlbums() {
  return spotifyFetch("/me/albums");
}
