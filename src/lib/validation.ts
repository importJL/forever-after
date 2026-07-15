import { z } from 'zod/v4'

export const GuestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().max(500).default(''),
  phone: z.string().max(100).default(''),
  group: z.string().max(100).default('General'),
  rsvpStatus: z.enum(['pending', 'accepted', 'declined', 'maybe']).default('pending'),
  mealPreference: z.string().max(200).default(''),
  dietaryNotes: z.string().max(500).default(''),
  plusOne: z.boolean().default(false),
  plusOneName: z.string().max(200).default(''),
  tableNumber: z.number().int().min(0).default(0),
  seatNumber: z.number().int().min(0).default(0),
  role: z.string().max(100).default('guest'),
  priority: z.number().int().min(0).max(3).default(3),
  side: z.string().max(50).default(''),
  category: z.string().max(100).default(''),
  relationshipGroup: z.string().max(100).default(''),
  overseas: z.boolean().default(false),
  verbalAsked: z.boolean().default(false),
  adults: z.number().int().min(0).default(1),
  children: z.number().int().min(0).default(0),
  totalInParty: z.number().int().min(0).default(1),
  address: z.string().max(500).default(''),
  giftReceived: z.string().max(500).default(''),
  thankYouSent: z.boolean().default(false),
  notes: z.string().max(2000).default(''),
})

export const BudgetCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  icon: z.string().max(50).default('CircleDollarSign'),
  budgeted: z.number().min(0).default(0),
  spent: z.number().min(0).default(0),
  color: z.string().max(20).default('#e11d48'),
  sortOrder: z.number().int().min(0).default(0),
})

export const BudgetExpenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  date: z.string().max(20).default(''),
  vendor: z.string().max(200).default(''),
  paid: z.boolean().default(false),
  notes: z.string().max(2000).default(''),
})

export const TaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().max(2000).default(''),
  category: z.string().max(100).default('General'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'done', 'cancelled']).default('todo'),
  dueDate: z.string().max(20).default(''),
  assignee: z.string().max(200).default(''),
  notes: z.string().max(2000).default(''),
  sortOrder: z.number().int().min(0).default(0),
})

export const VendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  category: z.string().max(100).default(''),
  contactPerson: z.string().max(200).default(''),
  email: z.string().max(500).default(''),
  phone: z.string().max(100).default(''),
  website: z.string().max(500).default(''),
  address: z.string().max(500).default(''),
  district: z.string().max(200).default(''),
  city: z.string().max(200).default('Hong Kong'),
  price: z.number().min(0).default(0),
  depositPaid: z.number().min(0).default(0),
  status: z.enum(['considering', 'booked', 'confirmed', 'cancelled']).default('considering'),
  rating: z.number().int().min(0).max(5).default(0),
  notes: z.string().max(2000).default(''),
  contractDate: z.string().max(20).default(''),
})

export const TimelineEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().max(2000).default(''),
  startTime: z.string().max(10).default(''),
  endTime: z.string().max(10).default(''),
  eventDate: z.string().max(10).default(''),
  location: z.string().max(500).default(''),
  category: z.string().max(100).default('ceremony'),
  notes: z.string().max(2000).default(''),
  sortOrder: z.number().int().min(0).default(0),
})

export const MediaItemSchema = z.object({
  title: z.string().max(500).default(''),
  type: z.enum(['image', 'video', 'link']).default('image'),
  url: z.string().max(50000).default(''),
  thumbnail: z.string().max(50000).default(''),
  category: z.string().max(100).default('inspiration'),
  notes: z.string().max(2000).default(''),
  sortOrder: z.number().int().min(0).default(0),
  source: z.string().max(100).default(''),
  tags: z.string().max(500).default(''),
  location: z.string().max(200).default(''),
  date: z.string().max(20).default(''),
  color: z.string().max(7).default(''),
})

export const WebLinkSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.string().min(1, 'URL is required').max(2000),
  description: z.string().max(500).default(''),
  category: z.string().max(100).default('other'),
  icon: z.string().max(50).default('Link'),
  sortOrder: z.number().int().min(0).default(0),
})

export const NotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().max(2000).default(''),
  type: z.enum(['info', 'warning', 'success', 'reminder']).default('info'),
  read: z.boolean().default(false),
  relatedTo: z.string().max(100).default(''),
})

export const WeddingSchema = z.object({
  coupleName: z.string().max(200).default('Our Wedding'),
  partner1: z.string().max(100).default(''),
  partner2: z.string().max(100).default(''),
  date: z.string().max(20).default(''),
  venue: z.string().max(500).default(''),
  venueAddress: z.string().max(500).default(''),
  ceremonyDate: z.string().max(20).default(''),
  ceremonyLocation: z.string().max(500).default(''),
  ceremonyAddress: z.string().max(500).default(''),
  theme: z.string().max(100).default('Classic Elegance'),
  guestCount: z.number().int().min(0).default(0),
  budgetTotal: z.number().min(0).default(0),
  notes: z.string().max(2000).default(''),
})
