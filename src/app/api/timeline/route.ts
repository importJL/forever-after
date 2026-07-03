import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const events = await db.timelineEvent.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(events)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch timeline events'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const event = await db.timelineEvent.create({ data: body })
    return NextResponse.json(event)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create timeline event'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}