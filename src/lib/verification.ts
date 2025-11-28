import { prisma } from './prisma'
import crypto from 'crypto'

// Generate 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Create verification token
export async function createVerificationToken(email: string, type: 'email' | 'password-reset' | 'email-change' = 'email') {
  const code = generateVerificationCode()
  const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  // Delete any existing tokens for this email and type
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: `${type}:${email}`,
    },
  })

  // Create new token
  await prisma.verificationToken.create({
    data: {
      identifier: `${type}:${email}`,
      token: code,
      expires,
    },
  })

  return code
}

// Verify code
export async function verifyCode(email: string, code: string, type: 'email' | 'password-reset' | 'email-change' = 'email') {
  const token = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: `${type}:${email}`,
        token: code,
      },
    },
  })

  if (!token) {
    return { success: false, error: 'Неверный код' }
  }

  if (token.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: `${type}:${email}`,
          token: code,
        },
      },
    })
    return { success: false, error: 'Код истек. Запросите новый код.' }
  }

  // Delete used token
  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: `${type}:${email}`,
        token: code,
      },
    },
  })

  return { success: true }
}
