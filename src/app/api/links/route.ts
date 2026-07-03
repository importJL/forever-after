import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const links = await db.webLink.findMany()
    return NextResponse.json(links)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch web links'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const link = await db.webLink.create({ data: body })
    return NextResponse.json(link)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create web link'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}