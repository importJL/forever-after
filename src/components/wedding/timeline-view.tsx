'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { TimelineEvent } from '@/lib/store'
import { Plus, Clock, MapPin, Edit, Trash2, Calendar } from 'lucide-react'

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

const emptyEvent: Omit<TimelineEvent, 'id' | 'sortOrder'> = {
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  location: '',
  category: 'other',
  notes: '',
}

export function TimelineView() {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)
  const [formData, setFormData] = useState(emptyEvent)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/timeline')
      if (res.ok) {
        const data = await res.json()
        setEvents(data)
      }
    } catch {
      toast.error('Failed to load timeline')
    } finally {
      setLoading(false)
    }
  }

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime)
      if (a.startTime) return -1
      if (b.startTime) return 1
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    })
  }, [events])

  const openCreateDialog = () => {
    setEditingEvent(null)
    setFormData(emptyEvent)
    setDialogOpen(true)
  }

  const openEditDialog = (event: TimelineEvent) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      category: event.category,
      notes: event.notes,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Event title is required')
      return
    }

    try {
      if (editingEvent) {
        const res = await fetch(`/api/timeline/${editingEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (res.ok) {
          const updated = await res.json()
          setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
          toast.success('Event updated')
        } else {
          toast.error('Failed to update event')
        }
      } else {
        const res = await fetch('/api/timeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, id: crypto.randomUUID(), sortOrder: events.length }),
        })
        if (res.ok) {
          const created = await res.json()
          setEvents((prev) => [...prev, created])
          toast.success('Event added')
        } else {
          toast.error('Failed to add event')
        }
      }
      setDialogOpen(false)
    } catch {
      toast.error('Something went wrong')
    }
  }

  const handleDelete = async (event: TimelineEvent) => {
    if (!window.confirm(`Delete "${event.title}"?`)) return
    try {
      const res = await fetch(`/api/timeline/${event.id}`, { method: 'DELETE' })
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== event.id))
        toast.success('Event deleted')
      } else {
        toast.error('Failed to delete event')
      }
    } catch {
      toast.error('Something went wrong')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Calendar className="h-8 w-8 animate-pulse text-rose-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-7 w-7 text-rose-500" />
          <h1 className="text-2xl font-bold text-gray-900">Wedding Day Timeline</h1>
          {events.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {events.length} events
            </Badge>
          )}
        </div>
        <Button onClick={openCreateDialog} className="bg-rose-500 hover:bg-rose-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* Timeline */}
      {sortedEvents.length > 0 ? (
        <div className="relative">
          {/* Vertical connecting line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-rose-300 via-amber-300 to-emerald-300" />

          <div className="space-y-6">
            {sortedEvents.map((event, index) => {
              const colors = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other
              const categoryLabel =
                TIMELINE_CATEGORIES.find((c) => c.value === event.category)?.label || event.category
              const timeRange = formatTimeRange(event.startTime, event.endTime)

              return (
                <div key={event.id} className="relative flex gap-5 group">
                  {/* Timeline node */}
                  <div className="relative z-10 flex flex-col items-center shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full ${colors.bg} border-2 border-white shadow-md flex items-center justify-center`}
                    >
                      <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
                    </div>
                  </div>

                  {/* Event card */}
                  <Card className="flex-1 group-hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900">{event.title}</h3>
                            <Badge
                              variant="outline"
                              className={`text-xs ${colors.bg} ${colors.text} border-transparent`}
                            >
                              {categoryLabel}
                            </Badge>
                          </div>
                          {timeRange && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{timeRange}</span>
                            </div>
                          )}
                          {event.description && (
                            <p className="text-sm text-gray-600 mt-1.5">{event.description}</p>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(event)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(event)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="text-center py-16">
          <Calendar className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500">No events yet</h3>
          <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
            Plan your perfect wedding day by adding events to the timeline. Start with the
            ceremony time and work backwards and forwards from there.
          </p>
          <div className="mt-6 space-y-2 text-xs text-gray-400">
            <p>💡 Tip: Add events like &quot;Getting Ready,&quot; &quot;First Look,&quot; &quot;Ceremony,&quot;</p>
            <p>&quot;Cocktail Hour,&quot; &quot;Reception,&quot; &quot;First Dance,&quot; and &quot;Send-Off&quot;</p>
          </div>
          <Button onClick={openCreateDialog} className="mt-6 bg-rose-500 hover:bg-rose-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Event
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>
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
                rows={3}
              />
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
    </div>
  )
}