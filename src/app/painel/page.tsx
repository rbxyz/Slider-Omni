"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { api } from "~/trpc/react"
import { User, Coins, LogOut, Home, Search, Sparkles, Loader2 } from "lucide-react"

type ProviderFormState = Record<string, string>

const defaultAzureState: ProviderFormState = {
  apiKey: "",
  endpoint: "",
  deploymentName: "",
  apiVersion: "2024-02-15-preview",
}

const defaultOpenRouterState: ProviderFormState = {
  apiKey: "",
  baseUrl: "https://openrouter.ai/api/v1",
  model: "openrouter/auto",
}

export default function PainelPage() {
  const utils = api.useUtils()
  const { data: providers, isPending } = api.llm.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })

  const [azureState, setAzureState] = useState<ProviderFormState>(defaultAzureState)
  const [openRouterState, setOpenRouterState] = useState<ProviderFormState>(defaultOpenRouterState)
  const [status, setStatus] = useState<string>("")
  const [user, setUser] = useState<{ username: string; email: string; omnitokens?: number; omnicoins?: number } | null>(null)
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  const azureConfig = useMemo(() => providers?.find((item) => item.provider === "azure"), [providers])
  const openRouterConfig = useMemo(
    () => providers?.find((item) => item.provider === "openrouter"),
    [providers],
  )
  const activeProvider = useMemo(
    () => providers?.find((item) => item.isActive)?.provider,
    [providers],
  )

  useEffect(() => {
    if (azureConfig) {
      setAzureState({
        apiKey: azureConfig.apiKey ?? "",
        endpoint: azureConfig.azureEndpoint ?? "",
        deploymentName: azureConfig.azureDeploymentName ?? "",
        apiVersion: azureConfig.azureApiVersion ?? "2024-02-15-preview",
      })
    }
  }, [azureConfig])

  useEffect(() => {
    if (openRouterConfig) {
      setOpenRouterState({
        apiKey: openRouterConfig.apiKey ?? "",
        baseUrl: openRouterConfig.baseUrl ?? "https://openrouter.ai/api/v1",
        model: openRouterConfig.model ?? "openrouter/auto",
      })
    }
  }, [openRouterConfig])

  // Buscar dados do usuário
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("authToken")
        if (token) {
          try {
            const resp = await fetch("/api/auth/me", {
              headers: { Authorization: `Bearer ${token}` },
            })
            if (resp.ok) {
              const data = await resp.json()
              if (data?.user) {
                setUser({
                  username: data.user.username,
                  email: data.user.email || "",
                  omnitokens: data.user.omnitokens ?? 0,
                  omnicoins: data.user.omnicoins ?? 0,
                })
              }
            }
          } catch (err) {
            console.error("Error fetching user data:", err)
          }
        }
      } catch (e) {
        console.error("Error checking auth:", e)
      }
    }
    checkAuth()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    document.cookie = "authToken=; path=/; max-age=0"
    window.location.href = "/"
  }

  const upsertAzure = api.llm.upsertAzure.useMutation({
    onSuccess: async () => {
      setStatus("Configuração da Azure salva com sucesso.")
      await utils.llm.list.invalidate()
    },
    onError: (error) => {
      setStatus(error.message ?? "Erro ao salvar configuração da Azure.")
    },
  })

  const upsertOpenRouter = api.llm.upsertOpenRouter.useMutation({
    onSuccess: async () => {
      setStatus("Configuração do OpenRouter salva com sucesso.")
      await utils.llm.list.invalidate()
    },
    onError: (error) => {
      setStatus(error.message ?? "Erro ao salvar configuração do OpenRouter.")
    },
  })

  const setActiveProviderMutation = api.llm.setActive.useMutation({
    onSuccess: async () => {
      setStatus("Provedor ativo atualizado.")
      await utils.llm.list.invalidate()
    },
    onError: (error) => {
      setStatus(error.message ?? "Erro ao atualizar provedor ativo.")
    },
  })

  const handleAzureSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus("")
    
    // Validar que os campos obrigatórios não estão vazios
    if (!azureState.apiKey || !azureState.endpoint || !azureState.deploymentName) {
      setStatus("Por favor, preencha todos os campos obrigatórios.")
      return
    }
    
    await upsertAzure.mutateAsync({
      apiKey: azureState.apiKey,
      endpoint: azureState.endpoint,
      deploymentName: azureState.deploymentName,
      apiVersion: azureState.apiVersion || "2024-02-15-preview",
    })
  }

  const handleOpenRouterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus("")
    
    // Validar que os campos obrigatórios não estão vazios
    if (!openRouterState.apiKey || !openRouterState.model) {
      setStatus("Por favor, preencha todos os campos obrigatórios.")
      return
    }
    
    await upsertOpenRouter.mutateAsync({
      apiKey: openRouterState.apiKey,
      baseUrl: openRouterState.baseUrl,
      model: openRouterState.model,
    })
  }

  const handleActivate = async (provider: "azure" | "openrouter") => {
    setStatus("")
    await setActiveProviderMutation.mutateAsync({ provider })
  }

  // Buscar modelos disponíveis do OpenRouter
  const fetchAvailableModels = async () => {
    if (!openRouterState.apiKey) {
      setStatus("Por favor, insira a API Key do OpenRouter primeiro.")
      return
    }

    setIsLoadingModels(true)
    setStatus("")
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          "Authorization": `Bearer ${openRouterState.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!resp.ok) {
        throw new Error("Erro ao buscar modelos. Verifique sua API Key.")
      }

      const data = await resp.json()
      const models = data.data?.map((model: any) => model.id) || []
      setAvailableModels(models)
      setStatus(`Encontrados ${models.length} modelos disponíveis.`)
    } catch (err: any) {
      setStatus(err.message || "Erro ao buscar modelos do OpenRouter.")
      setAvailableModels([])
    } finally {
      setIsLoadingModels(false)
    }
  }

  // Modelos populares do OpenRouter
  const popularModels = [
    "openrouter/auto",
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
    "openai/gpt-4-turbo",
    "openai/gpt-3.5-turbo",
    "anthropic/claude-3.5-sonnet",
    "anthropic/claude-3-opus",
    "anthropic/claude-3-sonnet",
    "google/gemini-pro-1.5",
    "meta-llama/llama-3.1-405b-instruct",
    "meta-llama/llama-3.1-70b-instruct",
    "meta-llama/llama-3.1-8b-instruct",
    "mistralai/mistral-large",
    "mistralai/mixtral-8x7b-instruct",
    "perplexity/llama-3.1-sonar-large-128k-online",
  ]

  const renderStatus = () =>
    status ? <p className="rounded-md border border-dashed border-primary/40 p-3 text-sm">{status}</p> : null

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
            <Link href="/">
              <h1 className="text-xl font-bold text-white hover:opacity-80 transition-opacity">Silder Omni</h1>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="border-white/20 bg-white/10 text-white hover:bg-white/20 shadow-lg backdrop-blur-xl">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Início
              </Link>
            </Button>

            {user && (
              <>
                {(user.omnitokens !== undefined || user.omnicoins !== undefined) && (
                  <div className="flex items-center gap-3 px-3 py-1.5 rounded-md border border-white/20 bg-white/10 shadow-lg backdrop-blur-xl">
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

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/20 bg-white/10 shadow-lg backdrop-blur-xl">
                  <User className="h-4 w-4 text-white/80" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">{user.username}</span>
                    {user.email && (
                      <span className="text-xs text-white/80">{user.email}</span>
                    )}
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20 shadow-lg backdrop-blur-xl"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto max-w-4xl space-y-6 px-4 py-10 relative z-10">
        <CreditsCard />

      <div>
        <h1 className="text-3xl text-white font-semibold">Painel de Provedores</h1>
        <p className="text-muted-foreground text-white ">
          Configure as chaves e defina qual provedor ficará ativo no gerador de slides.
        </p>
      </div>

      {renderStatus()}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Azure OpenAI</CardTitle>
            <CardDescription>Informe as credenciais e o deployment configurado no Azure.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleAzureSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <Input
                  value={azureState.apiKey}
                  onChange={(event) =>
                    setAzureState((prev) => ({ ...prev, apiKey: event.target.value }))
                  }
                  placeholder="Azure API Key"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Endpoint</label>
                <Input
                  value={azureState.endpoint}
                  onChange={(event) =>
                    setAzureState((prev) => ({ ...prev, endpoint: event.target.value }))
                  }
                  placeholder="https://example-resource.openai.azure.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Deployment</label>
                <Input
                  value={azureState.deploymentName}
                  onChange={(event) =>
                    setAzureState((prev) => ({ ...prev, deploymentName: event.target.value }))
                  }
                  placeholder="gpt-4o-mini"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">API Version</label>
                <Input
                  value={azureState.apiVersion}
                  onChange={(event) =>
                    setAzureState((prev) => ({ ...prev, apiVersion: event.target.value }))
                  }
                  placeholder="2024-02-15-preview"
                  required
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Button type="submit" disabled={upsertAzure.isPending}>
                  {upsertAzure.isPending ? "Salvando..." : "Salvar Azure"}
                </Button>
                <Button
                  type="button"
                  variant={activeProvider === "azure" ? "default" : "outline"}
                  onClick={() => handleActivate("azure")}
                  disabled={setActiveProviderMutation.isPending || !azureConfig}
                >
                  {activeProvider === "azure" ? "Azure Ativo" : "Ativar Azure"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>OpenRouter</CardTitle>
            <CardDescription>Configure o endpoint compatível e o modelo desejado.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleOpenRouterSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <Input
                  value={openRouterState.apiKey}
                  onChange={(event) =>
                    setOpenRouterState((prev) => ({ ...prev, apiKey: event.target.value }))
                  }
                  placeholder="OpenRouter API Key"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Base URL</label>
                <Input
                  value={openRouterState.baseUrl}
                  onChange={(event) =>
                    setOpenRouterState((prev) => ({ ...prev, baseUrl: event.target.value }))
                  }
                  placeholder="https://openrouter.ai/api/v1"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Modelo</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={fetchAvailableModels}
                    disabled={isLoadingModels || !openRouterState.apiKey}
                    className="h-7 text-xs"
                  >
                    {isLoadingModels ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="mr-1 h-3 w-3" />
                        Buscar Modelos
                      </>
                    )}
                  </Button>
                </div>
                <Input
                  value={openRouterState.model}
                  onChange={(event) =>
                    setOpenRouterState((prev) => ({ ...prev, model: event.target.value }))
                  }
                  placeholder="openrouter/auto"
                  list="openrouter-models"
                  required
                  className="font-mono text-sm"
                />
                <datalist id="openrouter-models">
                  {popularModels.map((model) => (
                    <option key={model} value={model} />
                  ))}
                  {availableModels.map((model) => (
                    <option key={model} value={model} />
                  ))}
                </datalist>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Digite o ID do modelo ou selecione uma sugestão. Use <code className="text-xs bg-muted px-1 py-0.5 rounded">openrouter/auto</code> para seleção automática.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {popularModels.slice(0, 6).map((model) => (
                      <button
                        key={model}
                        type="button"
                        onClick={() => setOpenRouterState((prev) => ({ ...prev, model }))}
                        className="text-xs px-2 py-1 rounded-md border border-border bg-muted/50 hover:bg-muted transition-colors font-mono"
                      >
                        {model.split("/").pop()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Button type="submit" disabled={upsertOpenRouter.isPending}>
                  {upsertOpenRouter.isPending ? "Salvando..." : "Salvar OpenRouter"}
                </Button>
                <Button
                  type="button"
                  variant={activeProvider === "openrouter" ? "default" : "outline"}
                  onClick={() => handleActivate("openrouter")}
                  disabled={setActiveProviderMutation.isPending || !openRouterConfig}
                >
                  {activeProvider === "openrouter" ? "OpenRouter Ativo" : "Ativar OpenRouter"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status Atual</CardTitle>
          <CardDescription>Resumo das configurações registradas no banco.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPending ? (
            <p>Carregando provedores...</p>
          ) : providers && providers.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {providers.map((provider) => (
                <li
                  key={provider.id}
                  className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2"
                >
                  <div>
                    <p className="font-medium capitalize">{provider.provider}</p>
                    <p className="text-xs text-muted-foreground">
                      Atualizado em {new Date(provider.updatedAt ?? provider.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      provider.isActive ? "text-green-500" : "text-muted-foreground"
                    }`}
                  >
                    {provider.isActive ? "Ativo" : "Inativo"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma configuração encontrada.</p>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

function CreditsCard() {
  const [users, setUsers] = useState<Array<any>>([])
  const [loading, setLoading] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
      const resp = await fetch(`/api/auth/admin/credits`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await resp.json()
      if (resp.ok) setUsers(data.users ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleReset = async (username: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
      const resp = await fetch(`/api/auth/admin/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username }),
      })
      if (resp.ok) await fetchUsers()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créditos de Usuários</CardTitle>
        <CardDescription>Visualize e resete omnitokens / omnicoins (admin)</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Carregando usuários...</p>
        ) : (
          <ul className="space-y-2">
            {users.map((u: any) => (
              <li key={u.username} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <div className="font-medium">{u.username}</div>
                  <div className="text-xs text-muted-foreground">omnitokens: {u.omnitokens} • omnicoins: {u.omnicoins}</div>
                </div>
                <div>
                  <Button size="sm" variant="destructive" onClick={() => handleReset(u.username)}>
                    Resetar Créditos
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

