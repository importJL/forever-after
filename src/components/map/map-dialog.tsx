'use client'

import { useEffect, useRef, useState } from 'react'
import * as maptilersdk from '@maptiler/sdk'
import { geocoding } from '@maptiler/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, MapPin } from 'lucide-react'

import '@maptiler/sdk/dist/maptiler-sdk.css'

const MAPTILER_API_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || ''
maptilersdk.config.apiKey = MAPTILER_API_KEY

interface MapDialogProps {
  open: boolean
  onClose: () => void
  address: string
  locationName?: string
  title?: string
}

function simplifyAddress(address: string): string[] {
  const candidates: string[] = [address]

  const stripped = address
    .replace(/^(Flat|Room|Unit|Shop|Suite)\s+\S+,\s*/i, '')
    .replace(/^(\d+\/F|[Gg]\/F),\s*/i, '')
    .trim()
  if (stripped && stripped !== address) candidates.push(stripped)

  // Normalize "Hong Kong SAR, China" → "Hong Kong"
  const normalized = address
    .replace(/Hong\s*Kong\s*SAR\s*,?\s*China/gi, 'Hong Kong')
    .replace(/,\s*SAR/gi, '')
    .trim()
  if (normalized !== address) candidates.push(normalized)

  // Progressive trailing parts (from the normalized version if available)
  const base = normalized !== address ? normalized : address
  const parts = base.split(',').map((s) => s.trim()).filter(Boolean)
  for (let i = parts.length - 1; i >= 1; i--) {
    candidates.push(parts.slice(-i).join(', '))
  }

  // Append ", Hong Kong" if no candidate already references it
  if (!candidates.some((c) => c.toLowerCase().includes('hong kong'))) {
    for (const c of [...candidates]) {
      candidates.push(`${c}, Hong Kong`)
    }
  }

  return [...new Set(candidates)]
}

async function resolveAddress(address: string): Promise<[number, number] | null> {
  let lastApiError: unknown = null

  for (const query of simplifyAddress(address)) {
    try {
      const result = await geocoding.forward(query)
      lastApiError = null

      // Prefer the first relevant result that references Hong Kong
      const hkResult = result.features.find(
        (f) => (f.place_name.includes('Hong Kong') || f.place_name.includes('香港')) && f.relevance >= 0.5
      )
      if (hkResult) return hkResult.center as [number, number]
    } catch (err) {
      lastApiError = err
    }
  }

  if (lastApiError) throw lastApiError
  return null
}

export function MapDialog({ open, onClose, address, locationName, title }: MapDialogProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maptilersdk.Map | null>(null)
  const genRef = useRef(0)
  const [coords, setCoords] = useState<[number, number] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !address) return

    const gen = ++genRef.current

    resolveAddress(address)
      .then((result) => {
        if (gen !== genRef.current) return
        if (result) {
          setCoords(result)
        } else {
          setError("Couldn't find this location on the map. Try a simpler address (e.g. street name + district).")
        }
      })
      .catch(() => {
        if (gen !== genRef.current) return
        setError('Map service is currently unavailable. Please try again later.')
      })
  }, [open, address])

  useEffect(() => {
    if (!open || !coords || !mapContainer.current) return

    const map = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.STREETS,
      center: coords,
      zoom: 15,
      navigationControl: true,
    })

    map.addControl(new maptilersdk.NavigationControl(), 'top-right')

    new maptilersdk.Marker({ color: '#e11d48' })
      .setLngLat(coords)
      .addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [open, coords])

  const pending = open && address && !coords && !error

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-rose-500" />
            {title || locationName || address}
          </DialogTitle>
        </DialogHeader>
        <div className="relative h-[400px] w-full rounded-lg overflow-hidden">
          {pending && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                Loading map...
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/50 z-10 p-6 text-center">
              <MapPin className="h-8 w-8 text-destructive/60" />
              <p className="text-sm text-destructive max-w-sm">{error}</p>
            </div>
          )}
          <div ref={mapContainer} className="h-full w-full" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
