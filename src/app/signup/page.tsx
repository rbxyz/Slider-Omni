"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Loader2, UserPlus, User, Mail, Lock, Sparkles } from "lucide-react"

export default function SignupPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const resp = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        setError(data?.error || "Registration failed")
        return
      }

      if (data?.token) {
        localStorage.setItem("authToken", data.token)
        document.cookie = `authToken=${data.token}; path=/; max-age=3600; SameSite=Lax`
        window.location.href = "/"
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-primary to-blue-600 relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Gradient Circles */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-pink-400/30 to-blue-500/30 rounded-full blur-3xl animate-float-slower"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-cyan-400/30 to-blue-600/30 rounded-full blur-3xl animate-float-slowest"></div>
        <div className="absolute top-1/2 right-1/3 w-96 h-96 bg-gradient-to-r from-indigo-400/30 to-purple-600/30 rounded-full blur-3xl animate-float-slow"></div>
      </div>
      
      {/* Glass Effect Overlay */}
      <div className="absolute inset-0 -z-[5] bg-white/5 backdrop-blur-3xl"></div>

      {/* Signup Card */}
      <Card className="w-full max-w-md border-white/20 bg-white/10 backdrop-blur-2xl shadow-2xl relative z-10">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-white">Criar conta</CardTitle>
          <CardDescription className="text-white/80">
            Preencha os dados abaixo para começar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-500/20 border border-red-500/50 p-3 text-sm text-red-100 backdrop-blur-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-white flex items-center gap-2">
                <User className="h-4 w-4" />
                Usuário
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Escolha um nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-white flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-white flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Crie uma senha segura"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-white text-primary hover:bg-white/90 font-semibold h-11 text-base"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-5 w-5" />
                  Criar Conta
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-white/80">
            Já tem uma conta?{" "}
            <Link href="/login" className="font-semibold text-white hover:underline">
              Fazer login
            </Link>
          </div>
          <Link href="/" className="text-sm text-white/60 hover:text-white/80 transition-colors flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" />
            Voltar ao início
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
