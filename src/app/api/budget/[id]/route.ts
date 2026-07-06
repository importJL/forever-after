import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { BudgetCategorySchema } from '@/lib/validation'
import { validateBody, errorResponse } from '@/lib/api-helpers'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { data, error } = validateBody(BudgetCategorySchema.partial(), body)
    if (error) return error

    const category = await db.budgetCategory.update({
      where: { id },
      data,
    })
    return NextResponse.json(category)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to update budget category')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.budgetCategory.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to delete budget category')
  }
}
