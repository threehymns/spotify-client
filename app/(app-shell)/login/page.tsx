"use client";

import { AlertCircle, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveCredentials } from "@/lib/auth-helpers";

export default function LoginPage() {
	const router = useRouter();
	const [clientId, setClientId] = useState("");
	const [clientSecret, setClientSecret] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [statusMessage, setStatusMessage] = useState("");

	// Check for error in URL params
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const errorParam = urlParams.get("error");

		if (errorParam) {
			console.error("Error from callback:", errorParam);

			// Map error codes to user-friendly messages
			const errorMessages: { [key: string]: string } = {
				access_denied:
					"Access was denied by Spotify or the user. Please try again.",
				invalid_client:
					"Invalid client ID or client secret. Please check your credentials.",
				invalid_grant:
					"The authorization code is invalid or expired. Please try again.",
				missing_code: "No authorization code was received from Spotify.",
				missing_credentials:
					"Client credentials are missing. Please re-enter your Spotify API keys.",
				token_exchange:
					"Failed to exchange authorization code for tokens. Please check your credentials and redirect URI.",
				server_error: "A server error occurred. Please try again later.",
			};

			setError(
				errorMessages[errorParam] || `Authentication error: ${errorParam}`,
			);
		}
	}, []);

	const updateStatus = (message: string) => {
		console.log(message);
		setStatusMessage(message);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setStatusMessage("");

		if (!clientId || !clientSecret) {
			setError("Please enter both Client ID and Client Secret");
			setLoading(false);
			return;
		}

		try {
			updateStatus("Validating credentials...");

			// Validate client ID format (should be 32 characters)
			if (clientId.length !== 32) {
				setError(
					"Client ID should be 32 characters long. Please check your Spotify Developer Dashboard.",
				);
				setLoading(false);
				return;
			}

			// Validate client secret format (should be 32 characters)
			if (clientSecret.length !== 32) {
				setError(
					"Client Secret should be 32 characters long. Please check your Spotify Developer Dashboard.",
				);
				setLoading(false);
				return;
			}

			updateStatus("Saving credentials securely...");
			// Save credentials securely
			await saveCredentials(clientId, clientSecret);

			updateStatus("Preparing Spotify authorization...");
			// Redirect to Spotify authorization
			const redirectUri = `${window.location.origin}/api/auth/callback`;
			const scope =
				"user-read-private user-read-email playlist-read-private playlist-modify-private playlist-modify-public user-library-read user-library-modify streaming user-read-playback-state user-modify-playback-state user-follow-modify user-follow-read";

			// Generate a random state value for CSRF protection
			const state = crypto.randomUUID();
			// Store the state in localStorage to verify when the callback returns
			localStorage.setItem("spotify_auth_state", state);

			updateStatus("Redirecting to Spotify login...");
			const authUrl = new URL("https://accounts.spotify.com/authorize");
			authUrl.searchParams.append("response_type", "code");
			authUrl.searchParams.append("client_id", clientId);
			authUrl.searchParams.append("scope", scope);
			authUrl.searchParams.append("redirect_uri", redirectUri);
			authUrl.searchParams.append("state", state);
			authUrl.searchParams.append("show_dialog", "true"); // Force login dialog for testing

			window.location.href = authUrl.toString();
		} catch (err) {
			console.error("Authentication preparation failed:", err);
			setError(
				"Failed to authenticate. Please check your credentials and try again.",
			);
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-black p-4">
			<Card className="w-full max-w-md border-zinc-800 bg-zinc-950 text-white">
				<CardHeader>
					<CardTitle className="text-2xl font-bold">
						Connect to Spotify
					</CardTitle>
					<CardDescription className="text-zinc-400">
						Enter your Spotify API credentials to get started
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="client-id">Client ID</Label>
							<Input
								id="client-id"
								placeholder="Enter your Spotify Client ID"
								value={clientId}
								onChange={(e) => setClientId(e.target.value)}
								className="bg-zinc-900 border-zinc-800"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="client-secret">Client Secret</Label>
							<Input
								id="client-secret"
								type="password"
								placeholder="Enter your Spotify Client Secret"
								value={clientSecret}
								onChange={(e) => setClientSecret(e.target.value)}
								className="bg-zinc-900 border-zinc-800"
							/>
						</div>

						{statusMessage && (
							<Alert className="bg-blue-900/20 border-blue-900 text-blue-400">
								<Info className="h-4 w-4" />
								<AlertDescription>{statusMessage}</AlertDescription>
							</Alert>
						)}

						{error && (
							<Alert
								variant="destructive"
								className="bg-red-900/20 border-red-900 text-red-400"
							>
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className="text-sm text-zinc-400">
							<p>
								You can get your Spotify API credentials by creating an app in
								the{" "}
								<a
									href="https://developer.spotify.com/dashboard"
									target="_blank"
									rel="noopener noreferrer"
									className="text-green-500 hover:underline"
								>
									Spotify Developer Dashboard
								</a>
							</p>
							<p className="mt-2">
								Make sure to add{" "}
								<code className="bg-zinc-800 px-1 py-0.5 rounded">
									{typeof window !== "undefined"
										? `${window.location.origin}/api/auth/callback`
										: "your-app-url.com/api/auth/callback"}
								</code>{" "}
								as a Redirect URI in your Spotify app settings.
							</p>
						</div>
					</form>
				</CardContent>
				<CardFooter>
					<Button
						onClick={handleSubmit}
						className="w-full bg-green-500 hover:bg-green-600"
						disabled={loading}
					>
						{loading ? "Connecting..." : "Connect to Spotify"}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
