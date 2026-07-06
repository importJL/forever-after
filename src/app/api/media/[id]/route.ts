import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MediaItemSchema } from '@/lib/validation'
import { validateBody, errorResponse } from '@/lib/api-helpers'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { data, error } = validateBody(MediaItemSchema.partial(), body)
    if (error) return error

    const media = await db.mediaItem.update({
      where: { id },
      data,
    })
    return NextResponse.json(media)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to update media item')
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
    return errorResponse(error, 'Failed to delete media item')
  }
}
