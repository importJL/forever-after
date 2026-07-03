import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const media = await db.mediaItem.findMany()
    return NextResponse.json(media)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch media items'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const media = await db.mediaItem.create({ data: body })
    return NextResponse.json(media)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create media item'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}