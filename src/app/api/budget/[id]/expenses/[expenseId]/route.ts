import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { BudgetExpenseSchema } from '@/lib/validation'
import { validateBody, errorResponse } from '@/lib/api-helpers'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  try {
    const { id, expenseId } = await params
    const body = await request.json()
    const { data, error } = validateBody(BudgetExpenseSchema.partial(), body)
    if (error) return error

    await db.budgetExpense.update({
      where: { id: expenseId },
      data,
    })
    const expenses = await db.budgetExpense.findMany({ where: { categoryId: id } })
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
    await db.budgetCategory.update({
      where: { id },
      data: { spent: totalSpent },
    })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to update expense')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  try {
    const { id, expenseId } = await params
    await db.budgetExpense.delete({ where: { id: expenseId } })
    const expenses = await db.budgetExpense.findMany({ where: { categoryId: id } })
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
    await db.budgetCategory.update({
      where: { id },
      data: { spent: totalSpent },
    })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to delete expense')
  }
}
