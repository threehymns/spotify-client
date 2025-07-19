import { z } from "zod";
import {
  SpotifyAlbum,
  SpotifyArtist,
  SpotifyPaging,
  SpotifyPlaylist,
  SpotifySimplifiedPlaylist,
  SpotifySavedAlbum,
  SpotifySavedTrack,
  SpotifyTrack,
  SpotifyUser,
} from "@/lib/zod-schemas";

const BASE_URL = "https://api.spotify.com/v1";

export const TimeRange = z.enum([
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

  private async batchRequest<T>(
    ids: string[],
    requestFn: (chunk: string[]) => Promise<T>,
    chunkSize = 50,
  ): Promise<T[]> {
    const promises: Promise<T>[] = [];
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      promises.push(requestFn(chunk));
    }
    return Promise.all(promises);
  }

  async getMe() {
    return this.fetch("/me", {}, SpotifyUser);
  }

  async getMyPlaylists(limit = 50) {
    return this.fetch(
      `/me/playlists?limit=${limit}`,
      {},
      SpotifyPaging(SpotifySimplifiedPlaylist),
    );
  }

  async getPlaylist(playlistId: string) {
    return this.fetch(`/playlists/${playlistId}`, {}, SpotifyPlaylist);
  }

  async getMyTopArtists(
    timeRange: z.infer<typeof TimeRange> = "medium_term",
  ) {
    return this.fetch(
      `/me/top/artists?time_range=${timeRange}`,
      {},
      SpotifyPaging(SpotifyArtist),
    );
  }

  async getMyTopTracks(
    timeRange: z.infer<typeof TimeRange> = "medium_term",
  ) {
    return this.fetch(
      `/me/top/tracks?time_range=${timeRange}`,
      {},
      SpotifyPaging(SpotifyTrack),
    );
  }

  async getMySavedTracks(limit = 50) {
    return this.fetch(
      `/me/tracks?limit=${limit}`,
      {},
      SpotifyPaging(SpotifySavedTrack),
    );
  }

  async getMySavedAlbums(limit = 50) {
    return this.fetch(
      `/me/albums?limit=${limit}`,
      {},
      SpotifyPaging(SpotifySavedAlbum),
    );
  }

  async getArtist(artistId: string) {
    return this.fetch(`/artists/${artistId}`, {}, SpotifyArtist);
  }

  async getArtistTopTracks(artistId: string) {
    return this.fetch(
      `/artists/${artistId}/top-tracks?market=US`,
      {},
      z.object({ tracks: z.array(SpotifyTrack) }),
    );
  }

  async getRelatedArtists(artistId: string) {
    return this.fetch(
      `/artists/${artistId}/related-artists`,
      {},
      z.object({ artists: z.array(SpotifyArtist) }),
    );
  }

  async getAlbum(albumId: string) {
    return this.fetch(`/albums/${albumId}`, {}, SpotifyAlbum);
  }

  async getTrack(trackId: string) {
    return this.fetch(`/tracks/${trackId}`, {}, SpotifyTrack);
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
      z.object({ tracks: z.array(SpotifyTrack) }),
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
        tracks: SpotifyPaging(SpotifyTrack).optional(),
        artists: SpotifyPaging(SpotifyArtist).optional(),
        albums: SpotifyPaging(SpotifyAlbum).optional(),
        playlists: SpotifyPaging(SpotifySimplifiedPlaylist).optional(),
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
      SpotifySimplifiedPlaylist,
    );
  }

  async fetchUrl<T>(url: string, schema: z.ZodType<T>): Promise<T> {
    return this.fetch(url, {}, schema);
  }

  async checkSavedAlbums(albumIds: string[]) {
    const results = await this.batchRequest(albumIds, (chunk) => {
      const params = new URLSearchParams({ ids: chunk.join(",") });
      return this.fetch(
        `/me/albums/contains?${params.toString()}`,
        {},
        z.array(z.boolean()),
      );
    });
    return results.flat();
  }

  async saveAlbums(albumIds: string[]) {
    await this.batchRequest(albumIds, (chunk) =>
      this.fetch(
        `/me/albums`,
        {
          method: "PUT",
          body: JSON.stringify({ ids: chunk }),
        },
        z.null(),
      ),
    );
  }

  async removeSavedAlbums(albumIds: string[]) {
    await this.batchRequest(albumIds, (chunk) =>
      this.fetch(
        `/me/albums`,
        {
          method: "DELETE",
          body: JSON.stringify({ ids: chunk }),
        },
        z.null(),
      ),
    );
  }

  async checkPlaylistFollowed(playlistId: string, userIds: string[]) {
    const results = await this.batchRequest(userIds, (chunk) => {
      const params = new URLSearchParams({ ids: chunk.join(",") });
      return this.fetch(
        `/playlists/${playlistId}/followers/contains?${params.toString()}`,
        {},
        z.array(z.boolean()),
      );
    });
    return results.flat();
  }

  async followPlaylist(playlistId: string) {
    return this.fetch(
      `/playlists/${playlistId}/followers`,
      {
        method: "PUT",
        body: JSON.stringify({ public: false }),
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
    const results = await this.batchRequest(artistIds, (chunk) => {
      const params = new URLSearchParams({
        type: "artist",
        ids: chunk.join(","),
      });
      return this.fetch(
        `/me/following/contains?${params.toString()}`,
        {},
        z.array(z.boolean()),
      );
    });
    return results.flat();
  }

  async followArtists(artistIds: string[]) {
    await this.batchRequest(artistIds, (chunk) =>
      this.fetch(
        `/me/following?type=artist`,
        {
          method: "PUT",
          body: JSON.stringify({ ids: chunk }),
        },
        z.null(),
      ),
    );
  }

  async unfollowArtists(artistIds: string[]) {
    await this.batchRequest(artistIds, (chunk) =>
      this.fetch(
        `/me/following?type=artist`,
        {
          method: "DELETE",
          body: JSON.stringify({ ids: chunk }),
        },
        z.null(),
      ),
    );
  }

  async checkSavedTracks(trackIds: string[]) {
    const results = await this.batchRequest(trackIds, (chunk) => {
      const params = new URLSearchParams({ ids: chunk.join(",") });
      return this.fetch(
        `/me/tracks/contains?${params.toString()}`,
        {},
        z.array(z.boolean()),
      );
    });
    return results.flat();
  }

  async saveTracks(trackIds: string[]) {
    await this.batchRequest(trackIds, (chunk) =>
      this.fetch(
        `/me/tracks`,
        {
          method: "PUT",
          body: JSON.stringify({ ids: chunk }),
        },
        z.null(),
      ),
    );
  }

  async removeSavedTracks(trackIds: string[]) {
    await this.batchRequest(trackIds, (chunk) =>
      this.fetch(
        `/me/tracks`,
        {
          method: "DELETE",
          body: JSON.stringify({ ids: chunk }),
        },
        z.null(),
      ),
    );
  }
}
