import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const media = await db.mediaItem.update({
      where: { id },
      data: body,
    })
    return NextResponse.json(media)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update media item'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.mediaItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete media item'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}