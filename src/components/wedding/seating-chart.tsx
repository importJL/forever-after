'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Plus,
  Armchair,
  Users,
  Trash2,
  Edit,
  UserMinus,
  UserPlus,
  GripVertical,
  X,
  Check,
  Clock,
  ChevronDown,
  TableProperties,
  Maximize2,
  CircleDot,
} from 'lucide-react'
import { useWeddingStore, type Guest } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────
interface TablePosition {
  id: string
  number: number
  capacity: number
  shape: 'round' | 'rectangle' | 'oval'
  x: number
  y: number
  label: string
}

interface DragGuestData {
  guest: Guest
  fromTable: number | null
}

// ── Constants ──────────────────────────────────────────────────────────────
const RSVP_CONFIG: Record<Guest['rsvpStatus'], { label: string; color: string; dotClass: string }> = {
  accepted: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800', dotClass: 'bg-emerald-500' },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800', dotClass: 'bg-amber-500' },
  declined: { label: 'Declined', color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800', dotClass: 'bg-rose-500' },
  maybe: { label: 'Maybe', color: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800', dotClass: 'bg-sky-500' },
}

const TABLE_COLORS = [
  'border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/50',
  'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/50',
  'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/50',
  'border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/50',
  'border-sky-300 bg-sky-50 dark:border-sky-700 dark:bg-sky-950/50',
  'border-pink-300 bg-pink-50 dark:border-pink-700 dark:bg-pink-950/50',
  'border-teal-300 bg-teal-50 dark:border-teal-700 dark:bg-teal-950/50',
  'border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950/50',
]

const FLOOR_PLAN_MIN_W = 700
const FLOOR_PLAN_MIN_H = 450

// ── Helpers ────────────────────────────────────────────────────────────────
function getTableColor(index: number) {
  return TABLE_COLORS[index % TABLE_COLORS.length]
}

function getCapacityColor(assigned: number, capacity: number) {
  const ratio = capacity > 0 ? assigned / capacity : 0
  if (ratio >= 1) return 'text-rose-600 dark:text-rose-400'
  if (ratio >= 0.75) return 'text-amber-600 dark:text-amber-400'
  if (ratio >= 0.5) return 'text-violet-600 dark:text-violet-400'
  return 'text-emerald-600 dark:text-emerald-400'
}

function getGuestPosition(index: number, total: number, radius: number) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

// ── Animation ──────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

// ── Component ──────────────────────────────────────────────────────────────
export function SeatingChart() {
  const guests = useWeddingStore((s) => s.guests)
  const updateGuest = useWeddingStore((s) => s.updateGuest)

  // Load table positions from localStorage on mount
  const [initialPositions] = useState(() => {
    if (typeof window === 'undefined') return null
    try {
      const saved = localStorage.getItem('seating-table-positions')
      return saved ? JSON.parse(saved) as TablePosition[] : null
    } catch { return null }
  })
  const [tablePositions, setTablePositions] = useState<TablePosition[]>(initialPositions ?? [])
  const [isLoaded] = useState(initialPositions !== null)
  const floorPlanRef = useRef<HTMLDivElement>(null)

  // UI state
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newTableName, setNewTableName] = useState('')
  const [newTableCapacity, setNewTableCapacity] = useState('8')
  const [newTableShape, setNewTableShape] = useState<'round' | 'rectangle' | 'oval'>('round')
  const [addGuestId, setAddGuestId] = useState('')
  const [editCapacity, setEditCapacity] = useState('')
  const [editLabel, setEditLabel] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [dragOverTableId, setDragOverTableId] = useState<string | null>(null)
  const [activeDragGuest, setActiveDragGuest] = useState<DragGuestData | null>(null)
  const [rsvpGroupOpen, setRsvpGroupOpen] = useState<Set<string>>(new Set(['accepted', 'pending', 'declined', 'maybe']))
  const [editingTableId, setEditingTableId] = useState<string | null>(null)

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  // Save table positions to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('seating-table-positions', JSON.stringify(tablePositions))
    }
  }, [tablePositions])

  // ── Derived data ───────────────────────────────────────────────────────
  const guestsByTable = useMemo(() => {
    const map = new Map<number, Guest[]>()
    for (const g of guests) {
      if (g.tableNumber > 0) {
        const list = map.get(g.tableNumber) ?? []
        list.push(g)
        map.set(g.tableNumber, list)
      }
    }
    return map
  }, [guests])

  const assignedGuestIds = useMemo(
    () => new Set(guests.filter((g) => g.tableNumber > 0).map((g) => g.id)),
    [guests],
  )

  const unassignedGuests = useMemo(
    () => guests.filter((g) => g.tableNumber === 0),
    [guests],
  )

  const allTableNumbers = useMemo(
    () => new Set(tablePositions.map((t) => t.number)),
    [tablePositions],
  )

  // Merge table info with guest data
  const tablesWithGuests = useMemo(() => {
    return tablePositions.map((tp) => ({
      ...tp,
      guests: guestsByTable.get(tp.number) ?? [],
      assignedCount: (guestsByTable.get(tp.number) ?? []).length,
    }))
  }, [tablePositions, guestsByTable])

  const selectedTable = useMemo(
    () => tablesWithGuests.find((t) => t.id === selectedTableId) ?? null,
    [tablesWithGuests, selectedTableId],
  )

  // Group all guests by RSVP status
  const guestsByRsvp = useMemo(() => {
    const groups: Record<string, Guest[]> = { accepted: [], pending: [], declined: [], maybe: [] }
    for (const g of guests) {
      if (groups[g.rsvpStatus]) groups[g.rsvpStatus].push(g)
    }
    return groups
  }, [guests])

  // Stats
  const totalAssigned = guests.filter((g) => g.tableNumber > 0).length
  const totalGuests = guests.length
  const totalCapacity = tablePositions.reduce((sum, t) => sum + t.capacity, 0)

  // ── Table management ───────────────────────────────────────────────────
  const handleAddTable = useCallback(() => {
    const cap = parseInt(newTableCapacity, 10) || 8
    const usedNumbers = Array.from(allTableNumbers)
    const nextNum = usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 1
    const label = newTableName.trim() || `Table ${nextNum}`

    if (allTableNumbers.size >= 50) {
      toast.error('Maximum 50 tables allowed.')
      return
    }

    // Auto-position in a grid
    const col = (nextNum - 1) % 4
    const row = Math.floor((nextNum - 1) / 4)
    const x = 60 + col * 200
    const y = 60 + row * 200

    const newTable: TablePosition = {
      id: crypto.randomUUID(),
      number: nextNum,
      capacity: cap,
      shape: newTableShape,
      x,
      y,
      label,
    }

    setTablePositions((prev) => [...prev, newTable])
    setAddDialogOpen(false)
    setNewTableName('')
    setNewTableCapacity('8')
    setNewTableShape('round')
    toast.success(`${label} added`)
  }, [newTableName, newTableCapacity, newTableShape, allTableNumbers])

  const handleDeleteTable = useCallback(
    (tableId: string, tableNumber: number) => {
      const tableGuests = guestsByTable.get(tableNumber) ?? []
      for (const g of tableGuests) {
        updateGuest(g.id, { tableNumber: 0, seatNumber: 0 })
      }
      setTablePositions((prev) => prev.filter((t) => t.id !== tableId))
      if (selectedTableId === tableId) setSelectedTableId(null)
      toast.success(`Table deleted. ${tableGuests.length} guest(s) unassigned.`)
    },
    [guestsByTable, updateGuest, selectedTableId],
  )

  const handleUpdateTable = useCallback(
    (tableId: string, updates: Partial<TablePosition>) => {
      setTablePositions((prev) => prev.map((t) => (t.id === tableId ? { ...t, ...updates } : t)))
    },
    [],
  )

  // ── Guest assignment ───────────────────────────────────────────────────
  const assignGuestToTable = useCallback(
    (guestId: string, tableNumber: number, seatNum: number) => {
      updateGuest(guestId, { tableNumber, seatNumber: seatNum })
    },
    [updateGuest],
  )

  const unassignGuest = useCallback(
    (guestId: string) => {
      updateGuest(guestId, { tableNumber: 0, seatNumber: 0 })
      toast.success('Guest unassigned.')
    },
    [updateGuest],
  )

  const handleAddGuestDropdown = useCallback(() => {
    if (!selectedTable || !addGuestId) return
    if (selectedTable.assignedCount >= selectedTable.capacity) {
      toast.error('Table is at full capacity.')
      return
    }
    const nextSeat = selectedTable.assignedCount + 1
    assignGuestToTable(addGuestId, selectedTable.number, nextSeat)
    setAddGuestId('')
    toast.success('Guest assigned!')
  }, [selectedTable, addGuestId, assignGuestToTable])

  const handleSelectTable = useCallback((tableId: string) => {
    setSelectedTableId(tableId)
    setEditingTableId(null)
  }, [])

  // ── Table dragging (free-form placement) ──────────────────────────────
  const dragTableInfo = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null)

  const handleTableMouseDown = useCallback(
    (e: React.MouseEvent, tableId: string) => {
      // Only start drag from the grip handle
      const target = e.target as HTMLElement
      if (!target.closest('[data-table-grip]')) return
      e.preventDefault()
      e.stopPropagation()

      const table = tablePositions.find((t) => t.id === tableId)
      if (!table) return

      const floorPlan = floorPlanRef.current
      if (!floorPlan) return

      const rect = floorPlan.getBoundingClientRect()
      dragTableInfo.current = {
        id: tableId,
        offsetX: e.clientX - rect.left - table.x,
        offsetY: e.clientY - rect.top - table.y,
      }

      const handleMouseMove = (moveE: MouseEvent) => {
        if (!dragTableInfo.current || !floorPlan) return
        const fpRect = floorPlan.getBoundingClientRect()
        let newX = moveE.clientX - fpRect.left - dragTableInfo.current.offsetX
        let newY = moveE.clientY - fpRect.top - dragTableInfo.current.offsetY

        // Clamp to floor plan bounds
        newX = Math.max(0, Math.min(newX, fpRect.width - 80))
        newY = Math.max(0, Math.min(newY, fpRect.height - 80))

        setTablePositions((prev) =>
          prev.map((t) =>
            t.id === dragTableInfo.current!.id ? { ...t, x: newX, y: newY } : t,
          ),
        )
      }

      const handleMouseUp = () => {
        dragTableInfo.current = null
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [tablePositions],
  )

  // ── Guest DnD ─────────────────────────────────────────────────────────
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const guestId = String(event.active.id)
    const guest = guests.find((g) => g.id === guestId)
    if (guest) {
      setActiveDragGuest({ guest, fromTable: guest.tableNumber > 0 ? guest.tableNumber : null })
    }
  }, [guests])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragGuest(null)
      setDragOverTableId(null)

      const { active, over } = event
      if (!over) return

      const guestId = String(active.id)
      const guest = guests.find((g) => g.id === guestId)
      if (!guest) return

      // Check if dropped on a table
      const tableId = String(over.id)
      const table = tablesWithGuests.find((t) => t.id === tableId)
      if (table) {
        if (table.assignedCount >= table.capacity) {
          toast.error(`${table.label} is at full capacity.`)
          return
        }
        const nextSeat = table.assignedCount + 1
        assignGuestToTable(guestId, table.number, nextSeat)
        toast.success(`${guest.name} → ${table.label}`)
        // Auto-select this table
        setSelectedTableId(table.id)
      }
    },
    [guests, tablesWithGuests, assignGuestToTable],
  )

  // ── Guest list: toggle RSVP group ─────────────────────────────────────
  const toggleRsvpGroup = (status: string) => {
    setRsvpGroupOpen((prev) => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }

  // ── Loading ───────────────────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
      </div>
    )
  }

  // ── Render: Draggable Guest Chip ──────────────────────────────────────
  function renderGuestChip(guest: Guest, showTable: boolean) {
    const rsvp = RSVP_CONFIG[guest.rsvpStatus]
    const isAssigned = guest.tableNumber > 0
    const assignedTable = isAssigned
      ? tablesWithGuests.find((t) => t.number === guest.tableNumber)
      : null

    return (
      <div
        key={guest.id}
        className={cn(
          'group/gc flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-150 cursor-grab active:cursor-grabbing select-none',
          isAssigned
            ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-sm'
            : 'bg-gray-50 dark:bg-gray-800/50 border-dashed border-gray-300 dark:border-gray-600 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-white dark:hover:bg-gray-800',
        )}
        data-dnd-guest={guest.id}
      >
        {/* Avatar */}
        <div className={cn('h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0', rsvp.dotClass)}>
          {getInitials(guest.name)}
        </div>
        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{guest.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border', rsvp.color)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', rsvp.dotClass)} />
              {rsvp.label}
            </span>
            {showTable && isAssigned && assignedTable && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
                🪑 {assignedTable.label}
              </span>
            )}
          </div>
        </div>
        {/* Unassign button */}
        {isAssigned && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover/gc:opacity-100 transition-opacity text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 shrink-0"
            onClick={(e) => { e.stopPropagation(); unassignGuest(guest.id) }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  // ── Render: Floor Plan Table ──────────────────────────────────────────
  function renderFloorTable(table: typeof tablesWithGuests[number], index: number) {
    const colorClass = getTableColor(index)
    const isSelected = selectedTableId === table.id
    const isDragOver = dragOverTableId === table.id
    const isFull = table.assignedCount >= table.capacity
    const capacityColor = getCapacityColor(table.assignedCount, table.capacity)
    const radius = 55

    return (
      <motion.div
        key={table.id}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: index * 0.03 }}
        className="absolute"
        style={{ left: table.x, top: table.y, zIndex: isSelected ? 30 : 10 }}
        onMouseDown={(e) => handleTableMouseDown(e, table.id)}
        onClick={(e) => {
          // Only select if not dragging (no grip target)
          if (!(e.target as HTMLElement).closest('[data-table-grip]')) {
            handleSelectTable(table.id)
            setIsEditing(false)
            setEditCapacity(String(table.capacity))
            setEditLabel(table.label)
          }
        }}
        data-table-drop={table.id}
      >
        <div
          className={cn(
            'relative flex flex-col items-center transition-all duration-200 cursor-pointer group/ft',
            isSelected && 'scale-105',
            isDragOver && 'ring-2 ring-rose-400 ring-offset-2 scale-105',
          )}
        >
          {/* Grip handle */}
          <button
            data-table-grip
            className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 h-5 w-10 rounded-full bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 flex items-center justify-center opacity-0 group-hover/ft:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            title="Drag to move table"
          >
            <GripVertical className="h-3 w-3 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Edit table button */}
          <button
            className="absolute -top-2 -right-2 z-20 h-5 w-5 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center opacity-0 group-hover/ft:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              setEditingTableId(table.id)
              setEditCapacity(String(table.capacity))
              setEditLabel(table.label)
            }}
          >
            <Edit className="h-2.5 w-2.5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Guest seats + table */}
          <div className="relative" style={{ width: (radius + 30) * 2, height: (radius + 30) * 2 }}>
            {/* Table shape */}
            {table.shape === 'round' && (
              <div
                className={cn(
                  'absolute rounded-full border-2 flex items-center justify-center shadow-md transition-all',
                  colorClass,
                  isFull && 'ring-2 ring-rose-400 ring-offset-1',
                )}
                style={{
                  width: radius * 2,
                  height: radius * 2,
                  top: 30,
                  left: 30,
                }}
              >
                <div className="text-center">
                  <p className="text-base font-bold text-gray-800 dark:text-gray-200 leading-tight">{table.label}</p>
                  <p className={cn('text-xs font-semibold mt-0.5', capacityColor)}>
                    {table.assignedCount}/{table.capacity}
                  </p>
                </div>
              </div>
            )}
            {table.shape === 'rectangle' && (
              <div
                className={cn(
                  'absolute rounded-xl border-2 flex items-center justify-center shadow-md transition-all',
                  colorClass,
                  isFull && 'ring-2 ring-rose-400 ring-offset-1',
                )}
                style={{
                  width: radius * 2.2,
                  height: radius * 1.4,
                  top: 30 + (radius * 0.3),
                  left: 30 - (radius * 0.1),
                }}
              >
                <div className="text-center">
                  <p className="text-base font-bold text-gray-800 dark:text-gray-200 leading-tight">{table.label}</p>
                  <p className={cn('text-xs font-semibold mt-0.5', capacityColor)}>
                    {table.assignedCount}/{table.capacity}
                  </p>
                </div>
              </div>
            )}
            {table.shape === 'oval' && (
              <div
                className={cn(
                  'absolute rounded-[50%] border-2 flex items-center justify-center shadow-md transition-all',
                  colorClass,
                  isFull && 'ring-2 ring-rose-400 ring-offset-1',
                )}
                style={{
                  width: radius * 2.4,
                  height: radius * 1.6,
                  top: 30 + (radius * 0.2),
                  left: 30 - (radius * 0.2),
                }}
              >
                <div className="text-center">
                  <p className="text-base font-bold text-gray-800 dark:text-gray-200 leading-tight">{table.label}</p>
                  <p className={cn('text-xs font-semibold mt-0.5', capacityColor)}>
                    {table.assignedCount}/{table.capacity}
                  </p>
                </div>
              </div>
            )}

            {/* Guest seats around table */}
            {table.guests.map((guest, i) => {
              const pos = getGuestPosition(i, table.guests.length, radius + 24)
              const rsvp = RSVP_CONFIG[guest.rsvpStatus]
              return (
                <div
                  key={guest.id}
                  className={cn(
                    'absolute flex items-center justify-center w-8 h-8 rounded-full text-[10px] font-bold text-white shadow-md transition-transform hover:scale-125 hover:z-30 border-2 border-white dark:border-gray-900',
                    rsvp.dotClass,
                  )}
                  style={{
                    left: (radius + 30) + pos.x - 16,
                    top: (radius + 30) + pos.y - 16,
                  }}
                  title={`${guest.name} (${rsvp.label})`}
                >
                  {getInitials(guest.name)}
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <motion.div
        className="space-y-5 p-4 md:p-6 max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
              <Armchair className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Seating Chart</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Drag tables to position, click to assign guests</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              setTablePositions([])
              setSelectedTableId(null)
              toast.info('Layout reset')
            }} disabled={tablePositions.length === 0}>
              <Maximize2 className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
            <Button onClick={() => setAddDialogOpen(true)} className="bg-rose-500 hover:bg-rose-600 text-white">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Table
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tables</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{tablePositions.length}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
                  <TableProperties className="h-4 w-4 text-rose-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Seats</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{totalCapacity}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-950 flex items-center justify-center">
                  <Users className="h-4 w-4 text-violet-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assigned</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{totalAssigned}/{totalGuests}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                  <Check className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-1.5 rounded-full transition-all" style={{ width: `${totalGuests > 0 ? (totalAssigned / totalGuests) * 100 : 0}%` }} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unassigned</p>
                  <p className={`text-2xl font-bold mt-0.5 ${unassignedGuests.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'}`}>{unassignedGuests.length}</p>
                </div>
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${unassignedGuests.length > 0 ? 'bg-amber-100 dark:bg-amber-950' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Clock className={`h-4 w-4 ${unassignedGuests.length > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Floor Plan Area */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-rose-500" />
              Floor Plan
              <Badge variant="secondary" className="ml-auto text-[10px]">
                Drag grip handle to move tables
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {tablePositions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
                <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <TableProperties className="h-8 w-8" />
                </div>
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No tables yet</p>
                <p className="text-sm mt-1">Click "Add Table" to create your first table</p>
                <Button onClick={() => setAddDialogOpen(true)} className="mt-4 bg-rose-500 hover:bg-rose-600 text-white" size="sm">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Your First Table
                </Button>
              </div>
            ) : (
              <div
                ref={floorPlanRef}
                className="relative bg-[radial-gradient(circle_at_50%_50%,rgba(244,163,181,0.06)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(244,163,181,0.03)_0%,transparent_70%)] overflow-auto"
                style={{ minHeight: FLOOR_PLAN_MIN_H, minWidth: '100%' }}
              >
                {/* Grid background */}
                <div
                  className="absolute inset-0 opacity-30 dark:opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                  }}
                />
                {/* Tables */}
                {tablesWithGuests.map((table, i) => renderFloorTable(table, i))}
                {/* Extendable area */}
                <div style={{ minHeight: Math.max(FLOOR_PLAN_MIN_H, ...tablePositions.map((t) => t.y + 250)) }} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Guest Assignment Panel */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-rose-500" />
                Guest Pool
                <Badge variant="secondary" className="text-[10px]">
                  {totalGuests} guests · {totalAssigned} assigned
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Accepted</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Pending</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Declined</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-500" /> Maybe</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[400px]">
              <div className="p-4 space-y-3">
                {/* RSVP Groups */}
                {(['accepted', 'pending', 'declined', 'maybe'] as const).map((status) => {
                  const groupGuests = guestsByRsvp[status]
                  const rsvp = RSVP_CONFIG[status]
                  const isOpen = rsvpGroupOpen.has(status)
                  const assignedInGroup = groupGuests.filter((g) => g.tableNumber > 0).length

                  if (groupGuests.length === 0) return null

                  return (
                    <div key={status}>
                      <button
                        className="w-full flex items-center gap-2 py-2 px-1 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                        onClick={() => toggleRsvpGroup(status)}
                      >
                        <ChevronDown className={cn('h-3.5 w-3.5 text-gray-400 transition-transform', !isOpen && '-rotate-90')} />
                        <span className={cn('h-2.5 w-2.5 rounded-full', rsvp.dotClass)} />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{rsvp.label}</span>
                        <Badge variant="secondary" className="text-[10px] h-5">{groupGuests.length}</Badge>
                        {assignedInGroup > 0 && (
                          <Badge className="text-[10px] h-5 bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
                            🪑 {assignedInGroup} seated
                          </Badge>
                        )}
                        <span className="ml-auto text-[11px] text-gray-400 dark:text-gray-500">
                          {isOpen ? 'Collapse' : `${groupGuests.length} guests`}
                        </span>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 pt-2 pl-5">
                              {groupGuests.map((g) => renderGuestChip(g, true))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}

                {totalGuests === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No guests yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add guests in the Guest Manager first</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Selected Table Detail Panel (shown as inline card below floor plan) */}
        <AnimatePresence>
          {selectedTable && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-rose-200 dark:border-rose-800 overflow-hidden">
                <CardHeader className="pb-3 bg-rose-50/50 dark:bg-rose-950/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Edit className="h-4 w-4 text-rose-500" />
                      {editingTableId === selectedTable.id ? (
                        <Input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="h-7 w-40 text-sm"
                          onBlur={() => {
                            handleUpdateTable(selectedTable.id, { label: editLabel })
                            setEditingTableId(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateTable(selectedTable.id, { label: editLabel })
                              setEditingTableId(null)
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="cursor-pointer hover:text-rose-700" onClick={() => {
                          setEditingTableId(selectedTable.id)
                          setEditLabel(selectedTable.label)
                        }}>
                          {selectedTable.label}
                        </span>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {selectedTable.assignedCount}/{selectedTable.capacity} guests
                      </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700"
                        onClick={() => handleSelectTable(selectedTable.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteTable(selectedTable.id, selectedTable.number)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Capacity + Shape row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">Capacity</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          value={editingTableId === selectedTable.id ? editCapacity : selectedTable.capacity}
                          onChange={(e) => {
                            setEditCapacity(e.target.value)
                            setIsEditing(true)
                          }}
                          onBlur={() => {
                            const val = parseInt(editCapacity, 10)
                            if (!isNaN(val) && val > 0 && val !== selectedTable.capacity) {
                              handleUpdateTable(selectedTable.id, { capacity: val })
                              toast.success('Capacity updated')
                            }
                            setIsEditing(false)
                          }}
                          className="h-8 text-sm w-20"
                          disabled={editingTableId === selectedTable.id}
                        />
                        <span className="text-xs text-gray-400">seats</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">Shape</Label>
                      <Select
                        value={selectedTable.shape}
                        onValueChange={(v) => handleUpdateTable(selectedTable.id, { shape: v as 'round' | 'rectangle' | 'oval' })}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="round">⭕ Round</SelectItem>
                          <SelectItem value="rectangle">⬜ Rectangle</SelectItem>
                          <SelectItem value="oval">🥜 Oval</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  {/* Currently seated guests */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Armchair className="h-3 w-3" />
                        Seated Guests ({selectedTable.assignedCount}/{selectedTable.capacity})
                      </Label>
                    </div>
                    {selectedTable.guests.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-xs text-gray-400 dark:text-gray-500">No guests seated yet</p>
                        <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">Use the dropdown below or drag from the guest pool</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedTable.guests.map((g) => {
                          const rsvp = RSVP_CONFIG[g.rsvpStatus]
                          return (
                            <div key={g.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50">
                              <div className={cn('h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0', rsvp.dotClass)}>
                                {getInitials(g.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{g.name}</p>
                                <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border', rsvp.color)}>
                                  <span className={cn('h-1.5 w-1.5 rounded-full', rsvp.dotClass)} />
                                  {rsvp.label}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 text-rose-500 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-950"
                                onClick={() => unassignGuest(g.id)}
                              >
                                <UserMinus className="h-3 w-3" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Add guest via dropdown */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                      <UserPlus className="h-3 w-3" />
                      Assign Guest
                    </Label>
                    {selectedTable.assignedCount >= selectedTable.capacity ? (
                      <p className="text-xs text-rose-500 font-medium">⚠ Table is at full capacity</p>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <Select value={addGuestId} onValueChange={setAddGuestId}>
                            <SelectTrigger className="h-9 text-sm flex-1">
                              <SelectValue placeholder="Select a guest to assign..." />
                            </SelectTrigger>
                            <SelectContent>
                              {unassignedGuests.length === 0 ? (
                                <div className="py-3 text-center text-xs text-gray-400">All guests are assigned</div>
                              ) : (
                                unassignedGuests.map((g) => {
                                  const rsvp = RSVP_CONFIG[g.rsvpStatus]
                                  return (
                                    <SelectItem key={g.id} value={g.id}>
                                      <span className="flex items-center gap-2">
                                        <span className={cn('h-2 w-2 rounded-full', rsvp.dotClass)} />
                                        {g.name}
                                        <span className="text-gray-400">({rsvp.label})</span>
                                      </span>
                                    </SelectItem>
                                  )
                                })
                              )}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            className="h-9 bg-rose-500 hover:bg-rose-600 text-white shrink-0"
                            disabled={!addGuestId}
                            onClick={handleAddGuestDropdown}
                          >
                            <UserPlus className="h-3.5 w-3.5 mr-1" />
                            Assign
                          </Button>
                        </div>
                        <p className="text-[10px] text-gray-400">💡 You can also drag guests from the pool below directly onto tables in the floor plan</p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Table Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-rose-500" />
                Add New Table
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Table Name</Label>
                <Input
                  placeholder="e.g. Head Table, Table 1"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                />
                <p className="text-[10px] text-gray-400">Leave blank for auto-numbered name</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    placeholder="8"
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shape</Label>
                  <Select value={newTableShape} onValueChange={(v) => setNewTableShape(v as 'round' | 'rectangle' | 'oval')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round">⭕ Round</SelectItem>
                      <SelectItem value="rectangle">⬜ Rectangle</SelectItem>
                      <SelectItem value="oval">🥜 Oval</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddTable} className="bg-rose-500 hover:bg-rose-600 text-white">
                Add Table
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Drag Overlay */}
      <DragOverlay dropAnimation={null}>
        {activeDragGuest ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border-2 border-rose-300 dark:border-rose-700 shadow-xl rotate-2 opacity-90">
            <div className={cn('h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white', RSVP_CONFIG[activeDragGuest.guest.rsvpStatus].dotClass)}>
              {getInitials(activeDragGuest.guest.name)}
            </div>
            <span className="text-sm font-medium">{activeDragGuest.guest.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}