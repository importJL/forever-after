'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Info,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react'
import { useWeddingStore, type AppNotification } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'


// ── Types ──────────────────────────────────────────────────────────────────
type NotificationType = AppNotification['type']
type FilterTab = 'all' | 'unread' | NotificationType

interface FilterTabConfig {
  value: FilterTab
  label: string
}

// ── Constants ──────────────────────────────────────────────────────────────
const FILTER_TABS: FilterTabConfig[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'success', label: 'Success' },
  { value: 'reminder', label: 'Reminder' },
]

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ElementType; color: string; bgClass: string; borderClass: string }
> = {
  info: {
    icon: Info,
    color: 'text-blue-600',
    bgClass: 'bg-blue-50',
    borderClass: 'border-l-blue-500',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgClass: 'bg-amber-50',
    borderClass: 'border-l-amber-500',
  },
  success: {
    icon: CheckCircle,
    color: 'text-emerald-600',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-l-emerald-500',
  },
  reminder: {
    icon: Clock,
    color: 'text-violet-600',
    bgClass: 'bg-violet-50',
    borderClass: 'border-l-violet-500',
  },
}

// ── Animation ──────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

// ── Component ──────────────────────────────────────────────────────────────
export function NotificationPanel() {
  const storeNotifications = useWeddingStore((s) => s.notifications)
  const setNotifications = useWeddingStore((s) => s.setNotifications)
  const markNotificationRead = useWeddingStore((s) => s.markNotificationRead)
  const clearNotifications = useWeddingStore((s) => s.clearNotifications)

  // Local state
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const [isClearingAll, setIsClearingAll] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // ── Data fetch ───────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/notifications')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) setNotifications(data)
        }
      } catch {
        // Use store data as fallback
      } finally {
        setIsLoading(false)
      }
    }
    fetchNotifications()
  }, [setNotifications])

  // ── Derived ──────────────────────────────────────────────────────────────
  const unreadCount = useMemo(
    () => storeNotifications.filter((n) => !n.read).length,
    [storeNotifications],
  )

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'all':
        return storeNotifications
      case 'unread':
        return storeNotifications.filter((n) => !n.read)
      default:
        return storeNotifications.filter((n) => n.type === activeTab)
    }
  }, [storeNotifications, activeTab])

  const sortedNotifications = useMemo(
    () =>
      [...filteredNotifications].sort((a, b) => {
        // Try to parse IDs that look like timestamps for sort order
        // Otherwise keep original order (newest first as per store)
        return 0
      }),
    [filteredNotifications],
  )

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleMarkRead = useCallback(
    async (id: string) => {
      const notif = storeNotifications.find((n) => n.id === id)
      if (!notif || notif.read) return

      markNotificationRead(id)
      try {
        await fetch(`/api/notifications/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ read: true }),
        })
      } catch {
        // Optimistic update already applied
      }
    },
    [storeNotifications, markNotificationRead],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
        if (res.ok) {
          // Remove from store by re-setting without the deleted one
          setNotifications(storeNotifications.filter((n) => n.id !== id))
          toast.success('Notification deleted.')
        }
      } catch {
        toast.error('Failed to delete notification.')
      }
    },
    [storeNotifications, setNotifications],
  )

  const handleMarkAllRead = useCallback(async () => {
    const unread = storeNotifications.filter((n) => !n.read)
    if (unread.length === 0) return

    setIsMarkingAll(true)
    for (const notif of unread) {
      markNotificationRead(notif.id)
      try {
        await fetch(`/api/notifications/${notif.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ read: true }),
        })
      } catch {
        // Continue with others
      }
    }
    setIsMarkingAll(false)
    toast.success(`${unread.length} notification(s) marked as read.`)
  }, [storeNotifications, markNotificationRead])

  const handleClearAll = useCallback(async () => {
    if (storeNotifications.length === 0) return

    setIsClearingAll(true)
    for (const notif of storeNotifications) {
      try {
        await fetch(`/api/notifications/${notif.id}`, { method: 'DELETE' })
      } catch {
        // Continue with others
      }
    }
    clearNotifications()
    setIsClearingAll(false)
    toast.success('All notifications cleared.')
  }, [storeNotifications, clearNotifications])

  // ── Render helpers ───────────────────────────────────────────────────────
  function formatTimestamp(dateStr: string): string {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch {
      return ''
    }
  }

  function renderNotification(notif: AppNotification) {
    const config = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.info
    const Icon = config.icon
    const isHovered = hoveredId === notif.id

    return (
      <motion.div
        key={notif.id}
        variants={itemVariants}
        className={`relative group flex items-start gap-3 p-3 rounded-lg border-l-4 transition-colors cursor-pointer ${
          notif.read
            ? 'border-l-transparent hover:bg-muted/30'
            : `border-l-rose-500 bg-rose-50/30 hover:bg-rose-50/60`
        }`}
        onClick={() => handleMarkRead(notif.id)}
        onMouseEnter={() => setHoveredId(notif.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        {/* Type Icon */}
        <div
          className={`shrink-0 flex items-center justify-center h-8 w-8 rounded-full ${config.bgClass} mt-0.5`}
        >
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={`text-sm truncate ${
                notif.read ? 'font-normal text-muted-foreground' : 'font-semibold text-foreground'
              }`}
            >
              {notif.title}
            </p>
            {!notif.read && (
              <span className="shrink-0 h-2 w-2 rounded-full bg-rose-500" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notif.message}
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-2">
            {notif.relatedTo && (
              <span>via {notif.relatedTo}</span>
            )}
            {Boolean((notif as unknown as Record<string, unknown>).createdAt) && (
              <span>{formatTimestamp(String((notif as unknown as Record<string, unknown>).createdAt))}</span>
            )}
          </p>
        </div>

        {/* Delete button on hover */}
        <Button
          variant="ghost"
          size="sm"
          className={`shrink-0 h-7 w-7 p-0 text-muted-foreground hover:text-destructive transition-opacity ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={(e) => {
            e.stopPropagation()
            handleDelete(notif.id)
          }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </motion.div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-rose-500" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-rose-600 text-white hover:bg-rose-600 ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={unreadCount === 0 || isMarkingAll}
            onClick={handleMarkAllRead}
          >
            {isMarkingAll ? (
              <span className="h-4 w-4 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin mr-1.5" />
            ) : (
              <CheckCheck className="h-4 w-4 mr-1.5" />
            )}
            Mark All Read
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={storeNotifications.length === 0 || isClearingAll}
            onClick={handleClearAll}
            className="text-destructive hover:text-destructive"
          >
            {isClearingAll ? (
              <span className="h-4 w-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin mr-1.5" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1.5" />
            )}
            Clear All
          </Button>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
          <TabsList className="flex-wrap h-auto gap-1">
            {FILTER_TABS.map((tab) => {
              const count =
                tab.value === 'all'
                  ? storeNotifications.length
                  : tab.value === 'unread'
                    ? unreadCount
                    : storeNotifications.filter((n) => n.type === tab.value).length

              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs px-3 py-1.5"
                >
                  {tab.label}
                  {count > 0 && (
                    <Badge
                      variant="secondary"
                      className={`ml-1.5 text-[10px] px-1.5 py-0 ${
                        tab.value === 'unread' && count > 0
                          ? 'bg-rose-100 text-rose-700'
                          : ''
                      }`}
                    >
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {/* Shared content for all tabs */}
          {FILTER_TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              {sortedNotifications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <BellOff className="h-12 w-12 mb-3 opacity-40" />
                    <p className="text-lg font-medium">No notifications</p>
                    <p className="text-sm">
                      {activeTab === 'all'
                        ? "You're all caught up!"
                        : `No ${tab.label.toLowerCase()} notifications to show.`}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-2">
                    <div className="max-h-[600px] overflow-y-auto space-y-1">
                      {sortedNotifications.map(renderNotification)}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </motion.div>
  )
}