import { verifyJwt } from "~/server/auth/jwt"
import { listUsers, resetCredits } from "~/server/auth/users"

export async function GET(request: Request) {
  try {
    const auth = request.headers.get("authorization") || ""
    const m = auth.match(/^Bearer\s+(.+)$/i)
    if (!m || !m[1]) return Response.json({ error: "no token" }, { status: 401 })
    const token = m[1]
    const payload = verifyJwt(token)
    const permissions = payload.permissions || {}
    if (!permissions.sudo) return Response.json({ error: "forbidden" }, { status: 403 })

    const users = await listUsers()
    return Response.json({ users })
  } catch (err) {
    console.error("Admin credits GET error", err)
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = request.headers.get("authorization") || ""
    const m = auth.match(/^Bearer\s+(.+)$/i)
    if (!m || !m[1]) return Response.json({ error: "no token" }, { status: 401 })
    const token = m[1]
    const payload = verifyJwt(token)
    const permissions = payload.permissions || {}
    if (!permissions.sudo) return Response.json({ error: "forbidden" }, { status: 403 })

    const body = await request.json()
    const { username } = body
    if (!username) return Response.json({ error: "invalid payload" }, { status: 400 })

    const ok = await resetCredits(username)
    if (!ok) return Response.json({ error: "user not found" }, { status: 404 })

    return Response.json({ ok: true })
  } catch (err) {
    console.error("Admin credits POST error", err)
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
}
