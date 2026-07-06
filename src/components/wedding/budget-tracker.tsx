'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Receipt,
} from 'lucide-react'
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
  Legend,
} from 'recharts'
import { useWeddingStore, type BudgetCategory, type BudgetExpense } from '@/lib/store'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getProgressColor(pct: number): string {
  if (pct < 70) return 'bg-emerald-500'
  if (pct <= 90) return 'bg-amber-500'
  return 'bg-rose-500'
}

const PREDEFINED_COLORS = [
  { label: 'Rose', value: '#e11d48' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Sky', value: '#0ea5e9' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Teal', value: '#14b8a6' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Stone', value: '#78716c' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Lime', value: '#84cc16' },
  { label: 'Fuchsia', value: '#d946ef' },
  { label: 'Cyan', value: '#06b6d4' },
]

const SEED_CATEGORIES = [
  { name: 'Venue', icon: '🏛️', budgeted: 5000, color: '#e11d48' },
  { name: 'Catering', icon: '🍽️', budgeted: 8000, color: '#f59e0b' },
  { name: 'Photography', icon: '📸', budgeted: 3000, color: '#8b5cf6' },
  { name: 'Flowers', icon: '💐', budgeted: 2000, color: '#10b981' },
  { name: 'Music/DJ', icon: '🎵', budgeted: 2000, color: '#0ea5e9' },
  { name: 'Attire', icon: '👗', budgeted: 3000, color: '#f97316' },
  { name: 'Decor', icon: '🎨', budgeted: 2500, color: '#ec4899' },
  { name: 'Transportation', icon: '🚗', budgeted: 1000, color: '#6366f1' },
  { name: 'Stationery', icon: '✉️', budgeted: 500, color: '#14b8a6' },
  { name: 'Rings', icon: '💍', budgeted: 3000, color: '#a855f7' },
  { name: 'Miscellaneous', icon: '📦', budgeted: 2000, color: '#78716c' },
]

// ── Component ────────────────────────────────────────────────────────────────

export function BudgetTracker() {
  const budgetCategories = useWeddingStore((s) => s.budgetCategories)
  const setBudgetCategories = useWeddingStore((s) => s.setBudgetCategories)
  const addBudgetCategory = useWeddingStore((s) => s.addBudgetCategory)
  const updateBudgetCategory = useWeddingStore((s) => s.updateBudgetCategory)
  const deleteBudgetCategory = useWeddingStore((s) => s.deleteBudgetCategory)

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Category dialog state
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<BudgetCategory | null>(null)
  const [catForm, setCatForm] = useState({
    name: '',
    icon: '',
    budgeted: '',
    color: '#e11d48',
  })

  // Expense dialog state
  const [expDialogOpen, setExpDialogOpen] = useState(false)
  const [editingExp, setEditingExp] = useState<BudgetExpense | null>(null)
  const [expCatId, setExpCatId] = useState('')
  const [expForm, setExpForm] = useState({
    description: '',
    amount: '',
    date: '',
    vendor: '',
    paid: false,
    notes: '',
  })

  // ── Delete confirmation state ─────────────────────────────────────────
  const [deleteConfirmCatId, setDeleteConfirmCatId] = useState<string | null>(null)
  const [deleteConfirmExp, setDeleteConfirmExp] = useState<{ catId: string; expId: string } | null>(null)

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchCategories = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/budget', { signal })
      if (res.ok) {
        const data = await res.json()
        setBudgetCategories(data)
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      toast.error('Failed to load budget data')
    }
  }, [setBudgetCategories])

  const seedDefaults = useCallback(async () => {
    try {
      for (const cat of SEED_CATEGORIES) {
        await fetch('/api/budget', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cat.name,
            icon: cat.icon,
            budgeted: cat.budgeted,
            spent: 0,
            color: cat.color,
            sortOrder: SEED_CATEGORIES.indexOf(cat),
          }),
        })
      }
      await fetchCategories()
      toast.success('Default budget categories created')
    } catch {
      toast.error('Failed to seed default categories')
    }
  }, [fetchCategories])



  // ── Category CRUD ──────────────────────────────────────────────────────────

  function openAddCategory() {
    setEditingCat(null)
    setCatForm({ name: '', icon: '', budgeted: '', color: '#e11d48' })
    setCatDialogOpen(true)
  }

  function openEditCategory(cat: BudgetCategory) {
    setEditingCat(cat)
    setCatForm({
      name: cat.name,
      icon: cat.icon,
      budgeted: String(cat.budgeted),
      color: cat.color,
    })
    setCatDialogOpen(true)
  }

  async function saveCategory() {
    const budgeted = parseFloat(catForm.budgeted)
    if (!catForm.name.trim()) {
      toast.error('Category name is required')
      return
    }
    if (isNaN(budgeted) || budgeted < 0) {
      toast.error('Budgeted amount must be a valid number')
      return
    }

    try {
      if (editingCat) {
        const res = await fetch(`/api/budget/${editingCat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: catForm.name.trim(),
            icon: catForm.icon.trim(),
            budgeted,
            color: catForm.color,
          }),
        })
        if (res.ok) {
          const updated = await res.json()
          updateBudgetCategory(editingCat.id, updated)
          toast.success('Category updated')
        } else {
          toast.error('Failed to update category')
        }
      } else {
        const res = await fetch('/api/budget', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: catForm.name.trim(),
            icon: catForm.icon.trim(),
            budgeted,
            spent: 0,
            color: catForm.color,
            sortOrder: budgetCategories.length,
          }),
        })
        if (res.ok) {
          const created = await res.json()
          addBudgetCategory(created)
          toast.success('Category added')
        } else {
          toast.error('Failed to add category')
        }
      }
      setCatDialogOpen(false)
    } catch {
      toast.error('An error occurred saving the category')
    }
  }

  async function handleDeleteCategory() {
    if (!deleteConfirmCatId) return
    try {
      const res = await fetch(`/api/budget/${deleteConfirmCatId}`, { method: 'DELETE' })
      if (res.ok) {
        deleteBudgetCategory(deleteConfirmCatId)
        setExpandedIds((prev) => {
          const next = new Set(prev)
          next.delete(deleteConfirmCatId)
          return next
        })
        toast.success('Category deleted')
      } else {
        toast.error('Failed to delete category')
      }
    } catch {
      toast.error('An error occurred deleting the category')
    } finally {
      setDeleteConfirmCatId(null)
    }
  }

  // ── Expense CRUD ───────────────────────────────────────────────────────────

  function openAddExpense(catId: string) {
    setEditingExp(null)
    setExpCatId(catId)
    setExpForm({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      paid: false,
      notes: '',
    })
    setExpDialogOpen(true)
  }

  function openEditExpense(catId: string, expense: BudgetExpense) {
    setEditingExp(expense)
    setExpCatId(catId)
    setExpForm({
      description: expense.description,
      amount: String(expense.amount),
      date: expense.date,
      vendor: expense.vendor,
      paid: expense.paid,
      notes: expense.notes,
    })
    setExpDialogOpen(true)
  }

  async function saveExpense() {
    const amount = parseFloat(expForm.amount)
    if (!expForm.description.trim()) {
      toast.error('Description is required')
      return
    }
    if (isNaN(amount) || amount < 0) {
      toast.error('Amount must be a valid number')
      return
    }

    try {
      if (editingExp) {
        const res = await fetch(
          `/api/budget/${expCatId}/expenses/${editingExp.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description: expForm.description.trim(),
              amount,
              date: expForm.date,
              vendor: expForm.vendor.trim(),
              paid: expForm.paid,
              notes: expForm.notes.trim(),
            }),
          }
        )
        if (res.ok) {
          toast.success('Expense updated')
          await fetchCategories()
        } else {
          toast.error('Failed to update expense')
        }
      } else {
        const res = await fetch(`/api/budget/${expCatId}/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: expForm.description.trim(),
            amount,
            date: expForm.date,
            vendor: expForm.vendor.trim(),
            paid: expForm.paid,
            notes: expForm.notes.trim(),
          }),
        })
        if (res.ok) {
          toast.success('Expense added')
          await fetchCategories()
        } else {
          toast.error('Failed to add expense')
        }
      }
      setExpDialogOpen(false)
    } catch {
      toast.error('An error occurred saving the expense')
    }
  }

  async function handleDeleteExpense() {
    if (!deleteConfirmExp) return
    try {
      const res = await fetch(
        `/api/budget/${deleteConfirmExp.catId}/expenses/${deleteConfirmExp.expId}`,
        { method: 'DELETE' }
      )
      if (res.ok) {
        toast.success('Expense deleted')
        await fetchCategories()
      } else {
        toast.error('Failed to delete expense')
      }
    } catch {
      toast.error('An error occurred deleting the expense')
    } finally {
      setDeleteConfirmExp(null)
    }
  }

  // ── Toggle expand ──────────────────────────────────────────────────────────

  function toggleExpand(catId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) {
        next.delete(catId)
      } else {
        next.add(catId)
      }
      return next
    })
  }

  // ── Computed values ────────────────────────────────────────────────────────

  const totalBudgeted = budgetCategories.reduce(
    (sum, c) => sum + c.budgeted,
    0
  )
  const totalSpent = budgetCategories.reduce((sum, c) => sum + c.spent, 0)
  const remaining = totalBudgeted - totalSpent
  const overallPct = totalBudgeted > 0 ? Math.min((totalSpent / totalBudgeted) * 100, 100) : 0

  // Chart data
  const pieData = budgetCategories.map((c) => ({
    name: c.name,
    value: c.budgeted,
    color: c.color,
  }))

  const barData = budgetCategories.map((c) => ({
    name: c.name.length > 10 ? c.name.slice(0, 10) + '…' : c.name,
    fullName: c.name,
    budgeted: c.budgeted,
    spent: c.spent,
  }))

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-rose-500" />
          <h1 className="text-2xl font-bold tracking-tight">Budget Tracker</h1>
        </div>
        <Button onClick={openAddCategory} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Total Budgeted
            </div>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(totalBudgeted)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Total Spent
            </div>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingDown className="h-4 w-4" />
              Remaining
            </div>
            <p
              className={`mt-1 text-2xl font-bold ${
                remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatCurrency(remaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">
              {totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0}% spent
            </span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0
              )}`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Chart Tabs */}
      <Tabs defaultValue="allocation">
        <TabsList>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="allocation">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Budget Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              {budgetCategories.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No categories yet. Add one to get started!
                </p>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [formatCurrency(value), name]} />
                      <Legend
                        formatter={(value: string) => (
                          <span className="text-xs">{value}</span>
                        )}
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Budgeted vs Spent</CardTitle>
            </CardHeader>
            <CardContent>
              {budgetCategories.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No categories yet. Add one to get started!
                </p>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        angle={-30}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: number) => `$${(v / 1000).toFixed(v >= 1000 ? 0 : 1)}k`}
                      />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend
                        formatter={(value: string) => (
                          <span className="text-xs">{value === 'budgeted' ? 'Budgeted' : 'Spent'}</span>
                        )}
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                      <Bar dataKey="budgeted" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="spent" fill="#e11d48" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category List */}
      <div className="space-y-3">
        {budgetCategories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Receipt className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>No budget categories yet.</p>
              <p className="text-sm">Click &quot;Add Category&quot; to get started or use defaults.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={seedDefaults}>
                Initialize with Default Categories
              </Button>
            </CardContent>
          </Card>
        ) : (
          budgetCategories.map((cat) => {
            const catPct = cat.budgeted > 0 ? (cat.spent / cat.budgeted) * 100 : 0
            const isExpanded = expandedIds.has(cat.id)
            const catRemaining = cat.budgeted - cat.spent

            return (
              <Card key={cat.id}>
                <CardContent className="pt-6">
                  {/* Category header row */}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon || '📁'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold truncate">{cat.name}</h3>
                        <div className="flex items-center gap-1 ml-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditCategory(cat)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-500 hover:text-rose-600"
                            onClick={() => setDeleteConfirmCatId(cat.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleExpand(cat.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Budgeted</span>
                          <p className="font-medium">{formatCurrency(cat.budgeted)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Spent</span>
                          <p className="font-medium">{formatCurrency(cat.spent)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Remaining</span>
                          <p
                            className={`font-medium ${
                              catRemaining >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {formatCurrency(catRemaining)}
                          </p>
                        </div>
                      </div>

                      {/* Category progress bar */}
                      <div className="mt-3 flex items-center gap-2">
                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${getProgressColor(catPct)}`}
                            style={{
                              width: `${Math.min(catPct, 100)}%`,
                              backgroundColor:
                                catPct < 70
                                  ? '#10b981'
                                  : catPct <= 90
                                  ? '#f59e0b'
                                  : '#e11d48',
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground w-10 text-right">
                          {Math.round(catPct)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded expense list */}
                  {isExpanded && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-muted-foreground">
                            Expenses ({cat.expenses.length})
                          </h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAddExpense(cat.id)}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add Expense
                          </Button>
                        </div>

                        {cat.expenses.length === 0 ? (
                          <p className="py-4 text-center text-sm text-muted-foreground">
                            No expenses recorded yet.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {cat.expenses.map((exp) => (
                              <div
                                key={exp.id}
                                className="flex items-center gap-3 rounded-lg border p-3"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm truncate">
                                      {exp.description}
                                    </span>
                                    <Badge
                                      variant={exp.paid ? 'default' : 'secondary'}
                                      className={exp.paid ? 'bg-emerald-600' : 'bg-amber-100 text-amber-800'}
                                    >
                                      {exp.paid ? 'Paid' : 'Unpaid'}
                                    </Badge>
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                    <span>{formatCurrency(exp.amount)}</span>
                                    {exp.date && <span>{exp.date}</span>}
                                    {exp.vendor && <span>{exp.vendor}</span>}
                                  </div>
                                  {exp.notes && (
                                    <p className="mt-1 text-xs text-muted-foreground truncate">
                                      {exp.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => openEditExpense(cat.id, exp)}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-rose-500 hover:text-rose-600"
                                    onClick={() => setDeleteConfirmExp({ catId: cat.id, expId: exp.id })}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* ── Add/Edit Category Dialog ─────────────────────────────────────────── */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCat ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                placeholder="e.g. Venue"
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-icon">Icon (emoji)</Label>
              <Input
                id="cat-icon"
                placeholder="e.g. 🏛️"
                value={catForm.icon}
                onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-budgeted">Budgeted Amount ($)</Label>
              <Input
                id="cat-budgeted"
                type="number"
                min="0"
                placeholder="5000"
                value={catForm.budgeted}
                onChange={(e) => setCatForm({ ...catForm, budgeted: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-color">Color</Label>
              <Select
                value={catForm.color}
                onValueChange={(val) => setCatForm({ ...catForm, color: val })}
              >
                <SelectTrigger id="cat-color">
                  <SelectValue placeholder="Select a color">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full border"
                        style={{ backgroundColor: catForm.color }}
                      />
                      <span>
                        {PREDEFINED_COLORS.find((c) => c.value === catForm.color)?.label ||
                          'Custom'}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_COLORS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full border"
                          style={{ backgroundColor: c.value }}
                        />
                        <span>{c.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCategory}>
              {editingCat ? 'Save Changes' : 'Add Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add/Edit Expense Dialog ──────────────────────────────────────────── */}
      <Dialog open={expDialogOpen} onOpenChange={setExpDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExp ? 'Edit Expense' : 'Add Expense'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="exp-desc">Description</Label>
              <Input
                id="exp-desc"
                placeholder="e.g. Venue deposit"
                value={expForm.description}
                onChange={(e) =>
                  setExpForm({ ...expForm, description: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="exp-amount">Amount ($)</Label>
              <Input
                id="exp-amount"
                type="number"
                min="0"
                placeholder="1000"
                value={expForm.amount}
                onChange={(e) =>
                  setExpForm({ ...expForm, amount: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="exp-date">Date</Label>
              <Input
                id="exp-date"
                type="date"
                value={expForm.date}
                onChange={(e) =>
                  setExpForm({ ...expForm, date: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="exp-vendor">Vendor</Label>
              <Input
                id="exp-vendor"
                placeholder="e.g. Grand Ballroom"
                value={expForm.vendor}
                onChange={(e) =>
                  setExpForm({ ...expForm, vendor: e.target.value })
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="exp-paid" className="cursor-pointer">
                Paid
              </Label>
              <Switch
                id="exp-paid"
                checked={expForm.paid}
                onCheckedChange={(checked) =>
                  setExpForm({ ...expForm, paid: checked })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="exp-notes">Notes</Label>
              <Textarea
                id="exp-notes"
                placeholder="Additional details..."
                value={expForm.notes}
                onChange={(e) =>
                  setExpForm({ ...expForm, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveExpense}>
              {editingExp ? 'Save Changes' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Category Confirmation ─────────────────────────────────── */}
      <AlertDialog open={!!deleteConfirmCatId} onOpenChange={() => setDeleteConfirmCatId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this budget category? All associated expenses will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Expense Confirmation ──────────────────────────────────── */}
      <AlertDialog open={!!deleteConfirmExp} onOpenChange={() => setDeleteConfirmExp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}