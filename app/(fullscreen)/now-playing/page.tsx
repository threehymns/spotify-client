"use client";

import {
	Minimize,
	Pause,
	Play,
	SkipBack,
	SkipForward,
	Volume2,
	VolumeX,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import MotionAlbumArt, { MotionButton } from "@/components/motion-components";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import UniversalContextMenu from "@/components/universal-context-menu";
import { useSpotify } from "@/context/spotify-context";

export default function NowPlayingPage() {
	const {
		currentTrack,
		isPlaying,
		togglePlayback,
		skipToNext,
		skipToPrevious,
		setVolume,
		setMute,
		seekTo,
		volume,
		isMuted,
		position,
		duration,
	} = useSpotify();
	const router = useRouter();

	// ESC key to go back
	useEffect(() => {
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				router.back();
			}
		};
		window.addEventListener("keydown", handleEsc);
		return () => window.removeEventListener("keydown", handleEsc);
	}, [router]);

	// Show controls on mouse move
	const [showControls, setShowControls] = useState(true);
	const hideTimeout = useRef<NodeJS.Timeout | null>(null);

	const hasAnimatedOnce = useRef(false);

	useEffect(() => {
		const handleMouseMove = () => {
			setShowControls(true);
			if (hideTimeout.current) clearTimeout(hideTimeout.current);
			hideTimeout.current = setTimeout(() => setShowControls(false), 2500);
		};
		window.addEventListener("mousemove", handleMouseMove);
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			if (hideTimeout.current) clearTimeout(hideTimeout.current);
		};
	}, []);

	// Mark that the first layout animation has occurred
	useEffect(() => {
		hasAnimatedOnce.current = true;
	}, []);

	// Always show player controls, even if nothing is playing
	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden">
			{/* Animated background */}
			<UniversalContextMenu
				type="track"
				id={currentTrack?.id || ""}
				albumId={currentTrack?.album.id || ""}
				artists={currentTrack?.artists || []}
			>
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.7 }}
					className="absolute inset-0 w-full h-full z-0 saturate-150"
				>
					{currentTrack ? (
						currentTrack.artists &&
						currentTrack.artists[0]?.images?.[0]?.url ? (
							<img
								src={currentTrack.artists[0].images[0].url}
								alt={currentTrack.artists[0].name}
								className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110"
								style={{ filter: "brightness(0.4) blur(40px)" }}
							/>
						) : currentTrack.album?.images?.[0]?.url ? (
							<img
								src={currentTrack.album.images[0].url}
								alt={currentTrack.album.name}
								className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110"
								style={{ filter: "brightness(0.4) blur(40px)" }}
							/>
						) : (
							<div className="absolute inset-0 w-full h-full bg-gradient-to-b from-black to-zinc-900" />
						)
					) : (
						<div className="absolute inset-0 w-full h-full bg-gradient-to-b from-black to-zinc-900" />
					)}
					{/* Overlay for readability */}
					<div className="absolute inset-0 bg-black/60" />
				</motion.div>
			</UniversalContextMenu>

			{/* Album Art */}
			<motion.div
				animate={{
					opacity: 1,
					y: showControls ? 0 : 30,
					scale: showControls ? 1 : 1.6,
				}}
				transition={{
					delay: showControls ? 0 : 0.18,
				}}
				className="mb-8 z-20"
			>
				<MotionAlbumArt
					src={
						currentTrack?.album?.images[0]?.url ||
						"/placeholder.svg?height=240&width=240"
					}
					alt={currentTrack?.album?.name || "No album"}
					width={240}
					height={240}
					className={`rounded-xl shadow-lg ${!currentTrack ? "opacity-60 grayscale" : ""}`}
					layoutId="now-playing-album-art"
				/>
			</motion.div>
			{/* Track info */}
			<motion.div
				animate={{
					opacity: 1,
					y: showControls ? 0 : 100,
					scale: showControls ? 1 : 1.25,
				}}
				transition={{
					delay: showControls ? 0.05 : 0.12,
				}}
				layoutId="now-playing-track-info"
				className="text-center mb-2 z-20"
			>
				<div
					className={`text-2xl font-bold truncate ${!currentTrack ? "text-zinc-400" : "text-white"}`}
				>
					{currentTrack ? (
						(() => {
							let albumId = currentTrack.album?.id;
							if (
								!albumId &&
								currentTrack.album?.uri?.startsWith("spotify:album:")
							) {
								albumId = currentTrack.album.uri.split(":")[2];
							}
							return albumId ? (
								<Link href={`/albums/${albumId}`} className="hover:underline">
									{currentTrack.name}
								</Link>
							) : (
								<span>{currentTrack.name}</span>
							);
						})()
					) : (
						<span>No track playing</span>
					)}
				</div>
				<div className="font-light truncate text-muted-foreground">
					{currentTrack && currentTrack.artists ? (
						currentTrack.artists.map(
							(a: { id?: string; name: string; uri?: string }, i: number) => {
								let artistId = a.id;
								if (!artistId && a.uri?.startsWith("spotify:artist:")) {
									artistId = a.uri.split(":")[2];
								}
								return (
									<span key={artistId || a.name}>
										{artistId ? (
											<Link
												href={`/artists/${artistId}`}
												className="hover:underline"
											>
												{a.name}
											</Link>
										) : (
											<span>{a.name}</span>
										)}
										{i < currentTrack.artists.length - 1 && ", "}
									</span>
								);
							},
						)
					) : (
						<span>&nbsp;</span>
					)}
				</div>
			</motion.div>
			{/* Playback Controls - show/hide on mouse movement */}
			<motion.div
				layoutId="now-playing-controls"
				animate={{
					opacity: showControls ? 1 : 0,
					y: showControls ? 0 : 10,
					scale: showControls ? 1 : 0.75,
				}}
				transition={{
					delay: hasAnimatedOnce.current && showControls ? 0.18 : 0,
				}}
				className="flex items-center justify-center gap-8 my-8 z-30"
			>
				<Button
					size="icon"
					variant="ghost"
					onClick={skipToPrevious}
					disabled={!currentTrack}
				>
					<SkipBack className="!size-8" />
				</Button>
				<Button
					size="icon"
					className="bg-white text-black hover:bg-zinc-200 rounded-full h-16 w-16"
					onClick={togglePlayback}
					disabled={!currentTrack}
				>
					{isPlaying ? (
						<Pause className="!size-10" fill="#000" strokeWidth={1} />
					) : (
						<Play className="!size-10" fill="black" />
					)}
				</Button>
				<Button
					size="icon"
					variant="ghost"
					onClick={skipToNext}
					disabled={!currentTrack}
				>
					<SkipForward className="!size-8" />
				</Button>
			</motion.div>
			<motion.div
				layoutId="now-playing-progress"
				animate={{
					opacity: showControls ? 1 : 0,
					y: showControls ? 0 : 10,
					scale: showControls ? 1 : 0.98,
				}}
				transition={{
					delay: hasAnimatedOnce.current && showControls ? 0.23 : 0,
				}}
				className="flex items-center gap-2 w-full max-w-xl mx-auto z-30"
			>
				<div className="text-xs text-zinc-400 w-12 text-right">
					{formatTime(currentTrack ? position : 0)}
				</div>
				<Slider
					value={[currentTrack ? position : 0]}
					max={currentTrack ? duration : 100}
					step={1}
					onValueChange={(value) => {
						if (currentTrack) seekTo(value[0]);
					}}
					disabled={!currentTrack}
					className="w-full [&>span:first-child]:h-1 [&>span:first-child]:bg-zinc-600 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-white"
				/>
				<div className="text-xs text-zinc-400 w-12">
					{formatTime(currentTrack ? duration : 0)}
				</div>
			</motion.div>
			{/* Bottom right controls: volume & fullscreen */}
			<div className="absolute bottom-8 right-8 flex items-center gap-4 z-40">
				<motion.div
					layoutId="now-playing-volume"
					animate={{
						opacity: showControls ? 1 : 0,
						y: showControls ? 0 : 10,
						scale: showControls ? 1 : 0.98,
					}}
					transition={{
						delay: hasAnimatedOnce.current && showControls ? 0.28 : 0,
					}}
					className="flex items-center gap-2"
				>
					<Button
						size="icon"
						variant="ghost"
						onClick={() => setMute(!isMuted)}
						disabled={!currentTrack}
					>
						{isMuted ? (
							<VolumeX className="h-6 w-6" />
						) : (
							<Volume2 className="h-6 w-6" />
						)}
					</Button>
					<Slider
						value={[volume]}
						max={100}
						step={1}
						onValueChange={(value) => {
							setVolume(value[0]);
						}}
						disabled={!currentTrack}
						className="w-32 [&>span:first-child]:h-1 [&>span:first-child]:bg-zinc-600 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-white"
					/>
				</motion.div>
				<MotionButton
					size="icon"
					variant="ghost"
					aria-label="Exit Fullscreen"
					layoutId="now-playing-toggle"
					animate={{
						opacity: showControls ? 1 : 0,
						y: showControls ? 0 : 10,
						scale: showControls ? 1 : 0.98,
					}}
					onClick={() => router.back()}
				>
					<Minimize className="h-6 w-6" />
				</MotionButton>
			</div>
		</div>
	);
}
