import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { verifyCode } from '@/lib/verification'

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = resetPasswordSchema.parse(body)

    // Verify code
    const verification = await verifyCode(validatedData.email, validatedData.code, 'password-reset')

    if (!verification.success) {
      return NextResponse.json(
        { error: verification.error },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Ошибка сброса пароля' },
      { status: 500 }
    )
  }
}
