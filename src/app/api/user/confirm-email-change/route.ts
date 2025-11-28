import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { verifyCode } from '@/lib/verification'

const confirmEmailChangeSchema = z.object({
  code: z.string().length(6, 'Код должен состоять из 6 цифр'),
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
    const validatedData = confirmEmailChangeSchema.parse(body)

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

    // Verify code
    const verification = await verifyCode(user.email, validatedData.code, 'email-change')

    if (!verification.success) {
      return NextResponse.json(
        { error: verification.error },
        { status: 400 }
      )
    }

    // Get new email from stored token
    const newEmailToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: `new-email:${user.email}`,
        expires: { gte: new Date() },
      },
    })

    if (!newEmailToken) {
      return NextResponse.json(
        { error: 'Сессия смены email истекла. Попробуйте снова.' },
        { status: 400 }
      )
    }

    const newEmail = newEmailToken.token

    // Update email
    await prisma.user.update({
      where: { id: session.user.id },
      data: { email: newEmail },
    })

    // Clean up tokens
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: `new-email:${user.email}`,
      },
    })

    return NextResponse.json({
      success: true,
      newEmail,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Confirm email change error:', error)
    return NextResponse.json(
      { error: 'Ошибка подтверждения смены email' },
      { status: 500 }
    )
  }
}
