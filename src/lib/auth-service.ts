import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export interface User {
  id: string
  email: string
  name: string | null
  password: string | null
  emailVerified: Date | null
  image: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserInput {
  email: string
  name: string
  password: string
}

const SALT_ROUNDS = 12

export async function createUser(input: CreateUserInput): Promise<User> {
  const existing = await db.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw new Error('A user with this email already exists')
  }

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS)

  return db.user.create({
    data: {
      email: input.email,
      name: input.name,
      password: hashedPassword,
    },
  })
}

export async function verifyPassword(email: string, password: string): Promise<User | null> {
  const user = await db.user.findUnique({ where: { email } })
  if (!user || !user.password) return null

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return null

  return user
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return db.user.findUnique({ where: { email } })
}

export async function getUserById(id: string): Promise<User | null> {
  return db.user.findUnique({ where: { id } })
}

export function sanitizeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    emailVerified: user.emailVerified,
  }
}
