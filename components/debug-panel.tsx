"use client";

import { Bug, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getAccessToken, getCredentials } from "@/lib/auth-helpers";

export default function DebugPanel() {
	const [isOpen, setIsOpen] = useState(false);
	const [debugInfo, setDebugInfo] = useState<any>(null);
	const [loading, setLoading] = useState(false);

	const gatherDebugInfo = async () => {
		setLoading(true);
		try {
			// Gather information about the current state
			const credentials = await getCredentials();
			const accessToken = await getAccessToken();

			// Check localStorage keys
			const localStorageKeys = Object.keys(localStorage)
				.filter((key) => key.startsWith("spotify_"))
				.reduce((obj, key) => {
					obj[key] = localStorage.getItem(key)
						? key.includes("token")
							? "[REDACTED]"
							: "[PRESENT]"
						: "[MISSING]";
					return obj;
				}, {});

			// Check cookies
			const cookies = document.cookie
				.split(";")
				.map((cookie) => cookie.trim())
				.filter((cookie) => cookie.startsWith("spotify_"))
				.map((cookie) => cookie.split("=")[0])
				.reduce((obj, key) => {
					obj[key] = "[PRESENT]";
					return obj;
				}, {});

			setDebugInfo({
				hasCredentials: !!credentials,
				hasAccessToken: !!accessToken,
				localStorageKeys,
				cookies,
				userAgent: navigator.userAgent,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			setDebugInfo({
				error: error.message,
				timestamp: new Date().toISOString(),
			});
		} finally {
			setLoading(false);
		}
	};

	const copyToClipboard = () => {
		if (debugInfo) {
			navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
		}
	};

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
			<CollapsibleTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="flex items-center justify-between w-full"
				>
					<span className="flex items-center">
						<Bug className="h-4 w-4 mr-2" />
						Debug Tools
					</span>
					{isOpen ? (
						<ChevronUp className="h-4 w-4" />
					) : (
						<ChevronDown className="h-4 w-4" />
					)}
				</Button>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<Card className="mt-2 bg-zinc-900 border-zinc-800">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Connection Diagnostics</CardTitle>
						<CardDescription className="text-xs">
							Gather information about your Spotify connection for
							troubleshooting
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							size="sm"
							variant="outline"
							onClick={gatherDebugInfo}
							disabled={loading}
							className="mb-2"
						>
							{loading ? "Gathering Info..." : "Gather Debug Info"}
						</Button>

						{debugInfo && (
							<>
								<div className="bg-zinc-950 p-2 rounded text-xs font-mono overflow-auto max-h-40 mb-2">
									<pre>{JSON.stringify(debugInfo, null, 2)}</pre>
								</div>
								<Button size="sm" variant="outline" onClick={copyToClipboard}>
									Copy to Clipboard
								</Button>
							</>
						)}
					</CardContent>
				</Card>
			</CollapsibleContent>
		</Collapsible>
	);
}
