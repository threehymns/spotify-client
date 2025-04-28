import type { Metadata } from 'next';
import './globals.css';
import { SpotifyProvider } from "@/context/spotify-context";
import { AuthProvider } from "@/context/auth-context";
import React from "react";

export const metadata: Metadata = {
  title: 'Pulse',
  description: 'A Spotify client built with Next.js and Tailwind CSS',
  generator: 'Next.js',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black dark">
        <SpotifyProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SpotifyProvider>
      </body>
    </html>
  );
}
