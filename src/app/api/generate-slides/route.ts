import { generateText } from "ai"
import { createAzure } from "@ai-sdk/azure"
import { env } from "~/env"

interface SlideStructure {
  title: string
  content: string[]
  layout: string
  notes?: string
}

// Configure Azure OpenAI provider
const azure = createAzure({
  apiKey: env.AZURE_OPENAI_API_KEY,
  endpoint: env.AZURE_OPENAI_ENDPOINT,
  apiVersion: env.AZURE_OPENAI_API_VERSION,
})

export async function POST(request: Request) {
  try {
    const { topic, description, slideCount } = await request.json()

    if (!topic || !slideCount) {
      return Response.json({ error: "Topic and slide count are required" }, { status: 400 })
    }

    // Generate presentation structure with AI
    const { text: structureText } = await generateText({
      model: azure(env.AZURE_OPENAI_DEPLOYMENT_NAME),
      prompt: `Create a presentation structure about "${topic}".
${description ? `Additional context: ${description}` : ""}

Generate exactly ${slideCount} slides. For each slide, provide:
1. A clear title
2. Key points or content (2-4 bullet points or paragraphs)
3. A suggested visual style or layout type (title-only, title-content, title-image-content, two-column, etc.)

Format your response as a JSON array of slides with this structure:
[
  {
    "title": "Slide title",
    "content": ["Point 1", "Point 2", "Point 3"],
    "layout": "title-content",
    "notes": "Optional speaker notes"
  }
]

Make it professional, engaging, and well-structured. Return ONLY the JSON array, no additional text.`,
    })

    // Parse the structure
    let slides: SlideStructure[]
    try {
      slides = JSON.parse(structureText) as SlideStructure[]
    } catch {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = structureText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        slides = JSON.parse(jsonMatch[0]) as SlideStructure[]
      } else {
        throw new Error("Failed to parse slide structure")
      }
    }

    // Generate HTML for each slide
    const generatedSlides = await Promise.all(
      slides.map(async (slide: SlideStructure, index: number) => {
        const { text: htmlContent } = await generateText({
          model: azure(env.AZURE_OPENAI_DEPLOYMENT_NAME),
          prompt: `Generate a complete, self-contained HTML slide for a presentation.

Slide ${index + 1} of ${slideCount}:
Title: ${slide.title}
Content: ${JSON.stringify(slide.content)}
Layout: ${slide.layout}

Requirements:
- Create a COMPLETE HTML document with <!DOCTYPE html>, <html>, <head>, and <body>
- Include ALL CSS inline in a <style> tag (no external stylesheets)
- Use modern, professional design with gradients, shadows, and animations
- Make it visually stunning and engaging
- Use a dark theme with vibrant accent colors
- Ensure text is readable with proper contrast
- Make it responsive and centered
- Include smooth transitions and hover effects where appropriate
- The slide should fill the entire viewport (100vw x 100vh)
- Use flexbox for layout
- Add subtle animations for visual interest

Return ONLY the complete HTML code, nothing else.`,
        })

        return {
          id: `slide-${index + 1}`,
          title: slide.title,
          htmlContent: htmlContent.trim(),
          order: index + 1,
        }
      }),
    )

    // Create presentation ID and store in memory (for now)
    const presentationId = `pres-${Date.now()}`

    // Store in global memory (in a real app, this would be a database)
    if (typeof globalThis !== "undefined") {
      if (!globalThis.presentations) {
        globalThis.presentations = new Map()
      }
      globalThis.presentations.set(presentationId, {
        id: presentationId,
        title: topic,
        description,
        slides: generatedSlides,
        createdAt: new Date(),
      })
    }

    return Response.json({
      presentationId,
      slideCount: generatedSlides.length,
      message: "Presentation generated successfully",
    })
  } catch (error) {
    console.error("[v0] Error generating slides:", error)
    return Response.json(
      { error: "Failed to generate slides", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
