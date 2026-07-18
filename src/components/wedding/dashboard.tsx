'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Heart,
  Users,
  Wallet,
  ListChecks,
  CalendarDays,
  UserPlus,
  PlusCircle,
  Receipt,
  Store,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  TrendingUp,
  Bell,
  ArrowRight,
  Sparkles,
  Gift,
} from 'lucide-react'
import { useWeddingStore } from '@/lib/store'
import { useAmplifySession } from '@/lib/amplify-session-provider'
import { LocationLink } from '@/components/map/location-link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const CHART_COLORS = {
  accepted: '#10b981',
  declined: '#f43f5e',
  pending: '#f59e0b',
  maybe: '#8b5cf6',
}

const BUDGET_COLORS = ['#f43f5e', '#f59e0b', '#8b5cf6', '#10b981', '#3b82f6']

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    if (!targetDate) return

    const calculate = () => {
      const now = new Date()
      const target = new Date(targetDate)

      if (isNaN(target.getTime())) return

      setTimeLeft({
        days: Math.max(0, differenceInDays(target, now)),
        hours: Math.max(0, differenceInHours(target, now) % 24),
        minutes: Math.max(0, differenceInMinutes(target, now) % 60),
        seconds: Math.max(0, differenceInSeconds(target, now) % 60),
      })
    }

    calculate()
    const interval = setInterval(calculate, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ]

  return (
    <div className="flex gap-3 sm:gap-4 justify-center mt-4">
      {units.map((unit) => (
        <div key={unit.label} className="text-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center border border-white/30 shadow-lg">
            <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">
              {String(unit.value).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[10px] sm:text-xs text-rose-100 font-medium mt-1.5 block uppercase tracking-wider">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function SetupPrompt({ onNavigate }: { onNavigate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-dashed border-2 border-rose-200 dark:border-rose-900/50 bg-gradient-to-br from-rose-50/80 to-amber-50/50 dark:from-rose-950/20 dark:to-amber-950/10">
        <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/30 dark:to-rose-800/30 flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Welcome to ForeverAfter
          </h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Let&apos;s get started by setting up your wedding details. Add your names,
            pick a date, and let the planning begin!
          </p>
          <Button
            onClick={onNavigate}
            className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/25"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Set Up Your Wedding
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  accentColor,
  children,
  delay = 0,
}: {
  icon: React.ElementType
  label: string
  value: string
  description?: string
  accentColor: string
  children?: React.ReactNode
  delay?: number
}) {
  return (
    <motion.div variants={itemVariants} custom={delay}>
      <Card className="relative overflow-hidden hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between mb-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${accentColor}`}
            >
              <Icon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          {description && (
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">{description}</p>
          )}
          {children && <div className="mt-3">{children}</div>}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900/40',
    high: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/40',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/40',
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400 border-slate-200 dark:border-slate-700/40',
  }
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${styles[priority] || styles.low}`}>
      {priority}
    </Badge>
  )
}

function CustomTooltip({ active, payload, label: tooltipLabel }: { active?: boolean; payload?: Array<{ name: string; value: number; payload?: { fill?: string } }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-popover-foreground">{tooltipLabel}</p>
      {payload.map((entry: { name: string; value: number; color: string }, i: number) => (
        <p key={i} className="text-muted-foreground text-xs mt-0.5">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

export function DashboardView() {
  const {
    wedding,
    guests,
    tasks,
    budgetCategories,
    notifications,
    setActiveView,
  } = useWeddingStore()
  const { user } = useAmplifySession()
  const isAdmin = user?.role === 'admin'

  // Derived data
  const guestStats = useMemo(() => {
    const accepted = guests.filter((g) => g.rsvpStatus === 'accepted').length
    const declined = guests.filter((g) => g.rsvpStatus === 'declined').length
    const pending = guests.filter((g) => g.rsvpStatus === 'pending').length
    const maybe = guests.filter((g) => g.rsvpStatus === 'maybe').length
    return { total: guests.length, accepted, declined, pending, maybe }
  }, [guests])

  const budgetStats = useMemo(() => {
    const totalBudget = wedding.budgetTotal > 0 ? wedding.budgetTotal : budgetCategories.reduce((sum, c) => sum + c.budgeted, 0)
    const totalSpent = budgetCategories.reduce((sum, c) => sum + c.spent, 0)
    return { totalBudget, totalSpent, percentage: totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0 }
  }, [budgetCategories, wedding.budgetTotal])

  const taskStats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.status === 'done').length
    return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 }
  }, [tasks])

  const daysUntilWedding = useMemo(() => {
    if (!wedding.date) return null
    const target = new Date(wedding.date)
    if (isNaN(target.getTime())) return null
    return Math.max(0, differenceInDays(target, new Date()))
  }, [wedding.date])

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status !== 'done' && t.status !== 'cancelled' && t.dueDate)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5)
  }, [tasks])

  const recentNotifications = useMemo(() => {
    return notifications.slice(0, 6)
  }, [notifications])

  const rsvpData = useMemo(() => [
    { name: 'Accepted', value: guestStats.accepted, color: CHART_COLORS.accepted },
    { name: 'Declined', value: guestStats.declined, color: CHART_COLORS.declined },
    { name: 'Pending', value: guestStats.pending, color: CHART_COLORS.pending },
    { name: 'Maybe', value: guestStats.maybe, color: CHART_COLORS.maybe },
  ].filter((d) => d.value > 0), [guestStats])

  const budgetChartData = useMemo(() => {
    return [...budgetCategories]
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5)
      .map((c, i) => ({
        name: c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name,
        fullName: c.name,
        spent: c.spent,
        budgeted: c.budgeted,
        fill: BUDGET_COLORS[i % BUDGET_COLORS.length],
      }))
  }, [budgetCategories])

  const hasWeddingDate = wedding.date && !isNaN(new Date(wedding.date).getTime())
  const coupleDisplay = wedding.partner1 && wedding.partner2
    ? `${wedding.partner1} & ${wedding.partner2}`
    : wedding.coupleName || 'Your Wedding'

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)

  // Show setup prompt if no wedding date
  if (!hasWeddingDate) {
    if (isAdmin) {
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
          <SetupPrompt onNavigate={() => setActiveView('settings')} />
        </div>
      )
    }
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-dashed border-2 border-rose-200 dark:border-rose-900/50 bg-gradient-to-br from-rose-50/80 to-amber-50/50 dark:from-rose-950/20 dark:to-amber-950/10">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/30 dark:to-rose-800/30 flex items-center justify-center mb-6">
                <Heart className="w-10 h-10 text-rose-500" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Welcome{user?.firstName ? `, ${user.firstName}` : ''}!
              </h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Your wedding planner is being set up. Check back soon or contact your planner for updates.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 sm:p-6 lg:p-8 space-y-6"
    >
      {/* Hero Banner */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="relative bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 dark:from-rose-700 dark:via-rose-800 dark:to-pink-900 p-6 sm:p-8">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

            <div className="relative z-10">
              {user?.firstName && (
                <p className="text-rose-100/80 text-sm mb-1">
                  Welcome back, {user.firstName}
                </p>
              )}
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-5 h-5 text-rose-200" fill="currentColor" />
                <span className="text-rose-200 text-sm font-medium tracking-wide uppercase">
                  Counting Down To
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-[family-name:var(--font-playfair)]">
                {coupleDisplay}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-rose-100 text-sm mb-6">
                {wedding.date && (
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4" />
                    <span>{format(new Date(wedding.date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                )}
                {(wedding.venue || wedding.venueAddress) && (
                  <LocationLink
                    locationName={wedding.venue}
                    address={wedding.venueAddress}
                    className="text-rose-100 hover:text-white"
                  />
                )}
                {(wedding.ceremonyLocation || wedding.ceremonyAddress) && (
                  <LocationLink
                    locationName={wedding.ceremonyLocation}
                    address={wedding.ceremonyAddress}
                    className="text-rose-100 hover:text-white"
                  />
                )}
              </div>

              {wedding.ceremonyDate && (
                <div className="flex items-center gap-1.5 text-rose-100 text-sm mb-6">
                  <CalendarDays className="w-4 h-4" />
                  <span>
                    Ceremony: {format(new Date(wedding.ceremonyDate), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                  </span>
                </div>
              )}

              <CountdownTimer targetDate={wedding.date} />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Guests"
          value={String(guestStats.total)}
          description={`${guestStats.accepted} accepted · ${guestStats.pending} pending · ${guestStats.declined} declined`}
          accentColor="bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
        >
          <div className="flex gap-2">
            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40">
              {guestStats.accepted} ✓
            </Badge>
            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40">
              {guestStats.pending} ⏳
            </Badge>
            <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/40">
              {guestStats.declined} ✗
            </Badge>
          </div>
        </StatCard>

        <StatCard
          icon={Wallet}
          label="Budget"
          value={`${formatCurrency(budgetStats.totalSpent)}`}
          description={`of ${formatCurrency(budgetStats.totalBudget)} budget`}
          accentColor="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
        >
          <div className="space-y-1.5">
            <Progress
              value={budgetStats.percentage}
              className="h-2 [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-amber-400 [&>[data-slot=progress-indicator]]:to-rose-500"
            />
            <p className="text-[11px] text-muted-foreground">
              {budgetStats.percentage.toFixed(1)}% spent
            </p>
          </div>
        </StatCard>

        <StatCard
          icon={ListChecks}
          label="Tasks Completed"
          value={`${taskStats.completed} / ${taskStats.total}`}
          description={taskStats.total > 0 ? `${taskStats.percentage.toFixed(0)}% complete` : 'No tasks yet'}
          accentColor="bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
        >
          <div className="space-y-1.5">
            <Progress
              value={taskStats.percentage}
              className="h-2 [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-violet-400 [&>[data-slot=progress-indicator]]:to-violet-600"
            />
          </div>
        </StatCard>

        <StatCard
          icon={CalendarDays}
          label="Days Until Wedding"
          value={daysUntilWedding !== null ? String(daysUntilWedding) : '—'}
          description={daysUntilWedding === 0 ? "It's your wedding day! 💍" : undefined}
          accentColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Common tasks to keep your planning moving</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-auto py-3 px-4 flex flex-col items-center gap-2 hover:border-rose-300 hover:bg-rose-50/50 dark:hover:border-rose-800 dark:hover:bg-rose-950/20 transition-colors"
                onClick={() => setActiveView('guests')}
              >
                <UserPlus className="w-5 h-5 text-rose-500" />
                <span className="text-xs font-medium">Add Guest</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 px-4 flex flex-col items-center gap-2 hover:border-violet-300 hover:bg-violet-50/50 dark:hover:border-violet-800 dark:hover:bg-violet-950/20 transition-colors"
                onClick={() => setActiveView('tasks')}
              >
                <PlusCircle className="w-5 h-5 text-violet-500" />
                <span className="text-xs font-medium">Add Task</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 px-4 flex flex-col items-center gap-2 hover:border-amber-300 hover:bg-amber-50/50 dark:hover:border-amber-800 dark:hover:bg-amber-950/20 transition-colors"
                onClick={() => setActiveView('budget')}
              >
                <Receipt className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-medium">Add Expense</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 px-4 flex flex-col items-center gap-2 hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20 transition-colors"
                onClick={() => setActiveView('vendors')}
              >
                <Store className="w-5 h-5 text-emerald-500" />
                <span className="text-xs font-medium">Add Vendor</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Tasks */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Upcoming Tasks
                  </CardTitle>
                  <CardDescription>Next tasks due that need your attention</CardDescription>
                </div>
                {tasks.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-rose-500 hover:text-rose-600"
                    onClick={() => setActiveView('tasks')}
                  >
                    View All
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
                  <p className="text-sm">All tasks are complete!</p>
                  <p className="text-xs mt-1">Or no tasks with due dates yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingTasks.map((task, i) => {
                    const dueDate = new Date(task.dueDate)
                    const isOverdue = dueDate < new Date() && task.status !== 'done'
                    const isToday = format(dueDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
                      >
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          isOverdue ? 'bg-red-500' : isToday ? 'bg-amber-500' : 'bg-rose-300 dark:bg-rose-700'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              {format(dueDate, 'MMM d, yyyy')}
                            </span>
                            {task.category && (
                              <span className="text-[11px] text-muted-foreground/70">
                                · {task.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <PriorityBadge priority={task.priority} />
                        {isOverdue && (
                          <Badge variant="destructive" className="text-[10px] px-1.5">
                            Overdue
                          </Badge>
                        )}
                        {isToday && !isOverdue && (
                          <Badge className="text-[10px] px-1.5 bg-amber-500 text-white border-amber-500">
                            Today
                          </Badge>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* RSVP Summary Pie Chart */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Gift className="w-4 h-4 text-rose-500" />
                RSVP Summary
              </CardTitle>
              <CardDescription>Guest response overview</CardDescription>
            </CardHeader>
            <CardContent>
              {guestStats.total === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm">No guests yet</p>
                  <p className="text-xs mt-1">Add guests to see RSVP data</p>
                </div>
              ) : (
                <div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={rsvpData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {rsvpData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      { label: 'Accepted', count: guestStats.accepted, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400' },
                      { label: 'Pending', count: guestStats.pending, color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400' },
                      { label: 'Declined', count: guestStats.declined, color: 'text-rose-600 bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400' },
                      { label: 'Maybe', count: guestStats.maybe, color: 'text-violet-600 bg-violet-100 dark:bg-violet-950/30 dark:text-violet-400' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 text-xs">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.color.split(' ')[1]}`} style={{
                          backgroundColor: item.label === 'Accepted' ? CHART_COLORS.accepted
                            : item.label === 'Pending' ? CHART_COLORS.pending
                            : item.label === 'Declined' ? CHART_COLORS.declined
                            : CHART_COLORS.maybe
                        }} />
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="ml-auto font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Grid: Recent Activity + Budget Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="w-4 h-4 text-violet-500" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest updates and reminders</CardDescription>
                </div>
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-rose-500 hover:text-rose-600"
                    onClick={() => setActiveView('notifications')}
                  >
                    View All
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {recentNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm">No recent activity</p>
                  <p className="text-xs mt-1">Notifications will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentNotifications.map((notification, i) => {
                    const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
                      info: { icon: HelpCircle, color: 'text-blue-500 bg-blue-100 dark:bg-blue-950/30' },
                      warning: { icon: AlertCircle, color: 'text-amber-500 bg-amber-100 dark:bg-amber-950/30' },
                      success: { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-950/30' },
                      reminder: { icon: Clock, color: 'text-violet-500 bg-violet-100 dark:bg-violet-950/30' },
                    }
                    const { icon: NotifIcon, color } = iconMap[notification.type] || iconMap.info

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                          <NotifIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{notification.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Budget Overview Bar Chart */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-5 text-amber-500" />
                    Budget Overview
                  </CardTitle>
                  <CardDescription>Top 5 categories by amount spent</CardDescription>
                </div>
                {budgetCategories.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-rose-500 hover:text-rose-600"
                    onClick={() => setActiveView('budget')}
                  >
                    View All
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {budgetChartData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm">No budget data yet</p>
                  <p className="text-xs mt-1">Add budget categories and expenses</p>
                </div>
              ) : (
                <div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={budgetChartData} barSize={28} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                          width={50}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="spent" name="Spent" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded bg-gradient-to-r from-rose-400 to-rose-600" />
                    <span>Spent amount per category</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}