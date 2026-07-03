import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const expense = await db.budgetExpense.create({
      data: { ...body, categoryId: id },
    })
    // Recalculate spent total
    const expenses = await db.budgetExpense.findMany({ where: { categoryId: id } })
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
    await db.budgetCategory.update({
      where: { id },
      data: { spent: totalSpent },
    })
    return NextResponse.json(expense)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create expense'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}