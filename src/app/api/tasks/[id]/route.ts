import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TaskSchema } from '@/lib/validation'
import { validateBody, errorResponse } from '@/lib/api-helpers'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { data, error } = validateBody(TaskSchema.partial(), body)
    if (error) return error

    const task = await db.task.update({
      where: { id },
      data,
    })
    return NextResponse.json(task)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to update task')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.task.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to delete task')
  }
}
