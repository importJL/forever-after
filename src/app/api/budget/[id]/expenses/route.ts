import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { BudgetExpenseSchema } from '@/lib/validation'
import { validateBody, errorResponse } from '@/lib/api-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { data, error } = validateBody(BudgetExpenseSchema, body)
    if (error) return error

    const expense = await db.budgetExpense.create({
      data: { ...data!, categoryId: id, id: undefined },
    })
    const expenses = await db.budgetExpense.findMany({ where: { categoryId: id } })
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
    await db.budgetCategory.update({
      where: { id },
      data: { spent: totalSpent },
    })
    return NextResponse.json(expense)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to create expense')
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const expenses = await db.budgetExpense.findMany({
      where: { categoryId: id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(expenses)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to fetch expenses')
  }
}
