const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkVideoUrls() {
  console.log('Checking video URLs in database...\n')

  // Check articles with videoUrl
  const articles = await prisma.article.findMany({
    where: {
      videoUrl: {
        not: null
      }
    },
    select: {
      id: true,
      title: true,
      videoUrl: true
    }
  })

  console.log(`Found ${articles.length} articles with video URLs:\n`)
  articles.forEach((article, index) => {
    console.log(`${index + 1}. ${article.title}`)
    console.log(`   ID: ${article.id}`)
    console.log(`   URL: ${article.videoUrl}`)
    console.log(`   Type: ${detectVideoType(article.videoUrl)}`)
    console.log('')
  })

  await prisma.$disconnect()
}

function detectVideoType(url) {
  if (!url) return 'none'
  const lower = url.toLowerCase()

  if (/rutube\.ru/i.test(lower)) return 'Rutube'
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube'
  if (/vkvideo\.ru/i.test(lower) || /vk\.com\/video/i.test(lower)) return 'VK Video'
  return 'Unknown'
}

checkVideoUrls().catch(console.error)
