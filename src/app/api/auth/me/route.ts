import { verifyJwt } from "~/server/auth/jwt"
import { getUserSafe } from "~/server/auth/users"

export async function GET(request: Request) {
  try {
    const auth = request.headers.get("authorization") || ""
    const m = auth.match(/^Bearer\s+(.+)$/i)
    if (!m) return Response.json({ error: "no token" }, { status: 401 })
    const token = m[1]
    const payload = verifyJwt(token)
    const username = payload.username
    console.log("API /auth/me - Username from token:", username)
    console.log("API /auth/me - Payload permissions:", payload.permissions)
    if (!username) return Response.json({ error: "invalid token payload" }, { status: 401 })
    
    // Force buscar do banco de dados, não usar fallback da memória
    const user = await getUserSafe(username, true)
    console.log("API /auth/me - User returned from DB:", user ? { username: user.username, permissions: user.permissions, sudo: user.permissions?.sudo } : "null")
    
    if (!user) {
      console.log("API /auth/me - User not found in database")
      return Response.json({ error: "user not found" }, { status: 404 })
    }
    
    return Response.json({ user })
  } catch (err) {
    console.error("Me error", err)
    return Response.json({ error: "Invalid token" }, { status: 401 })
  }
}
