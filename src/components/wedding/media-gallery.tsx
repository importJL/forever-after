'use client'

import React, { useState, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Image as ImageIcon,
  Link2,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Play,
  Upload,
  Sparkles,
  Loader2,
  GripVertical,
  MapPin,
  Calendar,
  Tag,
  Globe,
  Palette,
  Film,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useWeddingStore, type MediaItem } from '@/lib/store'
import { client } from '@/lib/amplify-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/)
  return m ? m[1] : null
}

function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url)
}

function getEmbedUrl(url: string): string | null {
  const ytId = getYouTubeId(url)
  if (ytId) return `https://www.youtube-nocookie.com/embed/${ytId}`
  const vId = getVimeoId(url)
  if (vId) return `https://player.vimeo.com/video/${vId}`
  return null
}

function isDataUrl(url: string): boolean {
  return url.startsWith('data:')
}

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
  video: Film,
  link: Link2,
}

const INSPIRATION_SOURCES = ['Pinterest', 'Instagram', 'Website', 'Magazine', 'Other'] as const

const CATEGORY_LABELS: Record<string, string> = {
  inspiration: 'Inspiration',
  photo: 'Photo',
  video: 'Video',
  'mood-board': 'Mood Board',
}

interface MediaFormData {
  title: string
  type: MediaItem['type']
  url: string
  category: string
  notes: string
  source: string
  tags: string
  location: string
  date: string
  color: string
}

const emptyForm: MediaFormData = {
  title: '',
  type: 'image',
  url: '',
  category: 'inspiration',
  notes: '',
  source: '',
  tags: '',
  location: '',
  date: '',
  color: '',
}

export function MediaGallery() {
  const mediaItems = useWeddingStore((s) => s.mediaItems)
  const setMediaItems = useWeddingStore((s) => s.setMediaItems)
  const addMediaItem = useWeddingStore((s) => s.addMediaItem)
  const updateMediaItem = useWeddingStore((s) => s.updateMediaItem)
  const deleteMediaItem = useWeddingStore((s) => s.deleteMediaItem)

  const [activeTab, setActiveTab] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null)
  const [form, setForm] = useState<MediaFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sortedItems = useMemo(() => {
    return [...mediaItems].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }, [mediaItems])

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return sortedItems
    return sortedItems.filter((item) => item.category === activeTab)
  }, [sortedItems, activeTab])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: mediaItems.length }
    for (const tab of MEDIA_TABS.slice(1)) {
      c[tab] = mediaItems.filter((m) => m.category === tab).length
    }
    return c
  }, [mediaItems])

  const handleImageError = (id: string) => {
    setImageErrors((prev) => new Set(prev).add(id))
  }

  const openCreateDialog = () => {
    setEditingItem(null)
    const defaultCategory = activeTab === 'all' ? 'inspiration' : activeTab
    setForm({ ...emptyForm, category: defaultCategory })
    setFilePreview(null)
    setDialogOpen(true)
  }

  const openEditDialog = (item: MediaItem) => {
    setEditingItem(item)
    setForm({
      title: item.title,
      type: item.type,
      url: item.url,
      category: item.category,
      notes: item.notes,
      source: item.source ?? '',
      tags: item.tags ?? '',
      location: item.location ?? '',
      date: item.date ?? '',
      color: item.color ?? '',
    })
    setFilePreview(item.url && isDataUrl(item.url) ? item.url : null)
    setDialogOpen(true)
  }

  const handleFileUpload = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Please use a file under 10MB.')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setForm((f) => ({ ...f, url: dataUrl, type: 'image' }))
      setFilePreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [handleFileUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file)
    }
  }, [handleFileUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const clearFile = useCallback(() => {
    setForm((f) => ({ ...f, url: '' }))
    setFilePreview(null)
  }, [])

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter a title')
      return
    }
    if (!form.url.trim()) {
      toast.error('Please enter a URL or upload a file')
      return
    }

    try {
      setSubmitting(true)
      if (editingItem) {
        const { data: updated, errors } = await client.models.MediaItem.update({ id: editingItem.id, ...form })
        if (errors) throw new Error(errors[0].message)
        if (updated) updateMediaItem(editingItem.id, updated)
        toast.success('Media updated successfully')
      } else {
        const { data: created, errors } = await client.models.MediaItem.create(form)
        if (errors) throw new Error(errors[0].message)
        if (created) addMediaItem(created)
        toast.success('Media added successfully')
      }
      setDialogOpen(false)
    } catch {
      toast.error('Failed to save media')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const { errors } = await client.models.MediaItem.delete({ id: deleteId })
      if (errors) throw new Error(errors[0].message)
      deleteMediaItem(deleteId)
      toast.success('Media deleted')
    } catch {
      toast.error('Failed to delete media')
    } finally {
      setDeleteId(null)
    }
  }

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDragId(itemId)
    e.dataTransfer.effectAllowed = 'move'
    setTimeout(() => {
      (e.currentTarget as HTMLElement).classList.add('opacity-30')
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove('opacity-30')
    setDragId(null)
    setDragOverId(null)
  }

  const handleDragOverCard = (e: React.DragEvent, itemId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragId !== itemId) {
      setDragOverId(itemId)
    }
  }

  const handleDragLeaveCard = () => {
    setDragOverId(null)
  }

  const handleDropCard = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!dragId || dragId === targetId) {
      setDragId(null)
      setDragOverId(null)
      return
    }

    const items = [...sortedItems]
    const dragIdx = items.findIndex((i) => i.id === dragId)
    const dropIdx = items.findIndex((i) => i.id === targetId)
    if (dragIdx === -1 || dropIdx === -1) {
      setDragId(null)
      setDragOverId(null)
      return
    }

    const [moved] = items.splice(dragIdx, 1)
    items.splice(dropIdx, 0, moved)

    const updated = items.map((item, idx) => ({ ...item, sortOrder: idx }))
    setMediaItems(updated)

    for (const item of updated) {
      client.models.MediaItem.update({ id: item.id, sortOrder: item.sortOrder }).catch(() => {})
    }

    setDragId(null)
    setDragOverId(null)
  }

  const renderVideoEmbed = (item: MediaItem) => {
    const embedUrl = getEmbedUrl(item.url)

    if (embedUrl) {
      return (
        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-black">
          <iframe
            src={embedUrl}
            title={item.title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }

    if (isDirectVideoUrl(item.url)) {
      return (
        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-black">
          <video
            src={item.url}
            controls
            className="h-full w-full"
            poster={item.thumbnail || undefined}
          />
        </div>
      )
    }

    const thumbnailUrl = item.thumbnail || item.url
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-amber-100 to-rose-100 dark:from-amber-950/40 dark:to-amber-950/40 flex items-center justify-center">
        {thumbnailUrl && !imageErrors.has(item.id) ? (
          <>
            <img
              src={thumbnailUrl}
              alt={item.title}
              width={400}
              height={300}
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
            <Film className="h-7 w-7 text-amber-600 dark:text-amber-300" />
          </div>
        )}
      </div>
    )
  }

  const renderThumbnail = (item: MediaItem) => {
    if (item.type === 'video') {
      return renderVideoEmbed(item)
    }

    const thumbnailUrl = item.thumbnail || item.url

    if (item.type === 'image' && thumbnailUrl && !imageErrors.has(item.id)) {
      return (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-muted">
          <img
            src={thumbnailUrl}
            alt={item.title}
            width={400}
            height={300}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => handleImageError(item.id)}
          />
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

    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-950/40 dark:to-amber-950/40 flex items-center justify-center">
        <Sparkles className="h-10 w-10 text-rose-400 dark:text-rose-300" />
      </div>
    )
  }

  const renderCardActions = (item: MediaItem) => (
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
      {item.type === 'video' && item.url && !getEmbedUrl(item.url) && !isDirectVideoUrl(item.url) && (
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
  )

  const renderCardMeta = (item: MediaItem) => {
    const tags = item.tags ? item.tags.split(',').map((t) => t.trim()).filter(Boolean) : []

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge
          variant="secondary"
          className={`text-[10px] ${CATEGORY_COLORS[item.category] || ''}`}
        >
          {CATEGORY_LABELS[item.category] || item.category}
        </Badge>
        <Badge variant="outline" className="text-[10px] gap-1">
          {React.createElement(TYPE_ICONS[item.type] || ImageIcon, { className: 'h-3 w-3' })}
          {item.type}
        </Badge>

        {item.source && item.category === 'inspiration' && (
          <Badge variant="outline" className="text-[10px] gap-1 border-violet-200 text-violet-600 dark:border-violet-800 dark:text-violet-400">
            <Globe className="h-3 w-3" />
            {item.source}
          </Badge>
        )}

        {item.location && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {item.location}
          </span>
        )}

        {item.date && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {item.date}
          </span>
        )}
      </div>
    )
  }

  const renderColorStrip = (item: MediaItem) => {
    if (!item.color) return null
    return (
      <div
        className="h-1.5 w-full rounded-full"
        style={{ backgroundColor: item.color }}
      />
    )
  }

  const renderTags = (item: MediaItem) => {
    if (!item.tags) return null
    const tags = item.tags.split(',').map((t) => t.trim()).filter(Boolean)
    if (tags.length === 0) return null
    return (
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="text-[9px] px-1.5 py-0 border-violet-200 text-violet-500 dark:border-violet-800 dark:text-violet-400"
          >
            <Tag className="h-2.5 w-2.5 mr-0.5" />
            {tag}
          </Badge>
        ))}
      </div>
    )
  }

  const renderFileUploadArea = () => (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="relative rounded-lg border-2 border-dashed border-rose-200 bg-rose-50/50 dark:border-rose-800/50 dark:bg-rose-950/20 p-6 text-center transition-colors hover:border-rose-300 dark:hover:border-rose-700"
    >
      {filePreview ? (
        <div className="relative mx-auto max-w-[200px]">
          <img
            src={filePreview}
            alt="Preview"
            className="h-32 w-full rounded-lg object-cover"
          />
          <button
            type="button"
            onClick={clearFile}
            className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-sm hover:bg-destructive/90"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <>
          <Upload className="mx-auto h-8 w-8 text-rose-400 mb-2" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop an image, or click to browse
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/40"
          >
            Choose File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground mt-2">Max 10MB</p>
        </>
      )}
    </div>
  )

  const renderDialogFields = () => {
    const isPhoto = form.category === 'photo'
    const isInspiration = form.category === 'inspiration'
    const isMoodBoard = form.category === 'mood-board'

    return (
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
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  category: v,
                  type: v === 'photo' ? 'image' : f.type,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEDIA_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">
                    {CATEGORY_LABELS[c] || c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={form.type}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, type: v as MediaItem['type'] }))
              }
              disabled={isPhoto}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEDIA_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize" disabled={isPhoto && t !== 'image'}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isPhoto && !editingItem ? (
          <div className="space-y-2">
            <Label>Upload Photo</Label>
            {renderFileUploadArea()}
            <p className="text-xs text-muted-foreground">
              Or paste a URL below
            </p>
            <Input
              placeholder="https://example.com/photo.jpg"
              value={isDataUrl(form.url) ? '' : form.url}
              onChange={(e) => {
                setForm((f) => ({ ...f, url: e.target.value }))
                setFilePreview(null)
              }}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="media-url">
              {isPhoto ? 'Photo URL' : 'URL'}
            </Label>
            {isPhoto && filePreview ? (
              <div className="relative max-w-[200px]">
                <img
                  src={filePreview}
                  alt="Preview"
                  className="h-32 w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-sm hover:bg-destructive/90"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <Input
                id="media-url"
                placeholder={
                  isPhoto
                    ? 'https://example.com/photo.jpg'
                    : form.category === 'video'
                      ? 'https://youtube.com/watch?v=... or https://vimeo.com/...'
                      : 'https://example.com/image.jpg'
                }
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              />
            )}
            <p className="text-xs text-muted-foreground">
              {isPhoto
                ? 'Upload an image file or paste a direct link'
                : form.category === 'video'
                  ? 'Paste a YouTube or Vimeo link for embedded playback, or a direct video URL'
                  : 'Paste a direct link to an image or webpage'}
            </p>
          </div>
        )}

        {isInspiration && (
          <>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select
                value={form.source}
                onValueChange={(v) => setForm((f) => ({ ...f, source: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {INSPIRATION_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="media-tags">Tags</Label>
              <Input
                id="media-tags"
                placeholder="e.g., decor, floral, color-palette"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated tags for organizing inspiration
              </p>
            </div>
          </>
        )}

        {isPhoto && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="media-location">Location</Label>
                <Input
                  id="media-location"
                  placeholder="e.g., Grand Ballroom"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="media-date">Date</Label>
                <Input
                  id="media-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>
          </>
        )}

        {isMoodBoard && (
          <div className="space-y-2">
            <Label>Color Swatch</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color || '#000000'}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="h-10 w-20 cursor-pointer rounded-md border bg-transparent p-1"
              />
              {form.color && (
                <span className="text-xs text-muted-foreground font-mono">
                  {form.color}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Pick a color that represents this mood board item
            </p>
          </div>
        )}

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
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-rose-200 bg-rose-50/50 dark:border-rose-800/50 dark:bg-rose-950/20 p-12 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/40 mb-4">
                  <Upload className="h-8 w-8 text-rose-500" />
                </div>
                <h3 className="text-lg font-semibold text-rose-900 dark:text-rose-100">
                  No {activeTab === 'all' ? 'media' : CATEGORY_LABELS[activeTab]?.toLowerCase() || 'media'} yet
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  {activeTab === 'inspiration'
                    ? 'Collect ideas from Pinterest, Instagram, and more to inspire your wedding.'
                    : activeTab === 'photo'
                      ? 'Upload photos of venues, dresses, decorations, and special moments.'
                      : activeTab === 'video'
                        ? 'Add YouTube or Vimeo links for embedded video playback.'
                        : activeTab === 'mood-board'
                          ? 'Build a mood board with images, colors, and notes to define your wedding aesthetic.'
                          : 'Start building your wedding mood board by adding photos, videos, and inspirational links.'}
                </p>
                <Button
                  onClick={openCreateDialog}
                  variant="outline"
                  className="mt-4 border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/40"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First{' '}
                  {activeTab === 'all' ? 'Media' : CATEGORY_LABELS[activeTab] || 'Media'}
                </Button>
              </motion.div>
            ) : (
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
                      className={`relative transition-shadow duration-200 ${
                        dragOverId === item.id
                          ? 'ring-2 ring-rose-400 ring-offset-2 rounded-xl'
                          : ''
                      }`}
                    >
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOverCard(e, item.id)}
                        onDragLeave={handleDragLeaveCard}
                        onDrop={(e) => handleDropCard(e, item.id)}
                      >
                      <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 py-0 gap-0">
                        {/* Drag handle */}
                        <div className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing rounded-md bg-white/80 dark:bg-gray-900/80 p-1 shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>

                        {/* Thumbnail */}
                        <div className="relative">{renderThumbnail(item)}</div>

                        {/* Color strip for mood board */}
                        {item.category === 'mood-board' && item.color && (
                          <div className="px-3 pt-2">
                            {renderColorStrip(item)}
                          </div>
                        )}

                        {/* Content */}
                        <CardContent className="p-3 space-y-2">
                          <h3 className="font-semibold text-sm line-clamp-1 text-foreground">
                            {item.title}
                          </h3>

                          {renderCardMeta(item)}

                          {item.category === 'inspiration' && renderTags(item)}

                          {item.notes && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {item.notes}
                            </p>
                          )}

                          {renderCardActions(item)}
                        </CardContent>
                      </Card>
                      </div>
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
              {editingItem ? 'Edit Media' : `Add ${CATEGORY_LABELS[form.category] || 'Media'}`}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Update the details of your media item.'
                : form.category === 'inspiration'
                  ? 'Add an inspirational link, image, or idea.'
                  : form.category === 'photo'
                    ? 'Upload a photo from your device or paste a link.'
                    : form.category === 'video'
                      ? 'Add a YouTube or Vimeo link for embedded playback.'
                      : form.category === 'mood-board'
                        ? 'Add an item to your mood board with colors and notes.'
                        : 'Add a new item to your gallery.'}
            </DialogDescription>
          </DialogHeader>

          {renderDialogFields()}

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
