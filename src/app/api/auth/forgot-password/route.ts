import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createVerificationToken } from '@/lib/verification'
import { sendEmail, getVerificationCodeEmail } from '@/lib/email'

const forgotPasswordSchema = z.object({
  email: z.string().email('Неверный формат email'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = forgotPasswordSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    // Always return success even if user doesn't exist (security best practice)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Если аккаунт существует, код будет отправлен на email',
      })
    }

    // Generate verification code
    const code = await createVerificationToken(validatedData.email, 'password-reset')

    // Send email
    await sendEmail({
      to: validatedData.email,
      subject: 'Сброс пароля - Волонтерский Портал Росатома',
      html: getVerificationCodeEmail(code, 'password-reset'),
    })

    return NextResponse.json({
      success: true,
      message: 'Код отправлен на email',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Ошибка отправки кода' },
      { status: 500 }
    )
  }
}
