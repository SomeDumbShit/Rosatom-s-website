import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { verifyCode } from '@/lib/verification'

const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['VOLUNTEER', 'NGO']),
  city: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = verifyEmailSchema.parse(body)

    // Verify code
    const verification = await verifyCode(validatedData.email, validatedData.code, 'email')

    if (!verification.success) {
      return NextResponse.json(
        { error: verification.error },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      )
    }

    // Create user
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        role: validatedData.role,
        city: validatedData.city,
        emailVerified: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Ошибка верификации' },
      { status: 500 }
    )
  }
}
