'use client'

import { useWeddingStore, ViewType } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import {
  LayoutDashboard,
  Users,
  Wallet,
  ListChecks,
  Store,
  Clock,
  Image,
  Armchair,
  FileUp,
  Link2,
  Bell,
  Settings,
  Heart,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sun,
  Moon,
  Download,
} from 'lucide-react'

interface NavItem {
  id: ViewType
  label: string
  icon: React.ElementType
  badge?: string
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'guests', label: 'Guests', icon: Users },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'vendors', label: 'Vendors', icon: Store },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'media', label: 'Media', icon: Image },
  { id: 'seating', label: 'Seating', icon: Armchair },
  { id: 'links', label: 'Web Links', icon: Link2 },
  { id: 'import', label: 'Import Files', icon: FileUp },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function WeddingSidebar() {
  const { activeView, setActiveView, sidebarOpen, setSidebarOpen, notifications, wedding, guests, tasks, budgetCategories, vendors, timelineEvents, mediaItems, webLinks } = useWeddingStore()
  const { theme, setTheme } = useTheme()
  const unreadCount = notifications.filter(n => !n.read).length

  const handleExport = () => {
    const data = {
      wedding,
      guests,
      tasks,
      budgetCategories,
      vendors,
      timelineEvents,
      mediaItems,
      webLinks,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `foreverafter-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Data exported successfully')
  }

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out h-screen sticky top-0',
        sidebarOpen ? 'w-64' : 'w-[68px]'
      )}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 via-rose-500 to-pink-600 text-white shrink-0 shadow-lg shadow-rose-500/20">
          <Heart className="w-5 h-5 fill-white" />
        </div>
        {sidebarOpen && (
          <div className="flex flex-col min-w-0 animate-fade-in-up">
            <span className="font-[family-name:var(--font-playfair)] text-lg font-semibold tracking-tight truncate text-foreground">
              ForeverAfter
            </span>
            <span className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">
              Wedding Planner
            </span>
          </div>
        )}
      </div>

      {/* Wedding Info Mini Card */}
      {sidebarOpen && wedding.date && (
        <div className="mx-3 mt-3 p-3 rounded-xl bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 dark:from-rose-950/40 dark:via-pink-950/20 dark:to-amber-950/30 border border-rose-200/60 dark:border-rose-800/30 shrink-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 truncate">
              {wedding.partner1 && wedding.partner2 
                ? `${wedding.partner1} & ${wedding.partner2}`
                : wedding.coupleName}
            </span>
          </div>
          <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 font-medium">{wedding.date}</p>
          {wedding.venue && (
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{wedding.venue}</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3 px-2 custom-scrollbar">
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            const badgeCount = item.id === 'notifications' ? unreadCount : undefined

            const button = (
              <Button
                key={item.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3 h-10 px-3 rounded-lg transition-all duration-200 group',
                  isActive
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-medium shadow-sm border border-rose-200/60 dark:border-rose-800/40'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                  !sidebarOpen && 'justify-center px-0'
                )}
                onClick={() => setActiveView(item.id)}
              >
                <Icon className={cn(
                  'w-[18px] h-[18px] shrink-0 transition-colors',
                  isActive ? 'text-rose-500 dark:text-rose-400' : 'group-hover:text-foreground'
                )} />
                {sidebarOpen && (
                  <span className="truncate text-sm">{item.label}</span>
                )}
                {sidebarOpen && badgeCount !== undefined && badgeCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-auto h-5 min-w-[20px] text-[10px] px-1.5 rounded-full shadow-sm"
                  >
                    {badgeCount}
                  </Badge>
                )}
              </Button>
            )

            if (!sidebarOpen) {
              return (
                <Tooltip key={item.id} delayDuration={0}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2">
                    {item.label}
                    {badgeCount !== undefined && badgeCount > 0 && (
                      <Badge variant="destructive" className="h-4 text-[9px] px-1 rounded-full">
                        {badgeCount}
                      </Badge>
                    )}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.id}>{button}</div>
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Bottom actions */}
      <div className="p-2 shrink-0 space-y-1">
        {/* Theme toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'w-full h-9 text-muted-foreground hover:text-foreground gap-2',
                !sidebarOpen && 'justify-center px-0'
              )}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {sidebarOpen && <span className="text-xs">Toggle Theme</span>}
            </Button>
          </TooltipTrigger>
          {(!sidebarOpen) && <TooltipContent side="right">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</TooltipContent>}
        </Tooltip>

        {/* Export data */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'w-full h-9 text-muted-foreground hover:text-foreground gap-2',
                !sidebarOpen && 'justify-center px-0'
              )}
              onClick={handleExport}
            >
              <Download className="w-4 h-4" />
              {sidebarOpen && <span className="text-xs">Export Data</span>}
            </Button>
          </TooltipTrigger>
          {(!sidebarOpen) && <TooltipContent side="right">Export Backup</TooltipContent>}
        </Tooltip>

        {/* Collapse */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'w-full justify-center h-9 text-muted-foreground hover:text-foreground',
            sidebarOpen && 'gap-2'
          )}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {sidebarOpen && <span className="text-xs">Collapse</span>}
        </Button>
      </div>
    </aside>
  )
}