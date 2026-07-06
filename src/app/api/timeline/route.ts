import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TimelineEventSchema } from '@/lib/validation'
import { validateBody, errorResponse } from '@/lib/api-helpers'

export async function GET() {
  try {
    const events = await db.timelineEvent.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json(events)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to fetch timeline events')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, error } = validateBody(TimelineEventSchema, body)
    if (error) return error

    const event = await db.timelineEvent.create({
      data: { ...data!, id: undefined },
    })
    return NextResponse.json(event)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to create timeline event')
  }
}
