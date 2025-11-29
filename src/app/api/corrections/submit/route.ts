import { verifyJwt } from "~/server/auth/jwt"
import { consumeOmnicoins } from "~/server/auth/users"

export async function POST(request: Request) {
  try {
    const auth = request.headers.get("authorization") || ""
    const m = auth.match(/^Bearer\s+(.+)$/i)
    if (!m || !m[1]) return Response.json({ error: "no token" }, { status: 401 })
    const token = m[1]
    let payload: any
    try {
      payload = verifyJwt(token)
    } catch (e) {
      return Response.json({ error: "invalid token" }, { status: 401 })
    }
    const username = payload.username
    if (!username) return Response.json({ error: "invalid token payload" }, { status: 401 })

    // consume 1 omnicoins per correction request
    const ok = await consumeOmnicoins(username, 1)
    if (!ok) return Response.json({ error: "insufficient omnicoins" }, { status: 402 })

    // For now, just echo back the submitted correction request
    const body = await request.json()
    return Response.json({ ok: true, received: body })
  } catch (err) {
    console.error("Corrections submit error", err)
    return Response.json({ error: "Failed to process correction" }, { status: 500 })
  }
}
