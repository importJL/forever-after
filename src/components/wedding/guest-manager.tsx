'use client'

import { useState, useMemo, useCallback } from 'react'
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
  MoreHorizontal,
} from 'lucide-react'
import { useWeddingStore, type Guest } from '@/lib/store'
import { client } from '@/lib/amplify-client'
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
  priority: 3,
  side: '',
  category: '',
  relationshipGroup: '',
  overseas: false,
  verbalAsked: false,
  adults: 1,
  children: 0,
  totalInParty: 1,
  address: '',
  giftReceived: '',
  thankYouSent: false,
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
  const guests = useWeddingStore((s) => s.guests)
  const setGuests = useWeddingStore((s) => s.setGuests)
  const addGuest = useWeddingStore((s) => s.addGuest)
  const updateGuest = useWeddingStore((s) => s.updateGuest)
  const deleteGuest = useWeddingStore((s) => s.deleteGuest)
  const guestSetup = useWeddingStore((s) => s.guestSetup)

  // ── Local state ────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [formData, setFormData] = useState<Omit<Guest, 'id'>>(EMPTY_GUEST)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [rsvpFilter, setRsvpFilter] = useState<string>('all')
  const [groupFilter, setGroupFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [sideFilter, setSideFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [relationshipFilter, setRelationshipFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // ── Delete confirmation state ─────────────────────────────────────
  const [deleteConfirmGuest, setDeleteConfirmGuest] = useState<Guest | null>(null)

  // ── Derived: filtered guests ───────────────────────────────────────
  const filteredGuests = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return guests.filter((g) => {
      if (q && !g.name.toLowerCase().includes(q) && !g.email.toLowerCase().includes(q)) {
        return false
      }
      if (rsvpFilter !== 'all' && g.rsvpStatus !== rsvpFilter) return false
      if (groupFilter && !g.group.toLowerCase().includes(groupFilter.toLowerCase())) return false
      if (roleFilter !== 'all' && g.role !== roleFilter) return false
      if (sideFilter !== 'all' && g.side !== sideFilter) return false
      if (categoryFilter !== 'all' && g.category !== categoryFilter) return false
      if (relationshipFilter !== 'all' && g.relationshipGroup !== relationshipFilter) return false
      if (priorityFilter !== 'all' && g.priority !== parseInt(priorityFilter)) return false
      return true
    })
  }, [guests, searchQuery, rsvpFilter, groupFilter, roleFilter, sideFilter, categoryFilter, relationshipFilter, priorityFilter])

  // ── Derived: stats ─────────────────────────────────────────────────
  const stats = useMemo<StatCard[]>(() => {
    const total = guests.length
    const accepted = guests.filter((g) => g.rsvpStatus === 'accepted').length
    const pending = guests.filter((g) => g.rsvpStatus === 'pending').length
    const declined = guests.filter((g) => g.rsvpStatus === 'declined').length
    const plusOnes = guests.filter((g) => g.plusOne).length
    const priorityOne = guests.filter((g) => g.priority === 1).length
    const overseas = guests.filter((g) => g.overseas).length
    return [
      { label: 'Total Guests', value: total, color: 'text-foreground', bgColor: 'bg-muted', icon: Users },
      { label: 'Accepted', value: accepted, color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: CheckCircle },
      { label: 'Pending', value: pending, color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Clock },
      { label: 'Declined', value: declined, color: 'text-rose-600', bgColor: 'bg-rose-50', icon: XCircle },
      { label: 'Priority 1', value: priorityOne, color: 'text-rose-600', bgColor: 'bg-rose-50', icon: HelpCircle },
      { label: 'Overseas', value: overseas, color: 'text-sky-600', bgColor: 'bg-sky-50', icon: HelpCircle },
    ]
  }, [guests])

  // ── Derived: unique values for filter dropdowns ────────────────────
  const uniqueGroups = useMemo(
    () => [...new Set(guests.map((g) => g.group).filter(Boolean))].sort(),
    [guests],
  )
  const uniqueSides = useMemo(() => {
    if (guestSetup?.sides?.length) return guestSetup.sides
    return [...new Set(guests.map((g) => g.side).filter(Boolean))].sort()
  }, [guests, guestSetup])
  const uniqueCategories = useMemo(() => {
    if (guestSetup?.categories?.length) return guestSetup.categories
    return [...new Set(guests.map((g) => g.category).filter(Boolean))].sort()
  }, [guests, guestSetup])
  const uniqueRelationships = useMemo(() => {
    if (guestSetup?.relationshipGroups?.length) return guestSetup.relationshipGroups
    return [...new Set(guests.map((g) => g.relationshipGroup).filter(Boolean))].sort()
  }, [guests, guestSetup])

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
        const { data: updated, errors } = await client.models.Guest.update({ id: editingGuest.id, ...formData })
        if (errors) throw new Error(errors[0].message)
        if (updated) updateGuest(editingGuest.id, updated)
        toast.success(`"${formData.name}" updated successfully`)
      } else {
        const { data: created, errors } = await client.models.Guest.create(formData)
        if (errors) throw new Error(errors[0].message)
        if (created) addGuest(created)
        toast.success(`"${formData.name}" added successfully`)
      }
      closeDialog()
    } catch (err) {
      console.error(err)
      toast.error(editingGuest ? 'Failed to update guest' : 'Failed to add guest')
    }
  }

  // ── Delete handler ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteConfirmGuest) return
    try {
      const { errors } = await client.models.Guest.delete({ id: deleteConfirmGuest.id })
      if (errors) throw new Error(errors[0].message)
      deleteGuest(deleteConfirmGuest.id)
      toast.success(`"${deleteConfirmGuest.name}" removed`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete guest')
    } finally {
      setDeleteConfirmGuest(null)
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
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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

          {/* Side filter */}
          <Select value={sideFilter} onValueChange={setSideFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Side" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sides</SelectItem>
              {uniqueSides.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Relationship Group filter */}
          <Select value={relationshipFilter} onValueChange={setRelationshipFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Relationship" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Relationships</SelectItem>
              {uniqueRelationships.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="1">Priority 1</SelectItem>
              <SelectItem value="2">Priority 2</SelectItem>
              <SelectItem value="3">Priority 3</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || rsvpFilter !== 'all' || groupFilter || roleFilter !== 'all' || sideFilter !== 'all' || categoryFilter !== 'all' || relationshipFilter !== 'all' || priorityFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setRsvpFilter('all')
                setGroupFilter('')
                setRoleFilter('all')
                setSideFilter('all')
                setCategoryFilter('all')
                setRelationshipFilter('all')
                setPriorityFilter('all')
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
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead>RSVP</TableHead>
                      <TableHead className="text-center">+1</TableHead>
                      <TableHead className="text-center">O/S</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-[60px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGuests.map((guest) => (
                      <TableRow key={guest.id}>
                        <TableCell className="text-muted-foreground text-xs text-center">{guest.priority}</TableCell>
                        <TableCell className="font-medium">{guest.name}</TableCell>
                        <TableCell className="text-xs">{guest.side || <span className="text-muted-foreground/50">—</span>}</TableCell>
                        <TableCell className="text-xs max-w-[120px] truncate">{guest.category || <span className="text-muted-foreground/50">—</span>}</TableCell>
                        <TableCell className="text-xs max-w-[120px] truncate">{guest.relationshipGroup || <span className="text-muted-foreground/50">—</span>}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {renderRsvpBadge(guest.rsvpStatus)}
                          </div>
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
                        <TableCell className="text-center text-xs">
                          {guest.overseas ? (
                            <Badge variant="outline" className="text-xs bg-sky-50 text-sky-700 border-sky-200">Yes</Badge>
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
                                onClick={() => setDeleteConfirmGuest(guest)}
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
                        <div className="flex items-center gap-2 text-muted-foreground text-xs mt-0.5">
                          {guest.priority && <span>P{guest.priority}</span>}
                          {guest.side && <span>{guest.side}</span>}
                          {guest.category && <span>{guest.category}</span>}
                        </div>
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
                            onClick={() => setDeleteConfirmGuest(guest)}
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
                      {guest.relationshipGroup && (
                        <Badge variant="outline" className="text-xs">
                          {guest.relationshipGroup}
                        </Badge>
                      )}
                      {guest.overseas && (
                        <Badge variant="outline" className="text-xs bg-sky-50 text-sky-700 border-sky-200">Overseas</Badge>
                      )}
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
            {/* Name + Priority (side-by-side) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="sm:col-span-3 grid gap-2">
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
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select
                  value={String(formData.priority)}
                  onValueChange={(v) => updateField('priority', parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Priority 1</SelectItem>
                    <SelectItem value="2">Priority 2</SelectItem>
                    <SelectItem value="3">Priority 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Side + Category (side-by-side) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Side</Label>
                <Select
                  value={formData.side}
                  onValueChange={(v) => updateField('side', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select side" />
                  </SelectTrigger>
                  <SelectContent>
                    {guestSetup?.sides?.length ? (
                      guestSetup.sides.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="Bride">Bride</SelectItem>
                        <SelectItem value="Groom">Groom</SelectItem>
                        <SelectItem value="Joint">Joint</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => updateField('category', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {guestSetup?.categories?.length ? (
                      guestSetup.categories.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="V Family">V Family</SelectItem>
                        <SelectItem value="J Family">J Family</SelectItem>
                        <SelectItem value="JV Friends">JV Friends</SelectItem>
                        <SelectItem value="High school/ College Friends">High school/ College Friends</SelectItem>
                        <SelectItem value="Work Colleagues">Work Colleagues</SelectItem>
                        <SelectItem value="Plus Ones">Plus Ones</SelectItem>
                        <SelectItem value="Family Friends">Family Friends</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Relationship Group */}
            <div className="grid gap-2">
              <Label>Relationship Group</Label>
              <Select
                value={formData.relationshipGroup}
                onValueChange={(v) => updateField('relationshipGroup', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship group" />
                </SelectTrigger>
                <SelectContent>
                  {guestSetup?.relationshipGroups?.length ? (
                    guestSetup.relationshipGroups.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="Immediate Family">Immediate Family</SelectItem>
                      <SelectItem value="Extended Family">Extended Family</SelectItem>
                      <SelectItem value="Church Friends">Church Friends</SelectItem>
                      <SelectItem value="Bridesmaid">Bridesmaid</SelectItem>
                      <SelectItem value="Groomsmen">Groomsmen</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
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

            {/* Adults + Children (side-by-side) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="guest-adults">Adults</Label>
                <Input
                  id="guest-adults"
                  type="number"
                  min={0}
                  placeholder="1"
                  value={formData.adults || ''}
                  onChange={(e) => updateField('adults', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="guest-children">Children</Label>
                <Input
                  id="guest-children"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={formData.children || ''}
                  onChange={(e) => updateField('children', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Total in Party */}
            <div className="grid gap-2">
              <Label htmlFor="guest-total">Total in Party</Label>
              <Input
                id="guest-total"
                type="number"
                min={0}
                placeholder="1"
                value={formData.totalInParty || ''}
                onChange={(e) => updateField('totalInParty', parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Overseas + Verbal Asked + Thank You Sent switches */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="guest-overseas" className="cursor-pointer text-sm">Overseas</Label>
                  <p className="text-muted-foreground text-xs">Guest is overseas</p>
                </div>
                <Switch
                  id="guest-overseas"
                  checked={formData.overseas}
                  onCheckedChange={(checked) => updateField('overseas', checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="guest-verbal" className="cursor-pointer text-sm">Verbal Asked</Label>
                  <p className="text-muted-foreground text-xs">Verbally invited</p>
                </div>
                <Switch
                  id="guest-verbal"
                  checked={formData.verbalAsked}
                  onCheckedChange={(checked) => updateField('verbalAsked', checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="guest-thanks" className="cursor-pointer text-sm">Thank You Sent</Label>
                  <p className="text-muted-foreground text-xs">Thank-you note sent</p>
                </div>
                <Switch
                  id="guest-thanks"
                  checked={formData.thankYouSent}
                  onCheckedChange={(checked) => updateField('thankYouSent', checked)}
                />
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

            {/* Address */}
            <div className="grid gap-2">
              <Label htmlFor="guest-address">Address</Label>
              <Input
                id="guest-address"
                placeholder="Street, City, State, ZIP"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
              />
            </div>

            {/* Gift Received */}
            <div className="grid gap-2">
              <Label htmlFor="guest-gift">Gift Received</Label>
              <Input
                id="guest-gift"
                placeholder="Gift description"
                value={formData.giftReceived}
                onChange={(e) => updateField('giftReceived', e.target.value)}
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

      {/* ── Delete Confirmation ─────────────────────────────────────────── */}
      <AlertDialog open={!!deleteConfirmGuest} onOpenChange={() => setDeleteConfirmGuest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Guest</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteConfirmGuest?.name}&quot;? This action cannot be undone.
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