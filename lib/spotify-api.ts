"use client"

import { getAccessToken } from "@/lib/auth-helpers"

// Spotify API types
export interface SpotifyImage {
  url: string
  height: number | null
  width: number | null
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  images: Array<{ url: string }>;
  owner: { id: string; display_name?: string };
  tracks: { total: number };
  uri: string;
}

export interface SpotifyArtist {
  id: string
  name: string
  type: 'artist'
  uri: string
}

export interface SpotifyTrack {
  id: string
  name: string
  type: 'track'
  uri: string
  duration_ms: number
  artists: SpotifyArtist[]
  album: SpotifyAlbum
  is_local: boolean
  popularity: number
  track_number: number
  preview_url: string | null
}

export interface SpotifyAlbum {
  id: string
  name: string
  artists: SpotifyArtist[]
  images: SpotifyImage[]
  release_date: string
  total_tracks: number
  type: 'album'
  uri: string
}

export interface SavedAlbum {
  added_at: string
  album: SpotifyAlbum
}

export interface SpotifyPaging<T> {
  href: string
  items: T[]
  limit: number
  next: string | null
  offset: number
  previous: string | null
  total: number
}

export interface SpotifyPlaylistResponse extends SpotifyPaging<SpotifyPlaylist> {}

export async function getUserPlaylists(signal?: AbortSignal): Promise<SpotifyPlaylistResponse> {
  return spotifyFetch("/me/playlists", { signal }) as Promise<SpotifyPlaylistResponse>
}

export interface SavedTrack {
  added_at: string
  track: SpotifyTrack
}

export interface SpotifyRecommendationsResponse {
  tracks: SpotifyTrack[]
  seeds: Array<{
    afterFilteringSize: number
    afterRelinkingSize: number
    href: string
    id: string
    initialPoolSize: number
    type: string
  }>
}

const BASE_URL = "https://api.spotify.com/v1"

// Constants for Spotify API limits
export const SPOTIFY_API_LIMITS = {
  TRACKS: 50,
  ALBUMS: 50,
  ARTISTS: 50,
  PLAYLIST_ITEMS: 100
} as const;

export class SpotifyError extends Error {
  constructor(error: {
    status: number;
    message: string;
  }) {
    super(error.message);
    this.name = 'SpotifyError';
    this.status = error.status;
  }

  status: number;
}

// Helper function to make authenticated API requests
export function spotifyFetch<T>(
  endpoint: string,
  options?: RequestInit & { _retryCount?: number; signal?: AbortSignal },
): Promise<T>;

export function spotifyFetch(
  endpoint: string,
  options?: RequestInit & { _retryCount?: number; signal?: AbortSignal },
): Promise<void>;

export async function spotifyFetch<T = unknown>(
  endpoint: string,
  options: RequestInit & { _retryCount?: number; signal?: AbortSignal } = {},
): Promise<T | void> {
  console.log(`Making Spotify API request to: ${endpoint}`)

  const accessToken = await getAccessToken()

  if (!accessToken) {
    console.error("No access token available for API request")
    throw new Error("No access token available")
  }

  const url = endpoint.startsWith("https://") ? endpoint : `${BASE_URL}${endpoint}`

  try {
    const { _retryCount, signal, headers: optHeaders, ...fetchInit } = options

    const response = await fetch(url, {
      ...fetchInit,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...optHeaders,
      },
      signal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));

      // Check for specific error types
      if (typeof errorData.error !== 'string' && errorData.error?.status === 401 && (options._retryCount ?? 0) < 1) {
        console.log("Authentication error - token might be expired or invalid")
        // Try to refresh the token automatically
        const newToken = await refreshTokenAndRetry()
        if (newToken) {
          // Retry the request with the new token and increment retry counter
          return spotifyFetch(endpoint, { ...options, _retryCount: (options._retryCount ?? 0) + 1 })
        }
      }

      const errorMessage = typeof errorData.error === 'string'
        ? errorData.error
        : errorData.error?.message || "Failed to fetch from Spotify API";

      throw new SpotifyError(errorData);
    }

    // Only parse JSON if there is content
    if (response.status === 204) {
      // No Content
      console.log(`Spotify API request to ${endpoint} successful (204 No Content)`)
      return undefined;
    }
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      if (['DELETE', 'POST', 'PUT'].includes(options.method?.toUpperCase() ?? '')) {
        return undefined as T | void;
      }

      const data = await response.json();
      console.log(`Spotify API request to ${endpoint} successful`)
      return data as T;
    } else {
      // No JSON body
      console.log(`Spotify API request to ${endpoint} successful (no JSON body)`)
      return undefined;
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
    // Force refresh token to ensure we get a fresh token
    const newToken = await getAccessToken(true)
    if (!newToken) {
      console.error("Failed to obtain new access token")
      return null
    }
    return newToken
  } catch (error) {
    console.error("Failed to refresh token for retry:", error)
    return null
  }
}

// Get current user's profile
export interface UserProfile {
  id: string;
  display_name: string;
  external_urls: {
    spotify: string;
  };
}

export async function getUserProfile(
  signal?: AbortSignal
): Promise<UserProfile> {
  return spotifyFetch('/me', { signal });
}

// Create a new playlist
export async function createPlaylist(name: string, description = "") {
  const user = await getUserProfile()
  if (!user || !user.id) {
    throw new Error('Failed to get user profile')
  }
  return spotifyFetch(`/users/${encodeURIComponent(user.id)}/playlists`, {
    method: "POST",
    body: JSON.stringify({
      name,
      description,
      public: false,
    }),
  })
}

/**
 * Get tracks in a playlist with pagination support
 * @param playlistId - The Spotify playlist ID
 * @param limit - Maximum number of tracks to return (1-100, default: 100)
 * @param offset - The index of the first track to return
 * @returns Promise resolving to SpotifyPaging<SpotifyTrack>
 */
export async function getPlaylistTracks(
  playlistId: string,
  limit: number = SPOTIFY_API_LIMITS.PLAYLIST_ITEMS,
  offset: number = 0,
  signal?: AbortSignal
): Promise<SpotifyPaging<SpotifyTrack>> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    market: 'from_token'
  });
  
  return spotifyFetch(`/playlists/${encodeURIComponent(playlistId)}/tracks?${params}`, { signal });
}

// Get a playlist by ID
export async function getPlaylist(
  playlistId: string,
  signal?: AbortSignal
): Promise<SpotifyPlaylist> {
  return spotifyFetch(`/playlists/${encodeURIComponent(playlistId)}`, { signal });
}

// Add tracks to a playlist
export async function addTracksToPlaylist(playlistId: string, uris: string[]) {
  if (uris.length > SPOTIFY_API_LIMITS.PLAYLIST_ITEMS) {
    throw new Error(`Spotify API limits playlist items to ${SPOTIFY_API_LIMITS.PLAYLIST_ITEMS} items per request`);
  }
  return spotifyFetch(`/playlists/${encodeURIComponent(playlistId)}/tracks`, {
    method: "POST",
    body: JSON.stringify({ uris }),
  })
}

// Remove a track from a playlist
export async function removeTrackFromPlaylist(playlistId: string, uri: string, position: number) {
  return spotifyFetch(`/playlists/${encodeURIComponent(playlistId)}/tracks`, {
    method: "DELETE",
    body: JSON.stringify({
      tracks: [{ uri, positions: [position] }],
    }),
  })
}

// Search Spotify
export async function searchSpotify(query: string, types: string[] = ["track", "artist", "album"]) {
  const typeParam = types.join(",")
  return spotifyFetch(`/search?q=${encodeURIComponent(query)}&type=${encodeURIComponent(typeParam)}&limit=20`)
}

// Get recommendations based on seed tracks, artists, or genres
export async function getRecommendations(
  seedTracks: string[] = [],
  seedArtists: string[] = [],
  seedGenres: string[] = [],
  signal?: AbortSignal
) {
  const params = new URLSearchParams()

  if (seedTracks.length) params.append("seed_tracks", seedTracks.join(","))
  if (seedArtists.length) params.append("seed_artists", seedArtists.join(","))
  if (seedGenres.length) params.append("seed_genres", seedGenres.join(","))

  return spotifyFetch<SpotifyRecommendationsResponse>(`/recommendations?${params.toString()}`, { signal })
}

// Get a track
export async function getTrack(trackId: string, signal?: AbortSignal) {
  return spotifyFetch<SpotifyTrack>(`/tracks/${encodeURIComponent(trackId)}`, { signal })
}

// Get an album
export async function getAlbum(albumId: string, signal?: AbortSignal) {
  return spotifyFetch<SpotifyAlbum>(`/albums/${encodeURIComponent(albumId)}`, { signal })
}

// Get an artist
export async function getArtist(artistId: string, signal?: AbortSignal) {
  return spotifyFetch<SpotifyArtist>(`/artists/${encodeURIComponent(artistId)}`, { signal })
}

// Get an artist's top tracks
export async function getArtistTopTracks(artistId: string, market = 'from_token', signal?: AbortSignal) {
  return spotifyFetch<{ tracks: SpotifyTrack[] }>(`/artists/${encodeURIComponent(artistId)}/top-tracks?market=${encodeURIComponent(market)}`, { signal })
}

// Get an artist's albums
export async function getArtistAlbums(artistId: string, params: Record<string, string> = {}, signal?: AbortSignal) {
  const searchParams = new URLSearchParams(params);
  return spotifyFetch<SpotifyPaging<SpotifyAlbum>>(`/artists/${encodeURIComponent(artistId)}/albums${searchParams.toString() ? `?${searchParams.toString()}` : ''}`, { signal })
}

// Get current user's saved tracks
export async function getUserSavedTracks(signal?: AbortSignal) {
  return spotifyFetch<SpotifyPaging<SavedTrack>>("/me/tracks", { signal })
}

/**
 * Checks if tracks are saved in the user's library, handling batches of up to 50 tracks at a time.
 * Processes batches sequentially with a delay between requests to respect rate limits.
 * @param trackIds - Array of track IDs to check (can be any length)
 * @returns Array of booleans indicating if each track is saved, in the same order as input track IDs
 */
export async function checkSavedTracks(trackIds: string[], signal?: AbortSignal) {
  if (!trackIds.length) return [];
  
  // Split into batches of 50 IDs each
  const batches: string[][] = [];
  const batchSize = SPOTIFY_API_LIMITS.TRACKS;
  for (let i = 0; i < trackIds.length; i += batchSize) {
    batches.push(trackIds.slice(i, i + batchSize));
  }

  // Process batches sequentially with delay
  const batchResults: boolean[][] = [];
  for (const batch of batches) {
    const encodedIds = batch.map(id => encodeURIComponent(id)).join(',');
    const result = await spotifyFetch<boolean[]>(`/me/tracks/contains?ids=${encodedIds}`, { signal });
    batchResults.push(result);
    // Add delay between batches to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 100)); // 10 requests per second
  }

  return batchResults.flat();
}

// Save tracks to library
export async function saveTracks(trackIds: string[], signal?: AbortSignal) {
  if (!trackIds.length) return;
  if (trackIds.length > SPOTIFY_API_LIMITS.TRACKS) {
    throw new Error(`Spotify API limits track ID requests to ${SPOTIFY_API_LIMITS.TRACKS} IDs`);
  }
  const encodedIds = trackIds.map(id => encodeURIComponent(id)).join(',');
  return spotifyFetch(`/me/tracks?ids=${encodedIds}`, {
    method: "PUT",
    signal
  });
}

// Remove saved tracks from library
export async function removeSavedTracks(trackIds: string[], signal?: AbortSignal) {
  if (!trackIds.length) return;
  if (trackIds.length > SPOTIFY_API_LIMITS.TRACKS) {
    throw new Error(`Spotify API limits track ID requests to ${SPOTIFY_API_LIMITS.TRACKS} IDs`);
  }
  const encodedIds = trackIds.map(id => encodeURIComponent(id)).join(',');
  return spotifyFetch(`/me/tracks?ids=${encodedIds}`, {
    method: "DELETE",
    signal
  });
}

// Get current user's recently played tracks
export async function getRecentlyPlayedTracks(signal?: AbortSignal) {
  return spotifyFetch<{ items: { track: SpotifyTrack }[] }>(`/me/player/recently-played`, { signal })
}

// Get new releases (albums)
export async function getNewReleases(signal?: AbortSignal) {
  return spotifyFetch<{ albums: SpotifyPaging<SpotifyAlbum> }>(`/browse/new-releases`, { signal })
}

// Get current user's saved albums
export async function getUserSavedAlbums(signal?: AbortSignal) {
  return spotifyFetch<SpotifyPaging<SavedAlbum>>(`/me/albums`, { signal })
}

// Check if albums are saved
export async function checkSavedAlbums(albumIds: string[], signal?: AbortSignal) {
  if (!albumIds.length) return [];
  if (albumIds.length > SPOTIFY_API_LIMITS.ALBUMS) {
    throw new Error(`Spotify API limits album ID requests to ${SPOTIFY_API_LIMITS.ALBUMS} IDs`);
  }
  const encodedIds = albumIds.map(id => encodeURIComponent(id)).join(',');
  return spotifyFetch<boolean[]>(`/me/albums/contains?ids=${encodedIds}`, { signal });
}

// Save albums to library
export async function saveAlbums(albumIds: string[], signal?: AbortSignal) {
  if (!albumIds.length) return;
  if (albumIds.length > SPOTIFY_API_LIMITS.ALBUMS) {
    throw new Error(`Spotify API limits album ID requests to ${SPOTIFY_API_LIMITS.ALBUMS} IDs`);
  }
  const encodedIds = albumIds.map(id => encodeURIComponent(id)).join(',');
  return spotifyFetch(`/me/albums?ids=${encodedIds}`, {
    method: "PUT",
    signal
  });
}

// Remove saved albums from library
export async function removeSavedAlbums(albumIds: string[], signal?: AbortSignal) {
  if (!albumIds.length) return;
  if (albumIds.length > SPOTIFY_API_LIMITS.ALBUMS) {
    throw new Error(`Spotify API limits album ID requests to ${SPOTIFY_API_LIMITS.ALBUMS} IDs`);
  }
  const encodedIds = albumIds.map(id => encodeURIComponent(id)).join(',');
  return spotifyFetch(`/me/albums?ids=${encodedIds}`, {
    method: "DELETE",
    signal
  });
}

// Check if users follow a playlist
export async function checkPlaylistFollowed(playlistId: string, userIds: string[], signal?: AbortSignal) {
  if (!userIds.length) return [];
  if (userIds.length > 5) {
    throw new Error("Spotify API limits user ID requests to 5 IDs");
  }
  const encodedIds = userIds.map(id => encodeURIComponent(id)).join(',');
  return spotifyFetch<boolean[]>(`/playlists/${playlistId}/followers/contains?ids=${encodedIds}`, { signal })
}

// Follow a playlist
export async function followPlaylist(playlistId: string, signal?: AbortSignal) {
  return spotifyFetch(`/playlists/${playlistId}/followers`, {
    method: "PUT",
    signal
  });
}

// Unfollow a playlist
export async function unfollowPlaylist(playlistId: string, signal?: AbortSignal) {
  return spotifyFetch(`/playlists/${playlistId}/followers`, {
    method: "DELETE",
    signal
  });
}

// Check if user follows artists
export async function checkFollowingArtists(artistIds: string[], signal?: AbortSignal) {
  if (!artistIds.length) return [];
  if (artistIds.length > SPOTIFY_API_LIMITS.ARTISTS) {
    throw new Error(`Spotify API limits artist ID requests to ${SPOTIFY_API_LIMITS.ARTISTS} IDs`);
  }
  const encodedIds = artistIds.map(id => encodeURIComponent(id)).join(',');
  return spotifyFetch<boolean[]>(`/me/following/contains?type=artist&ids=${encodedIds}`, { signal })
}

// Follow artists
export async function followArtists(artistIds: string[], signal?: AbortSignal) {
  if (!artistIds.length) return;
  if (artistIds.length > SPOTIFY_API_LIMITS.ARTISTS) {
    throw new Error(`Spotify API limits artist ID requests to ${SPOTIFY_API_LIMITS.ARTISTS} IDs`);
  }
  const encodedIds = artistIds.map(id => encodeURIComponent(id)).join(',');
  return spotifyFetch(`/me/following?type=artist&ids=${encodedIds}`, {
    method: "PUT"
  });
}

// Unfollow artists
export async function unfollowArtists(artistIds: string[]) {
  if (!artistIds.length) return;
  if (artistIds.length > SPOTIFY_API_LIMITS.ARTISTS) {
    throw new Error(`Spotify API limits artist ID requests to ${SPOTIFY_API_LIMITS.ARTISTS} IDs`);
  }
  const encodedIds = artistIds.map(id => encodeURIComponent(id)).join(',');
  return spotifyFetch(`/me/following?type=artist&ids=${encodedIds}`, {
    method: "DELETE"
  });
}

// Check if user follows a single artist
export async function isFollowingArtist(artistId: string): Promise<boolean> {
  const result = await checkFollowingArtists([artistId]);
  if (!Array.isArray(result) || result.length === 0) {
    return false;
  }
  return result[0];
}

// Toggle follow status for a single artist
export async function toggleFollowArtist(artistId: string, follow: boolean) {
  if (follow) {
    return followArtists([artistId]);
  } else {
    return unfollowArtists([artistId]);
  }
}

/**
 * Fetches all paginated items from a Spotify endpoint that follows the paging pattern
 * @param initialUrl - The initial endpoint URL to fetch from
 * @param delayBetweenRequests - Minimum time (ms) between requests to respect rate limits (default: 500ms)
 * @returns Promise resolving to complete collection of all items across all pages
 */
export async function getAllPaginatedItems<T>(
  initialUrl: string,
  delayBetweenRequests: number = 500
): Promise<T[]> {
  let url: string | null = initialUrl;
  const allItems: T[] = [];
  
  while (url) {
    const response: SpotifyPaging<T> = await spotifyFetch(url);
    allItems.push(...response.items);
    
    if (response.next) {
      url = response.next;
      // Respect rate limits by waiting before next request
      await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
    } else {
      url = null;
    }
  }
  
  return allItems;
}
