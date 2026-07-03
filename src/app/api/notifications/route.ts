import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const notifications = await db.notification.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(notifications)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notifications'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const notification = await db.notification.create({ data: body })
    return NextResponse.json(notification)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create notification'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}