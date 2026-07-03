import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const notification = await db.notification.update({
      where: { id },
      data: body,
    })
    return NextResponse.json(notification)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update notification'
    return NextResponse.json({ error: message }, { status: 500 })
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
    const message = error instanceof Error ? error.message : 'Failed to delete notification'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}