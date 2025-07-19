import type { Metadata } from "next";
import "./globals.css";
import type React from "react";
import { AuthProvider } from "@/context/auth-context";
import { SpotifyProvider } from "@/context/spotify-context";

export const metadata: Metadata = {
	title: "Pulse",
	description: "A Spotify client built with Next.js and Tailwind CSS",
	generator: "Next.js",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className="bg-black dark">
				<AuthProvider>
					<SpotifyProvider>{children}</SpotifyProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
