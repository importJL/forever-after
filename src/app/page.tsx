'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAmplifySession } from '@/lib/amplify-session-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useTheme } from 'next-themes'
import { Heart, Users, DollarSign, CheckSquare, Store, Clock, Image, MapPin, Sun, Moon, ArrowRight, Sparkles } from 'lucide-react'

const features = [
  { icon: Users, label: 'Guest Management', desc: 'Track RSVPs, manage seating, and communicate with your guests effortlessly' },
  { icon: DollarSign, label: 'Budget Tracker', desc: 'Set budgets, track expenses, and never miss a payment' },
  { icon: CheckSquare, label: 'Task Checklist', desc: 'Stay organized with deadlines, assignments, and progress tracking' },
  { icon: Store, label: 'Vendor Management', desc: 'Compare, book, and manage all your wedding vendors in one place' },
  { icon: Clock, label: 'Wedding Timeline', desc: 'Design your perfect day down to the minute' },
  { icon: Image, label: 'Media Gallery', desc: 'Collect inspiration, mood boards, and memories' },
]

export default function LandingPage() {
  const router = useRouter()
  const { user, loading } = useAmplifySession()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!loading && user) {
      router.push('/app')
    }
  }, [user, loading, router])

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-sm">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-[family-name:var(--font-playfair)] text-lg font-semibold">ForeverAfter</span>
          </div>
          <div className="flex items-center gap-3">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <Button variant="ghost" onClick={() => router.push('/login')}>
              Sign In
            </Button>
            <Button onClick={() => router.push('/register')} className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/25">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-rose-50/50 via-transparent to-transparent dark:from-rose-950/20 dark:via-transparent" />
          <div className="max-w-6xl mx-auto px-4 pt-24 pb-32 md:pt-32 md:pb-40 text-center relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-sm text-rose-600 dark:text-rose-400 mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Your all-in-one wedding planning companion</span>
            </div>
            <h1 className="font-[family-name:var(--font-playfair)] text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight">
              Plan Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-rose-600"> Perfect Day</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              From guest lists to budgets, timelines to vendors — manage every detail of your wedding with elegance and ease.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => router.push('/register')}
                className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/25 px-8 h-13 text-base gap-2"
              >
                Start Planning Free
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push('/login')}
                className="px-8 h-13 text-base"
              >
                Sign In
              </Button>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 pb-32">
          <div className="text-center mb-16">
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Thoughtfully designed tools to keep your wedding planning organized, stress-free, and beautiful.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.label} className="p-6 border-border/50 hover:border-rose-200 dark:hover:border-rose-800 transition-colors bg-card/50 hover:bg-card">
                <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-rose-500" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/20 dark:to-amber-950/20 border-y border-border/50">
          <div className="max-w-6xl mx-auto px-4 py-24 text-center">
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Ready to Begin?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8">
              Join couples who trust ForeverAfter to plan their special day. It&apos;s free to get started.
            </p>
            <Button
              size="lg"
              onClick={() => router.push('/register')}
              className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/25 px-8 h-13 text-base gap-2"
            >
              Create Your Wedding
              <Heart className="w-4 h-4 fill-white" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background/50 backdrop-blur-sm py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            ForeverAfter Wedding Planner
          </div>
          <span>Plan your perfect day</span>
        </div>
      </footer>
    </div>
  )
}
