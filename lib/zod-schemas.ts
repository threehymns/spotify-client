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

export const SpotifyImage = z.object({
	url: z.string(),
	height: z.number().nullable(),
	width: z.number().nullable(),
});

export const SpotifyUser = z.object({
	id: z.string(),
	display_name: z.string().optional(),
	external_urls: z.object({
		spotify: z.string(),
	}),
	images: z.array(SpotifyImage).optional(),
});

export const SpotifyArtist = z.object({
	id: z.string(),
	name: z.string(),
	type: z.literal("artist"),
	uri: z.string(),
	images: z.array(SpotifyImage).optional(),
});

// Define Album and ; schemas with z.lazy to handle the circular dependency.
export const SpotifyAlbum: z.ZodType<any> = z.lazy(() =>
	z.object({
		id: z.string(),
		name: z.string(),
		artists: z.array(SpotifyArtist),
		images: z.array(SpotifyImage),
		release_date: z.string(),
		total_tracks: z.number(),
		type: z.literal("album"),
		uri: z.string(),
		tracks: SpotifyPaging(SpotifySimplifiedTrack).optional(),
	}),
);

export const SpotifyTrack: z.ZodType<any> = z.lazy(() =>
	z.object({
		id: z.string(),
		name: z.string(),
		type: z.literal("track"),
		uri: z.string(),
		duration_ms: z.number(),
		artists: z.array(SpotifyArtist),
		album: SpotifyAlbum,
		is_local: z.boolean(),
		popularity: z.number(),
		track_number: z.number(),
		preview_url: z.string().nullable(),
	}),
);

export const SpotifySavedTrack = z.object({
	added_at: z.string(),
	track: SpotifyTrack,
});

export const SpotifySavedAlbum = z.object({
	added_at: z.string(),
	album: SpotifyAlbum,
});

export const SpotifyPlaylistTrack = z.object({
	added_at: z.string(),
	added_by: SpotifyUser,
	is_local: z.boolean(),
	track: SpotifyTrack.nullable(),
});

export const SpotifyPlaylist = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	images: z.array(SpotifyImage).nullable(),
	owner: SpotifyUser,
	tracks: SpotifyPaging(SpotifyPlaylistTrack),
	uri: z.string(),
	public: z.boolean().optional(),
	followers: z.object({ total: z.number() }).optional(),
});

export const SpotifySimplifiedPlaylist = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	images: z.array(SpotifyImage).nullable(),
	owner: SpotifyUser,
	tracks: z.object({ href: z.string(), total: z.number() }),
	uri: z.string(),
});

export const SpotifySimplifiedTrack = z.object({
	artists: z.array(SpotifyArtist),
	available_markets: z.array(z.string()).optional(),
	disc_number: z.number(),
	duration_ms: z.number(),
	explicit: z.boolean(),
	external_urls: z.object({ spotify: z.string() }),
	href: z.string(),
	id: z.string(),
	is_playable: z.boolean().optional(),
	linked_from: z
		.object({
			external_urls: z.object({ spotify: z.string() }),
			href: z.string(),
			id: z.string(),
			type: z.string(),
			uri: z.string(),
		})
		.optional(),
	name: z.string(),
	preview_url: z.string().nullable(),
	track_number: z.number(),
	type: z.literal("track"),
	uri: z.string(),
});
