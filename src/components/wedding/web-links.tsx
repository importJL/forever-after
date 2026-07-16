'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Plus,
  ExternalLink,
  Globe,
  Link2,
  Edit,
  Trash2,
  Heart,
  Gift,
  MapPin,
  Store,
  Lightbulb,
  Plane,
  MoreHorizontal,
} from 'lucide-react'
import { useWeddingStore, type WebLink } from '@/lib/store'
import { client } from '@/lib/amplify-client'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ── Types ──────────────────────────────────────────────────────────────────
type LinkCategory = WebLink['category']
type TabValue = 'all' | LinkCategory

interface LinkFormData {
  title: string
  url: string
  description: string
  category: LinkCategory
}

const CATEGORIES: { value: LinkCategory; label: string }[] = [
  { value: 'registry', label: 'Registry' },
  { value: 'venue', label: 'Venue' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'inspiration', label: 'Inspiration' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other' },
]

const TABS: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'All' },
  ...CATEGORIES,
]

const PRESETS: { name: string; url: string; category: LinkCategory }[] = [
  { name: 'The Knot', url: 'https://www.theknot.com', category: 'registry' },
  { name: 'Zola', url: 'https://www.zola.com', category: 'registry' },
  { name: 'Pinterest', url: 'https://www.pinterest.com', category: 'inspiration' },
  { name: 'Etsy', url: 'https://www.etsy.com', category: 'vendor' },
  { name: 'Amazon Registry', url: 'https://www.amazon.com/wedding', category: 'registry' },
]

// ── Category config ────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; badgeClass: string }
> = {
  registry: {
    icon: Gift,
    color: 'text-rose-600',
    badgeClass: 'bg-rose-100 text-rose-700 hover:bg-rose-100',
  },
  venue: {
    icon: MapPin,
    color: 'text-emerald-600',
    badgeClass: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  },
  vendor: {
    icon: Store,
    color: 'text-violet-600',
    badgeClass: 'bg-violet-100 text-violet-700 hover:bg-violet-100',
  },
  inspiration: {
    icon: Lightbulb,
    color: 'text-amber-600',
    badgeClass: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  },
  travel: {
    icon: Plane,
    color: 'text-blue-600',
    badgeClass: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  },
  other: {
    icon: MoreHorizontal,
    color: 'text-muted-foreground',
    badgeClass: 'bg-muted text-muted-foreground hover:bg-muted',
  },
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

const EMPTY_FORM: LinkFormData = {
  title: '',
  url: '',
  description: '',
  category: 'other',
}

// ── Component ──────────────────────────────────────────────────────────────
export function WebLinks() {
  const storeLinks = useWeddingStore((s) => s.webLinks)
  const setWebLinks = useWeddingStore((s) => s.setWebLinks)
  const addWebLink = useWeddingStore((s) => s.addWebLink)
  const updateWebLink = useWeddingStore((s) => s.updateWebLink)
  const deleteWebLink = useWeddingStore((s) => s.deleteWebLink)

  // Local state
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<LinkFormData>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirmLinkId, setDeleteConfirmLinkId] = useState<string | null>(null)

  // ── Filtered links ───────────────────────────────────────────────────────
  const filteredLinks = useMemo(() => {
    if (activeTab === 'all') return storeLinks
    return storeLinks.filter((l) => l.category === activeTab)
  }, [storeLinks, activeTab])

  // ── Form helpers ─────────────────────────────────────────────────────────
  const openAddDialog = useCallback(
    (preset?: { name: string; url: string; category: LinkCategory }) => {
      setEditingId(null)
      setForm({
        title: preset?.name ?? '',
        url: preset?.url ?? '',
        description: '',
        category: preset?.category ?? 'other',
      })
      setDialogOpen(true)
    },
    [],
  )

  const openEditDialog = useCallback((link: WebLink) => {
    setEditingId(link.id)
    setForm({
      title: link.title,
      url: link.url,
      description: link.description,
      category: link.category,
    })
    setDialogOpen(true)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!form.title.trim() || !form.url.trim()) {
      toast.error('Title and URL are required.')
      return
    }

    // Ensure URL has protocol
    let url = form.url.trim()
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url
    }

    setIsSubmitting(true)
    try {
      const linkData = { title: form.title.trim(), url, description: form.description.trim(), category: form.category }
      if (editingId) {
        const { data: updated, errors } = await client.models.WebLink.update({ id: editingId, ...linkData })
        if (errors) throw new Error(errors[0].message)
        if (updated) updateWebLink(editingId, updated)
        toast.success('Link updated.')
      } else {
        const { data: created, errors } = await client.models.WebLink.create(linkData)
        if (errors) throw new Error(errors[0].message)
        if (created) addWebLink(created)
        toast.success('Link added.')
      }
      setDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }, [form, editingId, addWebLink, updateWebLink])

  const handleDelete = useCallback(
    async () => {
      if (!deleteConfirmLinkId) return
      try {
        const { errors } = await client.models.WebLink.delete({ id: deleteConfirmLinkId })
        if (errors) throw new Error(errors[0].message)
        deleteWebLink(deleteConfirmLinkId)
        toast.success('Link deleted.')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete')
      } finally {
        setDeleteConfirmLinkId(null)
      }
    },
    [deleteConfirmLinkId, deleteWebLink],
  )

  const handleOpenLink = useCallback((url: string) => {
    let href = url
    if (!/^https?:\/\//i.test(href)) href = 'https://' + href
    window.open(href, '_blank', 'noopener,noreferrer')
  }, [])

  // ── Render helpers ───────────────────────────────────────────────────────
  function getFaviconUrl(url: string): string {
    try {
      const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
    } catch {
      return ''
    }
  }

  function renderSiteIcon(link: WebLink) {
    const config = CATEGORY_CONFIG[link.category] ?? CATEGORY_CONFIG.other
    const Icon = config.icon

    return (
      <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center shrink-0 overflow-hidden">
        <Icon className="h-5 w-5 text-rose-500" />
      </div>
    )
  }

  function truncateUrl(url: string, maxLen = 40): string {
    if (url.length <= maxLen) return url
    return url.slice(0, maxLen - 3) + '...'
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
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-6 w-6 text-rose-500" />
            Web Links &amp; Integrations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Consolidate all your wedding-related links in one place
          </p>
        </div>
        <Button
          onClick={() => openAddDialog()}
          className="bg-rose-600 hover:bg-rose-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Link
        </Button>
      </motion.div>

      {/* Quick-add presets */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="py-3">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground self-center mr-1">Quick add:</span>
              {PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => openAddDialog(preset)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {preset.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="flex-wrap h-auto gap-1">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs px-3 py-1.5">
                {tab.label}
                {tab.value === 'all' && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                    {storeLinks.length}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* All tabs share the same content, just filtered */}
          {TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              {filteredLinks.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Link2 className="h-12 w-12 mb-3 opacity-40" />
                    <p className="text-lg font-medium">No links yet</p>
                    <p className="text-sm">
                      {activeTab === 'all'
                        ? 'Add your first link or use a quick-add preset'
                        : `No ${tab.label.toLowerCase()} links. Add one to get started.`}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => openAddDialog()}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Link
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredLinks.map((link) => {
                    const config = CATEGORY_CONFIG[link.category] ?? CATEGORY_CONFIG.other
                    return (
                      <motion.div key={link.id} variants={itemVariants}>
                        <Card className="group hover:shadow-md transition-shadow duration-200 h-full">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {/* Icon */}
                              {renderSiteIcon(link)}

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-semibold truncate">
                                    {link.title}
                                  </h3>
                                  <Badge className={`${config.badgeClass} text-[10px] shrink-0`}>
                                    {link.category}
                                  </Badge>
                                </div>
                                <p
                                  className="text-xs text-muted-foreground truncate mt-0.5 cursor-pointer hover:text-rose-600 transition-colors"
                                  onClick={() => handleOpenLink(link.url)}
                                  title={link.url}
                                >
                                  {truncateUrl(link.url)}
                                </p>
                                {link.description && (
                                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                    {link.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => handleOpenLink(link.url)}
                              >
                                <ExternalLink className="h-3 w-3" />
                                Open
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                                onClick={() => openEditDialog(link)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => setDeleteConfirmLinkId(link.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit className="h-5 w-5 text-rose-500" />
                  Edit Link
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-rose-500" />
                  Add Link
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g. Our Wedding Registry"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                placeholder="https://..."
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description..."
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v as LinkCategory }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white"
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : editingId ? (
                'Save Changes'
              ) : (
                'Add Link'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmLinkId} onOpenChange={() => setDeleteConfirmLinkId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this link? This action cannot be undone.
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