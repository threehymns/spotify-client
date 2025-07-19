import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
	const cookieStore = await cookies();
	const accessToken = cookieStore.get("spotify_access_token")?.value;
	const refreshToken = cookieStore.get("spotify_refresh_token")?.value;

	if (!accessToken || !refreshToken) {
		return NextResponse.json({ error: "Tokens not found" }, { status: 401 });
	}

	return NextResponse.json({ accessToken, refreshToken });
}
