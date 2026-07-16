'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Heart,
  Save,
  Calendar,
  MapPin,
  Palette,
  Users,
  Wallet,
  FileText,
  Loader2,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react'
import { useWeddingStore } from '@/lib/store'
import { client } from '@/lib/amplify-client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { LocationLink } from '@/components/map/location-link'

const WEDDING_THEMES = [
  'Classic Elegance',
  'Rustic Charm',
  'Modern Minimalist',
  'Garden Party',
  'Beach',
  'Bohemian',
  'Traditional',
] as const

interface WeddingFormData {
  partner1: string
  partner2: string
  date: string
  venue: string
  venueAddress: string
  ceremonyDate: string
  ceremonyLocation: string
  ceremonyAddress: string
  theme: string
  guestCount: string
  budgetTotal: string
  notes: string
}

const initialFormData: WeddingFormData = {
  partner1: '',
  partner2: '',
  date: '',
  venue: '',
  venueAddress: '',
  ceremonyDate: '',
  ceremonyLocation: '',
  ceremonyAddress: '',
  theme: 'Classic Elegance',
  guestCount: '0',
  budgetTotal: '0',
  notes: '',
}

function FormFieldGroup({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs">{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </motion.div>
  )
}

export function SettingsView() {
  const wedding = useWeddingStore((s) => s.wedding)
  const setWedding = useWeddingStore((s) => s.setWedding)
  const setActiveView = useWeddingStore((s) => s.setActiveView)
  const [formData, setFormData] = useState<WeddingFormData>(() => ({
    partner1: wedding.partner1 || '',
    partner2: wedding.partner2 || '',
    date: wedding.date ? wedding.date.split('T')[0] : '',
    venue: wedding.venue || '',
    venueAddress: wedding.venueAddress || '',
    ceremonyDate: wedding.ceremonyDate || '',
    ceremonyLocation: wedding.ceremonyLocation || '',
    ceremonyAddress: wedding.ceremonyAddress || '',
    theme: wedding.theme || 'Classic Elegance',
    guestCount: String(wedding.guestCount || 0),
    budgetTotal: String(wedding.budgetTotal || 0),
    notes: wedding.notes || '',
  }))
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Track changes — compare formData against stored wedding data
  useEffect(() => {
    const stored: WeddingFormData = {
      partner1: wedding.partner1 || '',
      partner2: wedding.partner2 || '',
      date: wedding.date ? wedding.date.split('T')[0] : '',
      venue: wedding.venue || '',
      venueAddress: wedding.venueAddress || '',
      ceremonyDate: wedding.ceremonyDate || '',
      ceremonyLocation: wedding.ceremonyLocation || '',
      ceremonyAddress: wedding.ceremonyAddress || '',
      theme: wedding.theme || 'Classic Elegance',
      guestCount: String(wedding.guestCount || 0),
      budgetTotal: String(wedding.budgetTotal || 0),
      notes: wedding.notes || '',
    }
    const changed = (Object.keys(stored) as (keyof WeddingFormData)[]).some(
      (key) => stored[key] !== formData[key]
    )
    setHasChanges(changed)
  }, [formData, wedding])

  const handleChange = (field: keyof WeddingFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const coupleName =
        formData.partner1 && formData.partner2
          ? `${formData.partner1} & ${formData.partner2}`
          : wedding.coupleName || 'Our Wedding'

      const payload = {
        ...wedding,
        coupleName,
        partner1: formData.partner1,
        partner2: formData.partner2,
        date: formData.date,
        venue: formData.venue,
        venueAddress: formData.venueAddress,
        ceremonyDate: formData.ceremonyDate,
        ceremonyLocation: formData.ceremonyLocation,
        ceremonyAddress: formData.ceremonyAddress,
        theme: formData.theme,
        guestCount: Number(formData.guestCount) || 0,
        budgetTotal: Number(formData.budgetTotal) || 0,
        notes: formData.notes,
      }

      const { data: existing } = await client.models.Wedding.list()
      if (existing && existing.length > 0) {
        const { errors } = await client.models.Wedding.update({ id: existing[0].id, ...payload })
        if (errors) throw new Error(errors[0].message)
      } else {
        const { errors } = await client.models.Wedding.create(payload)
        if (errors) throw new Error(errors[0].message)
      }

      // Update store
      setWedding(payload)
      setHasChanges(false)
      toast.success('Wedding details saved successfully!', {
        description: 'Your changes have been saved.',
      })
    } catch {
      toast.error('Failed to save', {
        description: 'There was an error saving your wedding details. Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setFormData({
      partner1: wedding.partner1 || '',
      partner2: wedding.partner2 || '',
      date: wedding.date ? wedding.date.split('T')[0] : '',
      venue: wedding.venue || '',
      venueAddress: wedding.venueAddress || '',
      ceremonyDate: wedding.ceremonyDate || '',
      ceremonyLocation: wedding.ceremonyLocation || '',
      ceremonyAddress: wedding.ceremonyAddress || '',
      theme: wedding.theme || 'Classic Elegance',
      guestCount: String(wedding.guestCount || 0),
      budgetTotal: String(wedding.budgetTotal || 0),
      notes: wedding.notes || '',
    })
    setHasChanges(false)
    toast.info('Changes discarded')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setActiveView('dashboard')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-playfair)] flex items-center gap-2">
              <Heart className="w-6 h-6 text-rose-500" fill="currentColor" />
              Wedding Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your wedding details and preferences
            </p>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {/* Couple Names */}
        <FormFieldGroup
          icon={Heart}
          title="Couple Information"
          description="The happy couple's names"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partner1">Partner 1</Label>
              <Input
                id="partner1"
                placeholder="Enter first name"
                value={formData.partner1}
                onChange={(e) => handleChange('partner1', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner2">Partner 2</Label>
              <Input
                id="partner2"
                placeholder="Enter second name"
                value={formData.partner2}
                onChange={(e) => handleChange('partner2', e.target.value)}
              />
            </div>
          </div>
        </FormFieldGroup>

        {/* Date & Venue */}
        <FormFieldGroup
          icon={Calendar}
          title="Date & Venue"
          description="When and where the celebration happens"
        >
          <div className="space-y-2">
            <Label htmlFor="wedding-date">Wedding Date</Label>
            <Input
              id="wedding-date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="max-w-xs"
            />
          </div>

          <Separator className="my-2" />

          <div className="space-y-2">
            <Label htmlFor="venue-name">Venue Name</Label>
            <div className="flex items-center gap-2">
              <Input
                id="venue-name"
                placeholder="e.g., The Grand Ballroom"
                value={formData.venue}
                onChange={(e) => handleChange('venue', e.target.value)}
              />
              {formData.venueAddress && (
                <LocationLink
                  locationName={formData.venue}
                  address={formData.venueAddress}
                />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue-address">Venue Address</Label>
            <Input
              id="venue-address"
              placeholder="Full address of the venue"
              value={formData.venueAddress}
              onChange={(e) => handleChange('venueAddress', e.target.value)}
            />
          </div>

          <Separator className="my-2" />

          <div className="space-y-2">
            <Label htmlFor="ceremony-date">Ceremony Date</Label>
            <Input
              id="ceremony-date"
              type="datetime-local"
              value={formData.ceremonyDate}
              onChange={(e) => handleChange('ceremonyDate', e.target.value)}
              className="max-w-xs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ceremony-location">Ceremony Location Name</Label>
            <div className="flex items-center gap-2">
              <Input
                id="ceremony-location"
                placeholder="e.g., St. Mary's Church"
                value={formData.ceremonyLocation}
                onChange={(e) => handleChange('ceremonyLocation', e.target.value)}
              />
              {formData.ceremonyAddress && (
                <LocationLink
                  locationName={formData.ceremonyLocation}
                  address={formData.ceremonyAddress}
                />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ceremony-address">Ceremony Address</Label>
            <Input
              id="ceremony-address"
              placeholder="Full address of the ceremony"
              value={formData.ceremonyAddress}
              onChange={(e) => handleChange('ceremonyAddress', e.target.value)}
            />
          </div>
        </FormFieldGroup>

        {/* Theme & Planning */}
        <FormFieldGroup
          icon={Palette}
          title="Theme & Planning"
          description="Your wedding style and scale"
        >
          <div className="space-y-2">
            <Label htmlFor="wedding-theme">Wedding Theme</Label>
            <Select
              value={formData.theme}
              onValueChange={(value) => handleChange('theme', value)}
            >
              <SelectTrigger id="wedding-theme" className="w-full sm:w-[280px]">
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                {WEDDING_THEMES.map((theme) => (
                  <SelectItem key={theme} value={theme}>
                    {theme}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="guest-count" className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                Total Guest Count
              </Label>
              <Input
                id="guest-count"
                type="number"
                min="0"
                placeholder="0"
                value={formData.guestCount}
                onChange={(e) => handleChange('guestCount', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-total" className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
                Total Budget ($)
              </Label>
              <Input
                id="budget-total"
                type="number"
                min="0"
                step="100"
                placeholder="0"
                value={formData.budgetTotal}
                onChange={(e) => handleChange('budgetTotal', e.target.value)}
              />
            </div>
          </div>
        </FormFieldGroup>

        {/* Notes */}
        <FormFieldGroup
          icon={FileText}
          title="Additional Notes"
          description="Any extra details or reminders"
        >
          <div className="space-y-2">
            <Label htmlFor="wedding-notes">Notes</Label>
            <Textarea
              id="wedding-notes"
              placeholder="Add any notes about your wedding plans, special requests, or reminders..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="min-h-[120px] resize-y"
            />
          </div>
        </FormFieldGroup>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-3 pt-2 pb-8"
        >
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/25 min-w-[160px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Discard Changes
            </Button>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}