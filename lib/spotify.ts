import { z } from "zod";
import {
  SpotifyAlbumSchema,
  SpotifyArtistSchema,
  SpotifyPaging,
  SpotifyPlaylistSchema,
  SpotifySimplifiedPlaylistSchema,
  SpotifySavedAlbumSchema,
  SpotifySavedTrackSchema,
  SpotifyTrackSchema,
  SpotifyUserSchema,
} from "@/lib/zod-schemas";

const BASE_URL = "https://api.spotify.com/v1";

export const TimeRangeSchema = z.enum([
  "short_term",
  "medium_term",
  "long_term",
]);

export class SpotifyAPI {
  private authHeaders: Headers;

  constructor(authHeaders: Headers) {
    this.authHeaders = authHeaders;
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {},
    schema: z.ZodType<T>,
  ): Promise<T> {
    const url = endpoint.startsWith("https://")
      ? endpoint
      : `${BASE_URL}${endpoint}`;

    const combinedHeaders = new Headers(this.authHeaders);
    combinedHeaders.set("Content-Type", "application/json");
    if (options.headers) {
      new Headers(options.headers).forEach((value, key) => {
        combinedHeaders.set(key, value);
      });
    }

    const response = await fetch(url, {
      ...options,
      headers: combinedHeaders,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Spotify API error: ${response.status} ${
          response.statusText
        } - ${JSON.stringify(error)}`,
      );
    }

    if (response.status === 204) {
      return null as T;
    }

    const data = await response.json();
    try {
      return schema.parse(data);
    } catch (e) {
      console.error("Zod validation error for endpoint:", endpoint);
      console.error("Data:", JSON.stringify(data, null, 2));
      throw e;
    }
  }

  async getMe() {
    return this.fetch("/me", {}, SpotifyUserSchema);
  }

  async getMyPlaylists(limit = 50) {
    return this.fetch(
      `/me/playlists?limit=${limit}`,
      {},
      SpotifyPaging(SpotifySimplifiedPlaylistSchema),
    );
  }

  async getPlaylist(playlistId: string) {
    return this.fetch(`/playlists/${playlistId}`, {}, SpotifyPlaylistSchema);
  }

  async getMyTopArtists(
    timeRange: z.infer<typeof TimeRangeSchema> = "medium_term",
  ) {
    return this.fetch(
      `/me/top/artists?time_range=${timeRange}`,
      {},
      SpotifyPaging(SpotifyArtistSchema),
    );
  }

  async getMyTopTracks(
    timeRange: z.infer<typeof TimeRangeSchema> = "medium_term",
  ) {
    return this.fetch(
      `/me/top/tracks?time_range=${timeRange}`,
      {},
      SpotifyPaging(SpotifyTrackSchema),
    );
  }

  async getMySavedTracks(limit = 50) {
    return this.fetch(
      `/me/tracks?limit=${limit}`,
      {},
      SpotifyPaging(SpotifySavedTrackSchema),
    );
  }

  async getMySavedAlbums(limit = 50) {
    return this.fetch(
      `/me/albums?limit=${limit}`,
      {},
      SpotifyPaging(SpotifySavedAlbumSchema),
    );
  }

  async getArtist(artistId: string) {
    return this.fetch(`/artists/${artistId}`, {}, SpotifyArtistSchema);
  }

  async getArtistTopTracks(artistId: string) {
    return this.fetch(
      `/artists/${artistId}/top-tracks?market=US`,
      {},
      z.object({ tracks: z.array(SpotifyTrackSchema) }),
    );
  }

  async getRelatedArtists(artistId: string) {
    return this.fetch(
      `/artists/${artistId}/related-artists`,
      {},
      z.object({ artists: z.array(SpotifyArtistSchema) }),
    );
  }

  async getAlbum(albumId: string) {
    return this.fetch(`/albums/${albumId}`, {}, SpotifyAlbumSchema);
  }

  async getTrack(trackId: string) {
    return this.fetch(`/tracks/${trackId}`, {}, SpotifyTrackSchema);
  }

  async getRecommendations(seed: {
    seed_artists?: string;
    seed_tracks?: string;
    seed_genres?: string;
  }) {
    const params = new URLSearchParams(seed);
    return this.fetch(
      `/recommendations?${params.toString()}`,
      {},
      z.object({ tracks: z.array(SpotifyTrackSchema) }),
    );
  }

  async search(query: string, type: string[]) {
    const params = new URLSearchParams({
      q: query,
      type: type.join(","),
    });
    return this.fetch(
      `/search?${params.toString()}`,
      {},
      z.object({
        tracks: SpotifyPaging(SpotifyTrackSchema).optional(),
        artists: SpotifyPaging(SpotifyArtistSchema).optional(),
        albums: SpotifyPaging(SpotifyAlbumSchema).optional(),
        playlists: SpotifyPaging(SpotifySimplifiedPlaylistSchema).optional(),
      }),
    );
  }

  async play(deviceId: string, uri: string) {
    const body: any = {};
    if (uri.startsWith("spotify:track:")) {
      body.uris = [uri];
    } else {
      body.context_uri = uri;
    }

    return this.fetch(
      `/me/player/play?device_id=${deviceId}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
      z.null(),
    );
  }

  async createPlaylist(userId: string, name: string) {
    return this.fetch(
      `/users/${userId}/playlists`,
      {
        method: "POST",
        body: JSON.stringify({ name }),
      },
      SpotifySimplifiedPlaylistSchema,
    );
  }

  async fetchUrl<T>(url: string, schema: z.ZodType<T>): Promise<T> {
    return this.fetch(url, {}, schema);
  }

  async checkSavedAlbums(albumIds: string[]) {
    const params = new URLSearchParams({ ids: albumIds.join(",") });
    return this.fetch(
      `/me/albums/contains?${params.toString()}`,
      {},
      z.array(z.boolean()),
    );
  }

  async saveAlbums(albumIds: string[]) {
    return this.fetch(
      `/me/albums`,
      {
        method: "PUT",
        body: JSON.stringify({ ids: albumIds }),
      },
      z.null(),
    );
  }

  async removeSavedAlbums(albumIds: string[]) {
    return this.fetch(
      `/me/albums`,
      {
        method: "DELETE",
        body: JSON.stringify({ ids: albumIds }),
      },
      z.null(),
    );
  }

  async checkPlaylistFollowed(playlistId: string, userId: string) {
    const params = new URLSearchParams({ ids: userId });
    return this.fetch(
      `/playlists/${playlistId}/followers/contains?${params.toString()}`,
      {},
      z.array(z.boolean()),
    );
  }

  async followPlaylist(playlistId: string) {
    return this.fetch(
      `/playlists/${playlistId}/followers`,
      {
        method: "PUT",
      },
      z.null(),
    );
  }

  async unfollowPlaylist(playlistId: string) {
    return this.fetch(
      `/playlists/${playlistId}/followers`,
      {
        method: "DELETE",
      },
      z.null(),
    );
  }

  async checkFollowingArtists(artistIds: string[]) {
    const params = new URLSearchParams({
      type: "artist",
      ids: artistIds.join(","),
    });
    return this.fetch(
      `/me/following/contains?${params.toString()}`,
      {},
      z.array(z.boolean()),
    );
  }

  async followArtists(artistIds: string[]) {
    return this.fetch(
      `/me/following?type=artist`,
      {
        method: "PUT",
        body: JSON.stringify({ ids: artistIds }),
      },
      z.null(),
    );
  }

  async unfollowArtists(artistIds: string[]) {
    return this.fetch(
      `/me/following?type=artist`,
      {
        method: "DELETE",
        body: JSON.stringify({ ids: artistIds }),
      },
      z.null(),
    );
  }

  async checkSavedTracks(trackIds: string[]) {
    const params = new URLSearchParams({ ids: trackIds.join(",") });
    return this.fetch(
      `/me/tracks/contains?${params.toString()}`,
      {},
      z.array(z.boolean()),
    );
  }

  async saveTracks(trackIds: string[]) {
    return this.fetch(
      `/me/tracks`,
      {
        method: "PUT",
        body: JSON.stringify({ ids: trackIds }),
      },
      z.null(),
    );
  }

  async removeSavedTracks(trackIds: string[]) {
    return this.fetch(
      `/me/tracks`,
      {
        method: "DELETE",
        body: JSON.stringify({ ids: trackIds }),
      },
      z.null(),
    );
  }
}