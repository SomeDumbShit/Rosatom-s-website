import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createVerificationToken } from '@/lib/verification'
import { sendEmail } from '@/lib/email'

const requestEmailChangeSchema = z.object({
  newEmail: z.string().email('Неверный формат email'),
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
    const validatedData = requestEmailChangeSchema.parse(body)

    // Check if new email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.newEmail },
    })

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { error: 'Email уже используется другим пользователем' },
        { status: 400 }
      )
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Generate verification code and send to CURRENT email
    const code = await createVerificationToken(user.email, 'email-change')

    await sendEmail({
      to: user.email,
      subject: 'Подтверждение смены email - Волонтерский Портал Росатома',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0066CC;">Подтверждение смены email</h2>
          <p>Здравствуйте!</p>
          <p>Вы запросили смену email на: <strong>${validatedData.newEmail}</strong></p>
          <p>Введите код ниже для подтверждения:</p>
          <div style="background-color: #f3f4f6; padding: 30px; border-radius: 8px; margin: 30px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Ваш код подтверждения:</p>
            <div style="font-size: 36px; font-weight: bold; color: #0066CC; letter-spacing: 8px; font-family: monospace;">
              ${code}
            </div>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Код действителен в течение 15 минут.
          </p>
          <p style="color: #dc2626; font-size: 14px;">
            Если вы не запрашивали смену email, проигнорируйте это письмо.
          </p>
        </div>
      `,
    })

    // Store new email in verification token identifier for later
    await prisma.verificationToken.create({
      data: {
        identifier: `new-email:${user.email}`,
        token: validatedData.newEmail,
        expires: new Date(Date.now() + 15 * 60 * 1000),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Код подтверждения отправлен на ваш текущий email',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Request email change error:', error)
    return NextResponse.json(
      { error: 'Ошибка запроса смены email' },
      { status: 500 }
    )
  }
}
