"use client"

import React, { useEffect, useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { Loader2 } from "lucide-react"

interface SlideEdit {
  title: string
  content: string[]
  layout: string
}

export default function ReviewPage() {
  const [slides, setSlides] = useState<SlideEdit[]>([])
  const [topic, setTopic] = useState("")
  const [description, setDescription] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("lastPresentationStructure")
      if (raw) {
        const parsed = JSON.parse(raw)
        setTopic(parsed.topic ?? "")
        setDescription(parsed.description ?? "")
        const s = (parsed.slides ?? []).map((sl: any) => ({
          title: sl.title ?? "",
          content: Array.isArray(sl.content) ? sl.content : (String(sl.content || "")).split("\n"),
          layout: sl.layout ?? "title-content",
        }))
        setSlides(s)
      }
    } catch (e) {
      console.error("Failed to load structure from sessionStorage", e)
    }
  }, [])

  const updateSlide = (index: number, patch: Partial<SlideEdit>) => {
    setSlides((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  const handleGenerate = async () => {
    if (slides.length === 0) return
    setIsGenerating(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
      if (!token) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`
        return
      }
      const body = {
        topic,
        description,
        slideCount: slides.length,
        structure: slides.map((s) => ({ title: s.title, content: s.content, layout: s.layout })),
      }

      const resp = await fetch("/api/generate-slides/from-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })

      const data = await resp.json()
      if (data?.presentationId) {
        // Clear the temporary structure and navigate to presentation
        sessionStorage.removeItem("lastPresentationStructure")
        window.location.href = `/presentations/${data.presentationId}`
      } else {
        console.error("Failed to generate presentation", data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Revisar e Editar Slides</h1>
            <p className="text-sm text-muted-foreground">Revise os cards gerados, edite títulos e conteúdos e confirme para gerar os slides finais.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              Voltar
            </Button>
            <Button onClick={handleGenerate} disabled={isGenerating} size="sm">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...
                </>
              ) : (
                "Gerar Apresentação"
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {slides.map((s, idx) => (
            <Card key={idx} className="p-4">
              <CardHeader>
                <CardTitle className="text-lg">Slide {idx + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium">Título</label>
                    <Input value={s.title} onChange={(e) => updateSlide(idx, { title: e.target.value })} />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium">Conteúdo (linhas = bullets)</label>
                    <Textarea
                      rows={4}
                      value={s.content.join("\n")}
                      onChange={(e) => updateSlide(idx, { content: e.target.value.split("\n") })}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium">Layout sugerido</label>
                    <Input value={s.layout} onChange={(e) => updateSlide(idx, { layout: e.target.value })} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
