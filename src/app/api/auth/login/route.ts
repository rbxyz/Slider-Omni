import { signJwt } from "~/server/auth/jwt"
import { verifyUser, getUserSafe } from "~/server/auth/users"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    if (!username || !password) return Response.json({ error: "username and password required" }, { status: 400 })

    const ok = await verifyUser(username, password)
    if (!ok) return Response.json({ error: "invalid credentials" }, { status: 401 })

    const user = await getUserSafe(username)
    if (!user) return Response.json({ error: "user not found" }, { status: 404 })
    
    const token = signJwt({ username: user.username, permissions: user.permissions })

    // Criar resposta com cookie
    const response = Response.json({ token, user })
    
    // Definir cookie HTTP para o middleware poder verificar
    response.headers.set(
      "Set-Cookie",
      `authToken=${token}; Path=/; Max-Age=3600; SameSite=Lax; HttpOnly=false`
    )

    return response
  } catch (err) {
    console.error("Login error", err)
    return Response.json({ error: "Login failed" }, { status: 500 })
  }
}
