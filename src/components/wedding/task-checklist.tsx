'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
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
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import type { Task } from '@/lib/store'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfDay } from 'date-fns'
import {
  Plus,
  Search,
  Filter,
  ListChecks,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Trash2,
  Circle,
  Loader,
  XCircle,
  Columns3,
  CalendarRange,
  FolderOpen,
  ChevronDown,
  GripVertical,
  Calendar,
  User,
  Hash,
  Flame,
} from 'lucide-react'

const TASK_CATEGORIES = [
  'Venue',
  'Catering',
  'Attire',
  'Flowers',
  'Photography',
  'Music',
  'Stationery',
  'Decor',
  'Transportation',
  'Legal',
  'Honeymoon',
  'Other',
]

const CATEGORY_ICONS: Record<string, string> = {
  Venue: '🏛️',
  Catering: '🍽️',
  Attire: '👗',
  Flowers: '💐',
  Photography: '📸',
  Music: '🎵',
  Stationery: '💌',
  Decor: '✨',
  Transportation: '🚗',
  Legal: '📜',
  Honeymoon: '✈️',
  Other: '📋',
}

const CATEGORY_COLORS: Record<string, string> = {
  Venue: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  Catering: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  Attire: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800',
  Flowers: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  Photography: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800',
  Music: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800',
  Stationery: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  Decor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
  Transportation: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700',
  Legal: 'bg-stone-50 text-stone-700 border-stone-200 dark:bg-stone-950 dark:text-stone-300 dark:border-stone-800',
  Honeymoon: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800',
  Other: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700',
}

const PRIORITY_CONFIG: Record<string, { label: string; className: string; dotClass: string }> = {
  low: { label: 'Low', className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700', dotClass: 'bg-slate-400' },
  medium: { label: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800', dotClass: 'bg-amber-500' },
  high: { label: 'High', className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800', dotClass: 'bg-orange-500' },
  urgent: { label: 'Urgent', className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800', dotClass: 'bg-rose-500' },
}

const STATUS_GROUPS = [
  { key: 'todo' as const, label: 'To Do', icon: Circle, color: 'text-slate-500', bgClass: 'bg-slate-50 dark:bg-slate-900', borderClass: 'border-slate-200 dark:border-slate-700', headerBg: 'bg-slate-100 dark:bg-slate-800', headerText: 'text-slate-700 dark:text-slate-300' },
  { key: 'in_progress' as const, label: 'In Progress', icon: Loader, color: 'text-amber-500', bgClass: 'bg-amber-50/50 dark:bg-amber-950/20', borderClass: 'border-amber-200 dark:border-amber-800', headerBg: 'bg-amber-100 dark:bg-amber-900/50', headerText: 'text-amber-700 dark:text-amber-300' },
  { key: 'done' as const, label: 'Done', icon: CheckCircle2, color: 'text-emerald-500', bgClass: 'bg-emerald-50/50 dark:bg-emerald-950/20', borderClass: 'border-emerald-200 dark:border-emerald-800', headerBg: 'bg-emerald-100 dark:bg-emerald-900/50', headerText: 'text-emerald-700 dark:text-emerald-300' },
  { key: 'cancelled' as const, label: 'Cancelled', icon: XCircle, color: 'text-rose-400', bgClass: 'bg-rose-50/50 dark:bg-rose-950/20', borderClass: 'border-rose-200 dark:border-rose-800', headerBg: 'bg-rose-100 dark:bg-rose-900/50', headerText: 'text-rose-700 dark:text-rose-300' },
]

type ViewMode = 'list' | 'kanban' | 'timeline' | 'category'

const emptyTask: Omit<Task, 'id' | 'sortOrder'> = {
  title: '',
  description: '',
  category: 'Other',
  priority: 'medium',
  status: 'todo',
  dueDate: '',
  assignee: '',
  notes: '',
}

/* ─────────── Sortable Task Card (for Kanban) ─────────── */
function SortableTaskCard({ task, onEdit, onDelete, onToggleDone }: {
  task: Task
  onEdit: (t: Task) => void
  onDelete: (t: Task) => void
  onToggleDone: (t: Task) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
  })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const overdue = task.dueDate && task.status !== 'done' && task.status !== 'cancelled' && isBefore(parseISO(task.dueDate), startOfDay(new Date()))
  const prio = PRIORITY_CONFIG[task.priority]

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        <Card className={`group hover:shadow-md transition-all duration-200 ${overdue ? 'ring-1 ring-red-200 dark:ring-red-800' : ''}`}>
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <button
                className="mt-0.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 transition-colors"
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Checkbox
                    checked={task.status === 'done'}
                    onCheckedChange={() => onToggleDone(task)}
                    className="h-4 w-4"
                  />
                  <span className={`text-sm font-medium leading-tight ${task.status === 'done' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                    {task.title}
                  </span>
                </div>
                {task.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 ml-6">{task.description}</p>
                )}
                <div className="flex items-center gap-1.5 mt-2 ml-6 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${prio.className}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${prio.dotClass}`} />
                    {prio.label}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${CATEGORY_COLORS[task.category] || CATEGORY_COLORS.Other}`}>
                    {CATEGORY_ICONS[task.category] || '📋'} {task.category}
                  </span>
                  {overdue && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800 flex items-center gap-0.5">
                      <AlertTriangle className="h-2.5 w-2.5" /> Overdue
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5 ml-6 text-[11px] text-gray-400 dark:text-gray-500">
                  {task.dueDate && (
                    <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 dark:text-red-400 font-medium' : ''}`}>
                      <Calendar className="h-3 w-3" />
                      {format(parseISO(task.dueDate), 'MMM d')}
                    </span>
                  )}
                  {task.assignee && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {task.assignee}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(task)}>
                  <Edit className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700" onClick={() => onDelete(task)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

/* ─────────── Kanban Column ─────────── */
function KanbanColumn({ status, tasks, onEdit, onDelete, onToggleDone }: {
  status: typeof STATUS_GROUPS[number]
  tasks: Task[]
  onEdit: (t: Task) => void
  onDelete: (t: Task) => void
  onToggleDone: (t: Task) => void
}) {
  const { setNodeRef } = useSortable({
    id: status.key,
    data: { type: 'column', status: status.key },
  })

  return (
    <div className={`flex-shrink-0 w-[280px] lg:w-[300px] flex flex-col rounded-xl border ${status.borderClass} ${status.bgClass} overflow-hidden`}>
      <div className={`px-4 py-3 ${status.headerBg} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <status.icon className={`h-4 w-4 ${status.color}`} />
          <span className={`text-sm font-semibold ${status.headerText}`}>{status.label}</span>
          <Badge variant="secondary" className="h-5 min-w-[20px] text-[10px] px-1.5">{tasks.length}</Badge>
        </div>
      </div>
      <ScrollArea className="flex-1 max-h-[calc(100vh-380px)]">
        <div ref={setNodeRef} className="p-2 space-y-2 min-h-[60px]">
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <AnimatePresence mode="popLayout">
              {tasks.map((task) => (
                <SortableTaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} onToggleDone={onToggleDone} />
              ))}
            </AnimatePresence>
          </SortableContext>
          {tasks.length === 0 && (
            <div className="py-8 text-center text-xs text-gray-400 dark:text-gray-500">
              <p>No tasks</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

/* ─────────── Main Component ─────────── */
export function TaskChecklist() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formData, setFormData] = useState(emptyTask)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(TASK_CATEGORIES))
  const [timelineMonth, setTimelineMonth] = useState(new Date())

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks')
      if (res.ok) {
        const data = await res.json()
        setTasks(data)
      }
    } catch {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()) || t.assignee.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || t.status === statusFilter
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter
      const matchCategory = categoryFilter === 'all' || t.category === categoryFilter
      return matchSearch && matchStatus && matchPriority && matchCategory
    })
  }, [tasks, search, statusFilter, priorityFilter, categoryFilter])

  const groupedByStatus = useMemo(() => {
    const groups: Record<string, Task[]> = { todo: [], in_progress: [], done: [], cancelled: [] }
    filteredTasks.forEach((t) => { if (groups[t.status]) groups[t.status].push(t) })
    return groups
  }, [filteredTasks])

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, Task[]> = {}
    filteredTasks.forEach((t) => {
      if (!groups[t.category]) groups[t.category] = []
      groups[t.category].push(t)
    })
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredTasks])

  const tasksWithDates = useMemo(() => filteredTasks.filter((t) => t.dueDate), [filteredTasks])

  const timelineDays = useMemo(() => {
    if (tasksWithDates.length === 0) return []
    const allDates = tasksWithDates.map((t) => parseISO(t.dueDate))
    const earliest = startOfMonth(new Date(Math.min(...allDates.map((d) => d.getTime()))))
    const latest = endOfMonth(new Date(Math.max(...allDates.map((d) => d.getTime()))))
    return eachDayOfInterval({ start: earliest, end: latest })
  }, [tasksWithDates])

  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length
  const overdueTasks = tasks.filter((t) => t.dueDate && t.status !== 'done' && t.status !== 'cancelled' && isBefore(parseISO(t.dueDate), startOfDay(new Date()))).length
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === 'done' || task.status === 'cancelled') return false
    return isBefore(parseISO(task.dueDate), startOfDay(new Date()))
  }

  // Drag & drop handlers for Kanban
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id))
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // Visual feedback handled by CSS
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event
    if (!over) return

    const taskId = String(active.id)
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    // Determine target status
    let targetStatus = task.status

    // If dropped on a column
    if (STATUS_GROUPS.some((g) => g.key === String(over.id))) {
      targetStatus = String(over.id) as Task['status']
    }
    // If dropped on another task, use that task's status
    else {
      const overTask = tasks.find((t) => t.id === String(over.id))
      if (overTask) targetStatus = overTask.status
    }

    if (targetStatus !== task.status) {
      try {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: targetStatus }),
        })
        if (res.ok) {
          const updated = await res.json()
          setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
          toast.success(`Moved to ${STATUS_GROUPS.find((g) => g.key === targetStatus)?.label}`)
        }
      } catch {
        toast.error('Failed to move task')
      }
    }
  }

  const openCreateDialog = () => {
    setEditingTask(null)
    setFormData(emptyTask)
    setDialogOpen(true)
  }

  const openEditDialog = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      assignee: task.assignee,
      notes: task.notes,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim()) { toast.error('Task title is required'); return }
    try {
      if (editingTask) {
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (res.ok) {
          const updated = await res.json()
          setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
          toast.success('Task updated')
        } else toast.error('Failed to update task')
      } else {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, id: crypto.randomUUID(), sortOrder: tasks.length }),
        })
        if (res.ok) {
          const created = await res.json()
          setTasks((prev) => [...prev, created])
          toast.success('Task added')
        } else toast.error('Failed to add task')
      }
      setDialogOpen(false)
    } catch { toast.error('Something went wrong') }
  }

  const handleDelete = async (task: Task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== task.id))
        toast.success('Task deleted')
      } else toast.error('Failed to delete task')
    } catch { toast.error('Something went wrong') }
  }

  const toggleDone = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        const updated = await res.json()
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
        toast.success(newStatus === 'done' ? 'Task completed!' : 'Task reopened')
      }
    } catch { toast.error('Failed to update task') }
  }

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat); else next.add(cat)
      return next
    })
  }

  const categories = useMemo(() => {
    const cats = new Set(tasks.map((t) => t.category))
    return Array.from(cats).sort()
  }, [tasks])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    )
  }

  const activeDragTask = tasks.find((t) => t.id === activeDragId)

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
              <ListChecks className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Task Checklist</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Manage your wedding planning tasks</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-300' : ''}
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              Filters
            </Button>
            <Button onClick={openCreateDialog} className="bg-rose-500 hover:bg-rose-600 text-white">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{totalTasks}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Hash className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">In Progress</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{inProgressTasks}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <Flame className="h-4 w-4 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Overdue</p>
                  <p className={`text-2xl font-bold mt-0.5 ${overdueTasks > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>{overdueTasks}</p>
                </div>
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${overdueTasks > 0 ? 'bg-red-100 dark:bg-red-900/50' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <AlertTriangle className={`h-4 w-4 ${overdueTasks > 0 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Completion</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{completionPct}%</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search + View Toggle + Filters */}
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
                </div>
                <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)} className="rounded-lg border bg-gray-50 dark:bg-gray-900">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="list" className="px-3 h-9 data-[state=on]:bg-white data-[state=on]:shadow-sm dark:data-[state=on]:bg-gray-800">
                        <ListChecks className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>List View</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="kanban" className="px-3 h-9 data-[state=on]:bg-white data-[state=on]:shadow-sm dark:data-[state=on]:bg-gray-800">
                        <Columns3 className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Kanban Board</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="timeline" className="px-3 h-9 data-[state=on]:bg-white data-[state=on]:shadow-sm dark:data-[state=on]:bg-gray-800">
                        <CalendarRange className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Timeline View</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="category" className="px-3 h-9 data-[state=on]:bg-white data-[state=on]:shadow-sm dark:data-[state=on]:bg-gray-800">
                        <FolderOpen className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>By Category</TooltipContent>
                  </Tooltip>
                </ToggleGroup>
              </div>
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <Separator className="mb-3" />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Filter:</span>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priorities</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {TASK_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all') && (
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-500" onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setCategoryFilter('all') }}>
                          Clear all
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* ─────────── LIST VIEW ─────────── */}
        <AnimatePresence mode="wait">
          {viewMode === 'list' && (
            <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
              {STATUS_GROUPS.map((group) => {
                const groupTasks = groupedByStatus[group.key]
                if (groupTasks.length === 0) return null
                return (
                  <div key={group.key} className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <group.icon className={`h-4 w-4 ${group.color}`} />
                      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{group.label}</h2>
                      <Badge variant="secondary" className="h-5 text-[10px] px-1.5">{groupTasks.length}</Badge>
                    </div>
                    <div className="space-y-1.5">
                      {groupTasks.map((task) => {
                        const overdue = isOverdue(task)
                        const prio = PRIORITY_CONFIG[task.priority]
                        return (
                          <Card key={task.id} className={`group hover:shadow-md transition-all duration-200 ${overdue ? 'ring-1 ring-red-200 dark:ring-red-800' : ''}`}>
                            <CardContent className="p-3">
                              <div className="flex items-start gap-3">
                                <div className="pt-0.5">
                                  <Checkbox checked={task.status === 'done'} onCheckedChange={() => toggleDone(task)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`font-medium text-sm text-gray-900 dark:text-gray-100 ${task.status === 'done' ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                                      {task.title}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${prio.className}`}>
                                      <span className={`h-1.5 w-1.5 rounded-full ${prio.dotClass}`} />
                                      {prio.label}
                                    </span>
                                    {task.category && (
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${CATEGORY_COLORS[task.category] || CATEGORY_COLORS.Other}`}>
                                        {CATEGORY_ICONS[task.category] || '📋'} {task.category}
                                      </span>
                                    )}
                                    {overdue && (
                                      <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0 h-5 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
                                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Overdue
                                      </Badge>
                                    )}
                                  </div>
                                  {task.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                                  )}
                                  <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
                                    {task.dueDate && (
                                      <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 dark:text-red-400 font-medium' : ''}`}>
                                        <Clock className="h-3 w-3" />
                                        {format(parseISO(task.dueDate), 'MMM d, yyyy')}
                                      </span>
                                    )}
                                    {task.assignee && <span className="flex items-center gap-1"><User className="h-3 w-3" /> {task.assignee}</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(task)}><Edit className="h-3.5 w-3.5" /></Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => handleDelete(task)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </motion.div>
          )}

          {/* ─────────── KANBAN VIEW ─────────── */}
          {viewMode === 'kanban' && (
            <motion.div key="kanban" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x">
                  {STATUS_GROUPS.map((group) => (
                    <KanbanColumn
                      key={group.key}
                      status={group}
                      tasks={groupedByStatus[group.key]}
                      onEdit={openEditDialog}
                      onDelete={handleDelete}
                      onToggleDone={toggleDone}
                    />
                  ))}
                </div>
                <DragOverlay>
                  {activeDragTask ? (
                    <Card className="w-[272px] shadow-2xl rotate-2 opacity-90">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-gray-300" />
                          <span className="text-sm font-medium">{activeDragTask.title}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </motion.div>
          )}

          {/* ─────────── TIMELINE VIEW ─────────── */}
          {viewMode === 'timeline' && (
            <motion.div key="timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
              {tasksWithDates.length === 0 ? (
                <div className="text-center py-16">
                  <CalendarRange className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">No tasks with due dates</h3>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add due dates to your tasks to see them on the timeline.</p>
                </div>
              ) : (
                <>
                  {/* Timeline month nav */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {format(timelineDays[0], 'MMM d')} — {format(timelineDays[timelineDays.length - 1], 'MMM d, yyyy')}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Done</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> In Progress</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-400" /> To Do</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Overdue</span>
                    </div>
                  </div>

                  {/* Gantt chart */}
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                    {/* Header row with dates */}
                    <div className="flex min-w-max">
                      <div className="w-[200px] lg:w-[260px] flex-shrink-0 p-3 border-b border-r border-gray-200 dark:border-gray-700">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Task</span>
                      </div>
                      <div className="flex-1 flex border-b border-gray-200 dark:border-gray-700">
                        {timelineDays.map((day, i) => {
                          const showLabel = i % 7 === 0 || (timelineDays.length <= 31)
                          return (
                            <div
                              key={day.toISOString()}
                              className={`flex-1 min-w-[32px] py-1.5 text-center border-l border-gray-100 dark:border-gray-800 ${isToday(day) ? 'bg-rose-50/50 dark:bg-rose-950/30' : ''}`}
                            >
                              {showLabel && (
                                <>
                                  <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">{format(day, 'EEE')}</div>
                                  <div className={`text-xs font-medium mt-0.5 ${isToday(day) ? 'text-rose-600 dark:text-rose-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {format(day, 'd')}
                                  </div>
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Task rows */}
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {tasksWithDates
                        .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime())
                        .map((task) => {
                          const taskDate = parseISO(task.dueDate)
                          const dayIndex = timelineDays.findIndex((d) => isSameDay(d, taskDate))
                          const overdue = isOverdue(task)
                          const prio = PRIORITY_CONFIG[task.priority]
                          const statusColor = task.status === 'done' ? 'bg-emerald-500' : task.status === 'in_progress' ? 'bg-amber-500' : overdue ? 'bg-red-500' : 'bg-slate-400'

                          return (
                            <div key={task.id} className="flex min-w-max group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => openEditDialog(task)}>
                              <div className="w-[200px] lg:w-[260px] flex-shrink-0 p-3 border-r border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${statusColor}`} />
                                  <span className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                                    {task.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 ml-4">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${prio.className}`}>
                                    {prio.label}
                                  </span>
                                  {task.assignee && (
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{task.assignee}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 flex relative">
                                {timelineDays.map((day) => (
                                  <div key={day.toISOString()} className={`flex-1 min-w-[32px] h-[52px] border-l border-gray-100 dark:border-gray-800/50 ${isToday(day) ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''}`} />
                                ))}
                                {/* Task marker */}
                                {dayIndex >= 0 && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-1/2 -translate-y-1/2 z-10"
                                    style={{ left: `calc(${dayIndex} * (100% / ${timelineDays.length}) + (100% / ${timelineDays.length} / 2) - 6px)` }}
                                  >
                                    <div className={`relative group/marker`}>
                                      <div className={`h-3 w-3 rounded-full ${statusColor} ring-2 ring-white dark:ring-gray-900 shadow-sm transition-transform group-hover:scale-125`} />
                                      {/* Connector line */}
                                      <div className={`absolute left-1/2 top-3 -translate-x-1/2 w-0.5 h-3 ${statusColor} opacity-30`} />
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ─────────── CATEGORY VIEW ─────────── */}
          {viewMode === 'category' && (
            <motion.div key="category" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-3">
              {groupedByCategory.map(([category, catTasks]) => {
                const catDone = catTasks.filter((t) => t.status === 'done').length
                const catPct = catTasks.length > 0 ? Math.round((catDone / catTasks.length) * 100) : 0
                const catOverdue = catTasks.filter((t) => isOverdue(t)).length
                const isOpen = openCategories.has(category)
                const catColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other
                const catIcon = CATEGORY_ICONS[category] || '📋'

                return (
                  <Collapsible key={category} open={isOpen} onOpenChange={() => toggleCategory(category)}>
                    <Card className={`overflow-hidden transition-all duration-200 ${isOpen ? 'shadow-md' : 'hover:shadow-sm'}`}>
                      <CollapsibleTrigger asChild>
                        <button className="w-full text-left">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-lg ${catColor.split(' ').find(c => c.startsWith('bg-')) || 'bg-gray-100'}`}>
                                {catIcon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{category}</h3>
                                  <Badge variant="secondary" className="text-[10px] h-5">{catTasks.length}</Badge>
                                  {catOverdue > 0 && (
                                    <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] h-5 px-1.5 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
                                      <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> {catOverdue}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <div className="flex-1 max-w-[200px] bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                    <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${catPct}%` }} />
                                  </div>
                                  <span className="text-[11px] text-gray-500 dark:text-gray-400">{catDone}/{catTasks.length} done</span>
                                </div>
                              </div>
                              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                            </div>
                          </CardContent>
                        </button>
                      </CollapsibleTrigger>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <Separator />
                            <div className="p-3 space-y-2 bg-gray-50/50 dark:bg-gray-900/50">
                              {catTasks.map((task) => {
                                const overdue = isOverdue(task)
                                const prio = PRIORITY_CONFIG[task.priority]
                                return (
                                  <Card key={task.id} className={`group hover:shadow-sm transition-all duration-200 bg-white dark:bg-gray-900 ${overdue ? 'ring-1 ring-red-200 dark:ring-red-800' : ''}`}>
                                    <CardContent className="p-3">
                                      <div className="flex items-start gap-3">
                                        <div className="pt-0.5">
                                          <Checkbox checked={task.status === 'done'} onCheckedChange={() => toggleDone(task)} className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                                              {task.title}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${prio.className}`}>
                                              <span className={`h-1.5 w-1.5 rounded-full ${prio.dotClass}`} />
                                              {prio.label}
                                            </span>
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600">
                                              {task.status === 'todo' ? 'To Do' : task.status === 'in_progress' ? 'In Progress' : task.status === 'done' ? 'Done' : 'Cancelled'}
                                            </Badge>
                                            {overdue && (
                                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800 flex items-center gap-0.5">
                                                <AlertTriangle className="h-2.5 w-2.5" /> Overdue
                                              </span>
                                            )}
                                          </div>
                                          {task.description && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{task.description}</p>
                                          )}
                                          <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                                            {task.dueDate && (
                                              <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 dark:text-red-400 font-medium' : ''}`}>
                                                <Clock className="h-3 w-3" /> {format(parseISO(task.dueDate), 'MMM d, yyyy')}
                                              </span>
                                            )}
                                            {task.assignee && <span className="flex items-center gap-1"><User className="h-3 w-3" /> {task.assignee}</span>}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(task)}><Edit className="h-3.5 w-3.5" /></Button>
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => handleDelete(task)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </Collapsible>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {filteredTasks.length === 0 && !loading && (
          <div className="text-center py-16">
            <ListChecks className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">No tasks found</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {tasks.length === 0 ? 'Start by adding your first task to get organized.' : 'Try adjusting your filters.'}
            </p>
            {tasks.length === 0 && (
              <Button onClick={openCreateDialog} className="mt-4 bg-rose-500 hover:bg-rose-600 text-white">
                <Plus className="h-4 w-4 mr-2" /> Add Task
              </Button>
            )}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingTask ? <Edit className="h-5 w-5 text-rose-500" /> : <Plus className="h-5 w-5 text-rose-500" />}
                {editingTask ? 'Edit Task' : 'Add Task'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="task-title">Title *</Label>
                <Input id="task-title" value={formData.title} onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))} placeholder="Task title" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-desc">Description</Label>
                <Textarea id="task-desc" value={formData.description} onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))} placeholder="Task description" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData((f) => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TASK_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{CATEGORY_ICONS[c] || '📋'} {c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData((f) => ({ ...f, priority: v as Task['priority'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData((f) => ({ ...f, status: v as Task['status'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task-due">Due Date</Label>
                  <Input id="task-due" type="date" value={formData.dueDate} onChange={(e) => setFormData((f) => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-assignee">Assignee</Label>
                <Input id="task-assignee" value={formData.assignee} onChange={(e) => setFormData((f) => ({ ...f, assignee: e.target.value }))} placeholder="Who is responsible?" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-notes">Notes</Label>
                <Textarea id="task-notes" value={formData.notes} onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} className="bg-rose-500 hover:bg-rose-600 text-white">
                {editingTask ? 'Update' : 'Add'} Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}