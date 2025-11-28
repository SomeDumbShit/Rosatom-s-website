import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Read JSON data files
const knowledgeBaseData = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'scripts', 'knowledge-base-data.json'), 'utf-8')
)

const ngoData = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'scripts', 'ngo-data.json'), 'utf-8')
)

async function main() {
  console.log('🌱 Starting seed from Excel data...')

  // 1. Create all 32 Rosatom cities
  console.log('📍 Creating cities...')
  const cities = [
    { name: 'Ангарск', region: 'Иркутская область', lat: 52.5444, lng: 103.8889 },
    { name: 'Байкальск', region: 'Иркутская область', lat: 51.5167, lng: 104.1333 },
    { name: 'Балаково', region: 'Саратовская область', lat: 52.0281, lng: 47.7944 },
    { name: 'Билибино', region: 'Чукотский АО', lat: 68.0544, lng: 166.4378 },
    { name: 'Волгодонск', region: 'Ростовская область', lat: 47.5136, lng: 42.1531 },
    { name: 'Глазов', region: 'Удмуртская Республика', lat: 58.1394, lng: 52.6581 },
    { name: 'Десногорск', region: 'Смоленская область', lat: 54.1500, lng: 33.2833 },
    { name: 'Димитровград', region: 'Ульяновская область', lat: 54.2139, lng: 49.6181 },
    { name: 'Железногорск', region: 'Красноярский край', lat: 56.2508, lng: 93.5328 },
    { name: 'Заречный', region: 'Пензенская область', lat: 53.2022, lng: 45.1617 },
    { name: 'Заречный', region: 'Свердловская область', lat: 56.8089, lng: 61.3225 },
    { name: 'Зеленогорск', region: 'Красноярский край', lat: 56.1128, lng: 94.5883 },
    { name: 'Краснокаменск', region: 'Забайкальский край', lat: 50.0981, lng: 118.0361 },
    { name: 'Курчатов', region: 'Курская область', lat: 51.6606, lng: 35.6539 },
    { name: 'Лесной', region: 'Свердловская область', lat: 58.6356, lng: 59.7847 },
    { name: 'Неман', region: 'Калининградская область', lat: 55.0311, lng: 22.0331 },
    { name: 'Нижний Новгород', region: 'Нижегородская область', lat: 56.3269, lng: 44.0059 },
    { name: 'Нововоронеж', region: 'Воронежская область', lat: 51.3089, lng: 39.2186 },
    { name: 'Новоуральск', region: 'Свердловская область', lat: 57.2444, lng: 60.0833 },
    { name: 'Обнинск', region: 'Калужская область', lat: 55.0944, lng: 36.6106 },
    { name: 'Озерск', region: 'Челябинская область', lat: 55.7569, lng: 60.7028 },
    { name: 'Омск', region: 'Омская область', lat: 54.9885, lng: 73.3242 },
    { name: 'Певек', region: 'Чукотский АО', lat: 69.7011, lng: 170.3103 },
    { name: 'Полярные Зори', region: 'Мурманская область', lat: 67.3656, lng: 32.4981 },
    { name: 'Саров', region: 'Нижегородская область', lat: 54.9356, lng: 43.3406 },
    { name: 'Северск', region: 'Томская область', lat: 56.6000, lng: 84.8833 },
    { name: 'Снежинск', region: 'Челябинская область', lat: 56.0850, lng: 60.7303 },
    { name: 'Советск', region: 'Калининградская область', lat: 55.0833, lng: 21.8833 },
    { name: 'Сосновый Бор', region: 'Ленинградская область', lat: 59.9000, lng: 29.0833 },
    { name: 'Трехгорный', region: 'Челябинская область', lat: 54.8167, lng: 58.4500 },
    { name: 'Удомля', region: 'Тверская область', lat: 57.8792, lng: 35.0089 },
    { name: 'Усолье-Сибирское', region: 'Иркутская область', lat: 52.7519, lng: 103.6450 },
    { name: 'Электросталь', region: 'Московская область', lat: 55.7894, lng: 38.4464 },
    { name: 'Энергодар', region: 'Запорожская область', lat: 47.4983, lng: 34.6561 },
  ]

  for (const city of cities) {
    await prisma.city.upsert({
      where: { name_region: { name: city.name, region: city.region } },
      update: {},
      create: {
        name: city.name,
        region: city.region,
        latitude: city.lat,
        longitude: city.lng,
      },
    })
  }
  console.log(`✅ Created ${cities.length} cities`)

  // 2. Create categories
  console.log('📂 Creating categories...')
  const categories = [
    'Экология',
    'Помощь детям',
    'Помощь пожилым',
    'Помощь животным',
    'Помощь людям с инвалидностью',
    'Образование',
    'Культура',
    'Спорт',
    'Благоустройство',
    'Социальная помощь',
    'Развитие территорий',
  ]

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, slug: name.toLowerCase().replace(/\s+/g, '-') },
    })
  }
  console.log(`✅ Created ${categories.length} categories`)

  // 3. Create admin user
  console.log('👤 Creating admin user...')
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rosatom-volunteers.ru' },
    update: {},
    create: {
      email: 'admin@rosatom-volunteers.ru',
      name: 'Администратор',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log('✅ Created admin user')

  // 4. Create ALL NGOs from Excel data (all cities/sheets)
  console.log('🏢 Creating NGOs from Excel (all cities)...')

  // Filter out header rows
  const realNGOData = ngoData.filter((item: any) => {
    const name = item.__EMPTY_1 || item['Название организации']
    return name && name !== 'Название организации'
  })

  console.log(`Found ${realNGOData.length} NGOs to create`)

  // Category mapping from Excel to our categories
  const categoryMapping: Record<string, string[]> = {
    'Экология': ['Экология'],
    'Социальная защита': ['Социальная помощь'],
    'Местное сообщество': ['Развитие территорий'],
    'Образование': ['Образование'],
    'Культура': ['Культура'],
    'Спорт': ['Спорт'],
    'Помощь детям': ['Помощь детям'],
    'Помощь пожилым': ['Помощь пожилым'],
  }

  // City name normalization
  const cityNameMap: Record<string, string> = {
    'Ангарск': 'Ангарск',
    'Волгодонск': 'Волгодонск',
    'Глазов, УР': 'Глазов',
    'Железногорск, Краснояр. край': 'Железногорск',
    'Зеленогорск, Краснояр. край': 'Зеленогорск',
    'Нижний Новгород': 'Нижний Новгород',
    'Обнинск, Калуж. обл.': 'Обнинск',
    'Омск': 'Омск',
    'Северск, Том. обл.': 'Северск',
    'Снежинск': 'Снежинск',
    'Усолье-Сибирское': 'Усолье-Сибирское',
    'Озёрск, Челяб. обл.': 'Озерск',
  }

  let ngosCreated = 0
  const ngoPassword = await bcrypt.hash('password123', 10)

  for (let i = 0; i < realNGOData.length; i++) {
    const ngoItem = realNGOData[i]

    try {
      // Extract data
      const ngoName = (ngoItem.__EMPTY_1 || ngoItem['Название организации'] || '').trim()
      const ngoDescription = ngoItem.__EMPTY_2 || ngoItem['Про организацию'] || ''
      const ngoWebsite = ngoItem.__EMPTY_3 || ngoItem['Ссылка на социальные сети'] || ''
      const ngoActivity = ngoItem.__EMPTY || ngoItem['Деятельность НКО'] || ''
      const sheetName = ngoItem._sheetName || 'Ангарск'

      if (!ngoName || ngoName.length < 3) continue

      // Normalize city name
      const cityName = cityNameMap[sheetName] || sheetName

      // Find city in database
      const city = await prisma.city.findFirst({
        where: {
          OR: [
            { name: cityName },
            { name: { contains: cityName.split(',')[0] } }
          ]
        },
      })

      if (!city) {
        console.log(`⚠️  City not found for ${cityName}, skipping ${ngoName}`)
        continue
      }

      // Determine categories
      let ngoCategories = ['Социальная помощь'] // default
      for (const [key, value] of Object.entries(categoryMapping)) {
        if (ngoActivity.toLowerCase().includes(key.toLowerCase())) {
          ngoCategories = value
          break
        }
      }

      // Create unique email
      const email = `ngo${i}@example.com`

      // Create user for NGO
      const ngoUser = await prisma.user.create({
        data: {
          email,
          name: ngoName.substring(0, 100),
          password: ngoPassword,
          role: 'NGO',
        },
      })

      // Generate unique INN
      const inn = `${3800 + i}${String(i).padStart(6, '0')}`

      // Determine if link is social media or website
      const linkUrl = ngoWebsite.trim()
      let websiteUrl = ''
      let vkUrl = ''
      let telegramUrl = ''

      if (linkUrl) {
        if (linkUrl.includes('vk.com') || linkUrl.includes('vkontakte.ru')) {
          vkUrl = linkUrl
        } else if (linkUrl.includes('t.me') || linkUrl.includes('telegram')) {
          telegramUrl = linkUrl
        } else {
          websiteUrl = linkUrl
        }
      }

      // Create NGO
      const ngo = await prisma.nGO.create({
        data: {
          userId: ngoUser.id,
          legalName: ngoName.substring(0, 200),
          brandName: ngoName.substring(0, 200).replace(/^(ОО|АНО|МБУ|КРОМО)\s+/i, ''),
          inn,
          description: ngoDescription.substring(0, 2000),
          city: city.name,
          address: city.name,
          latitude: city.latitude,
          longitude: city.longitude,
          phone: '+7 (999) 000-00-00',
          email,
          website: websiteUrl,
          vkLink: vkUrl,
          telegramLink: telegramUrl,
          categories: JSON.stringify(ngoCategories),
          organizationType: 'PUBLIC_ORGANIZATION',
          status: 'APPROVED',
        },
      })

      ngosCreated++
      console.log(`  ✅ Created NGO #${ngosCreated}: ${ngo.brandName} (${city.name})`)
    } catch (error: any) {
      console.log(`  ⚠️  Error creating NGO: ${error.message}`)
    }
  }

  console.log(`✅ Created ${ngosCreated} NGOs from Excel`)

  // Create sample events
  console.log('📅 Creating sample events...')
  const sampleNGOs = await prisma.nGO.findMany({ take: 5 })

  if (sampleNGOs.length > 0) {
    for (let i = 0; i < sampleNGOs.length; i++) {
      const ngo = sampleNGOs[i]
      // Create events on different dates
      const daysOffset = i * 3 + 2 // Events every 3 days starting from 2 days from now
      const eventDate = new Date()
      eventDate.setDate(eventDate.getDate() + daysOffset)
      eventDate.setHours(10 + (i % 8), 0, 0, 0) // Different start times

      const endDate = new Date(eventDate)
      endDate.setHours(eventDate.getHours() + 4) // 4 hour duration

      await prisma.event.create({
        data: {
          title: `Волонтерская акция от ${ngo.brandName}`,
          description: 'Присоединяйтесь к нашей волонтерской акции! Вместе мы сможем сделать больше добрых дел.',
          startDate: eventDate,
          endDate: endDate,
          address: ngo.address,
          city: ngo.city,
          volunteersNeeded: 3 + (i % 5), // Different number of volunteers needed
          helpType: JSON.stringify(['Социальная помощь']),
          latitude: ngo.latitude,
          longitude: ngo.longitude,
          ngoId: ngo.id,
        },
      })
    }
    console.log(`✅ Created ${sampleNGOs.length} sample events`)
  }

  // 5. Create volunteer user
  console.log('👤 Creating volunteer user...')
  const volunteerPassword = await bcrypt.hash('volunteer123', 10)
  await prisma.user.upsert({
    where: { email: 'volunteer1@example.com' },
    update: {},
    create: {
      email: 'volunteer1@example.com',
      name: 'Иван Волонтёров',
      password: volunteerPassword,
      role: 'VOLUNTEER',
    },
  })
  console.log('✅ Created volunteer user')

  // 6. Create ALL knowledge base articles from Excel (125 items)
  console.log('📚 Creating knowledge base articles from Excel...')

  let articlesCreated = 0
  let articlesSkipped = 0

  for (let i = 0; i < knowledgeBaseData.length; i++) {
    const item = knowledgeBaseData[i]

    // Skip header row
    if (item['Название курса'] === 'Название курса') continue

    // Extract data from Excel columns
    const titleRaw = item['Название курса'] || item['Тема'] || 'Без названия'
    const themeRaw = item['Тема'] || ''
    const speaker = item['Спикер'] || ''
    const videoUrl = item['Ссылка на видео'] || ''
    const hashtagsRaw = item['Хэштеги:\n(чтобы сделать поиск по хештегу - копируй хэштег, нажимай ctrl+F или ""поиск по странице"" и вставляй скопированный тег)'] || ''

    // Skip if no video URL
    if (!videoUrl || videoUrl.trim() === '') {
      articlesSkipped++
      console.log(`⚠️  No video URL for: ${titleRaw.substring(0, 50)}...`)
      continue
    }

    // Extract ALL hashtags from title, theme, and hashtags column
    const allText = `${titleRaw}\n${themeRaw}\n${hashtagsRaw}`
    const hashtagMatches = allText.match(/#[а-яёА-ЯЁa-zA-Z0-9_]+/g) || []
    const hashtags = [...new Set(hashtagMatches)].sort() // Remove duplicates

    // Remove hashtags from title and theme to clean content
    const title = titleRaw.replace(/#[а-яёА-ЯЁa-zA-Z0-9_]+/g, '').replace(/\s+/g, ' ').trim()
    const theme = themeRaw.replace(/#[а-яёА-ЯЁa-zA-Z0-9_]+/g, '').replace(/\s+/g, ' ').trim()

    // Extract category from theme or hashtags
    let category = 'ngo' // default
    const themeAndHashtags = (theme + '\n' + hashtagsRaw).toLowerCase()

    if (themeAndHashtags.includes('волонтер')) {
      category = 'volunteers'
    }

    // Create slug from title - make it unique with index
    const baseSlug = title
      .toLowerCase()
      .replace(/[«»]/g, '')
      .replace(/[^\u0400-\u04FFa-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 80)

    const slug = `${baseSlug}-${i}`

    // Create article
    try {
      await prisma.article.create({
        data: {
          title: title.substring(0, 200),
          slug,
          excerpt: theme.substring(0, 200),
          content: `<p>${theme.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`,
          category,
          published: true,
          videoUrl,
          tags: JSON.stringify(hashtags),
          speaker: speaker || null,
        },
      })
      articlesCreated++
    } catch (error: any) {
      articlesSkipped++
      console.log(`⚠️  Error creating article: ${title.substring(0, 50)}... - ${error.message}`)
    }
  }

  console.log(`✅ Created ${articlesCreated} knowledge base articles from Excel`)
  console.log(`⚠️  Skipped ${articlesSkipped} articles (no video URL or duplicates)`)

  console.log('🎉 Seed from Excel completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
