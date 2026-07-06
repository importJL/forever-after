import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { NotificationSchema } from '@/lib/validation'
import { validateBody, errorResponse } from '@/lib/api-helpers'

export async function GET() {
  try {
    const notifications = await db.notification.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(notifications)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to fetch notifications')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, error } = validateBody(NotificationSchema, body)
    if (error) return error

    const notification = await db.notification.create({
      data: { ...data!, id: undefined },
    })
    return NextResponse.json(notification)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to create notification')
  }
}
