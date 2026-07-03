import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const vendors = await db.vendor.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(vendors)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch vendors'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const vendor = await db.vendor.create({ data: body })
    return NextResponse.json(vendor)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create vendor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}