import { unstable_noStore } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	// Opt out of static rendering immediately
	unstable_noStore();

	// Clear all Spotify-related cookies
	const response = NextResponse.json({ success: true });

	response.cookies.delete("spotify_access_token");
	response.cookies.delete("spotify_refresh_token");
	response.cookies.delete("spotify_client_id");
	response.cookies.delete("spotify_client_secret");
	response.cookies.delete("spotify_auth_success");

	return response;
}
