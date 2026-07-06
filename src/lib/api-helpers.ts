import { NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod/v4'

export function validateBody<T>(schema: ZodSchema<T>, body: unknown): { data?: T; error?: NextResponse } {
  const result = schema.safeParse(body)
  if (!result.success) {
    const errors = (result as { error: ZodError }).error.issues.map(i => ({
      path: i.path.join('.'),
      message: i.message,
    }))
    return {
      error: NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      ),
    }
  }
  return { data: result.data }
}

export function errorResponse(error: unknown, defaultMessage: string) {
  const message = error instanceof Error ? error.message : defaultMessage
  return NextResponse.json({ error: message }, { status: 500 })
}
