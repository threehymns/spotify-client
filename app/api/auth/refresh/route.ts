import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { unstable_noStore } from "next/cache"

export async function POST(request: NextRequest) {
  // Opt out of static rendering immediately
  unstable_noStore()

  console.log("Token refresh route triggered")

  try {
    const body = await request.json()
    const { refreshToken, clientId, clientSecret } = body

    // First try to get credentials from the request body
    let credentialsToUse = {
      clientId,
      clientSecret,
    }

    // If not in the body, try to get from cookies as fallback
    if (!credentialsToUse.clientId || !credentialsToUse.clientSecret) {
      console.log("Credentials not in request body, checking cookies...")
      credentialsToUse = {
        clientId: cookies().get("spotify_client_id")?.value,
        clientSecret: cookies().get("spotify_client_secret")?.value,
      }
    }

    if (!credentialsToUse.clientId || !credentialsToUse.clientSecret) {
      console.error("Missing credentials for token refresh")
      return NextResponse.json({ error: "Missing credentials" }, { status: 401 })
    }

    if (!refreshToken) {
      console.error("Missing refresh token")
      return NextResponse.json({ error: "Missing refresh token" }, { status: 401 })
    }

    console.log("Making token refresh request to Spotify...")

    // Exchange the refresh token for a new access token
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${credentialsToUse.clientId}:${credentialsToUse.clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Token refresh error:", errorText)

      // Try to parse the error for more details
      try {
        const errorJson = JSON.parse(errorText)
        return NextResponse.json(
          {
            error: "Failed to refresh token",
            details: errorJson,
          },
          { status: 401 },
        )
      } catch (e) {
        return NextResponse.json(
          {
            error: "Failed to refresh token",
            details: errorText,
          },
          { status: 401 },
        )
      }
    }

    const tokenData = await tokenResponse.json()
    console.log("Token refresh successful")

    const response = NextResponse.json(tokenData)

    // Update the access token cookie
    response.cookies.set("spotify_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: tokenData.expires_in,
      path: "/",
    })

    // Update the refresh token cookie if a new one was provided
    if (tokenData.refresh_token) {
      response.cookies.set("spotify_refresh_token", tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      })
    }

    return response
  } catch (error) {
    console.error("Token refresh error:", error)
    // Make sure to re-throw any special Next.js errors
    if (error && typeof error === "object" && "type" in error && error.type === Symbol.for("BAIL_OUT_LAYOUTS")) {
      throw error
    }
    return NextResponse.json({ error: "Server error", details: error.message }, { status: 500 })
  }
}
