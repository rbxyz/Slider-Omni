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

// PASSO 1: Gerar conteúdo de texto para todos os slides em UMA chamada
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

// PASSO 2: Gerar HTML com TODOS os slides em uma ÚNICA chamada
async function generatePresentationHTML(
  slides: SlideContent[],
  topic: string,
  model: any,
): Promise<string> {
  console.log("🔧 Gerando HTML completo da apresentação...")

  // Preparar descrição dos slides para o prompt
  const slidesDescription = slides
    .map(
      (slide, idx) => `
Slide ${idx + 1}:
  Título: ${slide.title}
  Conteúdo: ${slide.content.join(" | ")}
`,
    )
    .join("\n")

  // Gerar HTML base
  const baseHTML = await generateBaseHTML(slides, topic, model)

  // Injetar script de controle e navegação
  const enhancedHTML = injectNavigationController(baseHTML, slides.length)

  return enhancedHTML
}

// Função para gerar o HTML base sem preocupação com navegação
async function generateBaseHTML(
  slides: SlideContent[],
  topic: string,
  model: any,
): Promise<string> {
  const slidesDescription = slides
    .map(
      (slide, idx) => `
Slide ${idx + 1}:
  Título: ${slide.title}
  Conteúdo: ${slide.content.join(" | ")}
`,
    )
    .join("\n")

  const { text } = await generateText({
    model,
    prompt: `Você é um designer especialista em HTML/CSS moderno.

IMPORTANTE: NÃO gere nenhum componente de navegação, botões de próximo/anterior, ou controles de slide. Esses serão injetados automaticamente.

Crie um documento HTML5 ÚNICO e COMPLETO para uma apresentação sobre: "${topic}"

ESTRUTURA DOS SLIDES:
${slidesDescription}

REQUISITOS OBRIGATÓRIOS:

1. **Uma única estrutura HTML:**
   - <!DOCTYPE html> no início
   - Um único <html>, <head> e <body>
   - NUNCA gere múltiplos documentos HTML

2. **Cada slide em uma <div> separada:**
   - <div id="slide1" class="slide">...</div>
   - <div id="slide2" class="slide">...</div>
   - etc... até slide${slides.length}
   - IDs DEVEM ser numerados sequencialmente: slide1, slide2, slide3, etc.

3. **CSS (tudo no <head>):**
   - Uma única tag <style> no <head>
   - Design moderno, profissional e visualmente atraente
   - Tema escuro com cores vibrantes (azuis, roxos, cians)
   - Cada .slide ocupa 100vw x 100vh
   - Flexbox para centralizar conteúdo
   - Gradientes, sombras, transições suaves
   - Alto contraste para legibilidade

4. **Estrutura de cada slide:**
   - <h1> para o título
   - <ul> ou <p> para o conteúdo
   - Bem espaçado e legível

5. **Importante:**
   - Retorne APENAS código HTML puro
   - COMEÇE com <!DOCTYPE html>
   - TERMINE com </html>
   - Nenhum texto antes ou depois
   - Nenhuma tag de código (sem \`\`\`html)

Exemplo de estrutura esperada:
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    /* estilos aqui */
  </style>
</head>
<body>
  <div id="slide1" class="slide">
    <h1>Título 1</h1>
    <ul>
      <li>Conteúdo 1</li>
    </ul>
  </div>
  <div id="slide2" class="slide">
    <h1>Título 2</h1>
    <ul>
      <li>Conteúdo 2</li>
    </ul>
  </div>
  <!-- ... continuando até slide${slides.length} -->
</body>
</html>`,
  })

  // Limpar possíveis marcadores de código markdown
  let html = text.trim()
  html = html.replace(/^```html?\n?/i, "")
  html = html.replace(/^```\n?/i, "")
  html = html.replace(/\n?```$/i, "")
  html = html.trim()

  // Validar estrutura básica
  if (!html.toLowerCase().startsWith("<!doctype") && !html.toLowerCase().startsWith("<html")) {
    throw new Error("HTML inválido: não começa com <!DOCTYPE html>")
  }

  if (!html.toLowerCase().includes("</html>")) {
    throw new Error("HTML inválido: não termina com </html>")
  }

  // Contar divs de slide para validação
  const slideMatches = html.match(/id="slide\d+"/gi) || []
  console.log(`✅ HTML gerado com ${slideMatches.length} slides encontrados`)

  if (slideMatches.length !== slides.length) {
    console.warn(
      `⚠️ Esperado ${slides.length} slides, mas HTML contém ${slideMatches.length}`,
    )
  }

  return html
}

// Função para injetar o controlador de navegação no HTML
function injectNavigationController(html: string, totalSlides: number): string {
  // Remover body closing tag
  const bodyCloseIndex = html.toLowerCase().lastIndexOf("</body>")
  if (bodyCloseIndex === -1) {
    console.error("❌ Não encontrado </body> no HTML")
    return html
  }

  // Controlador de slides injetado
  const controllerScript = `
    <script>
      window.currentSlide = 1;
      window.totalSlides = ${totalSlides};
      
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
        
        // Notificar parent window
        if (window.parent !== window) {
          window.parent.postMessage({ type: 'slideChange', slide: slideNumber }, '*');
        }
      };
      
      // Keyboard navigation
      document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight' && window.currentSlide < window.totalSlides) {
          window.showSlide(window.currentSlide + 1);
        } else if (e.key === 'ArrowLeft' && window.currentSlide > 1) {
          window.showSlide(window.currentSlide - 1);
        }
      });
      
      // Inicializar no primeiro slide
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.showSlide(1));
      } else {
        window.showSlide(1);
      }
    </script>
  `

  // Injetar antes do </body>
  const enhancedHtml = html.slice(0, bodyCloseIndex) + controllerScript + html.slice(bodyCloseIndex)

  return enhancedHtml
}

export async function POST(request: Request) {
  try {
    // Verificar autenticação
    const auth = request.headers.get("authorization") || ""
    const m = auth.match(/^Bearer\s+(.+)$/i)
    if (!m) return Response.json({ error: "authentication required" }, { status: 401 })

    const token = m[1]
    let payload: any
    try {
      payload = verifyJwt(token)
    } catch (e) {
      return Response.json({ error: "invalid token" }, { status: 401 })
    }

    const username = payload.username
    if (!username) return Response.json({ error: "invalid token payload" }, { status: 401 })

    // Consumir 1 omnitoken
    const okConsume = await consumeOmnitokens(username, 1)
    if (!okConsume) return Response.json({ error: "insufficient omnitokens" }, { status: 402 })

    // Validar input
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

    console.log("🚀 Iniciando geração de apresentação...")
    console.log(`📝 Tema: ${topic}`)
    console.log(`📊 Slides: ${slideCount}`)

    // PASSO 1: Gerar conteúdo de TODOS os slides em uma chamada
    const slidesContent = await generateAllSlidesContent(
      topic,
      description || "",
      slideCount,
      model,
    )
    console.log(`✅ ${slidesContent.length} slides de conteúdo gerados`)

    // PASSO 2: Gerar HTML COMPLETO com todos os slides
    const presentationHTML = await generatePresentationHTML(slidesContent, topic, model)
    console.log("✅ HTML completo gerado")

    // Criar ID único
    const presentationId = `pres-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    // Armazenar em memória global
    if (typeof globalThis !== "undefined") {
      if (!globalThis.presentations) {
        globalThis.presentations = new Map()
      }
      globalThis.presentations.set(presentationId, {
        id: presentationId,
        title: topic,
        description: description || "",
        html: presentationHTML,
        slides: slidesContent,
        slideCount: slidesContent.length,
        createdAt: new Date().toISOString(),
      })
    }

    console.log(`✨ Apresentação criada: ${presentationId}`)

    return Response.json({
      presentationId,
      slideCount: slidesContent.length,
      slides: slidesContent.map((slide, idx) => ({
        id: `slide${idx + 1}`,
        title: slide.title,
        content: slide.content,
        notes: slide.notes,
      })),
      message: "Apresentação gerada com sucesso! Redirecionando...",
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