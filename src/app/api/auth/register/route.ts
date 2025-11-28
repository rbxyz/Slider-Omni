import { createUser, getUserSafe } from "~/server/auth/users"
import { signJwt } from "~/server/auth/jwt"

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json()
    if (!username || !email || !password) return Response.json({ error: "username, email and password required" }, { status: 400 })

    const existing = await getUserSafe(username)
    if (existing) return Response.json({ error: "user already exists" }, { status: 409 })

    const user = await createUser(username, email, password, { sudo: false })
    const token = signJwt({ username: user.username, permissions: user.permissions })

    // Criar resposta com cookie
    const response = Response.json({ token, user: { username: user.username, email: user.email, permissions: user.permissions } })
    
    // Definir cookie HTTP para o middleware poder verificar
    response.headers.set(
      "Set-Cookie",
      `authToken=${token}; Path=/; Max-Age=3600; SameSite=Lax; HttpOnly=false`
    )

    return response
  } catch (err) {
    console.error("Register error", err)
    return Response.json({ error: "Registration failed" }, { status: 500 })
  }
}
