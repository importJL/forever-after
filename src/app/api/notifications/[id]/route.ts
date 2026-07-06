import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { NotificationSchema } from '@/lib/validation'
import { validateBody, errorResponse } from '@/lib/api-helpers'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { data, error } = validateBody(NotificationSchema.partial(), body)
    if (error) return error

    const notification = await db.notification.update({
      where: { id },
      data,
    })
    return NextResponse.json(notification)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to update notification')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.notification.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to delete notification')
  }
}
