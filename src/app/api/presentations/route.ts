import { verifyJwt } from "~/server/auth/jwt"
import { getUserIdByUsername } from "~/server/auth/users"
import { db } from "~/server/db"
import { presentations } from "~/server/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    // Verificar autenticação
    const auth = request.headers.get("authorization") || ""
    const m = auth.match(/^Bearer\s+(.+)$/i)
    if (!m || !m[1]) {
      return Response.json({ error: "authentication required" }, { status: 401 })
    }

    const token = m[1]
    let payload: any
    try {
      payload = verifyJwt(token)
    } catch (e) {
      return Response.json({ error: "invalid token" }, { status: 401 })
    }

    const username = payload.username
    if (!username) {
      return Response.json({ error: "invalid token payload" }, { status: 401 })
    }

    // Buscar userId
    const userId = await getUserIdByUsername(username)
    if (!userId) {
      return Response.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Buscar apresentações do usuário
    const userPresentations = await db
      .select({
        id: presentations.id,
        title: presentations.title,
        description: presentations.description,
        slideCount: presentations.slideCount,
        createdAt: presentations.createdAt,
        updatedAt: presentations.updatedAt,
      })
      .from(presentations)
      .where(eq(presentations.userId, userId))
      .orderBy(desc(presentations.createdAt))

    return Response.json({
      presentations: userPresentations.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        slideCount: p.slideCount,
        createdAt: p.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: p.updatedAt?.toISOString() || null,
      })),
    })
  } catch (error) {
    console.error("❌ Erro ao buscar apresentações:", error)
    return Response.json(
      {
        error: "Falha ao buscar apresentações",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}


