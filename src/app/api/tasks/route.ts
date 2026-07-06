import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TaskSchema } from '@/lib/validation'
import { validateBody, errorResponse } from '@/lib/api-helpers'

export async function GET() {
  try {
    const tasks = await db.task.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json(tasks)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to fetch tasks')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, error } = validateBody(TaskSchema, body)
    if (error) return error

    const task = await db.task.create({
      data: { ...data!, id: undefined },
    })
    return NextResponse.json(task)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to create task')
  }
}
