import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Middleware to protect admin panel routes
export async function middleware(request: NextRequest) {
  const { nextUrl } = request
  const pathname = nextUrl.pathname

  // Only protect the admin panel path
  if (!pathname.startsWith("/painel")) {
    return NextResponse.next()
  }

  // Try cookie first, then Authorization header
  const cookieToken = request.cookies.get("authToken")?.value
  let token: string | null = cookieToken || null

  if (!token) {
    const auth = request.headers.get("authorization") || ""
    const m = auth.match(/^Bearer\s+(.+)$/i)
    if (m && m[1]) token = m[1]
  }

  // If no token, redirect to login with next param
  if (!token) {
    const url = nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  // Validate token by calling internal API (server-side verification)
  try {
    const resp = await fetch(`${nextUrl.origin}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })

    if (!resp.ok) {
      const url = nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("next", pathname)
      return NextResponse.redirect(url)
    }

    const body = await resp.json()
    const user = body?.user
    const permissions = user?.permissions || {}
    
    // Verificar sudo de forma robusta (pode ser boolean, string "true", ou número 1)
    const hasSudo = permissions.sudo === true || permissions.sudo === "true" || permissions.sudo === 1 || permissions.sudo === "1"
    
    console.log("Middleware - User permissions:", permissions, "Has sudo:", hasSudo)
    
    if (!hasSudo) {
      const url = nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("forbidden", "1")
      return NextResponse.redirect(url)
    }

    // Authorized
    return NextResponse.next()
  } catch (err) {
    const url = nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ["/painel/:path*"],
}
