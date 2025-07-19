"use client";
import { Clipboard, Disc, ListMusic, Music, User } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { type JSX } from "react";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";

export type ContextMenuType = "track" | "playlist" | "album" | "artist";

interface UniversalContextMenuProps {
	type: ContextMenuType;
	id: string;
	albumId?: string;
	artists?: { id?: string; name: string; uri?: string }[];
	children: React.ReactNode;
}

export default function UniversalContextMenu({
	type,
	id,
	albumId,
	artists,
	children,
}: UniversalContextMenuProps) {
	const router = useRouter();
	const MENU_ITEMS: Record<
		ContextMenuType,
		{
			label: string;
			icon: JSX.Element;
			action?: (id: string) => void;
			isArtistSubmenu?: boolean;
		}[]
	> = {
		track: [
			{
				label: "Copy Track Link",
				icon: <Clipboard />,
				action: (id) =>
					navigator.clipboard.writeText(`https://open.spotify.com/track/${id}`),
			},
			{ label: "Go to artist", icon: <User />, isArtistSubmenu: true },
			{
				label: "Go to album",
				icon: <Disc />,
				action: (id) => router.push(`/albums/${albumId}`),
			},
		],
		playlist: [
			{
				label: "Go to Playlist",
				icon: <ListMusic />,
				action: (id) => router.push(`/playlists/${id}`),
			},
			{
				label: "Copy Playlist Link",
				icon: <Clipboard />,
				action: (id) =>
					navigator.clipboard.writeText(
						`https://open.spotify.com/playlist/${id}`,
					),
			},
		],
		album: [
			{ label: "Go to Artist", icon: <User />, isArtistSubmenu: true },
			{
				label: "Copy Album Link",
				icon: <Clipboard />,
				action: (id) =>
					navigator.clipboard.writeText(`https://open.spotify.com/album/${id}`),
			},
		],
		artist: [
			{
				label: "Copy Artist Link",
				icon: <Clipboard />,
				action: (id) =>
					navigator.clipboard.writeText(
						`https://open.spotify.com/artist/${id}`,
					),
			},
		],
	};
	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent>
				{MENU_ITEMS[type].map((item) => {
					if (item.isArtistSubmenu && artists && artists.length > 1) {
						return (
							<ContextMenuSub key="go-to-artist">
								<ContextMenuSubTrigger asChild>
									<User className="mr-2 h-4 w-4" /> Go to artist
								</ContextMenuSubTrigger>
								<ContextMenuSubContent>
									{artists.map((artist) => {
										let artistId = artist.id;
										if (
											!artistId &&
											artist.uri?.startsWith("spotify:artist:")
										) {
											artistId = artist.uri.split(":")[2];
										}
										return artistId ? (
											<ContextMenuItem
												key={artistId}
												onSelect={() => router.push(`/artists/${artistId}`)}
											>
												<User className="mr-2 h-4 w-4" />
												{artist.name}
											</ContextMenuItem>
										) : (
											<ContextMenuItem key={artist.name} disabled>
												<User className="mr-2 h-4 w-4" />
												{artist.name}
											</ContextMenuItem>
										);
									})}
								</ContextMenuSubContent>
							</ContextMenuSub>
						);
					} else if (
						item.isArtistSubmenu &&
						type === "track" &&
						artists &&
						artists.length === 1
					) {
						// Single artist: just a normal item
						let artistId = artists[0].id;
						if (!artistId && artists[0].uri?.startsWith("spotify:artist:")) {
							artistId = artists[0].uri.split(":")[2];
						}
						return artistId ? (
							<ContextMenuItem
								key="go-to-artist"
								onSelect={() => router.push(`/artists/${artistId}`)}
							>
								<User className="mr-2 h-4 w-4" /> Go to artist
							</ContextMenuItem>
						) : (
							<ContextMenuItem key="go-to-artist" disabled>
								<User className="mr-2 h-4 w-4" /> Go to artist
							</ContextMenuItem>
						);
					} else if (item.isArtistSubmenu) {
						return null;
					}
					return (
						<ContextMenuItem
							key={item.label}
							onSelect={() => item.action && item.action(id)}
						>
							{item.icon &&
								React.cloneElement(item.icon, { className: "mr-2 h-4 w-4" })}
							{item.label}
						</ContextMenuItem>
					);
				})}
			</ContextMenuContent>
		</ContextMenu>
	);
}
