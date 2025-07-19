import { z } from "zod";

export const SpotifyPaging = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    href: z.string(),
    items: z.array(itemSchema.nullable()),
    limit: z.number(),
    next: z.string().nullable(),
    offset: z.number(),
    previous: z.string().nullable(),
    total: z.number(),
  });

export const SpotifyImageSchema = z.object({
  url: z.string(),
  height: z.number().nullable(),
  width: z.number().nullable(),
});

export const SpotifyUserSchema = z.object({
  id: z.string(),
  display_name: z.string().optional(),
  external_urls: z.object({
    spotify: z.string(),
  }),
  images: z.array(SpotifyImageSchema).optional(),
});

export const SpotifyArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.literal("artist"),
  uri: z.string(),
  images: z.array(SpotifyImageSchema).optional(),
});

// Define Album and Track schemas with z.lazy to handle the circular dependency.
export const SpotifyAlbumSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    artists: z.array(SpotifyArtistSchema),
    images: z.array(SpotifyImageSchema),
    release_date: z.string(),
    total_tracks: z.number(),
    type: z.literal("album"),
    uri: z.string(),
    tracks: SpotifyPaging(SpotifySimplifiedTrackSchema).optional(),
  })
);

export const SpotifyTrackSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    type: z.literal("track"),
    uri: z.string(),
    duration_ms: z.number(),
    artists: z.array(SpotifyArtistSchema),
    album: SpotifyAlbumSchema,
    is_local: z.boolean(),
    popularity: z.number(),
    track_number: z.number(),
    preview_url: z.string().nullable(),
  })
);

export const SpotifySavedTrackSchema = z.object({
  added_at: z.string(),
  track: SpotifyTrackSchema,
});

export const SpotifySavedAlbumSchema = z.object({
  added_at: z.string(),
  album: SpotifyAlbumSchema,
});

export const SpotifyPlaylistTrack = z.object({
  added_at: z.string(),
  added_by: SpotifyUserSchema,
  is_local: z.boolean(),
  track: SpotifyTrackSchema.nullable(),
});

export const SpotifyPlaylistSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  images: z.array(SpotifyImageSchema).nullable(),
  owner: SpotifyUserSchema,
  tracks: SpotifyPaging(SpotifyPlaylistTrack),
  uri: z.string(),
  public: z.boolean().optional(),
  followers: z.object({ total: z.number() }).optional(),
});

export const SpotifySimplifiedPlaylistSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  images: z.array(SpotifyImageSchema).nullable(),
  owner: SpotifyUserSchema,
  tracks: z.object({ href: z.string(), total: z.number() }),
  uri: z.string(),
});

export const SpotifySimplifiedTrackSchema = z.object({
  artists: z.array(SpotifyArtistSchema),
  available_markets: z.array(z.string()).optional(),
  disc_number: z.number(),
  duration_ms: z.number(),
  explicit: z.boolean(),
  external_urls: z.object({ spotify: z.string() }),
  href: z.string(),
  id: z.string(),
  is_playable: z.boolean().optional(),
  linked_from: z.object({ external_urls: z.object({ spotify: z.string() }), href: z.string(), id: z.string(), type: z.string(), uri: z.string() }).optional(),
  name: z.string(),
  preview_url: z.string().nullable(),
  track_number: z.number(),
  type: z.literal("track"),
  uri: z.string(),
});