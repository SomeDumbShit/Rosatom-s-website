import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import VkProvider from 'next-auth/providers/vk'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

interface VkProfile {
  id?: number
  user_id?: number
  first_name?: string
  last_name?: string
  screen_name?: string
  email?: string
  photo_200?: string
  photo_100?: string
}

const providers: any[] = [
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
      vkToken: { label: 'VK Token', type: 'text' },
      vkUserId: { label: 'VK User ID', type: 'text' }
    },
    async authorize(credentials) {
      // VK authentication flow
      if (credentials?.vkToken && credentials?.vkUserId) {
        try {
          // VK ID SDK tokens (vk2.a.*) don't work with old VK API
          // Create user directly with VK ID without additional API calls
          const email = `vk${credentials.vkUserId}@vk.placeholder.com`
          const name = `VK User ${credentials.vkUserId}`
          const image = null

          // Find or create user in our database
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { email },
                { vkId: credentials.vkUserId }
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
                vkId: credentials.vkUserId,
                role: 'VOLUNTEER',
                password: '',
                emailVerified: new Date(),
              },
              include: {
                ngo: true
              }
            })
          } else if (!user.vkId) {
            // Link VK ID to existing user
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                vkId: credentials.vkUserId,
              },
              include: {
                ngo: true
              }
            })
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          }
        } catch (error) {
          console.error('VK auth error:', error)
          throw new Error('VK authentication failed')
        }
      }

      // Regular email/password authentication
      if (!credentials?.email || !credentials?.password) {
        throw new Error('Необходимо указать email и пароль')
      }

      const user = await prisma.user.findUnique({
        where: {
          email: credentials.email
        },
        include: {
          ngo: true
        }
      })

      if (!user || !user.password) {
        throw new Error('Неверный email или пароль')
      }

      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.password
      )

      if (!isPasswordValid) {
        throw new Error('Неверный email или пароль')
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      }
    }
  })
]

// Add VK OAuth provider only if credentials are configured
if (process.env.VK_CLIENT_ID && process.env.VK_CLIENT_SECRET) {
  providers.push(
    VkProvider({
      clientId: process.env.VK_CLIENT_ID,
      clientSecret: process.env.VK_CLIENT_SECRET,
      profile(profile: VkProfile) {
        return {
          id: profile.user_id?.toString() || profile.id?.toString() || '',
          name: profile.first_name && profile.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : profile.screen_name || 'VK User',
          email: profile.email || `vk${profile.user_id || profile.id}@vk.com`,
          image: profile.photo_200 || profile.photo_100 || '',
        }
      },
    })
  )
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // On sign in, add user data to token
      if (user) {
        // Fetch the user from database to get the role
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id }
        })
        token.role = dbUser?.role || 'VOLUNTEER'
        token.id = user.id
        token.name = user.name || dbUser?.name
        token.email = user.email || dbUser?.email
      }

      // Handle session updates (when update() is called from client)
      if (trigger === 'update') {
        // Fetch latest data from database
        if (token.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string }
          })
          if (dbUser) {
            token.name = dbUser.name
            token.email = dbUser.email
            token.role = dbUser.role
          }
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
      }
      return session
    }
  },
  events: {
    async createUser({ user }) {
      // Set default role for OAuth users
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'VOLUNTEER' }
        })
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}
