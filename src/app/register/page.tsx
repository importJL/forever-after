'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signUp, confirmSignUp, signIn } from 'aws-amplify/auth'
import { useAmplifySession } from '@/lib/amplify-session-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Heart, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: sessionLoading } = useAmplifySession()

  const [name, setName] = useState('')
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(searchParams.get('confirm') === 'true')
  const [confirmationCode, setConfirmationCode] = useState('')

  useEffect(() => {
    if (!sessionLoading && user) {
      router.push('/app')
    }
  }, [user, sessionLoading, router])

  if (sessionLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signUp({ username: email, password, options: { userAttributes: { email, name } } })
      setNeedsConfirmation(true)
      setLoading(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      if (message.includes('UsernameExistsException')) {
        setError('An account with this email already exists. Please sign in.')
      } else {
        setError(message)
      }
      setLoading(false)
    }
  }

  async function handleConfirmSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { nextStep } = await confirmSignUp({ username: email, confirmationCode })

      if (nextStep.signUpStep !== 'COMPLETE_AUTO_SIGN_IN') {
        await signIn({ username: email, password })
      }

      setRegistered(true)
      router.push('/app')
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid confirmation code'
      setError(message)
      setLoading(false)
    }
  }

  if (needsConfirmation) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border bg-background/50">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-sm">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-[family-name:var(--font-playfair)] text-lg font-semibold">ForeverAfter</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md border-border/50 shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-950/40 dark:to-amber-950/40 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-rose-500" />
              </div>
              <CardTitle className="text-2xl font-[family-name:var(--font-playfair)]">Check Your Email</CardTitle>
              <CardDescription>Enter the confirmation code sent to {email}</CardDescription>
            </CardHeader>
            <form onSubmit={handleConfirmSignUp}>
              <CardContent className="space-y-4 pt-4">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive text-center">{error}</div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="code">Confirmation Code</Label>
                  <Input id="code" type="text" placeholder="Enter code" value={confirmationCode} onChange={(e) => setConfirmationCode(e.target.value)} required autoComplete="one-time-code" />
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4 pt-2">
                <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/25 h-11">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Sign In'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </main>
      </div>
    )
  }

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-border/50 shadow-lg text-center">
          <CardHeader>
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl font-[family-name:var(--font-playfair)]">Account Created!</CardTitle>
            <CardDescription>Redirecting you to your wedding planner...</CardDescription>
          </CardHeader>
          <CardContent>
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-background/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-sm">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-[family-name:var(--font-playfair)] text-lg font-semibold">ForeverAfter</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-border/50 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-950/40 dark:to-amber-950/40 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-rose-500" />
            </div>
            <CardTitle className="text-2xl font-[family-name:var(--font-playfair)]">Create Account</CardTitle>
            <CardDescription>Start planning your perfect wedding</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignUp}>
            <CardContent className="space-y-4 pt-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive text-center">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4 pt-2">
              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/25 h-11">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{' '}
                <Link href="/login" className="text-rose-500 hover:text-rose-600 font-medium transition-colors">Sign in</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
