'use client'

import { useState } from 'react'
import { MapPin, ExternalLink } from 'lucide-react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { MapDialog } from './map-dialog'

interface LocationLinkProps {
  locationName?: string
  address?: string
  className?: string
}

export function LocationLink({ locationName, address, className = '' }: LocationLinkProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const hasLocation = locationName || address

  if (!hasLocation) return null

  return (
    <>
      <HoverCard>
        <HoverCardTrigger asChild>
          <button
            onClick={() => setDialogOpen(true)}
            className={`inline-flex items-center gap-1.5 text-sm text-rose-600 hover:text-rose-700 underline-offset-2 hover:underline cursor-pointer transition-colors ${className}`}
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{locationName || address}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
          </button>
        </HoverCardTrigger>
        <HoverCardContent side="top" align="start" className="w-72 p-3">
          <p className="text-sm font-medium truncate">{locationName || 'Location'}</p>
          {address && <p className="text-xs text-muted-foreground mt-0.5">{address}</p>}
          <p className="text-xs text-rose-600 mt-2 flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            Click to open interactive map
          </p>
        </HoverCardContent>
      </HoverCard>

      <MapDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        address={address || locationName || ''}
        locationName={locationName}
        title={locationName || address}
      />
    </>
  )
}
