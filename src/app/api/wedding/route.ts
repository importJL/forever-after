import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { WeddingSchema } from '@/lib/validation'
import { validateBody, errorResponse } from '@/lib/api-helpers'

export async function GET() {
  try {
    const wedding = await db.wedding.findFirst()
    return NextResponse.json(wedding ?? {})
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to fetch wedding')
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, error } = validateBody(WeddingSchema, body)
    if (error) return error

    const existing = await db.wedding.findFirst()

    if (existing) {
      const wedding = await db.wedding.update({
        where: { id: existing.id },
        data: data!,
      })
      return NextResponse.json(wedding)
    } else {
      const wedding = await db.wedding.create({
        data: data!,
      })
      return NextResponse.json(wedding)
    }
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to upsert wedding')
  }
}
