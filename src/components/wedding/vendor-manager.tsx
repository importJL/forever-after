'use client'

import { useState, useMemo } from 'react'
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
import { useWeddingStore, type Vendor } from '@/lib/store'
import { LocationLink } from '@/components/map/location-link'
import {
  Plus,
  Search,
  Star,
  ExternalLink,
  Phone,
  Mail,
  Globe,
  MapPin,
  Store,
  Edit,
  Trash2,
} from 'lucide-react'

const VENDOR_CATEGORIES = [
  'Venue',
  'Catering',
  'Photography',
  'Videography',
  'Music/DJ',
  'Florist',
  'Attire',
  'Cake',
  'Decor',
  'Stationery',
  'Transportation',
  'Officiant',
  'Hair & Makeup',
  'Planning',
  'Other',
]

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  considering: { label: 'Considering', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  booked: { label: 'Booked', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  confirmed: { label: 'Confirmed', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', className: 'bg-rose-50 text-rose-700 border-rose-200' },
}

const emptyVendor: Omit<Vendor, 'id'> = {
  name: '',
  category: 'Other',
  contactPerson: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  district: '',
  city: 'Hong Kong',
  price: 0,
  depositPaid: 0,
  status: 'considering',
  rating: 0,
  notes: '',
  contractDate: '',
}

function StarRating({
  rating,
  onChange,
  readonly = false,
  size = 'sm',
}: {
  rating: number
  onChange?: (r: number) => void
  readonly?: boolean
  size?: 'sm' | 'md'
}) {
  const sz = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          onClick={() => onChange?.(star)}
        >
          <Star
            className={`${sz} ${
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function VendorManager() {
  const vendors = useWeddingStore((s) => s.vendors)
  const setVendors = useWeddingStore((s) => s.setVendors)
  const addVendor = useWeddingStore((s) => s.addVendor)
  const updateVendor = useWeddingStore((s) => s.updateVendor)
  const deleteVendor = useWeddingStore((s) => s.deleteVendor)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [formData, setFormData] = useState(emptyVendor)
  const [hoverRating, setHoverRating] = useState(0)
  const [deleteConfirmVendor, setDeleteConfirmVendor] = useState<Vendor | null>(null)

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchSearch =
        !search ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
        v.email.toLowerCase().includes(search.toLowerCase())
      const matchCategory = categoryFilter === 'all' || v.category === categoryFilter
      const matchStatus = statusFilter === 'all' || v.status === statusFilter
      return matchSearch && matchCategory && matchStatus
    })
  }, [vendors, search, categoryFilter, statusFilter])

  const stats = useMemo(() => {
    const total = vendors.length
    const booked = vendors.filter((v) => v.status === 'booked').length
    const confirmed = vendors.filter((v) => v.status === 'confirmed').length
    const totalDeposits = vendors.reduce((sum, v) => sum + (v.depositPaid || 0), 0)
    const totalPrice = vendors.reduce((sum, v) => sum + (v.price || 0), 0)
    return { total, booked, confirmed, totalDeposits, totalPrice }
  }, [vendors])

  const categories = useMemo(() => {
    const cats = new Set(vendors.map((v) => v.category))
    return Array.from(cats).sort()
  }, [vendors])

  const openCreateDialog = () => {
    setEditingVendor(null)
    setFormData(emptyVendor)
    setHoverRating(0)
    setDialogOpen(true)
  }

  const openEditDialog = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setFormData({
      name: vendor.name,
      category: vendor.category,
      contactPerson: vendor.contactPerson,
      email: vendor.email,
      phone: vendor.phone,
      website: vendor.website,
      address: vendor.address,
      district: vendor.district,
      city: vendor.city,
      price: vendor.price,
      depositPaid: vendor.depositPaid,
      status: vendor.status,
      rating: vendor.rating,
      notes: vendor.notes,
      contractDate: vendor.contractDate,
    })
    setHoverRating(0)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Vendor name is required')
      return
    }

    try {
      if (editingVendor) {
        const res = await fetch(`/api/vendors/${editingVendor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (res.ok) {
          const updated = await res.json()
          updateVendor(updated.id, updated)
          toast.success('Vendor updated')
        } else {
          toast.error('Failed to update vendor')
        }
      } else {
        const res = await fetch('/api/vendors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (res.ok) {
          const created = await res.json()
          addVendor(created)
          toast.success('Vendor added')
        } else {
          toast.error('Failed to add vendor')
        }
      }
      setDialogOpen(false)
    } catch {
      toast.error('Something went wrong')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmVendor) return
    try {
      const res = await fetch(`/api/vendors/${deleteConfirmVendor.id}`, { method: 'DELETE' })
      if (res.ok) {
        deleteVendor(deleteConfirmVendor.id)
        toast.success('Vendor deleted')
      } else {
        toast.error('Failed to delete vendor')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setDeleteConfirmVendor(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Store className="h-7 w-7 text-rose-500" />
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
        </div>
        <Button onClick={openCreateDialog} className="bg-rose-500 hover:bg-rose-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search vendors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {VENDOR_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="considering">Considering</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500 mt-1">Total Vendors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-sky-600">{stats.booked}</div>
            <div className="text-xs text-gray-500 mt-1">Booked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.confirmed}</div>
            <div className="text-xs text-gray-500 mt-1">Confirmed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(stats.totalDeposits)}</div>
            <div className="text-xs text-gray-500 mt-1">Total Deposits</div>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Grid */}
      {filteredVendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map((vendor) => {
            const statusCfg = STATUS_CONFIG[vendor.status]
            return (
              <Card key={vendor.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{vendor.name}</h3>
                      <Badge variant="outline" className="text-xs mt-1">
                        {vendor.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(vendor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => setDeleteConfirmVendor(vendor)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {/* Status & Rating */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`text-xs ${statusCfg.className}`}>
                      {statusCfg.label}
                    </Badge>
                    <StarRating rating={vendor.rating} readonly />
                  </div>

                  {/* Contact Info */}
                  {vendor.contactPerson && (
                    <p className="text-sm text-gray-600">{vendor.contactPerson}</p>
                  )}
                  <div className="space-y-1.5 text-sm">
                    {vendor.email && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <a href={`mailto:${vendor.email}`} className="hover:text-rose-500 truncate">
                          {vendor.email}
                        </a>
                      </div>
                    )}
                    {vendor.phone && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <a href={`tel:${vendor.phone}`} className="hover:text-rose-500">
                          {vendor.phone}
                        </a>
                      </div>
                    )}
                    {vendor.website && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Globe className="h-3.5 w-3.5 shrink-0" />
                        <a
                          href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-rose-500 truncate flex items-center gap-1"
                        >
                          <span className="truncate">{vendor.website.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                    )}
                    {(vendor.address || vendor.district) && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <LocationLink
                          locationName={`${vendor.address}${vendor.district ? `, ${vendor.district}` : ''}`}
                          address={`${vendor.address}${vendor.district ? `, ${vendor.district}` : ''}${vendor.city ? `, ${vendor.city}` : ''}`}
                          className="text-gray-500 hover:text-rose-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div>
                      {vendor.price > 0 && (
                        <span className="font-semibold text-gray-900">{formatCurrency(vendor.price)}</span>
                      )}
                      {vendor.depositPaid > 0 && (
                        <span className="text-xs text-gray-400 ml-2">
                          (Deposit: {formatCurrency(vendor.depositPaid)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {vendor.notes && (
                    <p className="text-xs text-gray-400 line-clamp-2">{vendor.notes}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500">No vendors found</h3>
          <p className="text-sm text-gray-400 mt-1">
            {vendors.length === 0
              ? 'Start by adding your first vendor.'
              : 'Try adjusting your filters.'}
          </p>
          {vendors.length === 0 && (
            <Button onClick={openCreateDialog} className="mt-4 bg-rose-500 hover:bg-rose-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="vendor-name">Name *</Label>
              <Input
                id="vendor-name"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                placeholder="Vendor name"
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
                    {VENDOR_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData((f) => ({ ...f, status: v as Vendor['status'] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="considering">Considering</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendor-contact">Contact Person</Label>
              <Input
                id="vendor-contact"
                value={formData.contactPerson}
                onChange={(e) => setFormData((f) => ({ ...f, contactPerson: e.target.value }))}
                placeholder="Primary contact"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vendor-email">Email</Label>
                <Input
                  id="vendor-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vendor-phone">Phone</Label>
                <Input
                  id="vendor-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendor-website">Website</Label>
              <Input
                id="vendor-website"
                value={formData.website}
                onChange={(e) => setFormData((f) => ({ ...f, website: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendor-address">Address</Label>
              <Input
                id="vendor-address"
                value={formData.address}
                onChange={(e) => setFormData((f) => ({ ...f, address: e.target.value }))}
                placeholder="Street address e.g. 1 Queen's Road Central"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vendor-district">District</Label>
                <Input
                  id="vendor-district"
                  value={formData.district}
                  onChange={(e) => setFormData((f) => ({ ...f, district: e.target.value }))}
                  placeholder="e.g. Central"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vendor-city">City</Label>
                <Input
                  id="vendor-city"
                  value={formData.city}
                  onChange={(e) => setFormData((f) => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. Hong Kong"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vendor-price">Price ($)</Label>
                <Input
                  id="vendor-price"
                  type="number"
                  min="0"
                  value={formData.price || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, price: Number(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vendor-deposit">Deposit Paid ($)</Label>
                <Input
                  id="vendor-deposit"
                  type="number"
                  min="0"
                  value={formData.depositPaid || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, depositPaid: Number(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Rating</Label>
                <div
                  onMouseLeave={() => setHoverRating(0)}
                  className="py-1"
                >
                  <StarRating
                    rating={formData.rating}
                    onChange={(r) => setFormData((f) => ({ ...f, rating: r }))}
                    size="md"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vendor-contract">Contract Date</Label>
                <Input
                  id="vendor-contract"
                  type="date"
                  value={formData.contractDate}
                  onChange={(e) => setFormData((f) => ({ ...f, contractDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendor-notes">Notes</Label>
              <Textarea
                id="vendor-notes"
                value={formData.notes}
                onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-rose-500 hover:bg-rose-600">
              {editingVendor ? 'Update' : 'Add'} Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmVendor} onOpenChange={() => setDeleteConfirmVendor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteConfirmVendor?.name}&quot;? This action cannot be undone.
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
    </div>
  )
}