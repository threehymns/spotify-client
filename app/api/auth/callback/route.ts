import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { unstable_noStore } from "next/cache"

export async function GET(request: NextRequest) {
  // Opt out of static rendering immediately
  unstable_noStore()

  console.log("Auth callback route triggered")

  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  // Check for errors in the callback
  if (error) {
    console.error("Error in Spotify callback:", error)
    return NextResponse.redirect(new URL(`/login?error=${error}`, request.url))
  }

  if (!code) {
    console.error("Missing authorization code in callback")
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url))
  }

  // Get client credentials from cookies
  const clientId = cookies().get("spotify_client_id")?.value
  const clientSecret = cookies().get("spotify_client_secret")?.value

  if (!clientId || !clientSecret) {
    console.error("Missing client credentials in cookies")
    return NextResponse.redirect(new URL("/login?error=missing_credentials", request.url))
  }

  try {
    console.log("Exchanging authorization code for access token...")

    // Exchange the authorization code for an access token
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${request.nextUrl.origin}/api/auth/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Token exchange error:", errorText)

      // Try to parse the error response
      let errorType = "token_exchange"
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.error === "invalid_client") {
          errorType = "invalid_client"
        } else if (errorJson.error === "invalid_grant") {
          errorType = "invalid_grant"
        }
      } catch (e) {
        // If parsing fails, use the default error type
      }

      return NextResponse.redirect(new URL(`/login?error=${errorType}`, request.url))
    }

    const tokenData = await tokenResponse.json()
    console.log("Token exchange successful")

    // Create a response with a temporary redirect to avoid layout issues
    const response = NextResponse.redirect(new URL("/auth/success", request.url))

    // Store tokens in cookies
    response.cookies.set("spotify_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: tokenData.expires_in,
      path: "/",
    })

    response.cookies.set("spotify_refresh_token", tokenData.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    })

    // Also set a cookie to indicate successful authentication
    response.cookies.set("spotify_auth_success", "true", {
      maxAge: 60, // Short-lived, just for the redirect
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Auth callback error:", error)
    // Make sure to re-throw any special Next.js errors
    if (error && typeof error === "object" && "type" in error && error.type === Symbol.for("BAIL_OUT_LAYOUTS")) {
      throw error
    }
    return NextResponse.redirect(new URL("/login?error=server_error", request.url))
  }
}
