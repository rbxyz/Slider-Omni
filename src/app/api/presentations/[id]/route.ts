export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Retrieve from global memory
    if (typeof globalThis !== "undefined" && globalThis.presentations) {
      const presentation = globalThis.presentations.get(id)

      if (presentation) {
        // If presentation already has `html` and `slideCount`, return as-is
        if (presentation.html && presentation.slideCount) {
          return Response.json(presentation)
        }

        // If presentation was stored as `slides` array, convert to combined HTML
        if (Array.isArray(presentation.slides) && presentation.slides.length > 0) {
          const generatedSlides = presentation.slides as Array<any>

          const baseStyles = `
            :root{--bg:#0b1020;--fg:#e6eef8;--accent:#7c5cff}
            html,body{height:100%;width:100%;margin:0;padding:0;overflow:hidden;background:var(--bg);color:var(--fg);font-family:Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial}
            .slide{position:absolute;top:0;left:0;align-items:center;justify-content:center;width:100vw;height:100vh;padding:48px;box-sizing:border-box;margin:0;z-index:1}
            .slide.active{z-index:10}
            [id^="slide"]{position:absolute;top:0;left:0;width:100vw;height:100vh;margin:0;padding:0;z-index:1}
            [id^="slide"].active{z-index:10}
            .card{max-width:1200px;width:100%;background:linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));box-shadow:0 10px 30px rgba(2,6,23,0.6);border-radius:16px;padding:40px}
            h1{margin:0 0 16px;font-size:2.25rem}
            p,li{color:var(--fg);line-height:1.5}
            ul{padding-left:1.1rem}
            .card{transition:transform .45s cubic-bezier(.2,.9,.3,1);}
            .slide.active .card{transform:translateY(0)}
          `

          const extractBody = (html: string) => {
            const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
            if (m && m[1]) return m[1]
            return html.replace(/<doctype[^>]*>/i, "").replace(/<html[^>]*>/i, "").replace(/<\/html>/i, "").replace(/<head[\s\S]*?<\/head>/i, "")
          }

          const slidesHtml = generatedSlides
            .map((s: any, i: number) => {
              const inner = extractBody(String(s.htmlContent ?? s.html ?? ""))
              return `
                <div id="slide${i + 1}" class="slide" data-order="${i + 1}">
                  <div class="card">
                    ${inner}
                  </div>
                </div>
              `
            })
            .join("\n")

          const combinedHtml = `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width,initial-scale=1" />
              <style>${baseStyles}</style>
            </head>
            <body>
              ${slidesHtml}
              <script>
                (function(){
                  try{
                    const first = document.getElementById('slide1')
                    if(first) {
                      first.classList.add('active')
                      first.style.display = 'flex'
                    }
                    // Ensure all other slides are hidden
                    const allSlides = document.querySelectorAll('[id^="slide"]')
                    allSlides.forEach((slide, index) => {
                      if(index !== 0) {
                        slide.classList.remove('active')
                        slide.style.display = 'none'
                      }
                    })
                  }catch(e){
                    console.error('Error initializing slides:', e)
                  }
                })()
              </script>
            </body>
            </html>`

          const normalized = {
            id: presentation.id,
            title: presentation.title,
            description: presentation.description,
            html: combinedHtml,
            slideCount: generatedSlides.length,
            createdAt: presentation.createdAt,
          }

          // Optionally replace stored value so future requests are faster
          try {
            globalThis.presentations.set(id, normalized)
          } catch (e) {
            // ignore
          }

          return Response.json(normalized)
        }

        return Response.json(presentation)
      }
    }

    return Response.json({ error: "Presentation not found" }, { status: 404 })
  } catch (error) {
    console.error("[v0] Error fetching presentation:", error)
    return Response.json({ error: "Failed to fetch presentation" }, { status: 500 })
  }
}
