import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { WebLinkSchema } from '@/lib/validation'
import { validateBody, errorResponse } from '@/lib/api-helpers'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { data, error } = validateBody(WebLinkSchema.partial(), body)
    if (error) return error

    const link = await db.webLink.update({
      where: { id },
      data,
    })
    return NextResponse.json(link)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to update web link')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.webLink.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to delete web link')
  }
}
