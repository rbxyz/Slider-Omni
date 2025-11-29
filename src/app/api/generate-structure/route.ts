import { generateText } from "ai"
import { createModelFromProvider, fetchActiveLlmProvider } from "~/server/services/llm-provider"
import { verifyJwt } from "~/server/auth/jwt"
import { consumeOmnitokens } from "~/server/auth/users"
import { z } from "zod"

// Schema para validação
const requestSchema = z.object({
    topic: z.string().min(1),
    description: z.string().optional(),
    slideCount: z.number().min(3).max(15),
})

// Tool para gerar conteúdo de texto dos slides
async function generateSlideContent(topic: string, description: string, slideCount: number, model: any) {
    const { text } = await generateText({
        model,
        prompt: `Você é um especialista em criar apresentações profissionais.

Tema: ${topic}
${description ? `Observações adicionais: ${description}` : ""}
Número de slides: ${slideCount}

Crie uma estrutura de apresentação com exatamente ${slideCount} slides.

Para cada slide, forneça:
1. Um título claro e impactante
2. Conteúdo relevante (2-4 pontos principais ou parágrafos curtos)
3. Notas do apresentador (opcional)

Retorne APENAS um JSON válido no seguinte formato:
[
  {
    "title": "Título do Slide",
    "content": ["Ponto 1", "Ponto 2", "Ponto 3"],
    "notes": "Notas opcionais para o apresentador"
  }
]

Importante: Retorne SOMENTE o array JSON, sem texto adicional antes ou depois.`,
    })

    // Parse do JSON
    try {
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (!jsonMatch) {
            throw new Error("Nenhum JSON encontrado na resposta")
        }
        return JSON.parse(jsonMatch[0])
    } catch (error) {
        console.error("Erro ao parsear JSON:", error)
        throw new Error("Falha ao gerar estrutura dos slides")
    }
}

// Tool para gerar HTML completo da apresentação
async function generatePresentationHTML(
    slides: Array<{ title: string; content: string[]; notes?: string }>,
    topic: string,
    model: any,
) {
    const slidesDescription = slides
        .map(
            (slide, idx) => `
Slide ${idx + 1}:
- Título: ${slide.title}
- Conteúdo: ${slide.content.join(", ")}
`,
        )
        .join("\n")

    const { text } = await generateText({
        model,
        prompt: `Você é um designer especialista em criar apresentações HTML modernas e profissionais.

Crie uma apresentação HTML completa sobre: "${topic}"

Estrutura dos slides:
${slidesDescription}

REQUISITOS TÉCNICOS OBRIGATÓRIOS:

1. **Estrutura HTML:**
   - Documento HTML5 completo com <!DOCTYPE html>
   - Cada slide deve estar em uma <div> com id="slide1", id="slide2", etc.
   - Exemplo: <div id="slide1" class="slide">...</div>

2. **CSS Inline:**
   - TODO o CSS deve estar em uma tag <style> no <head>
   - Use um design moderno, profissional e visualmente atraente
   - Tema escuro com cores vibrantes de destaque
   - Gradientes, sombras e animações sutis
   - Cada slide deve ocupar 100% da viewport (100vw x 100vh)
   - Use flexbox/grid para centralizar conteúdo
   - Adicione transições suaves

3. **Design:**
   - Tipografia moderna (use Google Fonts se quiser)
   - Alto contraste para legibilidade
   - Espaçamento generoso
   - Elementos visuais atraentes
   - Responsivo

4. **Conteúdo:**
   - Insira o título e conteúdo de cada slide nas respectivas divs
   - Mantenha o texto claro e bem formatado
   - Use listas, parágrafos e headings apropriadamente

IMPORTANTE: Retorne APENAS o código HTML completo, começando com <!DOCTYPE html> e terminando com </html>. Não adicione explicações ou texto adicional.`,
    })

    // Limpar possíveis marcadores de código
    let html = text.trim()
    html = html.replace(/^```html\n?/i, "")
    html = html.replace(/^```\n?/i, "")
    html = html.replace(/\n?```$/i, "")
    html = html.trim()

    // Validar que é HTML válido
    if (!html.startsWith("<!DOCTYPE") && !html.startsWith("<html")) {
        throw new Error("HTML gerado inválido")
    }

    return html
}

export async function POST(request: Request) {
    try {
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

        // consume 1 omnitoken for generating a new presentation
        const okConsume = await consumeOmnitokens(username, 1)
        if (!okConsume) return Response.json({ error: "insufficient omnitokens" }, { status: 402 })

        const body = await request.json()
        const { topic, description, slideCount } = requestSchema.parse(body)

        // Buscar provedor LLM ativo
        const activeProvider = await fetchActiveLlmProvider()
        if (!activeProvider) {
            return Response.json(
                { error: "Nenhum provedor LLM ativo encontrado. Configure no painel." },
                { status: 400 },
            )
        }

        const model = createModelFromProvider(activeProvider)

        console.log("🤖 AI Orchestrator: Iniciando geração de apresentação...")
        console.log(`📝 Tema: ${topic}`)
        console.log(`📊 Slides: ${slideCount}`)

        // PASSO 1: Tool de gerar conteúdo de texto
        console.log("🔧 Tool 1: Gerando conteúdo dos slides...")
        const slidesContent = await generateSlideContent(topic, description || "", slideCount, model)
        console.log(`✅ Conteúdo gerado: ${slidesContent.length} slides`)

        // PASSO 2: Tool de gerar apresentação HTML
        console.log("🔧 Tool 2: Gerando HTML da apresentação...")
        const presentationHTML = await generatePresentationHTML(slidesContent, topic, model)
        console.log("✅ HTML gerado com sucesso")

        // Criar ID único para a apresentação
        const presentationId = `pres-${Date.now()}`

        // Armazenar em memória global (em produção, usar banco de dados)
        if (typeof globalThis !== "undefined") {
            if (!globalThis.presentations) {
                globalThis.presentations = new Map()
            }
            
            // Transformar slidesContent para o formato esperado
            const formattedSlides = slidesContent.map((slide: any, idx: number) => {
                // Gerar HTML básico para cada slide
                const htmlContent = `
                  <div class="card">
                    <h1>${slide.title}</h1>
                    <ul>
                      ${slide.content.map((item: string) => `<li>${item}</li>`).join("")}
                    </ul>
                    ${slide.notes ? `<p><em>${slide.notes}</em></p>` : ""}
                  </div>
                `
                return {
                    id: `slide${idx + 1}`,
                    title: slide.title,
                    htmlContent,
                    order: idx + 1,
                }
            })
            
            globalThis.presentations.set(presentationId, {
                id: presentationId,
                title: topic,
                description: description || "",
                slides: formattedSlides,
                createdAt: new Date(),
            })
        }

        console.log(`✨ Apresentação criada: ${presentationId}`)

        // Retornar estrutura para revisão
        return Response.json({
            presentationId,
            slides: slidesContent.map((slide: any, idx: number) => ({
                id: `slide${idx + 1}`,
                title: slide.title,
                content: slide.content,
                notes: slide.notes,
            })),
            message: "Estrutura gerada com sucesso",
        })
    } catch (error) {
        console.error("❌ Erro ao gerar estrutura:", error)

        if (error instanceof z.ZodError) {
            return Response.json(
                { error: "Dados inválidos", details: error.errors },
                { status: 400 },
            )
        }

        return Response.json(
            {
                error: "Falha ao gerar estrutura",
                details: error instanceof Error ? error.message : "Erro desconhecido",
            },
            { status: 500 },
        )
    }
}
