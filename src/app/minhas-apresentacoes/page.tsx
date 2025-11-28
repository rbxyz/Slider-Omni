"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import {
  Loader2,
  Presentation,
  LogIn,
  User,
  Coins,
  Calendar,
  FileText,
  ArrowLeft,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface PresentationItem {
  id: string
  title: string | null
  description: string | null
  slideCount: number | null
  createdAt: string
  updatedAt: string | null
}

export default function MinhasApresentacoesPage() {
  const router = useRouter()
  const [presentations, setPresentations] = useState<PresentationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
              router.push(`/login?next=${encodeURIComponent("/minhas-apresentacoes")}`)
            }
          } catch (err) {
            console.error("Erro ao buscar dados do usuário:", err)
            setIsAuthenticated(false)
            setUser(null)
            router.push(`/login?next=${encodeURIComponent("/minhas-apresentacoes")}`)
          }
        } else {
          setIsAuthenticated(false)
          setUser(null)
          router.push(`/login?next=${encodeURIComponent("/minhas-apresentacoes")}`)
        }
      } catch (e) {
        setIsAuthenticated(false)
        setUser(null)
        router.push(`/login?next=${encodeURIComponent("/minhas-apresentacoes")}`)
      }
    }
    checkAuth()
  }, [router])

  // Carregar apresentações
  useEffect(() => {
    const fetchPresentations = async () => {
      if (!isAuthenticated) return

      try {
        const token = localStorage.getItem("authToken")
        if (!token) {
          setIsLoading(false)
          return
        }

        const res = await fetch("/api/presentations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.ok) {
          const data = await res.json()
          setPresentations(data.presentations || [])
        } else if (res.status === 401) {
          localStorage.removeItem("authToken")
          router.push(`/login?next=${encodeURIComponent("/minhas-apresentacoes")}`)
        }
      } catch (err) {
        console.error("Erro ao carregar apresentações:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPresentations()
  }, [isAuthenticated, router])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    } catch {
      return dateString
    }
  }

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-primary to-blue-600 relative overflow-hidden">
      {/* Animated Gradient Circles */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-pink-400/30 to-blue-500/30 rounded-full blur-3xl animate-float-slower"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-cyan-400/30 to-blue-600/30 rounded-full blur-3xl animate-float-slowest"></div>
      </div>

      <div className="absolute inset-0 -z-[5] bg-white/5 backdrop-blur-3xl"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/10 backdrop-blur-xl supports-[backdrop-filter]:bg-white/5">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="flex items-center text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <h1 className="text-xl font-bold text-white">Minhas Apresentações</h1>
          </div>
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto max-w-6xl px-4 py-16 relative z-10">
        {presentations.length === 0 ? (
          <Card className="border-white/20 bg-white/10 p-12 backdrop-blur-2xl shadow-2xl ring-1 ring-white/20 text-center">
            <Presentation className="mx-auto h-16 w-16 text-white/60 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Nenhuma apresentação encontrada</h2>
            <p className="text-white/80 mb-6">
              Você ainda não criou nenhuma apresentação. Comece criando sua primeira apresentação!
            </p>
            <Button asChild size="lg">
              <Link href="/">
                <Presentation className="mr-2 h-5 w-5" />
                Criar Nova Apresentação
              </Link>
            </Button>
          </Card>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                {presentations.length} {presentations.length === 1 ? "Apresentação" : "Apresentações"}
              </h2>
              <p className="text-white/80">Gerencie e acesse suas apresentações criadas</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {presentations.map((pres) => (
                <Card
                  key={pres.id}
                  className="border-white/20 bg-white/10 backdrop-blur-2xl shadow-xl ring-1 ring-white/20 hover:bg-white/15 transition-all cursor-pointer group"
                >
                  <Link href={`/presentations/${pres.id}`}>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                            {pres.title || "Sem título"}
                          </h3>
                          {pres.description && (
                            <p className="text-sm text-white/70 line-clamp-2 mb-3">
                              {pres.description}
                            </p>
                          )}
                        </div>
                        <Presentation className="h-5 w-5 text-white/60 group-hover:text-white transition-colors flex-shrink-0 ml-2" />
                      </div>

                      <div className="flex items-center gap-4 text-xs text-white/60">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          <span>{pres.slideCount ?? 0} slides</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDate(pres.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          </>
        )}
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

