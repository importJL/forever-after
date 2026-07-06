import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { WebLinkSchema } from '@/lib/validation'
import { validateBody, errorResponse } from '@/lib/api-helpers'

export async function GET() {
  try {
    const links = await db.webLink.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(links)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to fetch web links')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, error } = validateBody(WebLinkSchema, body)
    if (error) return error

    const link = await db.webLink.create({
      data: { ...data!, id: undefined },
    })
    return NextResponse.json(link)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to create web link')
  }
}
