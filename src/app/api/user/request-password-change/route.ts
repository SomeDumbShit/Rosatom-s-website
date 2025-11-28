import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { createVerificationToken } from '@/lib/verification'
import { sendEmail, getPasswordChangeConfirmationEmail } from '@/lib/email'

const requestPasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Введите текущий пароль'),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = requestPasswordChangeSchema.parse(body)

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Check if user has password
    if (!user.password) {
      return NextResponse.json(
        { error: 'Вы вошли через VK. Используйте сброс пароля для установки нового.' },
        { status: 400 }
      )
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      validatedData.currentPassword,
      user.password
    )

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Неверный текущий пароль' },
        { status: 400 }
      )
    }

    // Generate verification code
    const code = await createVerificationToken(user.email, 'password-reset')

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: 'Подтверждение смены пароля - Волонтерский Портал Росатома',
      html: getPasswordChangeConfirmationEmail(code),
    })

    return NextResponse.json({
      success: true,
      message: 'Код подтверждения отправлен на email',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Ошибка запроса смены пароля' },
      { status: 500 }
    )
  }
}
