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
import { Checkbox } from '@/components/ui/checkbox'
import type { Task } from '@/lib/store'
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

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  medium: { label: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  high: { label: 'High', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  urgent: { label: 'Urgent', className: 'bg-rose-50 text-rose-700 border-rose-200' },
}

const STATUS_GROUPS = [
  { key: 'todo' as const, label: 'To Do', icon: Circle, color: 'text-slate-500' },
  { key: 'in_progress' as const, label: 'In Progress', icon: Loader, color: 'text-amber-500' },
  { key: 'done' as const, label: 'Done', icon: CheckCircle2, color: 'text-emerald-500' },
  { key: 'cancelled' as const, label: 'Cancelled', icon: XCircle, color: 'text-rose-400' },
]

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
      const matchSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.assignee.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || t.status === statusFilter
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter
      const matchCategory = categoryFilter === 'all' || t.category === categoryFilter
      return matchSearch && matchStatus && matchPriority && matchCategory
    })
  }, [tasks, search, statusFilter, priorityFilter, categoryFilter])

  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
      cancelled: [],
    }
    filteredTasks.forEach((t) => {
      if (groups[t.status]) groups[t.status].push(t)
    })
    return groups
  }, [filteredTasks])

  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === 'done' || task.status === 'cancelled') return false
    return new Date(task.dueDate) < new Date(new Date().toDateString())
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
    if (!formData.title.trim()) {
      toast.error('Task title is required')
      return
    }

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
        } else {
          toast.error('Failed to update task')
        }
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
        } else {
          toast.error('Failed to add task')
        }
      }
      setDialogOpen(false)
    } catch {
      toast.error('Something went wrong')
    }
  }

  const handleDelete = async (task: Task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== task.id))
        toast.success('Task deleted')
      } else {
        toast.error('Failed to delete task')
      }
    } catch {
      toast.error('Something went wrong')
    }
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
    } catch {
      toast.error('Failed to update task')
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListChecks className="h-7 w-7 text-rose-500" />
          <h1 className="text-2xl font-bold text-gray-900">Task Checklist</h1>
        </div>
        <Button onClick={openCreateDialog} className="bg-rose-500 hover:bg-rose-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
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
                <SelectTrigger className="w-[130px]">
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
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {TASK_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Total Tasks</span>
              <span className="text-2xl font-bold text-gray-900">{totalTasks}</span>
            </div>
            <div className="flex gap-3 text-xs text-gray-500">
              <span>{STATUS_GROUPS.map((g) => `${g.label}: ${groupedTasks[g.key].length}`).join(' · ')}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Completion</span>
              <span className="text-2xl font-bold text-emerald-600">{completionPct}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Groups */}
      {STATUS_GROUPS.map((group) => {
        const groupTasks = groupedTasks[group.key]
        if (groupTasks.length === 0) return null
        return (
          <div key={group.key} className="space-y-3">
            <div className="flex items-center gap-2">
              <group.icon className={`h-5 w-5 ${group.color}`} />
              <h2 className="text-lg font-semibold text-gray-800">{group.label}</h2>
              <Badge variant="secondary" className="text-xs">
                {groupTasks.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {groupTasks.map((task) => {
                const overdue = isOverdue(task)
                const prio = PRIORITY_CONFIG[task.priority]
                return (
                  <Card key={task.id} className="group hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="pt-0.5">
                          <Checkbox
                            checked={task.status === 'done'}
                            onCheckedChange={() => toggleDone(task)}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-medium text-gray-900 ${
                                task.status === 'done' ? 'line-through text-gray-400' : ''
                              }`}
                            >
                              {task.title}
                            </span>
                            <Badge variant="outline" className={`text-xs ${prio.className}`}>
                              {prio.label}
                            </Badge>
                            {task.category && (
                              <Badge variant="secondary" className="text-xs">
                                {task.category}
                              </Badge>
                            )}
                            {overdue && (
                              <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                            {task.dueDate && (
                              <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : ''}`}>
                                <Clock className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            {task.assignee && <span>👤 {task.assignee}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(task)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {filteredTasks.length === 0 && !loading && (
        <div className="text-center py-16">
          <ListChecks className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500">No tasks found</h3>
          <p className="text-sm text-gray-400 mt-1">
            {tasks.length === 0
              ? 'Start by adding your first task to get organized.'
              : 'Try adjusting your filters.'}
          </p>
          {tasks.length === 0 && (
            <Button onClick={openCreateDialog} className="mt-4 bg-rose-500 hover:bg-rose-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Add Task'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                value={formData.title}
                onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                placeholder="Task title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea
                id="task-desc"
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                placeholder="Task description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                    {TASK_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) =>
                    setFormData((f) => ({ ...f, priority: v as Task['priority'] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData((f) => ({ ...f, status: v as Task['status'] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Input
                  id="task-due"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-assignee">Assignee</Label>
              <Input
                id="task-assignee"
                value={formData.assignee}
                onChange={(e) => setFormData((f) => ({ ...f, assignee: e.target.value }))}
                placeholder="Who is responsible?"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-notes">Notes</Label>
              <Textarea
                id="task-notes"
                value={formData.notes}
                onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-rose-500 hover:bg-rose-600">
              {editingTask ? 'Update' : 'Add'} Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}