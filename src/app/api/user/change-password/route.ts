import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { verifyCode } from '@/lib/verification'

const changePasswordSchema = z.object({
  code: z.string().length(6, 'Код должен состоять из 6 цифр'),
  newPassword: z.string().min(6, 'Новый пароль должен быть не менее 6 символов'),
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
    const validatedData = changePasswordSchema.parse(body)

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

    // Verify code
    const verification = await verifyCode(user.email, validatedData.code, 'password-reset')

    if (!verification.success) {
      return NextResponse.json(
        { error: verification.error },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    })

    // Send confirmation email
    const { sendEmail } = await import('@/lib/email')
    await sendEmail({
      to: user.email,
      subject: 'Пароль успешно изменен - Волонтерский Портал Росатома',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0066CC;">Пароль успешно изменен</h2>
          <p>Здравствуйте!</p>
          <p>Ваш пароль был успешно изменен.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #374151;">
              <strong>Дата и время:</strong> ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
            </p>
          </div>
          <p style="color: #dc2626; font-size: 14px;">
            ⚠️ Если вы не меняли пароль, немедленно свяжитесь с нами или воспользуйтесь функцией восстановления пароля.
          </p>
        </div>
      `,
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
      { error: 'Ошибка смены пароля' },
      { status: 500 }
    )
  }
}
