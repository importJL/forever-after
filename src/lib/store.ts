import { create } from 'zustand'

export type ViewType = 
  | 'dashboard' 
  | 'guests' 
  | 'budget' 
  | 'tasks' 
  | 'vendors' 
  | 'timeline' 
  | 'media' 
  | 'seating' 
  | 'import' 
  | 'links' 
  | 'notifications'
  | 'settings'

export interface Guest {
  id: string
  name: string
  email: string
  phone: string
  group: string
  rsvpStatus: 'pending' | 'accepted' | 'declined' | 'maybe'
  mealPreference: string
  dietaryNotes: string
  plusOne: boolean
  plusOneName: string
  tableNumber: number
  seatNumber: number
  role: string
  priority: number
  side: string
  category: string
  relationshipGroup: string
  overseas: boolean
  verbalAsked: boolean
  adults: number
  children: number
  totalInParty: number
  address: string
  giftReceived: string
  thankYouSent: boolean
  notes: string
}

export interface GuestSetup {
  sides: string[]
  categories: string[]
  relationshipGroups: string[]
  rsvpStatuses: string[]
  priorities: number[]
  binaries: string[]
}

export interface BudgetCategory {
  id: string
  name: string
  icon: string
  budgeted: number
  spent: number
  color: string
  sortOrder: number
  expenses: BudgetExpense[]
}

export interface BudgetExpense {
  id: string
  categoryId: string
  description: string
  amount: number
  date: string
  vendor: string
  paid: boolean
  notes: string
}

export interface Task {
  id: string
  title: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in_progress' | 'done' | 'cancelled'
  dueDate: string
  assignee: string
  notes: string
  sortOrder: number
}

export interface Vendor {
  id: string
  name: string
  category: string
  contactPerson: string
  email: string
  phone: string
  website: string
  address: string
  district: string
  city: string
  price: number
  depositPaid: number
  status: 'considering' | 'booked' | 'confirmed' | 'cancelled'
  rating: number
  notes: string
  contractDate: string
}

export interface TimelineEvent {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  eventDate: string
  location: string
  category: string
  notes: string
  sortOrder: number
}

export interface MediaItem {
  id: string
  title: string
  type: 'image' | 'video' | 'link'
  url: string
  thumbnail: string
  category: string
  notes: string
  sortOrder: number
  source: string
  tags: string
  location: string
  date: string
  color: string
}

export interface WebLink {
  id: string
  title: string
  url: string
  description: string
  category: string
  icon: string
  sortOrder: number
}

export interface AppNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'reminder'
  read: boolean
  relatedTo: string
}

export interface WeddingInfo {
  id: string
  coupleName: string
  partner1: string
  partner2: string
  date: string
  venue: string
  venueAddress: string
  ceremonyDate: string
  ceremonyLocation: string
  ceremonyAddress: string
  theme: string
  guestCount: number
  budgetTotal: number
  notes: string
}

interface WeddingStore {
  // Navigation
  activeView: ViewType
  sidebarOpen: boolean
  setActiveView: (view: ViewType) => void
  setSidebarOpen: (open: boolean) => void

  // Wedding Info
  wedding: WeddingInfo
  setWedding: (wedding: Partial<WeddingInfo>) => void

  // Guests
  guests: Guest[]
  setGuests: (guests: Guest[]) => void
  addGuest: (guest: Guest) => void
  updateGuest: (id: string, guest: Partial<Guest>) => void
  deleteGuest: (id: string) => void

  // Budget
  budgetCategories: BudgetCategory[]
  setBudgetCategories: (categories: BudgetCategory[]) => void
  addBudgetCategory: (category: BudgetCategory) => void
  updateBudgetCategory: (id: string, category: Partial<BudgetCategory>) => void
  deleteBudgetCategory: (id: string) => void
  addExpense: (categoryId: string, expense: BudgetExpense) => void
  updateExpense: (categoryId: string, expenseId: string, expense: Partial<BudgetExpense>) => void
  deleteExpense: (categoryId: string, expenseId: string) => void

  // Tasks
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, task: Partial<Task>) => void
  deleteTask: (id: string) => void

  // Vendors
  vendors: Vendor[]
  setVendors: (vendors: Vendor[]) => void
  addVendor: (vendor: Vendor) => void
  updateVendor: (id: string, vendor: Partial<Vendor>) => void
  deleteVendor: (id: string) => void

  // Timeline
  timelineViewType: 'gantt' | 'timeline'
  setTimelineViewType: (type: 'gantt' | 'timeline') => void
  timelineEvents: TimelineEvent[]
  setTimelineEvents: (events: TimelineEvent[]) => void
  addTimelineEvent: (event: TimelineEvent) => void
  updateTimelineEvent: (id: string, event: Partial<TimelineEvent>) => void
  deleteTimelineEvent: (id: string) => void

  // Media
  mediaItems: MediaItem[]
  setMediaItems: (items: MediaItem[]) => void
  addMediaItem: (item: MediaItem) => void
  updateMediaItem: (id: string, item: Partial<MediaItem>) => void
  deleteMediaItem: (id: string) => void

  // Web Links
  webLinks: WebLink[]
  setWebLinks: (links: WebLink[]) => void
  addWebLink: (link: WebLink) => void
  updateWebLink: (id: string, link: Partial<WebLink>) => void
  deleteWebLink: (id: string) => void

  // Notifications
  notifications: AppNotification[]
  setNotifications: (notifications: AppNotification[]) => void
  addNotification: (notification: AppNotification) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void

  // Guest Setup (dropdown mappings from Setup CSV)
  guestSetup: GuestSetup | null
  setGuestSetup: (setup: GuestSetup | null) => void

  // Data loading
  isLoaded: boolean
  setIsLoaded: (loaded: boolean) => void
}

export const useWeddingStore = create<WeddingStore>((set) => ({
  // Navigation
  activeView: 'dashboard',
  sidebarOpen: true,
  setActiveView: (view) => set({ activeView: view }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Wedding Info
  wedding: {
    id: '1',
    coupleName: 'Our Wedding',
    partner1: '',
    partner2: '',
    date: '',
    venue: '',
    venueAddress: '',
    ceremonyDate: '',
    ceremonyLocation: '',
    ceremonyAddress: '',
    theme: 'Classic Elegance',
    guestCount: 0,
    budgetTotal: 0,
    notes: '',
  },
  setWedding: (w) => set((s) => ({ wedding: { ...s.wedding, ...w } })),

  // Guests
  guests: [],
  setGuests: (guests) => set({ guests }),
  addGuest: (guest) => set((s) => ({ guests: [...s.guests, guest] })),
  updateGuest: (id, guest) => set((s) => ({
    guests: s.guests.map((g) => (g.id === id ? { ...g, ...guest } : g)),
  })),
  deleteGuest: (id) => set((s) => ({ guests: s.guests.filter((g) => g.id !== id) })),

  // Budget
  budgetCategories: [],
  setBudgetCategories: (budgetCategories) => set({ budgetCategories }),
  addBudgetCategory: (category) => set((s) => ({ budgetCategories: [...s.budgetCategories, category] })),
  updateBudgetCategory: (id, category) => set((s) => ({
    budgetCategories: s.budgetCategories.map((c) => (c.id === id ? { ...c, ...category } : c)),
  })),
  deleteBudgetCategory: (id) => set((s) => ({
    budgetCategories: s.budgetCategories.filter((c) => c.id !== id),
  })),
  addExpense: (categoryId, expense) => set((s) => ({
    budgetCategories: s.budgetCategories.map((c) =>
      c.id === categoryId
        ? { ...c, expenses: [...c.expenses, expense], spent: c.spent + expense.amount }
        : c
    ),
  })),
  updateExpense: (categoryId, expenseId, expense) => set((s) => ({
    budgetCategories: s.budgetCategories.map((c) =>
      c.id === categoryId
        ? {
            ...c,
            expenses: c.expenses.map((e) => (e.id === expenseId ? { ...e, ...expense } : e)),
            spent: c.expenses.reduce((acc, e) => acc + (e.id === expenseId ? (expense.amount ?? e.amount) : e.amount), 0),
          }
        : c
    ),
  })),
  deleteExpense: (categoryId, expenseId) => set((s) => ({
    budgetCategories: s.budgetCategories.map((c) =>
      c.id === categoryId
        ? {
            ...c,
            expenses: c.expenses.filter((e) => e.id !== expenseId),
            spent: c.expenses.filter((e) => e.id !== expenseId).reduce((acc, e) => acc + e.amount, 0),
          }
        : c
    ),
  })),

  // Tasks
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
  updateTask: (id, task) => set((s) => ({
    tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...task } : t)),
  })),
  deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

  // Vendors
  vendors: [],
  setVendors: (vendors) => set({ vendors }),
  addVendor: (vendor) => set((s) => ({ vendors: [...s.vendors, vendor] })),
  updateVendor: (id, vendor) => set((s) => ({
    vendors: s.vendors.map((v) => (v.id === id ? { ...v, ...vendor } : v)),
  })),
  deleteVendor: (id) => set((s) => ({ vendors: s.vendors.filter((v) => v.id !== id) })),

  // Timeline
  timelineViewType: 'timeline',
  setTimelineViewType: (timelineViewType) => set({ timelineViewType }),
  timelineEvents: [],
  setTimelineEvents: (timelineEvents) => set({ timelineEvents }),
  addTimelineEvent: (event) => set((s) => ({ timelineEvents: [...s.timelineEvents, event] })),
  updateTimelineEvent: (id, event) => set((s) => ({
    timelineEvents: s.timelineEvents.map((e) => (e.id === id ? { ...e, ...event } : e)),
  })),
  deleteTimelineEvent: (id) => set((s) => ({
    timelineEvents: s.timelineEvents.filter((e) => e.id !== id),
  })),

  // Media
  mediaItems: [],
  setMediaItems: (mediaItems) => set({ mediaItems }),
  addMediaItem: (item) => set((s) => ({ mediaItems: [...s.mediaItems, item] })),
  updateMediaItem: (id, item) => set((s) => ({
    mediaItems: s.mediaItems.map((m) => (m.id === id ? { ...m, ...item } : m)),
  })),
  deleteMediaItem: (id) => set((s) => ({ mediaItems: s.mediaItems.filter((m) => m.id !== id) })),

  // Web Links
  webLinks: [],
  setWebLinks: (webLinks) => set({ webLinks }),
  addWebLink: (link) => set((s) => ({ webLinks: [...s.webLinks, link] })),
  updateWebLink: (id, link) => set((s) => ({
    webLinks: s.webLinks.map((l) => (l.id === id ? { ...l, ...link } : l)),
  })),
  deleteWebLink: (id) => set((s) => ({ webLinks: s.webLinks.filter((l) => l.id !== id) })),

  // Notifications
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) => set((s) => ({
    notifications: [notification, ...s.notifications],
  })),
  markNotificationRead: (id) => set((s) => ({
    notifications: s.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    ),
  })),
  clearNotifications: () => set({ notifications: [] }),

  // Guest Setup
  guestSetup: null,
  setGuestSetup: (setup) => set({ guestSetup: setup }),

  // Data loading
  isLoaded: false,
  setIsLoaded: (loaded) => set({ isLoaded: loaded }),
}))