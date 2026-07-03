'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Plus,
  Armchair,
  Users,
  Trash2,
  Edit,
  UserMinus,
  UserPlus,
} from 'lucide-react'
import { useWeddingStore } from '@/lib/store'
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

// ── Types ──────────────────────────────────────────────────────────────────
interface TableInfo {
  number: number
  capacity: number
  guestIds: string[]
}

// ── Animation ──────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

// ── Helper: color by capacity usage ───────────────────────────────────────
function getTableColor(assigned: number, capacity: number): {
  ring: string
  bg: string
  label: string
} {
  const ratio = capacity > 0 ? assigned / capacity : 0
  if (ratio >= 1) return { ring: 'border-rose-400', bg: 'bg-rose-50', label: 'bg-rose-100 text-rose-700' }
  if (ratio >= 0.75) return { ring: 'border-amber-400', bg: 'bg-amber-50', label: 'bg-amber-100 text-amber-700' }
  if (ratio >= 0.5) return { ring: 'border-violet-400', bg: 'bg-violet-50', label: 'bg-violet-100 text-violet-700' }
  return { ring: 'border-emerald-400', bg: 'bg-emerald-50', label: 'bg-emerald-100 text-emerald-700' }
}

// ── Helper: position guests in a circle ───────────────────────────────────
function getGuestPosition(index: number, total: number, radius: number) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  }
}

// ── Component ──────────────────────────────────────────────────────────────
export function SeatingChart() {
  const guests = useWeddingStore((s) => s.guests)
  const updateGuest = useWeddingStore((s) => s.updateGuest)

  // Local state
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newTableNumber, setNewTableNumber] = useState('')
  const [newTableCapacity, setNewTableCapacity] = useState('8')
  const [editCapacity, setEditCapacity] = useState('')
  const [addGuestId, setAddGuestId] = useState('')

  // Derived
  const assignedGuests = useMemo(
    () => guests.filter((g) => g.tableNumber > 0),
    [guests],
  )
  const unassignedGuests = useMemo(
    () => guests.filter((g) => g.tableNumber === 0),
    [guests],
  )

  // Build tables from guest data
  const tableMap = useMemo(() => {
    const map = new Map<number, string[]>()
    for (const g of assignedGuests) {
      const list = map.get(g.tableNumber) ?? []
      list.push(g.id)
      map.set(g.tableNumber, list)
    }
    return map
  }, [assignedGuests])

  const sortedTableNumbers = useMemo(
    () => Array.from(tableMap.keys()).sort((a, b) => a - b),
    [tableMap],
  )

  // Also include tables that were added via the dialog but may not have guests yet
  const allTables: TableInfo[] = useMemo(() => {
    const existing = new Set(sortedTableNumbers)
    const dialogTables = tables.filter((t) => !existing.has(t.number))
    return [
      ...sortedTableNumbers.map((num) => ({
        number: num,
        capacity:
          tables.find((t) => t.number === num)?.capacity ??
          tableMap.get(num)?.length ??
          8,
        guestIds: tableMap.get(num) ?? [],
      })),
      ...dialogTables,
    ]
  }, [sortedTableNumbers, tableMap, tables])

  const selectedTableInfo = useMemo(
    () => allTables.find((t) => t.number === selectedTable) ?? null,
    [allTables, selectedTable],
  )

  const selectedGuests = useMemo(
    () =>
      selectedTableInfo
        ? guests.filter((g) => selectedTableInfo.guestIds.includes(g.id))
        : [],
    [guests, selectedTableInfo],
  )

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleAddTable = useCallback(() => {
    const num = parseInt(newTableNumber, 10)
    const cap = parseInt(newTableCapacity, 10) || 8
    if (isNaN(num) || num <= 0) {
      toast.error('Please enter a valid table number.')
      return
    }
    if (allTables.some((t) => t.number === num)) {
      toast.error(`Table ${num} already exists.`)
      return
    }
    setTables((prev) => [...prev, { number: num, capacity: cap, guestIds: [] }])
    setAddDialogOpen(false)
    setNewTableNumber('')
    setNewTableCapacity('8')
    toast.success(`Table ${num} added.`)
  }, [newTableNumber, newTableCapacity, allTables])

  const handleDeleteTable = useCallback(
    (tableNumber: number) => {
      // Reassign all guests at this table to unassigned (tableNumber=0)
      const tableGuests = guests.filter((g) => g.tableNumber === tableNumber)
      for (const g of tableGuests) {
        updateGuest(g.id, { tableNumber: 0, seatNumber: 0 })
      }
      setTables((prev) => prev.filter((t) => t.number !== tableNumber))
      if (selectedTable === tableNumber) setSelectedTable(null)
      toast.success(`Table ${tableNumber} deleted. ${tableGuests.length} guest(s) moved to unassigned.`)
    },
    [guests, updateGuest, selectedTable],
  )

  const handleRemoveGuest = useCallback(
    (guestId: string) => {
      updateGuest(guestId, { tableNumber: 0, seatNumber: 0 })
      toast.success('Guest moved to unassigned.')
    },
    [updateGuest],
  )

  const handleAddGuestToTable = useCallback(
    (guestId: string) => {
      if (!selectedTableInfo) return
      if (selectedTableInfo.guestIds.length >= selectedTableInfo.capacity) {
        toast.error('Table is at full capacity.')
        return
      }
      updateGuest(guestId, {
        tableNumber: selectedTableInfo.number,
        seatNumber: selectedTableInfo.guestIds.length + 1,
      })
      setAddGuestId('')
      toast.success('Guest assigned to table.')
    },
    [selectedTableInfo, updateGuest],
  )

  const handleUpdateCapacity = useCallback(
    (newCap: number) => {
      if (!selectedTableInfo) return
      setTables((prev) =>
        prev.map((t) =>
          t.number === selectedTableInfo.number ? { ...t, capacity: newCap } : t,
        ),
      )
      toast.success('Table capacity updated.')
    },
    [selectedTableInfo],
  )

  const handleSelectTable = useCallback((num: number) => {
    setSelectedTable(num)
    const t = tables.find((t) => t.number === num)
    setEditCapacity(String(t?.capacity ?? 8))
  }, [tables])

  // ── Render: Table Circle ────────────────────────────────────────────────
  function renderTableCircle(table: TableInfo) {
    const guestList = guests.filter((g) => table.guestIds.includes(g.id))
    const colors = getTableColor(guestList.length, table.capacity)
    const isSelected = selectedTable === table.number
    const radius = 90
    const guestRadius = guestList.length > 0 ? radius + 38 : radius

    return (
      <motion.div
        key={table.number}
        variants={itemVariants}
        className="relative flex flex-col items-center gap-1 cursor-pointer group"
        onClick={() => handleSelectTable(table.number)}
      >
        <div
          className={`relative transition-all duration-200 ${
            isSelected
              ? 'ring-2 ring-rose-500 ring-offset-2 scale-105'
              : 'hover:scale-102'
          }`}
          style={{ width: guestRadius * 2 + 60, height: guestRadius * 2 + 60 }}
        >
          {/* Table circle */}
          <div
            className={`absolute rounded-full border-2 ${colors.ring} ${colors.bg} flex items-center justify-center shadow-sm`}
            style={{
              width: radius * 2,
              height: radius * 2,
              top: guestRadius - radius + 30,
              left: guestRadius - radius + 30,
            }}
          >
            <div className="text-center">
              <p className="text-lg font-bold text-rose-700">{table.number}</p>
              <p className="text-xs text-muted-foreground">
                {guestList.length}/{table.capacity}
              </p>
            </div>
          </div>

          {/* Guest seats around table */}
          {guestList.map((guest, i) => {
            const pos = getGuestPosition(i, guestList.length, guestRadius)
            return (
              <div
                key={guest.id}
                className={`absolute flex items-center justify-center w-8 h-8 rounded-full text-[10px] font-medium border border-rose-200 bg-white text-rose-800 shadow-sm transition-transform hover:scale-110 z-10`}
                style={{
                  left: guestRadius + 30 + pos.x - 16,
                  top: guestRadius + 30 + pos.y - 16,
                }}
                title={guest.name}
              >
                {guest.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )
          })}
        </div>
        <Badge variant="secondary" className={`${colors.label} text-[10px]`}>
          {guestList.length}/{table.capacity}
        </Badge>
      </motion.div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Armchair className="h-6 w-6 text-rose-500" />
            Seating Chart
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize your guests into tables with a visual layout
          </p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Table
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tables Grid */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-rose-500" />
                Table Layout
                <Badge variant="outline" className="ml-2">
                  {allTables.length} tables
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allTables.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Armchair className="h-12 w-12 mb-3 opacity-40" />
                  <p className="text-lg font-medium">No tables yet</p>
                  <p className="text-sm">Click &quot;Add Table&quot; to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 p-4">
                  {allTables.map(renderTableCircle)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Unassigned Guests */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserMinus className="h-4 w-4 text-amber-500" />
                Unassigned Guests
                <Badge variant="secondary" className="ml-auto">
                  {unassignedGuests.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[240px]">
                <div className="px-4 pb-3 space-y-1">
                  {unassignedGuests.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      All guests are assigned
                    </p>
                  ) : (
                    unassignedGuests.map((g) => (
                      <div
                        key={g.id}
                        className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 text-sm"
                      >
                        <span className="truncate mr-2">{g.name}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {g.rsvpStatus}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Selected Table Edit Panel */}
          {selectedTableInfo && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <Card className="border-rose-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Edit className="h-4 w-4 text-rose-500" />
                      Table {selectedTableInfo.number}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteTable(selectedTableInfo.number)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Capacity */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Capacity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={editCapacity}
                      onChange={(e) => setEditCapacity(e.target.value)}
                      onBlur={() => {
                        const val = parseInt(editCapacity, 10)
                        if (!isNaN(val) && val > 0) {
                          handleUpdateCapacity(val)
                        }
                      }}
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Assigned Guests */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Assigned ({selectedGuests.length}/{selectedTableInfo.capacity})
                    </Label>
                    <ScrollArea className="max-h-[180px]">
                      <div className="space-y-1">
                        {selectedGuests.map((g) => (
                          <div
                            key={g.id}
                            className="flex items-center justify-between py-1 px-2 rounded-md bg-rose-50/50 text-sm"
                          >
                            <span className="truncate mr-2">{g.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-100"
                              onClick={() => handleRemoveGuest(g.id)}
                            >
                              <UserMinus className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Add Guest Dropdown */}
                  {unassignedGuests.length > 0 &&
                    selectedGuests.length < selectedTableInfo.capacity && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Add Guest</Label>
                        <Select
                          value={addGuestId}
                          onValueChange={(val) => setAddGuestId(val)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select guest..." />
                          </SelectTrigger>
                          <SelectContent>
                            {unassignedGuests.map((g) => (
                              <SelectItem key={g.id} value={g.id}>
                                {g.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white"
                          disabled={!addGuestId}
                          onClick={() => handleAddGuestToTable(addGuestId)}
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Assign to Table
                        </Button>
                      </div>
                    )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Add Table Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-rose-500" />
              Add New Table
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Table Number</Label>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 1"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input
                type="number"
                min={1}
                placeholder="8"
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleAddTable}
            >
              Add Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}