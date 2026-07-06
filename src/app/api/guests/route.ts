import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { GuestSchema } from '@/lib/validation'
import { validateBody, errorResponse } from '@/lib/api-helpers'

export async function GET() {
  try {
    const guests = await db.guest.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(guests)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to fetch guests')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, error } = validateBody(GuestSchema, body)
    if (error) return error

    const guest = await db.guest.create({
      data: {
        ...data!,
        id: undefined,
      },
    })
    return NextResponse.json(guest)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to create guest')
  }
}
