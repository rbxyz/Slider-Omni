"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import type React from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { Card } from "~/components/ui/card"
import {
  Loader2,
  Sparkles,
  Plus,
  Presentation,
  LogIn,
  User,
  Coins,
  Palette,
  FolderOpen,
} from "lucide-react"

interface Template {
  id: string
  name: string
  description: string
  theme: string
  layoutCount: number
}

export default function Home() {
  const [topic, setTopic] = useState("")
  const [description, setDescription] = useState("")
  const [slideCount, setSlideCount] = useState(5)
  const [selectedTemplate, setSelectedTemplate] = useState("dark-premium")
  const [mixLayouts, setMixLayouts] = useState(true)
  const [templates, setTemplates] = useState<Template[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{
    username: string
    email: string
    permissions?: { sudo?: boolean | string | number }
    omnitokens?: number
    omnicoins?: number
  } | null>(null)

  const hasSudoPermission = (permissions?: { sudo?: boolean | string | number }) => {
    if (!permissions) return false
    const sudo = permissions.sudo
    return sudo === true || sudo === "true" || sudo === 1 || sudo === "1"
  }

  // Carregar templates disponíveis
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/generate-with-template", { method: "GET" })
        if (res.ok) {
          const data = await res.json()
          setTemplates(data.templates)
        }
      } catch (err) {
        console.error("Erro ao carregar templates:", err)
      }
    }

    fetchTemplates()
  }, [])

  // Verificar autenticação
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const tok = localStorage.getItem("authToken")
        if (tok) {
          setIsAuthenticated(true)
          try {
            const resp = await fetch("/api/auth/me", {
              headers: { Authorization: `Bearer ${tok}` },
            })
            if (resp.ok) {
              const data = await resp.json()
              if (data?.user) {
                setUser({
                  username: data.user.username,
                  email: data.user.email || "",
                  permissions: data.user.permissions || {},
                  omnitokens: data.user.omnitokens ?? 0,
                  omnicoins: data.user.omnicoins ?? 0,
                })
              }
            } else {
              localStorage.removeItem("authToken")
              setIsAuthenticated(false)
              setUser(null)
            }
          } catch (err) {
            console.error("Erro ao buscar dados do usuário:", err)
            setIsAuthenticated(false)
            setUser(null)
          }
        } else {
          setIsAuthenticated(false)
          setUser(null)
        }
      } catch (e) {
        setIsAuthenticated(false)
        setUser(null)
      }
    }
    checkAuth()
  }, [])

  const handleGenerate = async () => {
    if (!topic.trim()) return
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
    if (!token) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`
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
          slideCount,
          templateId: selectedTemplate,
          mixLayouts,
        }),
      })

      const data = await resp.json()
      if (data && data.presentationId) {
        window.location.href = `/presentations/${data.presentationId}`
      } else {
        console.error("Erro ao gerar apresentação", data)
      }
    } catch (error) {
      console.error("Erro:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-primary to-blue-600 relative overflow-hidden">
      {/* Animated Gradient Circles */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-pink-400/30 to-blue-500/30 rounded-full blur-3xl animate-float-slower"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-cyan-400/30 to-blue-600/30 rounded-full blur-3xl animate-float-slowest"></div>
        <div className="absolute top-1/2 right-1/3 w-96 h-96 bg-gradient-to-r from-indigo-400/30 to-purple-600/30 rounded-full blur-3xl animate-float-slow"></div>
      </div>

      <div className="absolute inset-0 -z-[5] bg-white/5 backdrop-blur-3xl"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/10 backdrop-blur-xl supports-[backdrop-filter]:bg-white/5">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Slider Omni</h1>
          </div>
          <div className="flex items-center gap-2">
            {!isAuthenticated ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login" className="flex items-center">
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/minhas-apresentacoes" className="flex items-center">
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Minhas Apresentações
                  </Link>
                </Button>

                {hasSudoPermission(user?.permissions) && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/painel">Painel</Link>
                  </Button>
                )}

                {user && (
                  <>
                    {(user.omnitokens !== undefined || user.omnicoins !== undefined) && (
                      <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border border-white/20 bg-white/10 backdrop-blur-xl shadow-lg">
                        <Coins className="h-4 w-4 text-white" />
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-white">{user.omnitokens ?? 0}</span>
                            <span className="text-white/80">tokens</span>
                          </div>
                          <div className="h-4 w-px bg-white/30"></div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-white">{user.omnicoins ?? 0}</span>
                            <span className="text-white/80">coins</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/20 bg-white/10 backdrop-blur-xl shadow-lg">
                      <User className="h-4 w-4 text-white" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{user.username}</span>
                        {user.email && (
                          <span className="text-xs text-white/80">{user.email}</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto max-w-4xl px-4 py-16 relative z-10">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Nova Geração de IA
          </div>
          <h2 className="mb-6 text-balance text-5xl font-bold tracking-tight sm:text-7xl text-white">
            Crie apresentações <br />
            <span className="text-white">incríveis com IA</span>
          </h2>
          <p className="mx-auto max-w-2xl text-balance text-xl text-white/90">
            Transforme suas ideias em slides profissionais em segundos com templates personalizados.
          </p>
        </div>

        {/* Creation Form */}
        <Card className="border-white/20 bg-white/10 p-8 backdrop-blur-2xl shadow-2xl ring-1 ring-white/20">
          <div className="space-y-6">
            <div>
              <label htmlFor="topic" className="mb-2 block text-sm font-medium text-white">
                Tópico da Apresentação
              </label>
              <Input
                id="topic"
                className="rounded-md text-lg"
                placeholder="Ex: Inteligência Artificial no Marketing Digital"
                value={topic}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-white">
                Descrição (opcional)
              </label>
              <Textarea
                id="description"
                className="rounded-md"
                placeholder="Adicione detalhes sobre o que você quer incluir..."
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
                rows={3}
                disabled={isGenerating}
              />
            </div>

            {/* Template Selection */}
            <div>
              <div className="mb-3 block text-sm font-medium text-white flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Escolha um Template
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplate(t.id)}
                    disabled={isGenerating}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedTemplate === t.id
                        ? "border-white bg-white/20"
                        : "border-white/20 bg-white/5 hover:border-white/40"
                    } disabled:opacity-50`}
                  >
                    <div className="font-medium text-white">{t.name}</div>
                    <div className="text-xs text-white/70 mt-1">{t.description}</div>
                    <div className="text-xs text-white/60 mt-2">
                      {t.layoutCount} layouts disponíveis
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mix Layouts Toggle */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <input
                id="mixLayouts"
                type="checkbox"
                checked={mixLayouts}
                onChange={(e) => setMixLayouts(e.target.checked)}
                disabled={isGenerating}
                className="w-4 h-4 cursor-pointer"
              />
              <label htmlFor="mixLayouts" className="text-sm text-white cursor-pointer flex-1">
                <div className="font-medium">Mesclar Layouts</div>
                <div className="text-xs text-white/70">
                  Alterna entre diferentes layouts para cada slide
                </div>
              </label>
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSlideCount(Number(e.target.value))
                }
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
                disabled={isGenerating}
              />
              <div className="mt-1 flex justify-between text-xs text-white/80">
                <span>3 slides</span>
                <span>15 slides</span>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!topic.trim() || isGenerating || templates.length === 0}
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
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
              <Palette className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 font-semibold text-white">Templates Profissionais</h3>
            <p className="text-sm text-white/90">
              4 templates com múltiplos layouts cada um
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 font-semibold text-white">Layouts Mesclados</h3>
            <p className="text-sm text-white/90">Alterna automaticamente entre diferentes estilos</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
              <Presentation className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 font-semibold text-white">Sem Limites</h3>
            <p className="text-sm text-white/90">Crie quantas apresentações quiser</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/20 bg-white/10 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-sm text-white/80">
          <p>&copy; {new Date().getFullYear()} Allpines. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}