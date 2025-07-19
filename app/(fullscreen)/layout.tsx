import type { Metadata } from "next";
import type React from "react";
import { AuthProvider } from "@/context/auth-context";
import { SpotifyProvider } from "@/context/spotify-context";
import "../globals.css";

export const metadata: Metadata = {
	title: "Pulse",
	description: "A Spotify client built with Next.js and Tailwind CSS",
	generator: "Next.js",
};

export default function FullscreenLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
