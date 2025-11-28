"use client"

import React, { use, useEffect, useState, useRef } from "react"
import { SlideNavigation } from "~/app/_components/presentations/slide-navigation"
import { Loader2 } from "lucide-react"

interface Presentation {
  id: string
  title: string
  description?: string
  html: string
  slideCount: number
  createdAt: Date
}

export default function PresentationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [presentation, setPresentation] = useState<Presentation | null>(null)
  const [currentSlide, setCurrentSlide] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const iframeLoadedRef = useRef(false)

  // Fetch presentation data
  useEffect(() => {
    const fetchPresentation = async () => {
      try {
        const response = await fetch(`/api/presentations/${id}`)
        if (!response.ok) {
          throw new Error("Presentation not found")
        }
        const data = await response.json()
        setPresentation(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load presentation")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPresentation()
  }, [id])

  // Load presentation HTML into iframe
  useEffect(() => {
    if (!presentation || !iframeRef.current || iframeLoadedRef.current) return

    const iframe = iframeRef.current
    const doc = iframe.contentDocument

    if (doc) {
      doc.open()
      doc.write(presentation.html)
      doc.close()
      iframeLoadedRef.current = true
      console.log("✅ Apresentação carregada no iframe")
    }
  }, [presentation])

  // Handle slide changes via postMessage
  useEffect(() => {
    if (!iframeRef.current || !iframeLoadedRef.current) return

    const iframe = iframeRef.current
    const doc = iframe.contentDocument

    if (doc && typeof (doc.defaultView as any)?.showSlide === "function") {
      ;(doc.defaultView as any).showSlide(currentSlide)
      console.log(`🎬 Slide mudado para: ${currentSlide}`)
    }
  }, [currentSlide])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!presentation) return

      if (e.key === "ArrowRight" && currentSlide < presentation.slideCount) {
        setCurrentSlide((prev) => prev + 1)
      } else if (e.key === "ArrowLeft" && currentSlide > 1) {
        setCurrentSlide((prev) => prev - 1)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentSlide, presentation])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando apresentação...</p>
        </div>
      </div>
    )
  }

  if (error || !presentation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Apresentação não encontrada</h1>
          <p className="mb-4 text-muted-foreground">{error ?? "A apresentação solicitada não existe."}</p>
          <a href="/" className="text-primary hover:underline">
            Voltar para o início
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="h-screen w-full">
        <iframe
          ref={iframeRef}
          title={presentation.title}
          className="h-full w-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
        <div className="pointer-events-auto">
          <SlideNavigation
            currentSlide={currentSlide}
            totalSlides={presentation.slideCount}
            onPrevious={() => setCurrentSlide((prev) => Math.max(1, prev - 1))}
            onNext={() => setCurrentSlide((prev) => Math.min(presentation.slideCount, prev + 1))}
            presentationTitle={presentation.title}
          />
        </div>
      </div>
    </div>
  )
}