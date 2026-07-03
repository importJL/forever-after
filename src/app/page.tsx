'use client'

import { useEffect, useState } from 'react'
import { useWeddingStore } from '@/lib/store'
import { WeddingSidebar } from '@/components/wedding/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import dynamic from 'next/dynamic'

// Lazy load all view components for performance
const DashboardView = dynamic(() => import('@/components/wedding/dashboard').then(m => ({ default: m.DashboardView })), { 
  loading: () => <ViewSkeleton />,
  ssr: false 
})
const GuestManager = dynamic(() => import('@/components/wedding/guest-manager').then(m => ({ default: m.GuestManager })), { 
  loading: () => <ViewSkeleton />,
  ssr: false 
})
const BudgetTracker = dynamic(() => import('@/components/wedding/budget-tracker').then(m => ({ default: m.BudgetTracker })), { 
  loading: () => <ViewSkeleton />,
  ssr: false 
})
const TaskChecklist = dynamic(() => import('@/components/wedding/task-checklist').then(m => ({ default: m.TaskChecklist })), { 
  loading: () => <ViewSkeleton />,
  ssr: false 
})
const VendorManager = dynamic(() => import('@/components/wedding/vendor-manager').then(m => ({ default: m.VendorManager })), { 
  loading: () => <ViewSkeleton />,
  ssr: false 
})
const TimelineView = dynamic(() => import('@/components/wedding/timeline-view').then(m => ({ default: m.TimelineView })), { 
  loading: () => <ViewSkeleton />,
  ssr: false 
})
const MediaGallery = dynamic(() => import('@/components/wedding/media-gallery').then(m => ({ default: m.MediaGallery })), { 
  loading: () => <ViewSkeleton />,
  ssr: false 
})
const SeatingChart = dynamic(() => import('@/components/wedding/seating-chart').then(m => ({ default: m.SeatingChart })), { 
  loading: () => <ViewSkeleton />,
  ssr: false 
})
const FileImport = dynamic(() => import('@/components/wedding/file-import').then(m => ({ default: m.FileImport })), { 
  loading: () => <ViewSkeleton />,
  ssr: false 
})
const WebLinks = dynamic(() => import('@/components/wedding/web-links').then(m => ({ default: m.WebLinks })), { 
  loading: () => <ViewSkeleton />,
  ssr: false 
})
const NotificationPanel = dynamic(() => import('@/components/wedding/notification-panel').then(m => ({ default: m.NotificationPanel })), { 
  loading: () => <ViewSkeleton />,
  ssr: false 
})
const SettingsView = dynamic(() => import('@/components/wedding/settings-view').then(m => ({ default: m.SettingsView })), { 
  loading: () => <ViewSkeleton />,
  ssr: false 
})

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

export default function Home() {
  const { activeView, isLoaded, setIsLoaded } = useWeddingStore()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  useEffect(() => {
    // Load all data from API on mount
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

        // Process results and update store
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

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />
      case 'guests':
        return <GuestManager />
      case 'budget':
        return <BudgetTracker />
      case 'tasks':
        return <TaskChecklist />
      case 'vendors':
        return <VendorManager />
      case 'timeline':
        return <TimelineView />
      case 'media':
        return <MediaGallery />
      case 'seating':
        return <SeatingChart />
      case 'import':
        return <FileImport />
      case 'links':
        return <WebLinks />
      case 'notifications':
        return <NotificationPanel />
      case 'settings':
        return <SettingsView />
      default:
        return <DashboardView />
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block shrink-0">
        <WeddingSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-64 h-full">
            <WeddingSidebar />
          </div>
        </div>
      )}

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

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          {!isLoaded ? (
            <div className="p-6 space-y-6 animate-pulse-soft">
              <ViewSkeleton />
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
            <span>ForeverAfter Wedding Planner</span>
            <span>Plan your perfect day</span>
          </div>
        </footer>
      </main>
    </div>
  )
}