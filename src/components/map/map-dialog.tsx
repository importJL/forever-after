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

export function MapDialog({ open, onClose, address, locationName, title }: MapDialogProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maptilersdk.Map | null>(null)
  const [coords, setCoords] = useState<[number, number] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !address) return

    setLoading(true)
    setError('')

    geocoding.forward(address, { language: ['en'] })
      .then((result) => {
        if (result.features.length > 0) {
          const [lng, lat] = result.features[0].center as [number, number]
          setCoords([lng, lat])
        } else {
          setError('Location not found')
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('MapTiler geocoding error:', err)
        setError('Failed to geocode address')
        setLoading(false)
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
    setLoading(false)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [open, coords])

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
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                Loading map...
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          <div ref={mapContainer} className="h-full w-full" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
