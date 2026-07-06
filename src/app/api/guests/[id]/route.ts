import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { GuestSchema } from '@/lib/validation'
import { validateBody, errorResponse } from '@/lib/api-helpers'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { data, error } = validateBody(GuestSchema.partial(), body)
    if (error) return error

    const guest = await db.guest.update({
      where: { id },
      data,
    })
    return NextResponse.json(guest)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to update guest')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.guest.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to delete guest')
  }
}
