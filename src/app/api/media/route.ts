import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MediaItemSchema } from '@/lib/validation'
import { validateBody, errorResponse } from '@/lib/api-helpers'

export async function GET() {
  try {
    const media = await db.mediaItem.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(media)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to fetch media items')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, error } = validateBody(MediaItemSchema, body)
    if (error) return error

    const item = await db.mediaItem.create({
      data: { ...data!, id: undefined },
    })
    return NextResponse.json(item)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to create media item')
  }
}
