import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const guests = await db.guest.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(guests)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch guests'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const guest = await db.guest.create({ data: body })
    return NextResponse.json(guest)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create guest'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}