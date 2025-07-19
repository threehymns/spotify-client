"use client";

import { Clock, Disc, Heart, MoreHorizontal, Play, Share2 } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import type { z } from "zod";
import Loading from "@/components/loading";
import SongListing from "@/components/song-listing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/auth-context";
import { useSpotify } from "@/context/spotify-context";
import { useDominantColorWorker } from "@/hooks/useDominantColorWorker";
import {
	type SpotifyAlbum,
	SpotifyPlaylistTrack,
	type SpotifyTrack,
} from "@/lib/zod-schemas";

export default function AlbumPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { play, isAlbumSaved, toggleSaveAlbum } = useSpotify();
	const { id } = use(params);
	const { api } = useAuth();
	const [album, setAlbum] = useState<z.infer<typeof SpotifyAlbum> | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isLiked, setIsLiked] = useState(false);
	const [saving, setSaving] = useState(false);
	const imgUrl = album?.images?.[0]?.url;
	const { color } = useDominantColorWorker(id, imgUrl);

	// Format duration
	const totalDuration = useMemo(() => {
		if (!album?.tracks?.items) return "0 min";
		const totalMs = album.tracks.items.reduce(
			(acc: number, track: z.infer<typeof SpotifyTrack>) =>
				acc + (track.duration_ms || 0),
			0,
		);
		const minutes = Math.floor(totalMs / 60000);
		const hours = Math.floor(minutes / 60);
		return hours > 0 ? `${hours} hr ${minutes % 60} min` : `${minutes} min`;
	}, [album]);

	useEffect(() => {
		if (!api) return;
		let cancelled = false;
		async function fetchAlbum() {
			setLoading(true);
			setError(null);
			try {
				const data = await api?.getAlbum(id);
				if (!cancelled) {
					setAlbum(data);
					const saved = await isAlbumSaved(data.id);
					setIsLiked(saved);
				}
			} catch (e) {
				if (!cancelled) {
					console.error("Failed to load album:", e);
					setAlbum(null);
					setError("Failed to load album.");
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		fetchAlbum();
		return () => {
			cancelled = true;
		};
	}, [id, isAlbumSaved, api]);

	if (loading) return <Loading />;

	if (error)
		return (
			<div className="max-w-5xl mx-auto p-8">
				<div className="bg-red-900/20 border border-red-900/50 rounded-lg p-6 text-red-400 text-center flex flex-col items-center">
					<span className="mb-2 text-4xl">⚠️</span>
					<h3 className="text-xl font-semibold mb-1">Error Loading Album</h3>
					<p>{error}</p>
				</div>
			</div>
		);

	if (!album)
		return (
			<div className="max-w-5xl mx-auto p-8">
				<div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 text-zinc-400 text-center">
					Album not found.
				</div>
			</div>
		);

	// Get album release year
	const releaseYear = album?.release_date
		? new Date(album.release_date).getFullYear()
		: null;

	return (
		<div className="min-h-screen">
			{/* Hero section with album info */}
			<div className="relative">
				{/* Gradient background */}
				<div
					className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-zinc-900/60 to-black z-0"
					style={{
						backgroundImage: imgUrl
							? `linear-gradient(to bottom, rgba(88, 28, 135, 0.5), rgba(0, 0, 0, 0.9)), url(${imgUrl})`
							: "linear-gradient(to bottom, rgba(88, 28, 135, 0.3), rgba(0, 0, 0, 0.95))",
						backgroundSize: "cover",
						backgroundPosition: "center",
						filter: "blur(30px)",
						opacity: 0.6,
					}}
				/>

				<div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
					<div className="flex flex-col md:flex-row items-center md:items-end gap-8">
						<motion.div
							layoutId={`album-cover-${album.id}`}
							className="w-52 h-52 md:w-60 md:h-60 flex-shrink-0 shadow-2xl rounded-md overflow-hidden"
							initial={{ opacity: 0.8, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5 }}
						>
							<img
								src={imgUrl || "/placeholder.svg?height=240&width=240"}
								alt={album.name}
								className="w-full h-full object-cover"
							/>
						</motion.div>
						<div className="flex flex-col items-center md:items-start text-center md:text-left">
							<Badge
								variant="outline"
								className="mb-2 uppercase text-xs font-semibold tracking-wide text-white bg-white/10 backdrop-blur-sm border-white/20 px-3 py-1"
							>
								<Disc className="w-3 h-3 mr-1" /> Album
							</Badge>
							<motion.h1
								className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 tracking-tight"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.1 }}
							>
								{album.name}
							</motion.h1>
							<motion.div
								className="text-zinc-300 mb-3 max-w-2xl"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.2 }}
							>
								{album.artists?.map(
									(a: z.infer<typeof SpotifyTrack>, i: number) => (
										<span key={a.id}>
											<Link
												href={`/artists/${a.id}`}
												className="hover:underline text-white font-medium"
											>
												{a.name}
											</Link>
											{i < album.artists.length - 1 && ", "}
										</span>
									),
								)}
								{album.label && (
									<span className="ml-2 text-zinc-400">• {album.label}</span>
								)}
								{releaseYear && (
									<span className="ml-2 text-zinc-400">• {releaseYear}</span>
								)}
							</motion.div>
							<motion.div
								className="text-zinc-400 text-sm flex items-center flex-wrap gap-x-2 mb-4 justify-center md:justify-start"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 0.5, delay: 0.3 }}
							>
								<span>
									{album.total_tracks || album.tracks?.items?.length || 0}{" "}
									tracks
								</span>
								{album.tracks?.items?.length > 0 && (
									<>
										<span>•</span>
										<span>{totalDuration}</span>
									</>
								)}
							</motion.div>
							<motion.div
								className="flex items-center gap-3 flex-wrap justify-center md:justify-start"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.4 }}
							>
								<Button
									onClick={() => play(album.uri)}
									size="lg"
									className="bg-green-500 hover:bg-green-600 text-white px-8"
									style={{
										backgroundColor: color
											? `rgb(${color[0]},${color[1]},${color[2]})`
											: "",
										borderColor: color
											? `rgb(${color[0]},${color[1]},${color[2]})`
											: "",
									}}
								>
									<Play className="h-5 w-5 mr-2 fill-current" /> Play
								</Button>
								<Button
									variant="outline"
									size="icon"
									className="rounded-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
									disabled={saving}
									onClick={async () => {
										setSaving(true);
										try {
											await toggleSaveAlbum(id, !isLiked);
											setIsLiked((prev) => !prev);
										} catch {
											try {
												setIsLiked(await isAlbumSaved(id));
											} catch (error) {
												console.error(
													"Failed to check album save status:",
													error,
												);
												// Keep the previous state if we can't verify
											}
										} finally {
											setSaving(false);
										}
									}}
								>
									<Heart
										className="h-5 w-5"
										fill={isLiked ? "currentColor" : "none"}
									/>
								</Button>
								<Button
									variant="outline"
									size="icon"
									className="rounded-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
								>
									<Share2 className="h-5 w-5" />
								</Button>
								<Button
									variant="outline"
									size="icon"
									className="rounded-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
								>
									<MoreHorizontal className="h-5 w-5" />
								</Button>
							</motion.div>
						</div>
					</div>
				</div>
			</div>

			{/* Track listing */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="bg-zinc-900/20 backdrop-blur-sm rounded-xl overflow-hidden border border-zinc-800">
					<div className="p-4 pb-0 flex items-center justify-between">
						<h2 className="text-xl font-bold text-white flex items-center gap-2">
							<div className="p-1.5 bg-purple-900/50 rounded-lg border border-purple-700/30">
								<Disc className="h-4 w-4 text-purple-300" />
							</div>
							Tracks
						</h2>
						<Button variant="ghost" className="text-zinc-400 hover:text-white">
							<Clock className="h-4 w-4" />
						</Button>
					</div>
					<ScrollArea className="p-4 max-h-[calc(100vh-400px)]">
						<SongListing
							tracks={
								album.tracks?.items?.map(
									(track: z.infer<typeof SpotifyTrack>) => ({
										id: track.id,
										name: track.name,
										uri: track.uri,
										duration_ms: track.duration_ms,
										artists: track.artists,
										album: album,
									}),
								) || []
							}
						/>
					</ScrollArea>
				</div>
			</div>
		</div>
	);
}
