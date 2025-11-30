"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Textarea } from "~/components/ui/textarea"
import {
  Loader2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Palette,
  FileText,
  Edit,
  Check,
} from "lucide-react"

interface Template {
  id: string
  name: string
  description: string
  theme: string
  layoutCount: number
}

interface SlideContent {
  title: string
  content: string[]
  notes?: string
}

export default function GeneratePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [topic, setTopic] = useState("")
  const [description, setDescription] = useState("")
  const [slideCount, setSlideCount] = useState(5)
  const [slidesContent, setSlidesContent] = useState<SlideContent[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState("dark-premium")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)

  // Carregar dados iniciais da query string
  useEffect(() => {
    const topicParam = searchParams.get("topic")
    const descParam = searchParams.get("description")
    if (topicParam) setTopic(topicParam)
    if (descParam) setDescription(descParam)
  }, [searchParams])

  // Carregar templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoadingTemplates(true)
      try {
        const res = await fetch("/api/generate-with-template", { method: "GET" })
        if (res.ok) {
          const data = await res.json()
          setTemplates(data.templates)
        }
      } catch (err) {
        console.error("Erro ao carregar templates:", err)
      } finally {
        setIsLoadingTemplates(false)
      }
    }

    fetchTemplates()
  }, [])

  // Etapa 1: Gerar conteúdo dos slides
  const handleGenerateContent = async () => {
    if (!topic.trim()) return
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
    if (!token) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    setIsGenerating(true)
    try {
      const resp = await fetch("/api/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic,
          description,
          slideCount,
        }),
      })

      const data = await resp.json()
      if (data && data.slides) {
        setSlidesContent(data.slides)
        setStep(2)
      } else {
        console.error("Erro ao gerar conteúdo", data)
        alert(data.error || "Erro ao gerar conteúdo dos slides")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao gerar conteúdo dos slides")
    } finally {
      setIsGenerating(false)
    }
  }

  // Etapa 3: Gerar apresentação final
  const handleGeneratePresentation = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
    if (!token) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    setIsGenerating(true)
    try {
      const resp = await fetch("/api/generate-with-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic,
          description,
          slideCount: slidesContent.length,
          templateId: selectedTemplate,
          mixLayouts: false, // Sempre usar o primeiro layout
          slides: slidesContent, // Enviar slides editados
        }),
      })

      const data = await resp.json()
      if (data && data.presentationId) {
        router.push(`/presentations/${data.presentationId}`)
      } else {
        console.error("Erro ao gerar apresentação", data)
        alert(data.error || "Erro ao gerar apresentação")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao gerar apresentação")
    } finally {
      setIsGenerating(false)
    }
  }

  const updateSlide = (index: number, field: keyof SlideContent, value: string | string[]) => {
    const updated = [...slidesContent]
    const currentSlide = updated[index]
    if (!currentSlide) return
    
    if (field === "title" && typeof value === "string") {
      updated[index] = { ...currentSlide, title: value }
    } else if (field === "content" && Array.isArray(value)) {
      updated[index] = { ...currentSlide, content: value }
    } else if (field === "notes" && typeof value === "string") {
      updated[index] = { ...currentSlide, notes: value }
    }
    setSlidesContent(updated)
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-primary to-blue-600 relative overflow-hidden">
      {/* Animated Gradient Circles */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-pink-400/30 to-blue-500/30 rounded-full blur-3xl animate-float-slower"></div>
      </div>

      <div className="absolute inset-0 -z-[5] bg-white/5 backdrop-blur-3xl"></div>

      <div className="container mx-auto max-w-6xl px-4 py-8 relative z-10">
        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-white" : "text-white/50"}`}>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                step >= 1 ? "border-white bg-white/20" : "border-white/30"
              }`}
            >
              {step > 1 ? <Check className="h-5 w-5" /> : <span>1</span>}
            </div>
            <span className="hidden sm:inline">Tema</span>
          </div>
          <div className={`h-px w-16 ${step >= 2 ? "bg-white" : "bg-white/30"}`} />
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-white" : "text-white/50"}`}>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                step >= 2 ? "border-white bg-white/20" : "border-white/30"
              }`}
            >
              {step > 2 ? <Check className="h-5 w-5" /> : <span>2</span>}
            </div>
            <span className="hidden sm:inline">Template</span>
          </div>
          <div className={`h-px w-16 ${step >= 3 ? "bg-white" : "bg-white/30"}`} />
          <div className={`flex items-center gap-2 ${step >= 3 ? "text-white" : "text-white/50"}`}>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                step >= 3 ? "border-white bg-white/20" : "border-white/30"
              }`}
            >
              <span>3</span>
            </div>
            <span className="hidden sm:inline">Edição</span>
          </div>
        </div>

        {/* Step 1: Tema e Descrição */}
        {step === 1 && (
          <Card className="border-white/20 bg-white/10 p-8 backdrop-blur-2xl shadow-2xl ring-1 ring-white/20">
            <CardHeader>
              <CardTitle className="text-white text-2xl flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Etapa 1: Defina o Tema
              </CardTitle>
              <CardDescription className="text-white/80">
                Informe o tema e a descrição da sua apresentação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label htmlFor="topic" className="mb-2 block text-sm font-medium text-white">
                  Tópico da Apresentação
                </label>
                <input
                  id="topic"
                  className="w-full rounded-md bg-white/10 border border-white/20 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="Ex: Inteligência Artificial no Marketing Digital"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label htmlFor="description" className="mb-2 block text-sm font-medium text-white">
                  Descrição (opcional)
                </label>
                <Textarea
                  id="description"
                  className="rounded-md bg-white/10 border border-white/20 text-white placeholder:text-white/50"
                  placeholder="Adicione detalhes sobre o que você quer incluir..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label htmlFor="slideCount" className="mb-2 block text-sm font-medium text-white">
                  Número de Slides: {slideCount}
                </label>
                <input
                  id="slideCount"
                  type="range"
                  min="3"
                  max="15"
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-white"
                  disabled={isGenerating}
                />
                <div className="mt-1 flex justify-between text-xs text-white/80">
                  <span>3 slides</span>
                  <span>15 slides</span>
                </div>
              </div>

              <Button
                onClick={handleGenerateContent}
                disabled={!topic.trim() || isGenerating}
                className="w-full py-6 text-lg"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Gerando conteúdo...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Gerar Conteúdo
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Cards com textos + Seleção de Template */}
        {step === 2 && (
          <div className="space-y-6">
            <Card className="border-white/20 bg-white/10 p-6 backdrop-blur-2xl shadow-2xl ring-1 ring-white/20">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Etapa 2: Escolha o Template
                </CardTitle>
                <CardDescription className="text-white/80">
                  Selecione um template e revise os slides gerados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTemplates ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTemplate(t.id)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          selectedTemplate === t.id
                            ? "border-white bg-white/20"
                            : "border-white/20 bg-white/5 hover:border-white/40"
                        }`}
                      >
                        <div className="font-medium text-white">{t.name}</div>
                        <div className="text-xs text-white/70 mt-1">{t.description}</div>
                        <div className="text-xs text-white/60 mt-2">
                          {t.layoutCount} layouts disponíveis
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/20 bg-white/10 p-6 backdrop-blur-2xl shadow-2xl ring-1 ring-white/20">
              <CardHeader>
                <CardTitle className="text-white text-xl">Slides Gerados</CardTitle>
                <CardDescription className="text-white/80">
                  {slidesContent.length} slides criados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {slidesContent.map((slide, idx) => (
                    <Card
                      key={idx}
                      className="border-white/20 bg-white/5 backdrop-blur-xl"
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-white">
                          Slide {idx + 1}: {slide.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-xs text-white/80 space-y-1 list-disc list-inside">
                          {slide.content.slice(0, 3).map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                          {slide.content.length > 3 && (
                            <li className="text-white/60">+{slide.content.length - 3} mais</li>
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!selectedTemplate}
                className="flex-1"
              >
                Continuar
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Edição dos Slides */}
        {step === 3 && (
          <div className="space-y-6">
            <Card className="border-white/20 bg-white/10 p-6 backdrop-blur-2xl shadow-2xl ring-1 ring-white/20">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Etapa 3: Edite os Slides
                </CardTitle>
                <CardDescription className="text-white/80">
                  Revise e edite os textos de cada slide antes de finalizar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {slidesContent.map((slide, idx) => (
                    <Card
                      key={idx}
                      className="border-white/20 bg-white/5 backdrop-blur-xl"
                    >
                      <CardHeader>
                        <CardTitle className="text-white">Slide {idx + 1}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-white/90">
                            Título
                          </label>
                          <input
                            type="text"
                            value={slide.title}
                            onChange={(e) => updateSlide(idx, "title", e.target.value)}
                            className="w-full rounded-md bg-white/10 border border-white/20 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-white/90">
                            Conteúdo (um item por linha)
                          </label>
                          <Textarea
                            value={slide.content.join("\n")}
                            onChange={(e) =>
                              updateSlide(
                                idx,
                                "content",
                                e.target.value.split("\n").filter((line) => line.trim()),
                              )
                            }
                            rows={4}
                            className="rounded-md bg-white/10 border border-white/20 text-white placeholder:text-white/50"
                          />
                        </div>
                        {slide.notes && (
                          <div>
                            <label className="mb-2 block text-sm font-medium text-white/90">
                              Notas (opcional)
                            </label>
                            <Textarea
                              value={slide.notes}
                              onChange={(e) => updateSlide(idx, "notes", e.target.value)}
                              rows={2}
                              className="rounded-md bg-white/10 border border-white/20 text-white placeholder:text-white/50"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button
                onClick={handleGeneratePresentation}
                disabled={isGenerating}
                className="flex-1"
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
                    Finalizar Apresentação
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

