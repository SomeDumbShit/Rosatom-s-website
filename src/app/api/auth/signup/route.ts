import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { createVerificationToken } from '@/lib/verification'
import { sendEmail, getVerificationCodeEmail } from '@/lib/email'

const signupSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
  name: z.string().min(2, 'Имя должно быть не менее 2 символов'),
  role: z.enum(['VOLUNTEER', 'NGO']).default('VOLUNTEER'),
  city: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = signupSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      )
    }

    // Generate verification code
    const code = await createVerificationToken(validatedData.email, 'email')

    // Send verification email
    await sendEmail({
      to: validatedData.email,
      subject: 'Подтверждение регистрации - Волонтерский Портал Росатома',
      html: getVerificationCodeEmail(code, 'registration'),
    })

    // Store user data temporarily (will be created after verification)
    // For now, return success and let client handle verification
    return NextResponse.json({
      success: true,
      message: 'Код подтверждения отправлен на email',
      email: validatedData.email,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Ошибка при регистрации' },
      { status: 500 }
    )
  }
}
