import { generateText } from "ai"
import { createModelFromProvider, fetchActiveLlmProvider } from "~/server/services/llm-provider"
import { verifyJwt } from "~/server/auth/jwt"
import { consumeOmnitokens } from "~/server/auth/users"
import { z } from "zod"

const requestSchema = z.object({
  topic: z.string().min(1),
  description: z.string().optional(),
  slideCount: z.number().min(3).max(15),
})

interface SlideContent {
  title: string
  content: string[]
  notes?: string
}

async function generateAllSlidesContent(
  topic: string,
  description: string,
  slideCount: number,
  model: any,
): Promise<SlideContent[]> {
  console.log("🔧 Gerando conteúdo de texto para todos os slides...")

  const { text } = await generateText({
    model,
    prompt: `Você é um especialista em criar apresentações profissionais.

Tema: "${topic}"
${description ? `Contexto adicional: ${description}` : ""}
Número de slides: ${slideCount}

Crie uma estrutura de apresentação com EXATAMENTE ${slideCount} slides.

Para cada slide, forneça:
1. Um título claro e impactante
2. Conteúdo relevante (2-4 pontos principais)
3. Notas opcionais para o apresentador

Retorne APENAS um JSON válido, sem texto adicional:
[
  {
    "title": "Título do Slide",
    "content": ["Ponto 1", "Ponto 2", "Ponto 3"],
    "notes": "Notas opcionais"
  }
]`,
  })

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error("JSON não encontrado")

    const slides = JSON.parse(jsonMatch[0]) as SlideContent[]

    // Validar que temos o número correto de slides
    if (slides.length !== slideCount) {
      console.warn(
        `⚠️ Esperado ${slideCount} slides, mas recebeu ${slides.length}. Ajustando...`,
      )
    }

    return slides
  } catch (error) {
    console.error("❌ Erro ao parsear slides:", error)
    throw new Error("Falha ao gerar conteúdo dos slides")
  }
}

export async function POST(request: Request) {
  try {
    // Verificar autenticação
    const auth = request.headers.get("authorization") || ""
    const m = auth.match(/^Bearer\s+(.+)$/i)
    if (!m || !m[1]) return Response.json({ error: "authentication required" }, { status: 401 })

    const token = m[1]
    let payload: any
    try {
      payload = verifyJwt(token)
    } catch (e) {
      return Response.json({ error: "invalid token" }, { status: 401 })
    }

    const username = payload.username
    if (!username) return Response.json({ error: "invalid token payload" }, { status: 401 })

    // Consumir omnitoken
    const okConsume = await consumeOmnitokens(username, 1)
    if (!okConsume) return Response.json({ error: "insufficient omnitokens" }, { status: 402 })

    // Validar input
    const body = await request.json()
    const { topic, description, slideCount } = requestSchema.parse(body)

    // Buscar provedor LLM
    const activeProvider = await fetchActiveLlmProvider()
    if (!activeProvider) {
      return Response.json(
        { error: "Nenhum provedor LLM ativo encontrado. Configure no painel." },
        { status: 400 },
      )
    }

    const model = createModelFromProvider(activeProvider)

    console.log("🚀 Iniciando geração de conteúdo dos slides...")
    console.log(`📝 Tema: ${topic}`)
    console.log(`📊 Slides: ${slideCount}`)

    // Gerar conteúdo dos slides
    const slidesContent = await generateAllSlidesContent(
      topic,
      description || "",
      slideCount,
      model,
    )
    console.log(`✅ ${slidesContent.length} slides de conteúdo gerados`)

    return Response.json({
      slides: slidesContent,
      message: "Conteúdo gerado com sucesso!",
    })
  } catch (error) {
    console.error("❌ Erro ao gerar conteúdo:", error)

    if (error instanceof z.ZodError) {
      return Response.json({ error: "Dados inválidos", details: error.errors }, { status: 400 })
    }

    return Response.json(
      {
        error: "Falha ao gerar conteúdo",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

