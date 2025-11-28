"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import type React from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { Card } from "~/components/ui/card"
import { Loader2, Sparkles, Plus, Presentation, LogIn, User, Coins } from "lucide-react"

export default function Home() {
  const [topic, setTopic] = useState("")
  const [description, setDescription] = useState("")
  const [slideCount, setSlideCount] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{ username: string; email: string; permissions?: { sudo?: boolean | string | number }; omnitokens?: number; omnicoins?: number } | null>(null)

  const hasSudoPermission = (permissions?: { sudo?: boolean | string | number }) => {
    if (!permissions) return false
    const sudo = permissions.sudo
    return sudo === true || sudo === "true" || sudo === 1 || sudo === "1"
  }

  const handleGenerate = async () => {
    if (!topic.trim()) return
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
    if (!token) {
      // redirect to login preserving current path
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`
      return
    }
    setIsGenerating(true)
    try {
      // First request structure only
      const resp = await fetch("/api/generate-structure", {
        method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic, description, slideCount }),
      })

      const data = await resp.json()
      if (data && data.presentationId) {
        // Navigate directly to presentation page
        window.location.href = `/presentations/${data.presentationId}`
      } else {
        console.error("No presentation ID received", data)
      }
    } catch (error) {
      console.error("Error generating structure:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const tok = localStorage.getItem("authToken")
        if (tok) {
          setIsAuthenticated(true)
          // Buscar dados do usuário
          try {
            const resp = await fetch("/api/auth/me", {
              headers: { Authorization: `Bearer ${tok}` },
            })
            if (resp.ok) {
              const data = await resp.json()
              if (data?.user) {
                console.log("User data received:", data.user)
                console.log("Permissions:", data.user.permissions)
                console.log("Sudo value:", data.user.permissions?.sudo)
                setUser({
                  username: data.user.username,
                  email: data.user.email || "",
                  permissions: data.user.permissions || {},
                  omnitokens: data.user.omnitokens ?? 0,
                  omnicoins: data.user.omnicoins ?? 0,
                })
              }
            } else {
              // Token inválido, limpar
              localStorage.removeItem("authToken")
              setIsAuthenticated(false)
              setUser(null)
            }
          } catch (err) {
            console.error("Error fetching user data:", err)
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

  return (
    <div className="min-h-screen bg-gradient-to-r from-primary to-blue-600 relative overflow-hidden">
      {/* Animated Gradient Circles */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-pink-400/30 to-blue-500/30 rounded-full blur-3xl animate-float-slower"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-cyan-400/30 to-blue-600/30 rounded-full blur-3xl animate-float-slowest"></div>
        <div className="absolute top-1/2 right-1/3 w-96 h-96 bg-gradient-to-r from-indigo-400/30 to-purple-600/30 rounded-full blur-3xl animate-float-slow"></div>
      </div>
      
      {/* Glass Effect Overlay */}
      <div className="absolute inset-0 -z-[5] bg-white/5 backdrop-blur-3xl"></div>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/10 backdrop-blur-xl supports-[backdrop-filter]:bg-white/5">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Silder Omni</h1>
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
                {hasSudoPermission(user?.permissions) && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/painel">Painel</Link>
                  </Button>
                )}

                <Button variant="outline" size="sm">
                  Minhas Apresentações
                </Button>

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
            <span className="text-white">
              incríveis com IA
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-balance text-xl text-white/90">
            Transforme suas ideias em slides profissionais em segundos. Deixe a inteligência artificial cuidar do design e do conteúdo.
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
                placeholder="Adicione detalhes sobre o que você quer incluir na apresentação..."
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                rows={4}
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlideCount(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
                disabled={isGenerating}
              />
              <div className="mt-1 flex justify-between text-xs text-white/80">
                <span>3 slides</span>
                <span>15 slides</span>
              </div>
            </div>

            <Button
              type="button"
              className="w-full cursor-pointer py-6 text-lg"
              disabled={!topic.trim() || isGenerating}
              onClick={handleGenerate}
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
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 font-semibold text-white">IA Avançada</h3>
            <p className="text-sm text-white/90">
              Conteúdo gerado por inteligência artificial de última geração
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 font-semibold text-white">Design Profissional</h3>
            <p className="text-sm text-white/90">Layouts modernos e responsivos automaticamente</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
              <Presentation className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 font-semibold text-white">Rápido e Fácil</h3>
            <p className="text-sm text-white/90">Crie apresentações completas em menos de um minuto</p>
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
