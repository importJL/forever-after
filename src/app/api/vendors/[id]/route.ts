import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { VendorSchema } from '@/lib/validation'
import { validateBody, errorResponse } from '@/lib/api-helpers'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { data, error } = validateBody(VendorSchema.partial(), body)
    if (error) return error

    const vendor = await db.vendor.update({
      where: { id },
      data,
    })
    return NextResponse.json(vendor)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to update vendor')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.vendor.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to delete vendor')
  }
}
