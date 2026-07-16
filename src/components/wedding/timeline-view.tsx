'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { useWeddingStore, type TimelineEvent } from '@/lib/store'
import { client } from '@/lib/amplify-client'
import {
  Plus, Clock, MapPin, Edit, Trash2, Calendar,
  ChevronLeft, ChevronRight,
  BarChart3, ListChecks,
} from 'lucide-react'

const TIMELINE_CATEGORIES = [
  { value: 'ceremony', label: 'Ceremony' },
  { value: 'reception', label: 'Reception' },
  { value: 'photos', label: 'Photos' },
  { value: 'cocktail', label: 'Cocktail Hour' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'dancing', label: 'Dancing' },
  { value: 'other', label: 'Other' },
]

const CATEGORY_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  ceremony: { dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-700' },
  reception: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
  photos: { dot: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700' },
  cocktail: { dot: 'bg-sky-500', bg: 'bg-sky-50', text: 'text-sky-700' },
  dinner: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  dancing: { dot: 'bg-pink-500', bg: 'bg-pink-50', text: 'text-pink-700' },
  other: { dot: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-700' },
}

const CATEGORY_CSS: Record<string, { bg: string; text: string; border: string; light: string }> = {
  ceremony: { bg: '#fff1f2', text: '#be123c', border: '#e11d48', light: '#fecdd3' },
  reception: { bg: '#fffbeb', text: '#b45309', border: '#f59e0b', light: '#fde68a' },
  photos: { bg: '#f5f3ff', text: '#6d28d9', border: '#8b5cf6', light: '#c4b5fd' },
  cocktail: { bg: '#f0f9ff', text: '#0369a1', border: '#0ea5e9', light: '#bae6fd' },
  dinner: { bg: '#ecfdf5', text: '#047857', border: '#10b981', light: '#a7f3d0' },
  dancing: { bg: '#fdf2f8', text: '#be185d', border: '#ec4899', light: '#f9a8d4' },
  other: { bg: '#f8fafc', text: '#334155', border: '#64748b', light: '#cbd5e1' },
}

type GanttZoom = 'day' | 'month' | 'year'

function formatTime(time: string) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

function formatTimeRange(start: string, end: string) {
  if (!start) return ''
  if (!end) return formatTime(start)
  return `${formatTime(start)} – ${formatTime(end)}`
}

function timeToDecimal(time: string): number {
  if (!time) return -1
  const [h, m] = time.split(':').map(Number)
  return h + m / 60
}

function formatHour(h: number) {
  if (h === 0) return '12AM'
  if (h < 12) return `${h}AM`
  if (h === 12) return '12PM'
  return `${h - 12}PM`
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getMonthName(month: number) {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month]
}

function getFullMonthName(month: number) {
  return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month]
}

function eventDateLabel(event: TimelineEvent) {
  if (event.eventDate) {
    const d = new Date(event.eventDate + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  return null
}

const emptyEvent: Omit<TimelineEvent, 'id' | 'sortOrder'> = {
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  eventDate: '',
  location: '',
  category: 'other',
  notes: '',
}

export function TimelineView() {
  const events = useWeddingStore((s) => s.timelineEvents)
  const setEvents = useWeddingStore((s) => s.setTimelineEvents)
  const addTimelineEvent = useWeddingStore((s) => s.addTimelineEvent)
  const updateTimelineEvent = useWeddingStore((s) => s.updateTimelineEvent)
  const deleteTimelineEvent = useWeddingStore((s) => s.deleteTimelineEvent)
  const viewType = useWeddingStore((s) => s.timelineViewType)
  const setViewType = useWeddingStore((s) => s.setTimelineViewType)
  const wedding = useWeddingStore((s) => s.wedding)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)
  const [formData, setFormData] = useState(emptyEvent)
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<TimelineEvent | null>(null)

  const [ganttZoom, setGanttZoom] = useState<GanttZoom>('day')
  const [ganttNavOffset, setGanttNavOffset] = useState(0)

  const refDate = useMemo(() => {
    if (wedding.date) return new Date(wedding.date + 'T00:00:00')
    return new Date()
  }, [wedding.date])

  const ganttDate = useMemo(() => {
    const d = new Date(refDate)
    d.setMonth(d.getMonth() + ganttNavOffset)
    return d
  }, [refDate, ganttNavOffset])

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (a.eventDate && b.eventDate && a.eventDate !== b.eventDate) {
        return a.eventDate.localeCompare(b.eventDate)
      }
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime)
      if (a.startTime) return -1
      if (b.startTime) return 1
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    })
  }, [events])

  const openCreateDialog = () => {
    setEditingEvent(null)
    setFormData({ ...emptyEvent, eventDate: wedding.date || '' })
    setDialogOpen(true)
  }

  const openEditDialog = useCallback((event: TimelineEvent) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      eventDate: event.eventDate ?? '',
      location: event.location,
      category: event.category,
      notes: event.notes,
    })
    setDialogOpen(true)
  }, [])

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Event title is required')
      return
    }
    try {
      if (editingEvent) {
        const { data: updated, errors } = await client.models.TimelineEvent.update({ id: editingEvent.id, ...formData })
        if (errors) throw new Error(errors[0].message)
        if (updated) updateTimelineEvent(updated.id, updated)
        toast.success('Event updated')
      } else {
        const { data: created, errors } = await client.models.TimelineEvent.create({ ...formData, sortOrder: events.length })
        if (errors) throw new Error(errors[0].message)
        if (created) addTimelineEvent(created)
        toast.success('Event added')
      }
      setDialogOpen(false)
    } catch {
      toast.error('Something went wrong')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmEvent) return
    try {
      const { errors } = await client.models.TimelineEvent.delete({ id: deleteConfirmEvent.id })
      if (errors) throw new Error(errors[0].message)
      deleteTimelineEvent(deleteConfirmEvent.id)
      toast.success('Event deleted')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setDeleteConfirmEvent(null)
    }
  }

  const eventsWithTime = useMemo(() => sortedEvents.filter((e) => e.startTime), [sortedEvents])
  const eventsInMonth = useMemo(() => {
    const year = ganttDate.getFullYear()
    const month = ganttDate.getMonth()
    return sortedEvents.filter((e) => {
      if (!e.eventDate) return false
      const d = new Date(e.eventDate + 'T00:00:00')
      return d.getFullYear() === year && d.getMonth() === month
    })
  }, [sortedEvents, ganttDate])

  const eventsInYear = useMemo(() => {
    const year = ganttDate.getFullYear()
    return sortedEvents.filter((e) => {
      if (!e.eventDate) return false
      const d = new Date(e.eventDate + 'T00:00:00')
      return d.getFullYear() === year
    })
  }, [sortedEvents, ganttDate])

  const navTitle = useMemo(() => {
    if (ganttZoom === 'day') return 'Wedding Day'
    if (ganttZoom === 'month') return `${getFullMonthName(ganttDate.getMonth())} ${ganttDate.getFullYear()}`
    return `${ganttDate.getFullYear()}`
  }, [ganttZoom, ganttDate])

  // ── Gantt Intraday View ──────────────────────────────────────────────
  const renderGanttDay = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[960px]">
          {/* Time axis */}
          <div className="flex border-b border-border mb-2">
            <div className="w-32 shrink-0" />
            {hours.map((h) => (
              <div key={h} className="flex-1 text-[10px] text-muted-foreground pb-1 text-center border-l border-border/50">
                {formatHour(h)}
              </div>
            ))}
          </div>

          {/* Event rows */}
          <div className="space-y-2">
            {eventsWithTime.length > 0 ? (
              eventsWithTime.map((event) => {
                const start = timeToDecimal(event.startTime)
                const end = event.endTime ? timeToDecimal(event.endTime) : start + 1
                const left = (start / 24) * 100
                const width = Math.max(((end - start) / 24) * 100, 5)
                const css = CATEGORY_CSS[event.category] || CATEGORY_CSS.other

                return (
                  <div key={event.id} className="relative h-11 group/bar">
                    {/* Grid lines */}
                    {hours.map((h) => (
                      <div key={h} className="absolute inset-y-0 border-l border-border/30" style={{ left: `${(h / 24) * 100}%` }} />
                    ))}
                    {/* Event bar */}
                    <div
                      className="absolute inset-y-0 flex items-center cursor-pointer rounded-md px-2.5 transition-all duration-150 hover:shadow-lg hover:ring-2 hover:ring-rose-200 truncate text-sm font-medium"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: css.bg,
                        color: css.text,
                        borderLeft: `3px solid ${css.border}`,
                      }}
                      onClick={() => openEditDialog(event)}
                    >
                      <span className="truncate">{event.title}</span>
                      <span className="ml-auto shrink-0 text-[10px] opacity-60 hidden sm:inline">
                        {formatTime(event.startTime)}
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No timed events yet. Add events with start/end times to see them here.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Gantt Month View ──────────────────────────────────────────────
  const renderGanttMonth = () => {
    const year = ganttDate.getFullYear()
    const month = ganttDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    if (eventsInMonth.length === 0) {
      return (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No events in {getFullMonthName(month)} {year}.
        </div>
      )
    }

    return (
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[800px]">
          {/* Day headers */}
          <div className="flex border-b border-border mb-2">
            <div className="w-36 shrink-0" />
            {days.map((d) => {
              const date = new Date(year, month, d)
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
              const isToday = new Date().toDateString() === date.toDateString()
              return (
                <div
                  key={d}
                  className={`flex-1 text-[10px] text-center pb-1 border-l border-border/50 ${isToday ? 'text-rose-600 font-semibold' : 'text-muted-foreground'}`}
                >
                  <span className="block">{d}</span>
                  <span className="block text-[8px] opacity-60">{dayName}</span>
                </div>
              )
            })}
          </div>

          {/* Event rows */}
          <div className="space-y-2">
            {eventsInMonth.map((event) => {
              const d = new Date(event.eventDate + 'T00:00:00')
              const dayOfMonth = d.getDate()
              const left = ((dayOfMonth - 1) / daysInMonth) * 100
              const width = (1 / daysInMonth) * 100
              const css = CATEGORY_CSS[event.category] || CATEGORY_CSS.other

              return (
                <div key={event.id} className="relative h-11 group/bar">
                  {days.map((d) => (
                    <div key={d} className="absolute inset-y-0 border-l border-border/30" style={{ left: `${((d - 1) / daysInMonth) * 100}%` }} />
                  ))}
                  <div
                    className="absolute inset-y-0 flex items-center cursor-pointer rounded-md px-2 transition-all duration-150 hover:shadow-lg hover:ring-2 hover:ring-rose-200 truncate text-sm font-medium"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: css.bg,
                      color: css.text,
                      borderLeft: `3px solid ${css.border}`,
                    }}
                    onClick={() => openEditDialog(event)}
                  >
                    <span className="truncate">{event.title}</span>
                    <span className="ml-auto shrink-0 text-[10px] opacity-60 hidden sm:inline">
                      {event.startTime ? formatTime(event.startTime) : ''}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── Gantt Year View ──────────────────────────────────────────────
  const renderGanttYear = () => {
    const year = ganttDate.getFullYear()
    const months = Array.from({ length: 12 }, (_, i) => i)

    if (eventsInYear.length === 0) {
      return (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No events in {year}.
        </div>
      )
    }

    return (
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[800px]">
          {/* Month headers */}
          <div className="flex border-b border-border mb-2">
            <div className="w-36 shrink-0" />
            {months.map((m) => {
              const isCurrent = new Date().getFullYear() === year && new Date().getMonth() === m
              return (
                <div
                  key={m}
                  className={`flex-1 text-[10px] text-center pb-1 border-l border-border/50 ${isCurrent ? 'text-rose-600 font-semibold' : 'text-muted-foreground'}`}
                >
                  {getMonthName(m)}
                </div>
              )
            })}
          </div>

          {/* Event rows */}
          <div className="space-y-2">
            {eventsInYear.map((event) => {
              const d = new Date(event.eventDate + 'T00:00:00')
              const m = d.getMonth()
              const left = (m / 12) * 100
              const width = (1 / 12) * 100
              const css = CATEGORY_CSS[event.category] || CATEGORY_CSS.other

              return (
                <div key={event.id} className="relative h-11 group/bar">
                  {months.map((m) => (
                    <div key={m} className="absolute inset-y-0 border-l border-border/30" style={{ left: `${(m / 12) * 100}%` }} />
                  ))}
                  <div
                    className="absolute inset-y-0 flex items-center cursor-pointer rounded-md px-2 transition-all duration-150 hover:shadow-lg hover:ring-2 hover:ring-rose-200 truncate text-sm font-medium"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: css.bg,
                      color: css.text,
                      borderLeft: `3px solid ${css.border}`,
                    }}
                    onClick={() => openEditDialog(event)}
                  >
                    <span className="truncate">{event.title}</span>
                    <span className="ml-auto shrink-0 text-[10px] opacity-60 hidden sm:inline">
                      {getMonthName(d.getMonth())} {d.getDate()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── Gantt View ──────────────────────────────────────────────────
  const renderGanttView = () => {
    const canNavPrev = ganttZoom !== 'day'
    const canNavNext = ganttZoom !== 'day'

    return (
      <div className="space-y-4">
        {/* Gantt controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
              {(['day', 'month', 'year'] as GanttZoom[]).map((z) => (
                <button
                  key={z}
                  onClick={() => { setGanttZoom(z); setGanttNavOffset(0) }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    ganttZoom === z
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {z === 'day' ? 'Day' : z === 'month' ? 'Month' : 'Year'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-foreground ml-2">
              {canNavPrev && (
                <button
                  onClick={() => setGanttNavOffset((p) => p - 1)}
                  className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              <span className="min-w-[120px] text-center">{navTitle}</span>
              {canNavNext && (
                <button
                  onClick={() => setGanttNavOffset((p) => p + 1)}
                  className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <Button onClick={openCreateDialog} className="bg-rose-500 hover:bg-rose-600 shrink-0">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Event
          </Button>
        </div>

        {/* Gantt chart */}
        {ganttZoom === 'day' && renderGanttDay()}
        {ganttZoom === 'month' && renderGanttMonth()}
        {ganttZoom === 'year' && renderGanttYear()}

        {/* Unscheduled events */}
        {ganttZoom !== 'day' && (() => {
          const unscheduled = sortedEvents.filter((e) => !e.eventDate)
          if (unscheduled.length === 0) return null
          return (
            <div className="border-t border-border pt-4 mt-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Unscheduled (no date set)</p>
              <div className="flex flex-wrap gap-2">
                {unscheduled.map((event) => {
                  const colors = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other
                  return (
                    <Badge
                      key={event.id}
                      variant="outline"
                      className={`cursor-pointer ${colors.bg} ${colors.text} border-transparent`}
                      onClick={() => openEditDialog(event)}
                    >
                      {event.title}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )
        })()}
      </div>
    )
  }

  // ── Center Timeline View ──────────────────────────────────────────
  const renderCenterTimeline = () => {
    if (sortedEvents.length === 0) {
      return (
        <div className="text-center py-16">
          <Calendar className="h-16 w-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400">No events yet</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 max-w-md mx-auto">
            Plan your perfect wedding day by adding events to the timeline.
          </p>
          <Button onClick={openCreateDialog} className="mt-6 bg-rose-500 hover:bg-rose-600">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Your First Event
          </Button>
        </div>
      )
    }

    return (
      <div className="relative px-4">
        {/* Center connecting line */}
        <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-rose-300 via-amber-300 to-emerald-300" />

        <div className="space-y-10">
          {sortedEvents.map((event, index) => {
            const colors = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other
            const css = CATEGORY_CSS[event.category] || CATEGORY_CSS.other
            const categoryLabel = TIMELINE_CATEGORIES.find((c) => c.value === event.category)?.label || event.category
            const timeRange = formatTimeRange(event.startTime, event.endTime)
            const isLeft = index % 2 === 0
            const dateLabel = eventDateLabel(event)

            return (
              <div key={event.id} className="relative group grid grid-cols-[1fr_auto_1fr] gap-8 items-start">
                {/* Left column: card (even) or spacer (odd) */}
                <div className="flex justify-end">
                  {isLeft ? (
                    <Card
                      className="overflow-hidden border-0 shadow-md transition-all duration-200 group-hover:shadow-xl w-full max-w-md"
                      style={{ borderRight: `3px solid ${css.border}` }}
                    >
                      <CardContent className="p-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{event.title}</h3>
                            <Badge
                              variant="outline"
                              className={`text-xs ${colors.bg} ${colors.text} border-transparent`}
                            >
                              {categoryLabel}
                            </Badge>
                          </div>
                          {dateLabel && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 justify-end">
                              <Calendar className="h-3 w-3" />
                              <span>{dateLabel}</span>
                            </div>
                          )}
                          {timeRange && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1 justify-end">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{timeRange}</span>
                            </div>
                          )}
                          {event.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 text-right">
                              {event.description}
                            </p>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1.5 justify-end">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-start gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex-row-reverse">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(event)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700"
                            onClick={() => setDeleteConfirmEvent(event)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div />
                  )}
                </div>

                {/* Center column: circle */}
                <div className="relative z-10 flex justify-center">
                  <div
                    className={`w-12 h-12 rounded-full ${colors.bg} border-4 border-white dark:border-gray-900 shadow-md flex items-center justify-center transition-all duration-200 group-hover:ring-4 group-hover:ring-rose-200 group-hover:scale-110 group-hover:shadow-lg`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full ${colors.dot} transition-transform duration-200 group-hover:scale-125`} />
                  </div>
                </div>

                {/* Right column: spacer (even) or card (odd) */}
                <div className="flex justify-start">
                  {!isLeft ? (
                    <Card
                      className="overflow-hidden border-0 shadow-md transition-all duration-200 group-hover:shadow-xl w-full max-w-md"
                      style={{ borderLeft: `3px solid ${css.border}` }}
                    >
                      <CardContent className="p-4">
                        <div className="text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{event.title}</h3>
                            <Badge
                              variant="outline"
                              className={`text-xs ${colors.bg} ${colors.text} border-transparent`}
                            >
                              {categoryLabel}
                            </Badge>
                          </div>
                          {dateLabel && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                              <Calendar className="h-3 w-3" />
                              <span>{dateLabel}</span>
                            </div>
                          )}
                          {timeRange && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{timeRange}</span>
                            </div>
                          )}
                          {event.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
                              {event.description}
                            </p>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(event)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700"
                            onClick={() => setDeleteConfirmEvent(event)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Main Render ─────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-4 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-7 w-7 text-rose-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Wedding Day Timeline</h1>
          {events.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {events.length} events
            </Badge>
          )}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
          <button
            onClick={() => setViewType('gantt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewType === 'gantt'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Gantt Chart
          </button>
          <button
            onClick={() => setViewType('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewType === 'timeline'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ListChecks className="h-4 w-4" />
            Center Timeline
          </button>
        </div>
      </div>

      {/* View Content */}
      {viewType === 'gantt' ? (
        renderGanttView()
      ) : (
        <div className="relative">
          {renderCenterTimeline()}
          {/* Floating Add button for timeline view */}
          {sortedEvents.length > 0 && (
            <div className="flex justify-center mt-8">
              <Button onClick={openCreateDialog} className="bg-rose-500 hover:bg-rose-600">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Event
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Update the details of your timeline event.' : 'Add a new event to your wedding timeline.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="event-title">Title *</Label>
              <Input
                id="event-title"
                value={formData.title}
                onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g., Wedding Ceremony"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="event-desc">Description</Label>
              <Textarea
                id="event-desc"
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                placeholder="What happens during this event?"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="event-date">Event Date</Label>
              <Input
                id="event-date"
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData((f) => ({ ...f, eventDate: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Set a date for planning milestones. Leave blank for wedding-day events (uses time-based positioning).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="event-start">Start Time</Label>
                <Input
                  id="event-start"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData((f) => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="event-end">End Time</Label>
                <Input
                  id="event-end"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData((f) => ({ ...f, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="event-location">Location</Label>
                <Input
                  id="event-location"
                  value={formData.location}
                  onChange={(e) => setFormData((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g., Main Hall, Garden"
                />
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMELINE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="event-notes">Notes</Label>
              <Textarea
                id="event-notes"
                value={formData.notes}
                onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional details..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-rose-500 hover:bg-rose-600">
              {editingEvent ? 'Update' : 'Add'} Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmEvent} onOpenChange={() => setDeleteConfirmEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteConfirmEvent?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
