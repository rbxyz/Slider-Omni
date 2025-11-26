"use client"

import { useState } from "react"
import type React from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { Card } from "~/components/ui/card"
import { Loader2, Sparkles, Plus, Presentation } from "lucide-react"

export default function Home() {
  const [topic, setTopic] = useState("")
  const [description, setDescription] = useState("")
  const [slideCount, setSlideCount] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!topic.trim()) return

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, description, slideCount }),
      })

      const data = await response.json()

      if (data.presentationId) {
        // Redirect to presentation viewer
        window.location.href = `/presentation/${data.presentationId}`
      }
    } catch (error) {
      console.error("Error generating slides:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Presentation className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">SlideGen AI</h1>
          </div>
          <Button variant="outline" size="sm">
            Minhas Apresentações
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-balance text-5xl font-bold">
            Crie apresentações incríveis com <span className="text-primary">IA</span>
          </h2>
          <p className="text-balance text-xl text-muted-foreground">
            Transforme suas ideias em slides profissionais em segundos
          </p>
        </div>

        {/* Creation Form */}
        <Card className="border-border/50 bg-card/50 p-8 backdrop-blur">
          <div className="space-y-6">
            <div>
              <label htmlFor="topic" className="mb-2 block text-sm font-medium">
                Tópico da Apresentação
              </label>
              <Input
                id="topic"
                placeholder="Ex: Inteligência Artificial no Marketing Digital"
                value={topic}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
                className="text-lg"
                disabled={isGenerating}
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium">
                Descrição (opcional)
              </label>
              <Textarea
                id="description"
                placeholder="Adicione detalhes sobre o que você quer incluir na apresentação..."
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                rows={4}
                disabled={isGenerating}
              />
            </div>

            <div>
              <label htmlFor="slideCount" className="mb-2 block text-sm font-medium">
                Número de Slides: {slideCount}
              </label>
              <input
                id="slideCount"
                type="range"
                min="3"
                max="15"
                value={slideCount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlideCount(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
                disabled={isGenerating}
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>3 slides</span>
                <span>15 slides</span>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!topic.trim() || isGenerating}
              className="w-full py-6 text-lg"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Gerando apresentação...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Gerar Apresentação
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Features */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold">IA Avançada</h3>
            <p className="text-sm text-muted-foreground">
              Conteúdo gerado por inteligência artificial de última geração
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold">Design Profissional</h3>
            <p className="text-sm text-muted-foreground">Layouts modernos e responsivos automaticamente</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Presentation className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold">Rápido e Fácil</h3>
            <p className="text-sm text-muted-foreground">Crie apresentações completas em menos de um minuto</p>
          </div>
        </div>
      </div>
    </div>
  )
}
