import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { BudgetCategorySchema } from '@/lib/validation'
import { validateBody, errorResponse } from '@/lib/api-helpers'

export async function GET() {
  try {
    const categories = await db.budgetCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { expenses: true },
    })
    return NextResponse.json(categories)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to fetch budget categories')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, error } = validateBody(BudgetCategorySchema, body)
    if (error) return error

    const category = await db.budgetCategory.create({
      data: {
        ...data!,
        id: undefined,
      },
    })
    return NextResponse.json(category)
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to create budget category')
  }
}
