import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const categories = await db.budgetCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { expenses: true },
    })
    return NextResponse.json(categories)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch budget categories'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const category = await db.budgetCategory.create({ data: body })
    return NextResponse.json(category)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create budget category'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}