import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { VendorSchema } from '@/lib/validation'
import { validateBody, errorResponse } from '@/lib/api-helpers'

export async function GET() {
  try {
    const vendors = await db.vendor.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(vendors)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to fetch vendors')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, error } = validateBody(VendorSchema, body)
    if (error) return error

    const vendor = await db.vendor.create({
      data: { ...data!, id: undefined },
    })
    return NextResponse.json(vendor)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to create vendor')
  }
}
