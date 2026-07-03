import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const tasks = await db.task.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(tasks)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tasks'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const task = await db.task.create({ data: body })
    return NextResponse.json(task)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create task'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}