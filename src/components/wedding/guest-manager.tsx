'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle,
  Mail,
  Phone,
} from 'lucide-react'
import { useWeddingStore, type Guest } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'

// ─── Animation variants ───────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
}

// ─── RSVP badge config ────────────────────────────────────────────────
const RSVP_CONFIG: Record<
  Guest['rsvpStatus'],
  { label: string; color: string; icon: typeof CheckCircle }
> = {
  accepted: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
  declined: { label: 'Declined', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  maybe: { label: 'Maybe', color: 'bg-violet-100 text-violet-700 border-violet-200', icon: HelpCircle },
}

// ─── Empty guest template ─────────────────────────────────────────────
const EMPTY_GUEST: Omit<Guest, 'id'> = {
  name: '',
  email: '',
  phone: '',
  group: '',
  rsvpStatus: 'pending',
  mealPreference: '',
  dietaryNotes: '',
  plusOne: false,
  plusOneName: '',
  tableNumber: 0,
  seatNumber: 0,
  role: 'guest',
  notes: '',
}

// ─── Stat card data shape ─────────────────────────────────────────────
interface StatCard {
  label: string
  value: number
  color: string
  bgColor: string
  icon: typeof Users
}

// ─── Component ────────────────────────────────────────────────────────
export function GuestManager() {
  const { guests, setGuests, addGuest, updateGuest, deleteGuest } =
    useWeddingStore()

  // ── Local state ────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [formData, setFormData] = useState<Omit<Guest, 'id'>>(EMPTY_GUEST)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [rsvpFilter, setRsvpFilter] = useState<string>('all')
  const [groupFilter, setGroupFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // ── Fetch guests on mount ──────────────────────────────────────────
  useEffect(() => {
    async function fetchGuests() {
      try {
        const res = await fetch('/api/guests')
        if (!res.ok) throw new Error('Failed to fetch guests')
        const data: Guest[] = await res.json()
        setGuests(data)
      } catch (err) {
        console.error(err)
        toast.error('Failed to load guests')
      } finally {
        setLoading(false)
      }
    }
    fetchGuests()
  }, [setGuests])

  // ── Derived: filtered guests ───────────────────────────────────────
  const filteredGuests = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return guests.filter((g) => {
      // Search filter (name / email)
      if (q && !g.name.toLowerCase().includes(q) && !g.email.toLowerCase().includes(q)) {
        return false
      }
      // RSVP filter
      if (rsvpFilter !== 'all' && g.rsvpStatus !== rsvpFilter) return false
      // Group filter
      if (groupFilter && !g.group.toLowerCase().includes(groupFilter.toLowerCase())) return false
      // Role filter
      if (roleFilter !== 'all' && g.role !== roleFilter) return false
      return true
    })
  }, [guests, searchQuery, rsvpFilter, groupFilter, roleFilter])

  // ── Derived: stats ─────────────────────────────────────────────────
  const stats = useMemo<StatCard[]>(() => {
    const total = guests.length
    const accepted = guests.filter((g) => g.rsvpStatus === 'accepted').length
    const pending = guests.filter((g) => g.rsvpStatus === 'pending').length
    const declined = guests.filter((g) => g.rsvpStatus === 'declined').length
    const plusOnes = guests.filter((g) => g.plusOne).length
    return [
      { label: 'Total Guests', value: total, color: 'text-foreground', bgColor: 'bg-muted', icon: Users },
      { label: 'Accepted', value: accepted, color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: CheckCircle },
      { label: 'Pending', value: pending, color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Clock },
      { label: 'Declined', value: declined, color: 'text-rose-600', bgColor: 'bg-rose-50', icon: XCircle },
      { label: 'Plus Ones', value: plusOnes, color: 'text-violet-600', bgColor: 'bg-violet-50', icon: HelpCircle },
    ]
  }, [guests])

  // ── Derived: unique groups (for reference) ─────────────────────────
  const uniqueGroups = useMemo(
    () => [...new Set(guests.map((g) => g.group).filter(Boolean))].sort(),
    [guests],
  )

  // ── Dialog helpers ─────────────────────────────────────────────────
  const openAddDialog = useCallback(() => {
    setEditingGuest(null)
    setFormData(EMPTY_GUEST)
    setDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((guest: Guest) => {
    setEditingGuest(guest)
    const { id: _, ...rest } = guest
    setFormData(rest)
    setDialogOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
    setEditingGuest(null)
    setFormData(EMPTY_GUEST)
  }, [])

  // ── Form change handler ────────────────────────────────────────────
  const updateField = useCallback(
    <K extends keyof Omit<Guest, 'id'>>(key: K, value: Omit<Guest, 'id'>[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  // ── Submit handler (create / update) ───────────────────────────────
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Guest name is required')
      return
    }

    try {
      if (editingGuest) {
        // Update
        const res = await fetch(`/api/guests/${editingGuest.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('Failed to update guest')
        const updated = await res.json()
        updateGuest(editingGuest.id, updated)
        toast.success(`"${formData.name}" updated successfully`)
      } else {
        // Create
        const newGuest: Guest = { ...formData, id: crypto.randomUUID() }
        const res = await fetch('/api/guests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newGuest),
        })
        if (!res.ok) throw new Error('Failed to create guest')
        const created = await res.json()
        addGuest(created)
        toast.success(`"${formData.name}" added successfully`)
      }
      closeDialog()
    } catch (err) {
      console.error(err)
      toast.error(editingGuest ? 'Failed to update guest' : 'Failed to add guest')
    }
  }

  // ── Delete handler ─────────────────────────────────────────────────
  const handleDelete = async (guest: Guest) => {
    try {
      const res = await fetch(`/api/guests/${guest.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete guest')
      deleteGuest(guest.id)
      toast.success(`"${guest.name}" removed`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete guest')
    }
  }

  // ── RSVP badge renderer ────────────────────────────────────────────
  const renderRsvpBadge = (status: Guest['rsvpStatus']) => {
    const cfg = RSVP_CONFIG[status]
    const Icon = cfg.icon
    return (
      <Badge variant="outline" className={`gap-1 ${cfg.color}`}>
        <Icon className="size-3" />
        {cfg.label}
      </Badge>
    )
  }

  // ── Loading state ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-6 p-4 md:p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Guest Management</h1>
          <p className="text-muted-foreground text-sm">
            {guests.length} guest{guests.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <UserPlus className="size-4" />
          Add Guest
        </Button>
      </motion.div>

      {/* ── Stats Cards ─────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="py-4">
              <CardContent className="flex items-center gap-3 px-4">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${stat.bgColor}`}>
                  <Icon className={`size-5 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground truncate text-xs">{stat.label}</p>
                  <p className={`text-xl font-bold leading-tight ${stat.color}`}>{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      {/* ── Search & Filters ────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="size-4" />
            <span className="sr-only sm:not-sr-only">Filters:</span>
          </div>

          {/* RSVP filter */}
          <Select value={rsvpFilter} onValueChange={setRsvpFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="RSVP Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All RSVP</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="maybe">Maybe</SelectItem>
            </SelectContent>
          </Select>

          {/* Group filter */}
          <Input
            placeholder="Filter by group..."
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="w-[160px]"
          />

          {/* Role filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="guest">Guest</SelectItem>
              <SelectItem value="bridesmaid">Bridesmaid</SelectItem>
              <SelectItem value="groomsman">Groomsman</SelectItem>
              <SelectItem value="family">Family</SelectItem>
              <SelectItem value="officiant">Officiant</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || rsvpFilter !== 'all' || groupFilter || roleFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setRsvpFilter('all')
                setGroupFilter('')
                setRoleFilter('all')
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </motion.div>

      {/* ── Guest Table / Cards ─────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        {filteredGuests.length === 0 ? (
          /* Empty state */
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <Users className="text-muted-foreground size-8" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">
                  {guests.length === 0 ? 'No guests yet' : 'No matching guests'}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {guests.length === 0
                    ? 'Add your first guest to get started with your wedding guest list.'
                    : 'Try adjusting your search or filters.'}
                </p>
              </div>
              {guests.length === 0 && (
                <Button onClick={openAddDialog} variant="outline">
                  <UserPlus className="size-4" />
                  Add Your First Guest
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop table (hidden on mobile) */}
            <Card className="hidden md:block">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>RSVP</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead className="text-center">+1</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-[60px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGuests.map((guest) => (
                      <TableRow key={guest.id}>
                        <TableCell className="font-medium">{guest.name}</TableCell>
                        <TableCell>
                          {guest.email ? (
                            <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
                              <Mail className="size-3.5" />
                              {guest.email}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {guest.group || <span className="text-muted-foreground/50">—</span>}
                        </TableCell>
                        <TableCell>{renderRsvpBadge(guest.rsvpStatus)}</TableCell>
                        <TableCell>
                          {guest.mealPreference || (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {guest.plusOne ? (
                            <Badge variant="secondary" className="text-xs">
                              {guest.plusOneName || 'Yes'}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {guest.role ? (
                            <Badge variant="outline" className="capitalize text-xs">
                              {guest.role}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(guest)}>
                                <Edit className="size-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDelete(guest)}
                              >
                                <Trash2 className="size-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Mobile cards (hidden on md+) */}
            <div className="grid gap-3 md:hidden">
              {filteredGuests.map((guest) => (
                <Card key={guest.id} className="py-4">
                  <CardContent className="space-y-3 px-4">
                    {/* Name + actions row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{guest.name}</p>
                        {guest.group && (
                          <p className="text-muted-foreground text-xs">{guest.group}</p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 shrink-0">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(guest)}>
                            <Edit className="size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleDelete(guest)}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Contact row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {guest.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="size-3.5" />
                          {guest.email}
                        </span>
                      )}
                      {guest.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="size-3.5" />
                          {guest.phone}
                        </span>
                      )}
                    </div>

                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2">
                      {renderRsvpBadge(guest.rsvpStatus)}
                      {guest.role && guest.role !== 'guest' && (
                        <Badge variant="outline" className="capitalize text-xs">
                          {guest.role}
                        </Badge>
                      )}
                      {guest.plusOne && (
                        <Badge variant="secondary" className="text-xs">
                          +1{guest.plusOneName ? `: ${guest.plusOneName}` : ''}
                        </Badge>
                      )}
                    </div>

                    {/* Details row */}
                    {(guest.mealPreference || guest.tableNumber) && (
                      <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                        {guest.mealPreference && <span>Meal: {guest.mealPreference}</span>}
                        {guest.tableNumber > 0 && <span>Table: {guest.tableNumber}</span>}
                        {guest.seatNumber > 0 && <span>Seat: {guest.seatNumber}</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* ── Add / Edit Dialog ───────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGuest ? 'Edit Guest' : 'Add Guest'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="guest-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="guest-name"
                placeholder="Full name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </div>

            {/* Email + Phone (side-by-side) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="guest-email">Email</Label>
                <Input
                  id="guest-email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="guest-phone">Phone</Label>
                <Input
                  id="guest-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>
            </div>

            {/* Group */}
            <div className="grid gap-2">
              <Label htmlFor="guest-group">Group</Label>
              <Input
                id="guest-group"
                placeholder="Family, Friends, Work..."
                value={formData.group}
                onChange={(e) => updateField('group', e.target.value)}
              />
            </div>

            {/* RSVP Status + Role (side-by-side) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>RSVP Status</Label>
                <Select
                  value={formData.rsvpStatus}
                  onValueChange={(v) =>
                    updateField('rsvpStatus', v as Guest['rsvpStatus'])
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="maybe">Maybe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => updateField('role', v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guest">Guest</SelectItem>
                    <SelectItem value="bridesmaid">Bridesmaid</SelectItem>
                    <SelectItem value="groomsman">Groomsman</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="officiant">Officiant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Meal Preference */}
            <div className="grid gap-2">
              <Label htmlFor="guest-meal">Meal Preference</Label>
              <Input
                id="guest-meal"
                placeholder="Chicken, Vegetarian, Vegan..."
                value={formData.mealPreference}
                onChange={(e) => updateField('mealPreference', e.target.value)}
              />
            </div>

            {/* Dietary Notes */}
            <div className="grid gap-2">
              <Label htmlFor="guest-dietary">Dietary Notes</Label>
              <Textarea
                id="guest-dietary"
                placeholder="Allergies, dietary restrictions..."
                value={formData.dietaryNotes}
                onChange={(e) => updateField('dietaryNotes', e.target.value)}
                rows={2}
              />
            </div>

            {/* Plus One */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="guest-plusone" className="cursor-pointer">
                  Plus One
                </Label>
                <p className="text-muted-foreground text-xs">
                  This guest is bringing a plus one
                </p>
              </div>
              <Switch
                id="guest-plusone"
                checked={formData.plusOne}
                onCheckedChange={(checked) => updateField('plusOne', checked)}
              />
            </div>

            {/* Plus One Name (conditional) */}
            {formData.plusOne && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid gap-2 overflow-hidden"
              >
                <Label htmlFor="guest-plusone-name">Plus One Name</Label>
                <Input
                  id="guest-plusone-name"
                  placeholder="Name of the plus one"
                  value={formData.plusOneName}
                  onChange={(e) => updateField('plusOneName', e.target.value)}
                />
              </motion.div>
            )}

            {/* Table + Seat (side-by-side) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="guest-table">Table Number</Label>
                <Input
                  id="guest-table"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={formData.tableNumber || ''}
                  onChange={(e) => updateField('tableNumber', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="guest-seat">Seat Number</Label>
                <Input
                  id="guest-seat"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={formData.seatNumber || ''}
                  onChange={(e) => updateField('seatNumber', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="guest-notes">Notes</Label>
              <Textarea
                id="guest-notes"
                placeholder="Any additional notes..."
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingGuest ? 'Save Changes' : 'Add Guest'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}