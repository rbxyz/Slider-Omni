import { generateText } from "ai"
import { createModelFromProvider, fetchActiveLlmProvider } from "~/server/services/llm-provider"
import { verifyJwt } from "~/server/auth/jwt"
import { consumeOmnitokens, getUserIdByUsername } from "~/server/auth/users"
import { db } from "~/server/db"
import { presentations } from "~/server/db/schema"
import { z } from "zod"
import {
  ALL_TEMPLATES,
  generateTemplateCss,
  renderSlideWithTemplate,
  selectLayout,
  type SlideTemplate,
} from "~/server/templates/slide-templates"

const requestSchema = z.object({
  topic: z.string().min(1),
  description: z.string().optional(),
  slideCount: z.number().min(3).max(15).optional(),
  templateId: z.string().default("dark-premium"),
  mixLayouts: z.boolean().default(false).optional(),
  slides: z
    .array(
      z.object({
        title: z.string(),
        content: z.array(z.string()),
        notes: z.string().optional(),
      }),
    )
    .optional(),
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
  console.log("🔧 Gerando conteúdo para todos os slides...")

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
3. Notas opcionais

Retorne APENAS JSON válido, sem texto adicional:
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

    if (slides.length !== slideCount) {
      console.warn(`⚠️ Esperado ${slideCount} slides, recebeu ${slides.length}`)
    }

    return slides
  } catch (error) {
    console.error("❌ Erro ao parsear slides:", error)
    throw new Error("Falha ao gerar conteúdo dos slides")
  }
}

function generatePresentationWithTemplate(
  slides: SlideContent[],
  template: SlideTemplate,
  topic: string,
  mixLayouts: boolean,
): string {
  console.log(`🎨 Gerando apresentação com template: ${template.name}`)

  // Gerar slides HTML
  const slidesHtml = slides
    .map((slide, idx) => {
      // Selecionar layout: se mixLayouts ativado, alterna entre layouts; senão usa o primeiro
      let layout = mixLayouts ? selectLayout(template, idx) : template.layouts[0]

      // Se o slide tem conteúdo, priorizar layouts que mostram conteúdo
      if (slide.content && slide.content.length > 0) {
        const contentLayouts = template.layouts.filter(
          (l) => l.category !== "title-only" && l.category !== "title-image",
        )
        if (contentLayouts.length > 0 && mixLayouts) {
          // Usar layout com conteúdo baseado no índice
          const contentLayoutIndex = idx % contentLayouts.length
          layout = contentLayouts[contentLayoutIndex] ?? layout
        } else if (contentLayouts.length > 0) {
          // Se não está misturando, usar o primeiro layout com conteúdo
          layout = contentLayouts[0] ?? layout
        }
      }

      if (!layout) {
        throw new Error(`Layout não encontrado para o slide ${idx + 1}`)
      }

      console.log(
        `  Slide ${idx + 1}: Usando layout "${layout.name}" (categoria: ${layout.category})`,
      )
      console.log(`    Título: "${slide.title}"`)
      console.log(`    Conteúdo: ${slide.content.length} itens`)

      return renderSlideWithTemplate(slide.title, slide.content, layout, idx + 1)
    })
    .join("\n")

  // CSS do template
  const templateCss = generateTemplateCss(template)

  // Gerar script injetado
  const controllerScript = `
    <script>
      window.currentSlide = 1;
      window.totalSlides = ${slides.length};
      
      window.showSlide = function(slideNumber) {
        if (slideNumber < 1 || slideNumber > window.totalSlides) return;
        
        window.currentSlide = slideNumber;
        const allSlides = document.querySelectorAll('[id^="slide"]');
        
        allSlides.forEach((slide, index) => {
          const num = index + 1;
          if (num === slideNumber) {
            slide.style.display = 'flex';
            slide.style.visibility = 'visible';
            slide.style.opacity = '1';
            slide.style.zIndex = '10';
            slide.classList.add('active');
          } else {
            slide.style.display = 'none';
            slide.style.visibility = 'hidden';
            slide.style.opacity = '0';
            slide.style.zIndex = '1';
            slide.classList.remove('active');
          }
        });
      };
      
      // Navegação por teclado
      document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight' && window.currentSlide < window.totalSlides) {
          window.showSlide(window.currentSlide + 1);
        } else if (e.key === 'ArrowLeft' && window.currentSlide > 1) {
          window.showSlide(window.currentSlide - 1);
        }
      });
      
      // Inicializar
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.showSlide(1));
      } else {
        window.showSlide(1);
      }
    </script>
  `

  // Montar HTML final
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${topic}</title>
  <style>
    ${templateCss}
  </style>
</head>
<body>
  ${slidesHtml}
  ${controllerScript}
</body>
</html>`

  return html
}

export async function POST(request: Request) {
  try {
    // Verificar autenticação
    const auth = request.headers.get("authorization") || ""
    const m = auth.match(/^Bearer\s+(.+)$/i)
    if (!m) return Response.json({ error: "authentication required" }, { status: 401 })

    const token = m[1]
    if (!token) {
      return Response.json({ error: "invalid token" }, { status: 401 })
    }

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
    const { topic, description, slideCount, templateId, mixLayouts = false, slides } =
      requestSchema.parse(body)

    // Buscar template
    const template = ALL_TEMPLATES.find((t) => t.id === templateId)
    if (!template) {
      return Response.json({ error: `Template "${templateId}" não encontrado` }, { status: 400 })
    }

    let slidesContent: SlideContent[]

    // Se slides foram fornecidos (editados), usar eles; senão, gerar
    if (slides && slides.length > 0) {
      slidesContent = slides
      console.log(`✅ Usando ${slidesContent.length} slides fornecidos`)
    } else {
      // Buscar provedor LLM
      const activeProvider = await fetchActiveLlmProvider()
      if (!activeProvider) {
        return Response.json(
          { error: "Nenhum provedor LLM ativo encontrado. Configure no painel." },
          { status: 400 },
        )
      }

      const model = createModelFromProvider(activeProvider)

      if (!slideCount) {
        return Response.json(
          { error: "slideCount é obrigatório quando slides não são fornecidos" },
          { status: 400 },
        )
      }

      console.log("🚀 Iniciando geração de conteúdo dos slides...")
      console.log(`📝 Tema: ${topic}`)
      console.log(`📊 Slides: ${slideCount}`)

      // Gerar conteúdo dos slides
      slidesContent = await generateAllSlidesContent(
        topic,
        description || "",
        slideCount,
        model,
      )
      console.log(`✅ ${slidesContent.length} slides de conteúdo gerados`)
    }

    console.log("🚀 Iniciando geração de apresentação com template...")
    console.log(`🎨 Template: ${template.name}`)
    console.log(`🔀 Mix Layouts: ${mixLayouts}`)

    // Gerar HTML com template
    const presentationHTML = generatePresentationWithTemplate(
      slidesContent,
      template,
      topic,
      mixLayouts,
    )
    console.log("✅ HTML com template gerado")

    // Criar ID único
    const presentationId = `pres-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    // Buscar userId
    const userId = await getUserIdByUsername(username)
    if (!userId) {
      return Response.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Armazenar no banco de dados
    try {
      await db.insert(presentations).values({
        id: presentationId,
        userId: userId,
        title: topic,
        description: description || "",
        html: presentationHTML,
        slideCount: slidesContent.length,
        slides: JSON.stringify(slidesContent),
      })
      console.log(`✅ Apresentação salva no banco: ${presentationId}`)
    } catch (dbError) {
      console.error("❌ Erro ao salvar no banco:", dbError)
      // Continuar mesmo se falhar no banco, manter compatibilidade com memória
    }

    // Armazenar em memória também (para compatibilidade)
    if (typeof globalThis !== "undefined") {
      if (!globalThis.presentations) {
        globalThis.presentations = new Map()
      }
      globalThis.presentations.set(presentationId, {
        id: presentationId,
        title: topic,
        description: description || "",
        html: presentationHTML,
        slideCount: slidesContent.length,
        slides: slidesContent.map((slide, idx) => ({
          id: `slide${idx + 1}`,
          title: slide.title,
          htmlContent: "",
          order: idx + 1,
        })),
        createdAt: new Date(),
      })
    }

    console.log(`✨ Apresentação criada: ${presentationId}`)

    return Response.json({
      presentationId,
      slideCount: slidesContent.length,
      template: template.name,
      message: "Apresentação gerada com sucesso!",
    })
  } catch (error) {
    console.error("❌ Erro ao gerar apresentação:", error)

    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 },
      )
    }

    return Response.json(
      {
        error: "Falha ao gerar apresentação",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

// Endpoint helper para listar templates disponíveis
export async function GET() {
  return Response.json({
    templates: ALL_TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      theme: t.theme,
      layoutCount: t.layouts.length,
      layouts: t.layouts.map((l) => ({
        id: l.id,
        name: l.name,
        category: l.category,
      })),
    })),
  })
}