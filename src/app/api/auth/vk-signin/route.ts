import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { signIn } from 'next-auth/react'

// VK API endpoint to get user info
const VK_API_URL = 'https://api.vk.com/method/users.get'
const VK_API_VERSION = '5.131'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { access_token, user_id } = body

    if (!access_token || !user_id) {
      return NextResponse.json(
        { error: 'Missing access_token or user_id' },
        { status: 400 }
      )
    }

    // Get user info from VK API
    const vkUserResponse = await fetch(
      `${VK_API_URL}?user_ids=${user_id}&fields=photo_200,email&access_token=${access_token}&v=${VK_API_VERSION}`
    )

    const vkUserData = await vkUserResponse.json()

    if (vkUserData.error) {
      console.error('VK API error:', vkUserData.error)
      return NextResponse.json(
        { error: 'Failed to get user info from VK' },
        { status: 400 }
      )
    }

    const vkUser = vkUserData.response[0]

    if (!vkUser) {
      return NextResponse.json(
        { error: 'User not found in VK response' },
        { status: 400 }
      )
    }

    // Create email from VK ID if not provided
    const email = vkUser.email || `vk${user_id}@vk.placeholder.com`
    const name = `${vkUser.first_name} ${vkUser.last_name}`.trim()
    const image = vkUser.photo_200 || null

    // Find or create user in our database
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { vkId: user_id.toString() }
        ]
      },
      include: {
        ngo: true
      }
    })

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name,
          image,
          vkId: user_id.toString(),
          role: 'VOLUNTEER', // Default role
          password: '', // No password for VK users
          emailVerified: new Date(), // VK users are considered verified
        },
        include: {
          ngo: true
        }
      })
    } else {
      // Update existing user with VK data
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          vkId: user_id.toString(),
          name: name || user.name,
          image: image || user.image,
        },
        include: {
          ngo: true
        }
      })
    }

    // Return user data
    // Note: NextAuth session will be created on the client side
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      }
    })

  } catch (error) {
    console.error('VK sign-in error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
