import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TimelineEventSchema } from '@/lib/validation'
import { validateBody, errorResponse } from '@/lib/api-helpers'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { data, error } = validateBody(TimelineEventSchema.partial(), body)
    if (error) return error

    const event = await db.timelineEvent.update({
      where: { id },
      data,
    })
    return NextResponse.json(event)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to update timeline event')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.timelineEvent.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to delete timeline event')
  }
}
