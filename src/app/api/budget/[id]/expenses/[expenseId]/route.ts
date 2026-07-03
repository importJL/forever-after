import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  try {
    const { id, expenseId } = await params
    const body = await request.json()
    await db.budgetExpense.update({
      where: { id: expenseId },
      data: body,
    })
    // Recalculate spent total
    const expenses = await db.budgetExpense.findMany({ where: { categoryId: id } })
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
    await db.budgetCategory.update({
      where: { id },
      data: { spent: totalSpent },
    })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update expense'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  try {
    const { id, expenseId } = await params
    await db.budgetExpense.delete({ where: { id: expenseId } })
    // Recalculate spent total
    const expenses = await db.budgetExpense.findMany({ where: { categoryId: id } })
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
    await db.budgetCategory.update({
      where: { id },
      data: { spent: totalSpent },
    })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete expense'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}