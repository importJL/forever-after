import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const wedding = await db.wedding.findFirst()
    return NextResponse.json(wedding ?? {})
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch wedding'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      coupleName,
      partner1,
      partner2,
      date,
      venue,
      venueAddress,
      theme,
      guestCount,
      budgetTotal,
      notes,
    } = body

    const existing = await db.wedding.findFirst()

    if (existing) {
      const wedding = await db.wedding.update({
        where: { id: existing.id },
        data: {
          ...(coupleName !== undefined && { coupleName }),
          ...(partner1 !== undefined && { partner1 }),
          ...(partner2 !== undefined && { partner2 }),
          ...(date !== undefined && { date }),
          ...(venue !== undefined && { venue }),
          ...(venueAddress !== undefined && { venueAddress }),
          ...(theme !== undefined && { theme }),
          ...(guestCount !== undefined && { guestCount }),
          ...(budgetTotal !== undefined && { budgetTotal }),
          ...(notes !== undefined && { notes }),
        },
      })
      return NextResponse.json(wedding)
    } else {
      const wedding = await db.wedding.create({
        data: {
          coupleName: coupleName ?? 'Our Wedding',
          partner1: partner1 ?? '',
          partner2: partner2 ?? '',
          date: date ?? '',
          venue: venue ?? '',
          venueAddress: venueAddress ?? '',
          theme: theme ?? 'Classic Elegance',
          guestCount: guestCount ?? 0,
          budgetTotal: budgetTotal ?? 0,
          notes: notes ?? '',
        },
      })
      return NextResponse.json(wedding)
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to upsert wedding'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}