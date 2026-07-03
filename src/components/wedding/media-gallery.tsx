'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Image as ImageIcon,
  Video,
  Link2,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Play,
  Upload,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useWeddingStore, type MediaItem } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

const MEDIA_TABS = ['all', 'inspiration', 'photo', 'video', 'mood-board'] as const
const MEDIA_TYPES = ['image', 'video', 'link'] as const
const MEDIA_CATEGORIES = ['inspiration', 'photo', 'video', 'mood-board'] as const

const CATEGORY_COLORS: Record<string, string> = {
  inspiration: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  photo: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  video: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'mood-board': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
}

const TYPE_ICONS: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  link: Link2,
}

interface MediaFormData {
  title: string
  type: MediaItem['type']
  url: string
  category: string
  notes: string
}

const emptyForm: MediaFormData = {
  title: '',
  type: 'image',
  url: '',
  category: 'inspiration',
  notes: '',
}

export function MediaGallery() {
  const { mediaItems, setMediaItems, addMediaItem, updateMediaItem, deleteMediaItem } =
    useWeddingStore()

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null)
  const [form, setForm] = useState<MediaFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())



  // Fetch media items
  useEffect(() => {
    async function fetchMedia() {
      try {
        setLoading(true)
        const res = await fetch('/api/media')
        if (res.ok) {
          const data = await res.json()
          setMediaItems(data)
        }
      } catch {
        toast.error('Failed to load media')
      } finally {
        setLoading(false)
      }
    }
    fetchMedia()
  }, [setMediaItems])

  // Filtered items
  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return mediaItems
    return mediaItems.filter((item) => item.category === activeTab)
  }, [mediaItems, activeTab])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: mediaItems.length }
    for (const tab of MEDIA_TABS.slice(1)) {
      c[tab] = mediaItems.filter((m) => m.category === tab).length
    }
    return c
  }, [mediaItems])

  // Handle image load error
  const handleImageError = (id: string) => {
    setImageErrors((prev) => new Set(prev).add(id))
  }

  // Open dialog for new item
  const openCreateDialog = () => {
    setEditingItem(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  // Open dialog for editing
  const openEditDialog = (item: MediaItem) => {
    setEditingItem(item)
    setForm({
      title: item.title,
      type: item.type,
      url: item.url,
      category: item.category,
      notes: item.notes,
    })
    setDialogOpen(true)
  }

  // Submit form
  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter a title')
      return
    }
    if (!form.url.trim()) {
      toast.error('Please enter a URL')
      return
    }

    try {
      setSubmitting(true)
      if (editingItem) {
        const res = await fetch(`/api/media/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error()
        const updated = await res.json()
        updateMediaItem(editingItem.id, updated)
        toast.success('Media updated successfully')
      } else {
        const res = await fetch('/api/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error()
        const created = await res.json()
        addMediaItem(created)
        toast.success('Media added successfully')
      }
      setDialogOpen(false)
    } catch {
      toast.error('Failed to save media')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete media
  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/media/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      deleteMediaItem(deleteId)
      toast.success('Media deleted')
    } catch {
      toast.error('Failed to delete media')
    } finally {
      setDeleteId(null)
    }
  }

  // Render media card thumbnail
  const renderThumbnail = (item: MediaItem) => {
    const thumbnailUrl = item.thumbnail || item.url

    if (item.type === 'image' && thumbnailUrl && !imageErrors.has(item.id)) {
      return (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-muted">
          <img
            src={thumbnailUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => handleImageError(item.id)}
          />
        </div>
      )
    }

    if (item.type === 'video') {
      return (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-amber-100 to-rose-100 dark:from-amber-950/40 dark:to-rose-950/40 flex items-center justify-center">
          {thumbnailUrl && !imageErrors.has(item.id) ? (
            <>
              <img
                src={thumbnailUrl}
                alt={item.title}
                className="h-full w-full object-cover"
                onError={() => handleImageError(item.id)}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity group-hover:bg-black/40">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm">
                  <Play className="h-6 w-6 fill-rose-500 text-rose-500 ml-1" />
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-200/80 dark:bg-amber-800/50">
              <Video className="h-7 w-7 text-amber-600 dark:text-amber-300" />
            </div>
          )}
        </div>
      )
    }

    if (item.type === 'link') {
      return (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-950/40 dark:to-violet-950/40 flex flex-col items-center justify-center gap-2 p-4">
          <Link2 className="h-10 w-10 text-blue-500 dark:text-blue-400" />
          <span className="text-xs text-blue-600 dark:text-blue-300 line-clamp-2 text-center max-w-[90%]">
            {item.url}
          </span>
        </div>
      )
    }

    // Fallback placeholder
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-950/40 dark:to-amber-950/40 flex items-center justify-center">
        <Sparkles className="h-10 w-10 text-rose-400 dark:text-rose-300" />
      </div>
    )
  }

  // Loading skeleton grid
  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-9 w-80" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-4 sm:p-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-rose-900 dark:text-rose-100">
            Media Gallery
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Collect and organize your wedding inspiration
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-md"
        >
          <Plus className="h-4 w-4" />
          Add Media
        </Button>
      </motion.div>

      {/* Tab Filters */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            {MEDIA_TABS.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="capitalize text-sm data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 dark:data-[state=active]:bg-rose-950/30 dark:data-[state=active]:text-rose-300"
              >
                {tab === 'mood-board' ? 'Mood Board' : tab}
                {counts[tab] > 0 && (
                  <span className="ml-1.5 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:bg-rose-900/50 dark:text-rose-300">
                    {counts[tab]}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredItems.length === 0 ? (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-rose-200 bg-rose-50/50 dark:border-rose-800/50 dark:bg-rose-950/20 p-12 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/40 mb-4">
                  <Upload className="h-8 w-8 text-rose-500" />
                </div>
                <h3 className="text-lg font-semibold text-rose-900 dark:text-rose-100">
                  No media yet
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Start building your wedding mood board by adding photos, videos, and inspirational links.
                </p>
                <Button
                  onClick={openCreateDialog}
                  variant="outline"
                  className="mt-4 border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/40"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Media
                </Button>
              </motion.div>
            ) : (
              /* Media Grid */
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
              >
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item) => (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      layout
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 py-0 gap-0">
                        {/* Thumbnail */}
                        <div className="relative">{renderThumbnail(item)}</div>

                        {/* Content */}
                        <CardContent className="p-3 space-y-2">
                          <h3 className="font-semibold text-sm line-clamp-1 text-foreground">
                            {item.title}
                          </h3>

                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${CATEGORY_COLORS[item.category] || ''}`}
                            >
                              {item.category}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] gap-1">
                              {React.createElement(TYPE_ICONS[item.type] || ImageIcon, {
                                className: 'h-3 w-3',
                              })}
                              {item.type}
                            </Badge>
                          </div>

                          {item.notes && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {item.notes}
                            </p>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-1 pt-1">
                            {item.type === 'link' && item.url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {item.type === 'video' && item.url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                              >
                                <Play className="h-3.5 w-3.5 fill-current" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => openEditDialog(item)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteId(item.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-900 dark:text-rose-100">
              {editingItem ? 'Edit Media' : 'Add Media'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Update the details of your media item.'
                : 'Add a new photo, video, or link to your gallery.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="media-title">Title</Label>
              <Input
                id="media-title"
                placeholder="e.g., Reception venue inspiration"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, type: v as MediaItem['type'] }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDIA_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDIA_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">
                        {c === 'mood-board' ? 'Mood Board' : c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="media-url">URL</Label>
              <Input
                id="media-url"
                placeholder="https://example.com/image.jpg"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Paste a direct link to an image, video, or webpage
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="media-notes">Notes</Label>
              <Textarea
                id="media-notes"
                placeholder="Any notes about this item..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingItem ? 'Save Changes' : 'Add Media'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this media item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}