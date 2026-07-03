'use client'

import { useEffect, useState, useCallback, Component, type ReactNode } from 'react'
import { useWeddingStore, type ViewType } from '@/lib/store'
import { WeddingSidebar } from '@/components/wedding/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AlertTriangle, RefreshCw, Sun, Moon, Search, Sparkles } from 'lucide-react'
import { useTheme } from 'next-themes'
import dynamic from 'next/dynamic'

// ── Error Boundary for dynamic imports ─────────────────────────────────
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

// ── Dynamic view wrapper with error boundary ───────────────────────────
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

// ── Lazy load all view components ───────────────────────────────────────
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

// ── Command Palette ─────────────────────────────────────────────────────
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

// ── Main Page ───────────────────────────────────────────────────────────
export default function Home() {
  const { activeView, isLoaded, setIsLoaded, guests, tasks, budgetCategories, vendors, timelineEvents, wedding } = useWeddingStore()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  // Keyboard shortcut: Cmd+K / Ctrl+K for command palette
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

  // Load all data from API on mount
  useEffect(() => {
    async function loadData() {
      try {
        const endpoints = [
          '/api/wedding',
          '/api/guests',
          '/api/budget',
          '/api/tasks',
          '/api/vendors',
          '/api/timeline',
          '/api/media',
          '/api/links',
          '/api/notifications',
        ]
        const results = await Promise.allSettled(
          endpoints.map((url) => fetch(url).then((r) => r.json()))
        )

        const store = useWeddingStore.getState()

        if (results[0].status === 'fulfilled' && results[0].value) {
          store.setWedding(results[0].value)
        }
        if (results[1].status === 'fulfilled' && Array.isArray(results[1].value)) {
          store.setGuests(results[1].value)
        }
        if (results[2].status === 'fulfilled' && Array.isArray(results[2].value)) {
          store.setBudgetCategories(results[2].value)
        }
        if (results[3].status === 'fulfilled' && Array.isArray(results[3].value)) {
          store.setTasks(results[3].value)
        }
        if (results[4].status === 'fulfilled' && Array.isArray(results[4].value)) {
          store.setVendors(results[4].value)
        }
        if (results[5].status === 'fulfilled' && Array.isArray(results[5].value)) {
          store.setTimelineEvents(results[5].value)
        }
        if (results[6].status === 'fulfilled' && Array.isArray(results[6].value)) {
          store.setMediaItems(results[6].value)
        }
        if (results[7].status === 'fulfilled' && Array.isArray(results[7].value)) {
          store.setWebLinks(results[7].value)
        }
        if (results[8].status === 'fulfilled' && Array.isArray(results[8].value)) {
          store.setNotifications(results[8].value)
        }
      } catch (e) {
        console.error('Failed to load data:', e)
      } finally {
        setIsLoaded(true)
      }
    }
    loadData()
  }, [setIsLoaded])

  // Load demo data
  const loadDemoData = useCallback(async () => {
    try {
      toast.loading('Loading demo data...', { id: 'demo' })

      // Wedding info
      await fetch('/api/wedding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupleName: 'Emma & James',
          partner1: 'Emma',
          partner2: 'James',
          date: '2026-06-15',
          venue: 'Rosewood Estate',
          venueAddress: '123 Garden Lane, Napa Valley, CA',
          theme: 'Garden Party',
          guestCount: 120,
          budgetTotal: 35000,
          notes: 'Our dream outdoor wedding in Napa Valley!',
        }),
      })

      // Guests
      const demoGuests = [
        { name: 'Sarah Johnson', email: 'sarah@email.com', phone: '555-0101', group: 'Family', rsvpStatus: 'accepted', mealPreference: 'Chicken', role: 'bridesmaid', plusOne: true, plusOneName: 'Mike Chen' },
        { name: 'David Wilson', email: 'david@email.com', phone: '555-0102', group: 'Family', rsvpStatus: 'accepted', mealPreference: 'Beef', role: 'groomsman' },
        { name: 'Lisa Park', email: 'lisa@email.com', phone: '555-0103', group: 'Friends', rsvpStatus: 'accepted', mealPreference: 'Fish', role: 'guest', plusOne: true, plusOneName: 'Tom Park' },
        { name: 'Robert Chen', email: 'robert@email.com', phone: '555-0104', group: 'Family', rsvpStatus: 'pending', mealPreference: 'Vegetarian', role: 'family' },
        { name: 'Maria Garcia', email: 'maria@email.com', phone: '555-0105', group: 'Friends', rsvpStatus: 'accepted', mealPreference: 'Chicken', role: 'bridesmaid' },
        { name: 'James Thompson', email: 'james.t@email.com', phone: '555-0106', group: 'Work', rsvpStatus: 'declined', mealPreference: '', role: 'guest' },
        { name: 'Emily Davis', email: 'emily@email.com', phone: '555-0107', group: 'Friends', rsvpStatus: 'maybe', mealPreference: 'Vegan', role: 'guest', plusOne: true, plusOneName: 'Chris Lee' },
        { name: 'Michael Brown', email: 'michael@email.com', phone: '555-0108', group: 'Family', rsvpStatus: 'accepted', mealPreference: 'Beef', role: 'groomsman' },
        { name: 'Jennifer White', email: 'jen@email.com', phone: '555-0109', group: 'Friends', rsvpStatus: 'accepted', mealPreference: 'Fish', role: 'guest' },
        { name: 'Alex Kim', email: 'alex@email.com', phone: '555-0110', group: 'Work', rsvpStatus: 'pending', mealPreference: 'Chicken', role: 'guest' },
        { name: 'Rachel Green', email: 'rachel@email.com', phone: '555-0111', group: 'Friends', rsvpStatus: 'accepted', mealPreference: 'Vegetarian', role: 'bridesmaid', plusOne: true, plusOneName: 'Dan Smith' },
        { name: 'Rev. Patricia Moore', email: 'patricia@email.com', phone: '555-0112', group: 'Family', rsvpStatus: 'accepted', mealPreference: 'Chicken', role: 'officiant' },
      ]
      for (const g of demoGuests) {
        await fetch('/api/guests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(g) })
      }

      // Tasks
      const demoTasks = [
        { title: 'Book wedding venue', description: 'Confirm Rosewood Estate booking and pay deposit', category: 'Venue', priority: 'high', status: 'done', dueDate: '2025-09-01', assignee: 'Emma' },
        { title: 'Choose wedding photographer', description: 'Interview 3 photographers and select one', category: 'Photography', priority: 'high', status: 'done', dueDate: '2025-10-01', assignee: 'Emma' },
        { title: 'Send save-the-dates', description: 'Design and mail save-the-date cards', category: 'Stationery', priority: 'medium', status: 'done', dueDate: '2025-11-01', assignee: 'Emma' },
        { title: 'Book caterer', description: 'Taste test and book catering service', category: 'Catering', priority: 'high', status: 'in_progress', dueDate: '2026-01-15', assignee: 'James' },
        { title: 'Order wedding cake', description: 'Schedule cake tasting and place order', category: 'Catering', priority: 'medium', status: 'in_progress', dueDate: '2026-03-01', assignee: 'Emma' },
        { title: 'Choose bridesmaid dresses', description: 'Select color palette and dress style', category: 'Attire', priority: 'medium', status: 'todo', dueDate: '2026-02-15', assignee: 'Emma' },
        { title: 'Book DJ / Band', description: 'Research and book entertainment', category: 'Music', priority: 'high', status: 'todo', dueDate: '2026-02-01', assignee: 'James' },
        { title: 'Order wedding invitations', description: 'Design and print formal invitations', category: 'Stationery', priority: 'medium', status: 'todo', dueDate: '2026-03-15', assignee: 'Emma' },
        { title: 'Plan honeymoon', description: 'Book flights and resort', category: 'Honeymoon', priority: 'low', status: 'todo', dueDate: '2026-04-01', assignee: 'James' },
        { title: 'Final dress fitting', description: 'Last fitting for wedding dress', category: 'Attire', priority: 'high', status: 'todo', dueDate: '2026-05-15', assignee: 'Emma' },
        { title: 'Arrange transportation', description: 'Book limo/transport for wedding party', category: 'Transportation', priority: 'medium', status: 'todo', dueDate: '2026-05-01', assignee: 'James' },
        { title: 'Obtain marriage license', description: 'Visit county clerk office', category: 'Legal', priority: 'high', status: 'todo', dueDate: '2026-06-01', assignee: 'Emma & James' },
      ]
      for (const t of demoTasks) {
        await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t) })
      }

      // Vendors
      const demoVendors = [
        { name: 'Rosewood Estate', category: 'Venue', contactPerson: 'Victoria Hart', email: 'info@rosewood.com', phone: '555-1001', website: 'https://rosewood.com', price: 8000, depositPaid: 4000, status: 'confirmed', rating: 5, notes: 'Beautiful garden venue' },
        { name: 'Sweet Moments Bakery', category: 'Cake', contactPerson: 'Anna Lee', email: 'anna@sweetmoments.com', phone: '555-1002', website: '', price: 1200, depositPaid: 600, status: 'booked', rating: 4, notes: '3-tier floral cake' },
        { name: 'Lens & Light Studio', category: 'Photography', contactPerson: 'Marcus Wei', email: 'marcus@lenslight.com', phone: '555-1003', website: 'https://lenslight.com', price: 3500, depositPaid: 1750, status: 'confirmed', rating: 5, notes: 'Includes engagement + wedding day' },
        { name: 'Petal & Bloom', category: 'Florist', contactPerson: 'Sophie Chen', email: 'sophie@petalbloom.com', phone: '555-1004', website: '', price: 2500, depositPaid: 0, status: 'booked', rating: 4, notes: 'Garden roses and peonies' },
        { name: 'DJ Rhythm', category: 'Entertainment', contactPerson: 'Tony Rivera', email: 'tony@dj rhythm.com', phone: '555-1005', website: '', price: 1500, depositPaid: 0, status: 'considering', rating: 3, notes: 'Needs to confirm availability' },
        { name: 'Garden Catering Co.', category: 'Catering', contactPerson: 'Chef Maria', email: 'maria@gardencatering.com', phone: '555-1006', website: 'https://gardencatering.com', price: 8000, depositPaid: 2000, status: 'booked', rating: 4, notes: 'Farm-to-table menu' },
      ]
      for (const v of demoVendors) {
        await fetch('/api/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) })
      }

      // Timeline
      const demoTimeline = [
        { title: 'Getting Ready', description: 'Bridal party gets ready at the venue', startTime: '10:00', endTime: '12:00', location: 'Bridal Suite', category: 'other', sortOrder: 0 },
        { title: 'First Look', description: 'Private first look photos', startTime: '12:00', endTime: '12:30', location: 'Garden Gazebo', category: 'photos', sortOrder: 1 },
        { title: 'Ceremony', description: 'Wedding ceremony in the rose garden', startTime: '14:00', endTime: '15:00', location: 'Rose Garden', category: 'ceremony', sortOrder: 2 },
        { title: 'Cocktail Hour', description: 'Drinks and hors d\'oeuvres', startTime: '15:00', endTime: '16:00', location: 'Terrace', category: 'cocktail', sortOrder: 3 },
        { title: 'Dinner', description: 'Sit-down dinner service', startTime: '16:00', endTime: '18:00', location: 'Grand Hall', category: 'dinner', sortOrder: 4 },
        { title: 'First Dance & Toasts', description: 'First dance, father-daughter dance, toasts', startTime: '18:00', endTime: '18:45', location: 'Grand Hall', category: 'reception', sortOrder: 5 },
        { title: 'Dancing & Celebration', description: 'Open dance floor', startTime: '18:45', endTime: '22:00', location: 'Grand Hall', category: 'dancing', sortOrder: 6 },
        { title: 'Sparkler Send-Off', description: 'Grand exit with sparklers', startTime: '22:00', endTime: '22:15', location: 'Front Entrance', category: 'ceremony', sortOrder: 7 },
      ]
      for (const t of demoTimeline) {
        await fetch('/api/timeline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t) })
      }

      // Web Links
      const demoLinks = [
        { title: 'The Knot', url: 'https://www.theknot.com', description: 'Wedding planning resources', category: 'inspiration', icon: 'Heart' },
        { title: 'Amazon Registry', url: 'https://www.amazon.com/wedding', description: 'Our gift registry', category: 'registry', icon: 'Gift' },
        { title: 'Pinterest Inspiration', url: 'https://www.pinterest.com', description: 'Wedding mood board ideas', category: 'inspiration', icon: 'Lightbulb' },
        { title: 'Rosewood Estate', url: 'https://rosewood.com', description: 'Wedding venue website', category: 'venue', icon: 'MapPin' },
      ]
      for (const l of demoLinks) {
        await fetch('/api/links', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(l) })
      }

      // Notifications
      const demoNotifs = [
        { title: 'Welcome to ForeverAfter!', message: 'Start by setting up your wedding details in Settings.', type: 'info', relatedTo: 'dashboard' },
        { title: 'RSVP Reminder', message: '3 guests haven\'t responded yet. Consider sending a follow-up.', type: 'reminder', relatedTo: 'guests' },
        { title: 'Budget Alert', message: 'You\'ve used 72% of your total budget. Review your expenses.', type: 'warning', relatedTo: 'budget' },
        { title: 'Task Completed', message: 'Wedding venue has been booked successfully!', type: 'success', relatedTo: 'tasks' },
      ]
      for (const n of demoNotifs) {
        await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(n) })
      }

      // Reload data
      const endpoints = ['/api/wedding', '/api/guests', '/api/budget', '/api/tasks', '/api/vendors', '/api/timeline', '/api/media', '/api/links', '/api/notifications']
      const results = await Promise.allSettled(endpoints.map(url => fetch(url).then(r => r.json())))
      const store = useWeddingStore.getState()
      if (results[0].status === 'fulfilled' && results[0].value) store.setWedding(results[0].value)
      if (results[1].status === 'fulfilled' && Array.isArray(results[1].value)) store.setGuests(results[1].value)
      if (results[2].status === 'fulfilled' && Array.isArray(results[2].value)) store.setBudgetCategories(results[2].value)
      if (results[3].status === 'fulfilled' && Array.isArray(results[3].value)) store.setTasks(results[3].value)
      if (results[4].status === 'fulfilled' && Array.isArray(results[4].value)) store.setVendors(results[4].value)
      if (results[5].status === 'fulfilled' && Array.isArray(results[5].value)) store.setTimelineEvents(results[5].value)
      if (results[6].status === 'fulfilled' && Array.isArray(results[6].value)) store.setMediaItems(results[6].value)
      if (results[7].status === 'fulfilled' && Array.isArray(results[7].value)) store.setWebLinks(results[7].value)
      if (results[8].status === 'fulfilled' && Array.isArray(results[8].value)) store.setNotifications(results[8].value)

      toast.success('Demo data loaded!', { id: 'demo', description: 'Explore the app with sample wedding data' })
    } catch (e) {
      toast.error('Failed to load demo data', { id: 'demo' })
    }
  }, [])

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
      default: return <DashboardView />
    }
  }

  const hasData = isLoaded && (guests.length > 0 || tasks.length > 0 || wedding.date)

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block shrink-0">
        <WeddingSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)} />
          <div className="relative z-10 w-64 h-full">
            <WeddingSidebar />
          </div>
        </div>
      )}

      {/* Command Palette */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
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
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            </div>
            <span className="font-[family-name:var(--font-playfair)] text-base font-semibold">ForeverAfter</span>
          </div>
        </header>

        {/* Top utility bar (desktop) */}
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
        </div>

        {/* Page content */}
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
                Welcome to ForeverAfter
              </h2>
              <p className="text-muted-foreground max-w-md mb-2">
                Your all-in-one wedding planning companion. Get started by loading demo data or setting up your wedding details.
              </p>
              <p className="text-sm text-muted-foreground/70 mb-8">
                Plan, budget, organize, and manage every detail of your special day.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={loadDemoData} size="lg" className="gap-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/25">
                  <Sparkles className="w-4 h-4" />
                  Load Demo Data
                </Button>
                <Button onClick={() => useWeddingStore.getState().setActiveView('settings')} variant="outline" size="lg" className="gap-2">
                  Set Up Your Wedding
                </Button>
              </div>
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
            <div className="animate-fade-in-up">
              {renderView()}
            </div>
          )}
        </div>

        {/* Footer */}
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