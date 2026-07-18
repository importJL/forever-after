'use client'

import { useEffect, useState, useCallback, Component, type ReactNode } from 'react'
import { useWeddingStore, type ViewType, type BudgetCategory, type BudgetExpense } from '@/lib/store'
import { useAmplifySession } from '@/lib/amplify-session-provider'
import { WeddingSidebar } from '@/components/wedding/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AlertTriangle, RefreshCw, Sun, Moon, Search, Sparkles, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'
import { signOut } from 'aws-amplify/auth'
import { client } from '@/lib/amplify-client'
import dynamic from 'next/dynamic'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class DynamicErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Something went wrong</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              This section failed to load. This can happen if the server was restarted.
            </p>
          </div>
          <Button onClick={this.handleRetry} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

function createDynamicView(importFn: () => Promise<{ default: React.ComponentType }>) {
  const DynamicComponent = dynamic(importFn, {
    loading: () => <ViewSkeleton />,
    ssr: false,
  })

  return function ViewWithErrorBoundary() {
    return (
      <DynamicErrorBoundary>
        <DynamicComponent />
      </DynamicErrorBoundary>
    )
  }
}

const DashboardView = createDynamicView(() => import('@/components/wedding/dashboard').then(m => ({ default: m.DashboardView })))
const GuestManager = createDynamicView(() => import('@/components/wedding/guest-manager').then(m => ({ default: m.GuestManager })))
const BudgetTracker = createDynamicView(() => import('@/components/wedding/budget-tracker').then(m => ({ default: m.BudgetTracker })))
const TaskChecklist = createDynamicView(() => import('@/components/wedding/task-checklist').then(m => ({ default: m.TaskChecklist })))
const VendorManager = createDynamicView(() => import('@/components/wedding/vendor-manager').then(m => ({ default: m.VendorManager })))
const TimelineView = createDynamicView(() => import('@/components/wedding/timeline-view').then(m => ({ default: m.TimelineView })))
const MediaGallery = createDynamicView(() => import('@/components/wedding/media-gallery').then(m => ({ default: m.MediaGallery })))
const SeatingChart = createDynamicView(() => import('@/components/wedding/seating-chart').then(m => ({ default: m.SeatingChart })))
const FileImport = createDynamicView(() => import('@/components/wedding/file-import').then(m => ({ default: m.FileImport })))
const WebLinks = createDynamicView(() => import('@/components/wedding/web-links').then(m => ({ default: m.WebLinks })))
const NotificationPanel = createDynamicView(() => import('@/components/wedding/notification-panel').then(m => ({ default: m.NotificationPanel })))
const SettingsView = createDynamicView(() => import('@/components/wedding/settings-view').then(m => ({ default: m.SettingsView })))
const AdminView = createDynamicView(() => import('@/components/wedding/admin-view').then(m => ({ default: m.AdminView })))
const ProfileView = createDynamicView(() => import('@/components/wedding/profile-view').then(m => ({ default: m.ProfileView })))

function ViewSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

const navItems: { id: ViewType; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'guests', label: 'Guest Management', icon: '👥' },
  { id: 'budget', label: 'Budget Tracker', icon: '💰' },
  { id: 'tasks', label: 'Task Checklist', icon: '✅' },
  { id: 'vendors', label: 'Vendor Management', icon: '🏪' },
  { id: 'timeline', label: 'Wedding Timeline', icon: '⏰' },
  { id: 'media', label: 'Media Gallery', icon: '📸' },
  { id: 'seating', label: 'Seating Chart', icon: '🪑' },
  { id: 'links', label: 'Web Links', icon: '🔗' },
  { id: 'import', label: 'Import Files', icon: '📤' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const { setActiveView } = useWeddingStore()
  const inputRef = useCallback((node: HTMLInputElement | null) => {
    if (node && open) {
      node.value = ''
      setQuery('')
      setTimeout(() => node.focus(), 50)
    }
  }, [open])

  const filtered = navItems.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = useCallback((id: ViewType) => {
    setActiveView(id)
    setQuery('')
    onClose()
  }, [setActiveView, onClose])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const items = document.querySelectorAll('[data-cmd-item]')
        const current = document.activeElement?.getAttribute('data-cmd-item')
        const idx = current ? parseInt(current) : -1
        const next = e.key === 'ArrowDown'
          ? Math.min(idx + 1, items.length - 1)
          : Math.max(idx - 1, 0)
        ;(items[next] as HTMLElement)?.focus()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            id="cmd-input"
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages..."
            className="flex-1 h-12 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filtered.length > 0) {
                handleSelect(filtered[0].id)
              }
            }}
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted rounded-md border border-border">
            ESC
          </kbd>
        </div>
        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found
            </div>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={item.id}
                data-cmd-item={idx}
                onClick={() => handleSelect(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-accent transition-colors text-left"
              >
                <span className="text-lg w-6 text-center">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))
          )}
        </div>
        <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-muted rounded border border-border text-[10px]">↑↓</kbd> Navigate</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-muted rounded border border-border text-[10px]">↵</kbd> Select</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-muted rounded border border-border text-[10px]">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  )
}

export default function AppPage() {
  const { activeView, isLoaded, setIsLoaded, guests, tasks, budgetCategories, vendors, timelineEvents, wedding } = useWeddingStore()
  const { user } = useAmplifySession()
  const isAdmin = user?.role === 'admin'
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const fetchAllData = useCallback(async () => {
    const results = await Promise.allSettled([
      client.models.Wedding.list(),
      client.models.Guest.list(),
      client.models.BudgetCategory.list(),
      client.models.BudgetExpense.list(),
      client.models.Task.list(),
      client.models.Vendor.list(),
      client.models.TimelineEvent.list(),
      client.models.MediaItem.list(),
      client.models.WebLink.list(),
      client.models.Notification.list(),
    ])
    const store = useWeddingStore.getState()
    const [weddingRes, guestRes, catRes, expRes, taskRes, vendorRes, timelineRes, mediaRes, linkRes, notifRes] = results

    if (weddingRes.status === 'fulfilled' && weddingRes.value.data[0]) {
      store.setWedding(weddingRes.value.data[0] as Parameters<typeof store.setWedding>[0])
    }
    if (guestRes.status === 'fulfilled') store.setGuests(guestRes.value.data)

    if (catRes.status === 'fulfilled') {
      const cats = catRes.value.data as BudgetCategory[]
      const expenses = expRes.status === 'fulfilled' ? (expRes.value.data as BudgetExpense[]) : []
      const byCat = new Map<string, BudgetExpense[]>()
      for (const e of expenses) {
        if (e.categoryId) {
          const arr = byCat.get(e.categoryId) ?? []
          arr.push(e)
          byCat.set(e.categoryId, arr)
        }
      }
      store.setBudgetCategories(cats.map(c => ({ ...c, expenses: byCat.get(c.id) ?? [] })))
    }

    if (taskRes.status === 'fulfilled') store.setTasks(taskRes.value.data)
    if (vendorRes.status === 'fulfilled') store.setVendors(vendorRes.value.data)
    if (timelineRes.status === 'fulfilled') store.setTimelineEvents(timelineRes.value.data)
    if (mediaRes.status === 'fulfilled') store.setMediaItems(mediaRes.value.data)
    if (linkRes.status === 'fulfilled') store.setWebLinks(linkRes.value.data)
    if (notifRes.status === 'fulfilled') store.setNotifications(notifRes.value.data)
  }, [])

  useEffect(() => {
    fetchAllData().catch(console.error).finally(() => setIsLoaded(true))
  }, [setIsLoaded, fetchAllData])

  const loadDemoData = useCallback(async () => {
    try {
      toast.loading('Loading demo data...', { id: 'demo' })

      await client.models.Wedding.create({
        coupleName: 'Emma & James', partner1: 'Emma', partner2: 'James',
        date: '2026-06-15', venue: 'Rosewood Estate',
        venueAddress: '123 Garden Lane, Napa Valley, CA',
        theme: 'Garden Party', guestCount: 120, budgetTotal: 35000,
        notes: 'Our dream outdoor wedding in Napa Valley!',
      })

      const demoGuests = [
        { name: 'Sarah Johnson', email: 'sarah@email.com', phone: '555-0101', group: 'Family', rsvpStatus: 'accepted' as const, mealPreference: 'Chicken', role: 'bridesmaid' as const, plusOne: true, plusOneName: 'Mike Chen' },
        { name: 'David Wilson', email: 'david@email.com', phone: '555-0102', group: 'Family', rsvpStatus: 'accepted' as const, mealPreference: 'Beef', role: 'groomsman' as const },
        { name: 'Lisa Park', email: 'lisa@email.com', phone: '555-0103', group: 'Friends', rsvpStatus: 'accepted' as const, mealPreference: 'Fish', role: 'guest' as const, plusOne: true, plusOneName: 'Tom Park' },
        { name: 'Robert Chen', email: 'robert@email.com', phone: '555-0104', group: 'Family', rsvpStatus: 'pending' as const, mealPreference: 'Vegetarian', role: 'family' as const },
        { name: 'Maria Garcia', email: 'maria@email.com', phone: '555-0105', group: 'Friends', rsvpStatus: 'accepted' as const, mealPreference: 'Chicken', role: 'bridesmaid' as const },
        { name: 'James Thompson', email: 'james.t@email.com', phone: '555-0106', group: 'Work', rsvpStatus: 'declined' as const, mealPreference: '', role: 'guest' as const },
        { name: 'Emily Davis', email: 'emily@email.com', phone: '555-0107', group: 'Friends', rsvpStatus: 'maybe' as const, mealPreference: 'Vegan', role: 'guest' as const, plusOne: true, plusOneName: 'Chris Lee' },
        { name: 'Michael Brown', email: 'michael@email.com', phone: '555-0108', group: 'Family', rsvpStatus: 'accepted' as const, mealPreference: 'Beef', role: 'groomsman' as const },
        { name: 'Jennifer White', email: 'jen@email.com', phone: '555-0109', group: 'Friends', rsvpStatus: 'accepted' as const, mealPreference: 'Fish', role: 'guest' as const },
        { name: 'Alex Kim', email: 'alex@email.com', phone: '555-0110', group: 'Work', rsvpStatus: 'pending' as const, mealPreference: 'Chicken', role: 'guest' as const },
        { name: 'Rachel Green', email: 'rachel@email.com', phone: '555-0111', group: 'Friends', rsvpStatus: 'accepted' as const, mealPreference: 'Vegetarian', role: 'bridesmaid' as const, plusOne: true, plusOneName: 'Dan Smith' },
        { name: 'Rev. Patricia Moore', email: 'patricia@email.com', phone: '555-0112', group: 'Family', rsvpStatus: 'accepted' as const, mealPreference: 'Chicken', role: 'officiant' as const },
      ]
      for (const g of demoGuests) {
        await client.models.Guest.create(g)
      }

      const demoTasks = [
        { title: 'Book wedding venue', description: 'Confirm Rosewood Estate booking and pay deposit', category: 'Venue', priority: 'high' as const, status: 'done' as const, dueDate: '2025-09-01', assignee: 'Emma' },
        { title: 'Choose wedding photographer', description: 'Interview 3 photographers and select one', category: 'Photography', priority: 'high' as const, status: 'done' as const, dueDate: '2025-10-01', assignee: 'Emma' },
        { title: 'Send save-the-dates', description: 'Design and mail save-the-date cards', category: 'Stationery', priority: 'medium' as const, status: 'done' as const, dueDate: '2025-11-01', assignee: 'Emma' },
        { title: 'Book caterer', description: 'Taste test and book catering service', category: 'Catering', priority: 'high' as const, status: 'in_progress' as const, dueDate: '2026-01-15', assignee: 'James' },
        { title: 'Order wedding cake', description: 'Schedule cake tasting and place order', category: 'Catering', priority: 'medium' as const, status: 'in_progress' as const, dueDate: '2026-03-01', assignee: 'Emma' },
        { title: 'Choose bridesmaid dresses', description: 'Select color palette and dress style', category: 'Attire', priority: 'medium' as const, status: 'todo' as const, dueDate: '2026-02-15', assignee: 'Emma' },
        { title: 'Book DJ / Band', description: 'Research and book entertainment', category: 'Music', priority: 'high' as const, status: 'todo' as const, dueDate: '2026-02-01', assignee: 'James' },
        { title: 'Order wedding invitations', description: 'Design and print formal invitations', category: 'Stationery', priority: 'medium' as const, status: 'todo' as const, dueDate: '2026-03-15', assignee: 'Emma' },
        { title: 'Plan honeymoon', description: 'Book flights and resort', category: 'Honeymoon', priority: 'low' as const, status: 'todo' as const, dueDate: '2026-04-01', assignee: 'James' },
        { title: 'Final dress fitting', description: 'Last fitting for wedding dress', category: 'Attire', priority: 'high' as const, status: 'todo' as const, dueDate: '2026-05-15', assignee: 'Emma' },
        { title: 'Arrange transportation', description: 'Book limo/transport for wedding party', category: 'Transportation', priority: 'medium' as const, status: 'todo' as const, dueDate: '2026-05-01', assignee: 'James' },
        { title: 'Obtain marriage license', description: 'Visit county clerk office', category: 'Legal', priority: 'high' as const, status: 'todo' as const, dueDate: '2026-06-01', assignee: 'Emma & James' },
      ]
      for (const t of demoTasks) {
        await client.models.Task.create(t)
      }

      const demoVendors = [
        { name: 'Rosewood Estate', category: 'Venue', contactPerson: 'Victoria Hart', email: 'info@rosewood.com', phone: '555-1001', website: 'https://rosewood.com', price: 8000, depositPaid: 4000, status: 'confirmed' as const, rating: 5, notes: 'Beautiful garden venue' },
        { name: 'Sweet Moments Bakery', category: 'Cake', contactPerson: 'Anna Lee', email: 'anna@sweetmoments.com', phone: '555-1002', website: '', price: 1200, depositPaid: 600, status: 'booked' as const, rating: 4, notes: '3-tier floral cake' },
        { name: 'Lens & Light Studio', category: 'Photography', contactPerson: 'Marcus Wei', email: 'marcus@lenslight.com', phone: '555-1003', website: 'https://lenslight.com', price: 3500, depositPaid: 1750, status: 'confirmed' as const, rating: 5, notes: 'Includes engagement + wedding day' },
        { name: 'Petal & Bloom', category: 'Florist', contactPerson: 'Sophie Chen', email: 'sophie@petalbloom.com', phone: '555-1004', website: '', price: 2500, depositPaid: 0, status: 'booked' as const, rating: 4, notes: 'Garden roses and peonies' },
        { name: 'DJ Rhythm', category: 'Entertainment', contactPerson: 'Tony Rivera', email: 'tony@dj rhythm.com', phone: '555-1005', website: '', price: 1500, depositPaid: 0, status: 'considering' as const, rating: 3, notes: 'Needs to confirm availability' },
        { name: 'Garden Catering Co.', category: 'Catering', contactPerson: 'Chef Maria', email: 'maria@gardencatering.com', phone: '555-1006', website: 'https://gardencatering.com', price: 8000, depositPaid: 2000, status: 'booked' as const, rating: 4, notes: 'Farm-to-table menu' },
      ]
      for (const v of demoVendors) {
        await client.models.Vendor.create(v)
      }

      const demoTimeline = [
        { title: 'Getting Ready', description: 'Bridal party gets ready at the venue', startTime: '10:00', endTime: '12:00', location: 'Bridal Suite', category: 'other' as const, sortOrder: 0 },
        { title: 'First Look', description: 'Private first look photos', startTime: '12:00', endTime: '12:30', location: 'Garden Gazebo', category: 'photos' as const, sortOrder: 1 },
        { title: 'Ceremony', description: 'Wedding ceremony in the rose garden', startTime: '14:00', endTime: '15:00', location: 'Rose Garden', category: 'ceremony' as const, sortOrder: 2 },
        { title: 'Cocktail Hour', description: 'Drinks and hors d\'oeuvres', startTime: '15:00', endTime: '16:00', location: 'Terrace', category: 'photos' as const, sortOrder: 3 },
        { title: 'Dinner', description: 'Sit-down dinner service', startTime: '16:00', endTime: '18:00', location: 'Grand Hall', category: 'reception' as const, sortOrder: 4 },
        { title: 'First Dance & Toasts', description: 'First dance, father-daughter dance, toasts', startTime: '18:00', endTime: '18:45', location: 'Grand Hall', category: 'reception' as const, sortOrder: 5 },
        { title: 'Dancing & Celebration', description: 'Open dance floor', startTime: '18:45', endTime: '22:00', location: 'Grand Hall', category: 'reception' as const, sortOrder: 6 },
        { title: 'Sparkler Send-Off', description: 'Grand exit with sparklers', startTime: '22:00', endTime: '22:15', location: 'Front Entrance', category: 'ceremony' as const, sortOrder: 7 },
      ]
      for (const t of demoTimeline) {
        await client.models.TimelineEvent.create(t)
      }

      const demoLinks = [
        { title: 'The Knot', url: 'https://www.theknot.com', description: 'Wedding planning resources', category: 'inspiration' as const, icon: 'Heart' },
        { title: 'Amazon Registry', url: 'https://www.amazon.com/wedding', description: 'Our gift registry', category: 'registry' as const, icon: 'Gift' },
        { title: 'Pinterest Inspiration', url: 'https://www.pinterest.com', description: 'Wedding mood board ideas', category: 'inspiration' as const, icon: 'Lightbulb' },
        { title: 'Rosewood Estate', url: 'https://rosewood.com', description: 'Wedding venue website', category: 'venue' as const, icon: 'MapPin' },
      ]
      for (const l of demoLinks) {
        await client.models.WebLink.create(l)
      }

      const demoNotifs = [
        { title: 'Welcome to ForeverAfter!', message: 'Start by setting up your wedding details in Settings.', type: 'info' as const, relatedTo: 'dashboard' },
        { title: 'RSVP Reminder', message: '3 guests haven\'t responded yet. Consider sending a follow-up.', type: 'reminder' as const, relatedTo: 'guests' },
        { title: 'Budget Alert', message: 'You\'ve used 72% of your total budget. Review your expenses.', type: 'warning' as const, relatedTo: 'budget' },
        { title: 'Task Completed', message: 'Wedding venue has been booked successfully!', type: 'success' as const, relatedTo: 'tasks' },
      ]
      for (const n of demoNotifs) {
        await client.models.Notification.create(n)
      }

      await fetchAllData()
      toast.success('Demo data loaded!', { id: 'demo', description: 'Explore the app with sample wedding data' })
    } catch (e) {
      toast.error('Failed to load demo data', { id: 'demo' })
    }
  }, [fetchAllData])

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView />
      case 'guests': return <GuestManager />
      case 'budget': return <BudgetTracker />
      case 'tasks': return <TaskChecklist />
      case 'vendors': return <VendorManager />
      case 'timeline': return <TimelineView />
      case 'media': return <MediaGallery />
      case 'seating': return <SeatingChart />
      case 'import': return <FileImport />
      case 'links': return <WebLinks />
      case 'notifications': return <NotificationPanel />
      case 'settings': return <SettingsView />
      case 'admin': return <AdminView />
      case 'profile': return <ProfileView />
      default: return <DashboardView />
    }
  }

  const hasData = isLoaded && (guests.length > 0 || tasks.length > 0 || wedding.date)

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block shrink-0">
        <WeddingSidebar />
      </div>

      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)} />
          <div className="relative z-10 w-64 h-full">
            <WeddingSidebar />
          </div>
        </div>
      )}

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border h-14 flex items-center px-4 gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 15 15" fill="none">
              <path d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1 7.5C1 7.22386 1.22386 7 1.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H1.5C1.22386 8 1 7.77614 1 7.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo2.png" alt="ForeverAfter" className="w-7 h-7 rounded-lg object-contain" />
            <span className="font-[family-name:var(--font-playfair)] text-base font-semibold">ForeverAfter</span>
          </div>
        </header>

        <div className="hidden md:flex items-center justify-end gap-2 px-6 py-2 border-b border-border bg-muted/20">
          <button
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg border border-border transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-background rounded border border-border">⌘K</kbd>
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={async () => { await signOut(); window.location.href = '/' }}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {!isLoaded ? (
            <div className="p-6 space-y-6 animate-pulse-soft">
              <ViewSkeleton />
            </div>
          ) : !hasData && activeView === 'dashboard' ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fade-in-up">
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-950/40 dark:to-amber-950/40 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-rose-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg">
                  <span className="text-sm">✨</span>
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-[family-name:var(--font-playfair)] font-semibold text-foreground mb-3">
                {user?.firstName ? `Welcome, ${user.firstName}!` : 'Welcome to ForeverAfter'}
              </h2>
              <p className="text-muted-foreground max-w-md mb-2">
                {isAdmin
                  ? 'Your all-in-one wedding planning companion. Get started by loading demo data or setting up your wedding details.'
                  : 'Your wedding planner is being set up by your team. Check back soon!'}
              </p>
              <p className="text-sm text-muted-foreground/70 mb-8">
                Plan, budget, organize, and manage every detail of your special day.
              </p>
              {isAdmin && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={loadDemoData} size="lg" className="gap-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/25">
                    <Sparkles className="w-4 h-4" />
                    Load Demo Data
                  </Button>
                  <Button onClick={() => useWeddingStore.getState().setActiveView('settings')} variant="outline" size="lg" className="gap-2">
                    Set Up Your Wedding
                  </Button>
                </div>
              )}
              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl">
                {[
                  { icon: '👥', label: 'Guest Management', desc: 'RSVP tracking' },
                  { icon: '💰', label: 'Budget Tracker', desc: 'Expense monitoring' },
                  { icon: '✅', label: 'Task Planner', desc: 'Checklist & deadlines' },
                  { icon: '📸', label: 'Media & Links', desc: 'Inspiration hub' },
                ].map((f) => (
                  <div key={f.label} className="text-center">
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <div className="text-sm font-medium text-foreground">{f.label}</div>
                    <div className="text-xs text-muted-foreground">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-fade-in-up p-6">
              {renderView()}
            </div>
          )}
        </div>

        <footer className="border-t border-border bg-background/50 backdrop-blur-sm py-3 px-6 mt-auto shrink-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="text-rose-500">♥</span>
              ForeverAfter Wedding Planner
            </span>
            <span>Plan your perfect day</span>
          </div>
        </footer>
      </main>
    </div>
  )
}
