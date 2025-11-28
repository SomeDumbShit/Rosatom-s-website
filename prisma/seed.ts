import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Helper to generate slugs
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Helper to extract VK link
function extractVKLink(text: string): string | null {
  if (!text || text === '-') return null
  const match = text.match(/(https?:\/\/)?([a-z]+\.)?vk\.com\/[^\s]+/i)
  return match ? match[0] : null
}

// Helper to convert Rutube private link to embed
function convertRutubeToEmbed(url: string): string | null {
  if (!url) return null
  // Extract video ID from private URL: https://rutube.ru/video/private/VIDEO_ID/?p=TOKEN
  const match = url.match(/rutube\.ru\/video\/private\/([a-f0-9]+)/i)
  if (match && match[1]) {
    // Return embed URL
    return `https://rutube.ru/play/embed/${match[1]}`
  }
  return url
}

// Helper to generate random coordinates around a city
function getRandomCoordinates(lat: number, lng: number) {
  return {
    latitude: lat + (Math.random() - 0.5) * 0.05,
    longitude: lng + (Math.random() - 0.5) * 0.05,
  }
}

// Extended city coordinates mapping (including sheet names from Excel)
const CITY_COORDINATES: Record<string, { lat: number; lng: number; cityName: string }> = {
  'Ангарск': { lat: 52.5406, lng: 103.8886, cityName: 'Ангарск' },
  'Волгодонск': { lat: 47.5132, lng: 42.1530, cityName: 'Волгодонск' },
  'Глазов': { lat: 58.1394, lng: 52.6581, cityName: 'Глазов' },
  'Глазов, УР': { lat: 58.1394, lng: 52.6581, cityName: 'Глазов' },
  'Железногорск': { lat: 56.2511, lng: 93.5327, cityName: 'Железногорск' },
  'Железногорск, Краснояр. край': { lat: 56.2511, lng: 93.5327, cityName: 'Железногорск' },
  'Зеленогорск': { lat: 56.1128, lng: 94.5958, cityName: 'Зеленогорск' },
  'Зеленогорск, Краснояр. край': { lat: 56.1128, lng: 94.5958, cityName: 'Зеленогорск' },
  'Заречный, Пензенская обл.': { lat: 53.2000, lng: 45.1667, cityName: 'Заречный' },
  'Лесной': { lat: 58.6356, lng: 59.7847, cityName: 'Лесной' },
  'Нижний Новгород': { lat: 56.3269, lng: 44.0075, cityName: 'Нижний Новгород' },
  'Нововоронеж': { lat: 51.3064, lng: 39.2214, cityName: 'Нововоронеж' },
  'Новоуральск': { lat: 57.2439, lng: 60.0839, cityName: 'Новоуральск' },
  'Обнинск': { lat: 55.0956, lng: 36.6072, cityName: 'Обнинск' },
  'Обнинск, Калуж. обл.': { lat: 55.0956, lng: 36.6072, cityName: 'Обнинск' },
  'Омск': { lat: 54.9885, lng: 73.3242, cityName: 'Омск' },
  'Озерск': { lat: 55.7556, lng: 60.7028, cityName: 'Озерск' },
  'Озёрск': { lat: 55.7556, lng: 60.7028, cityName: 'Озерск' },
  'Озёрск, Челяб. обл.': { lat: 55.7556, lng: 60.7028, cityName: 'Озерск' },
  'Полярные Зори': { lat: 67.3667, lng: 32.5000, cityName: 'Полярные Зори' },
  'Саров': { lat: 54.9333, lng: 43.3167, cityName: 'Саров' },
  'Северск': { lat: 56.6000, lng: 84.8833, cityName: 'Северск' },
  'Северск, Том. обл.': { lat: 56.6000, lng: 84.8833, cityName: 'Северск' },
  'Снежинск': { lat: 56.0850, lng: 60.7350, cityName: 'Снежинск' },
  'Трёхгорный': { lat: 54.8167, lng: 58.4500, cityName: 'Трехгорный' },
  'Усолье-Сибирское': { lat: 52.7511, lng: 103.6450, cityName: 'Усолье-Сибирское' },
}

// Category mapping from Excel to our system
const CATEGORY_MAPPING: Record<string, string[]> = {
  'Помощь детям и семьям с детьми': ['children', 'social'],
  'Социальная защита (помощь людям в трудной ситуации)': ['social'],
  'Местное сообщество и развитие территорий': ['social', 'ecology'],
  'Экология и устойчивое развитие': ['ecology'],
  'Здоровье и спорт': ['health', 'sports'],
  'Образование и наука': ['education'],
  'Культура и искусство': ['culture'],
  'Культура и образование': ['culture', 'education'],
  'Помощь животным': ['animals'],
  'Защита животных': ['animals'],
  'Патриотическое воспитание': ['patriotic'],
  'Другое': ['social'],
}

async function main() {
  console.log('🌱 Starting seed with REAL data from Excel files...')

  // Clear existing data
  console.log('Clearing existing data...')
  await prisma.notification.deleteMany()
  await prisma.eventParticipation.deleteMany()
  await prisma.event.deleteMany()
  await prisma.project.deleteMany()
  await prisma.nGO.deleteMany()
  await prisma.article.deleteMany()
  await prisma.user.deleteMany()
  await prisma.city.deleteMany()
  await prisma.category.deleteMany()

  // Create all 32 Rosatom cities
  console.log('Creating all 32 Rosatom cities...')
  const cities = [
    { name: 'Саров', region: 'Нижегородская область', latitude: 54.9333, longitude: 43.3167 },
    { name: 'Снежинск', region: 'Челябинская область', latitude: 56.0850, longitude: 60.7350 },
    { name: 'Озерск', region: 'Челябинская область', latitude: 55.7556, longitude: 60.7028 },
    { name: 'Лесной', region: 'Свердловская область', latitude: 58.6356, longitude: 59.7847 },
    { name: 'Трехгорный', region: 'Челябинская область', latitude: 54.8167, longitude: 58.4500 },
    { name: 'Северск', region: 'Томская область', latitude: 56.6000, longitude: 84.8833 },
    { name: 'Железногорск', region: 'Красноярский край', latitude: 56.2511, longitude: 93.5327 },
    { name: 'Зеленогорск', region: 'Красноярский край', latitude: 56.1128, longitude: 94.5958 },
    { name: 'Новоуральск', region: 'Свердловская область', latitude: 57.2439, longitude: 60.0839 },
    { name: 'Заречный', region: 'Пензенская область', latitude: 53.2000, longitude: 45.1667 },
    { name: 'Заречный', region: 'Свердловская область', latitude: 56.8167, longitude: 61.3167 },
    { name: 'Нововоронеж', region: 'Воронежская область', latitude: 51.3064, longitude: 39.2214 },
    { name: 'Удомля', region: 'Тверская область', latitude: 57.8786, longitude: 35.0053 },
    { name: 'Балаково', region: 'Саратовская область', latitude: 52.0266, longitude: 47.7956 },
    { name: 'Курчатов', region: 'Курская область', latitude: 51.6605, longitude: 35.6569 },
    { name: 'Полярные Зори', region: 'Мурманская область', latitude: 67.3667, longitude: 32.5000 },
    { name: 'Сосновый Бор', region: 'Ленинградская область', latitude: 59.9000, longitude: 29.0833 },
    { name: 'Волгодонск', region: 'Ростовская область', latitude: 47.5132, longitude: 42.1530 },
    { name: 'Ангарск', region: 'Иркутская область', latitude: 52.5406, longitude: 103.8886 },
    { name: 'Байкальск', region: 'Иркутская область', latitude: 51.5167, longitude: 104.1500 },
    { name: 'Билибино', region: 'Чукотский АО', latitude: 68.0544, longitude: 166.4464 },
    { name: 'Глазов', region: 'Удмуртская Республика', latitude: 58.1394, longitude: 52.6581 },
    { name: 'Десногорск', region: 'Смоленская область', latitude: 54.1500, longitude: 33.2833 },
    { name: 'Димитровград', region: 'Ульяновская область', latitude: 54.2139, longitude: 49.6186 },
    { name: 'Краснокаменск', region: 'Забайкальский край', latitude: 50.0986, longitude: 118.0367 },
    { name: 'Неман', region: 'Калининградская область', latitude: 55.0333, longitude: 22.0333 },
    { name: 'Обнинск', region: 'Калужская область', latitude: 55.0956, longitude: 36.6072 },
    { name: 'Певек', region: 'Чукотский АО', latitude: 69.7011, longitude: 170.3133 },
    { name: 'Советск', region: 'Калининградская область', latitude: 55.0833, longitude: 21.8833 },
    { name: 'Усолье-Сибирское', region: 'Иркутская область', latitude: 52.7511, longitude: 103.6450 },
    { name: 'Электросталь', region: 'Московская область', latitude: 55.7897, longitude: 38.4461 },
    { name: 'Энергодар', region: 'Запорожская область', latitude: 47.4986, longitude: 34.6564 },
  ]

  for (const city of cities) {
    await prisma.city.create({ data: city })
  }

  // Create categories
  console.log('Creating categories...')
  const categories = [
    { name: 'Помощь детям', slug: 'children', icon: '👶' },
    { name: 'Помощь пожилым и ветеранам', slug: 'elderly', icon: '👴' },
    { name: 'Помощь животным', slug: 'animals', icon: '🐕' },
    { name: 'Экология и благоустройство', slug: 'ecology', icon: '🌱' },
    { name: 'Образование и наставничество', slug: 'education', icon: '📚' },
    { name: 'Здоровый образ жизни', slug: 'health', icon: '💪' },
    { name: 'Культура и искусство', slug: 'culture', icon: '🎭' },
    { name: 'Спорт', slug: 'sports', icon: '⚽' },
    { name: 'Социальная помощь', slug: 'social', icon: '🤝' },
    { name: 'Патриотическое воспитание', slug: 'patriotic', icon: '🇷🇺' },
  ]

  for (const category of categories) {
    await prisma.category.create({ data: category })
  }

  // Create admin user
  console.log('Creating admin user...')
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.create({
    data: {
      email: 'admin@rosatom-volunteers.ru',
      name: 'Администратор Портала',
      password: hashedPassword,
      role: 'ADMIN',
      city: 'Москва',
    },
  })

  // Load NGO data from COMPLETE JSON (all 24 NGOs from all sheets)
  console.log('Loading COMPLETE NGO data from JSON (all sheets)...')
  const ngoDataPath = path.join(process.cwd(), 'scripts', 'all-ngo-data-complete.json')
  const validNGOs = JSON.parse(fs.readFileSync(ngoDataPath, 'utf-8'))

  console.log(`Found ${validNGOs.length} valid NGOs to import from all sheets...`)

  // Create NGOs
  let ngoCount = 0
  const createdNGOs: any[] = []

  for (const ngoData of validNGOs) {
    try {
      const sheetName = ngoData._sheetName
      const orgName = ngoData['Название организации']?.trim()
      const description = (ngoData['Про организацию'] || 'Описание организации').substring(0, 2000)
      const socialLink = ngoData['Ссылка на социальные сети'] || ''
      const activityType = ngoData['Деятельность НКО'] || 'Социальная помощь'

      if (!orgName || orgName.length < 3) {
        console.log(`Skipping NGO with invalid name: ${orgName}`)
        continue
      }

      // Get city info from sheet name
      const cityInfo = CITY_COORDINATES[sheetName] || { lat: 55.7558, lng: 37.6173, cityName: sheetName.split(',')[0].trim() }
      const cityName = cityInfo.cityName
      const coords = getRandomCoordinates(cityInfo.lat, cityInfo.lng)

      // Get categories for this NGO
      const categorySlug = CATEGORY_MAPPING[activityType] || ['social']

      // Create NGO user with unique email
      const baseEmail = slugify(orgName).substring(0, 15)
      const email = `${baseEmail}-${ngoCount}@ngo.ru`
      const userPassword = await bcrypt.hash('password123', 10)

      console.log(`Creating NGO: ${orgName} in ${cityName}`)

      const user = await prisma.user.create({
        data: {
          email,
          name: orgName.substring(0, 100),
          password: userPassword,
          role: 'NGO',
          city: cityName,
        },
      })

      // Create NGO
      const ngo = await prisma.nGO.create({
        data: {
          userId: user.id,
          legalName: orgName.substring(0, 200),
          brandName: orgName.substring(0, 100),
          inn: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          description: description,
          mission: `Миссия: ${activityType}`,
          city: cityName,
          address: `ул. Центральная, ${Math.floor(Math.random() * 100) + 1}`,
          latitude: coords.latitude,
          longitude: coords.longitude,
          phone: `+7 (${Math.floor(100 + Math.random() * 900)}) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}-${Math.floor(10 + Math.random() * 90)}`,
          email,
          website: null,
          vkLink: extractVKLink(socialLink),
          categories: JSON.stringify(categorySlug),
          organizationType: 'Некоммерческая организация',
          status: 'APPROVED',
        },
      })

      createdNGOs.push({ ngo, cityName, categories: categorySlug })
      ngoCount++
    } catch (error) {
      console.error(`Error creating NGO: ${ngoData['Название организации']}`, error)
    }
  }

  console.log(`✅ Created ${ngoCount} NGOs from COMPLETE real data (all sheets)!`)

  // Create events for NGOs
  console.log('Creating events for NGOs...')
  const eventTemplates = [
    {
      titleTemplate: 'Помощь пожилым людям',
      description: 'Приглашаем волонтеров для помощи пожилым людям: доставка продуктов, лекарств, уборка, оплата коммунальных услуг.',
      helpType: ['social_help', 'physical_help'],
      volunteersNeeded: 10,
    },
    {
      titleTemplate: 'Экологический субботник',
      description: 'Субботник по уборке территории. Будем собирать мусор, высаживать деревья и благоустраивать город.',
      helpType: ['physical_help', 'ecology'],
      volunteersNeeded: 20,
    },
    {
      titleTemplate: 'Помощь в приюте для животных',
      description: 'Нужна помощь в уборке территории приюта, выгуле собак и уходе за животными.',
      helpType: ['physical_help', 'animal_care'],
      volunteersNeeded: 8,
    },
    {
      titleTemplate: 'Мастер-класс для детей',
      description: 'Организуем творческий мастер-класс для детей. Нужны волонтеры для помощи в проведении и организации.',
      helpType: ['event_help', 'creative'],
      volunteersNeeded: 5,
    },
    {
      titleTemplate: 'Спортивное мероприятие',
      description: 'Массовое спортивное мероприятие для всех возрастов. Нужна помощь с регистрацией и организацией.',
      helpType: ['event_help', 'logistics'],
      volunteersNeeded: 15,
    },
  ]

  let eventCount = 0
  for (let i = 0; i < createdNGOs.length; i++) {
    const { ngo, cityName, categories } = createdNGOs[i]

    // Create 2-3 events per NGO
    const numEvents = Math.floor(Math.random() * 2) + 2

    for (let j = 0; j < numEvents; j++) {
      const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)]
      const daysFromNow = Math.floor(Math.random() * 30) + 1
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + daysFromNow)
      startDate.setHours(10 + Math.floor(Math.random() * 8), 0, 0, 0)

      const endDate = new Date(startDate)
      endDate.setHours(endDate.getHours() + 3)

      await prisma.event.create({
        data: {
          ngoId: ngo.id,
          title: `${template.titleTemplate} - ${cityName}`,
          description: template.description,
          startDate,
          endDate,
          address: `${cityName}, ${ngo.address}`,
          city: cityName,
          latitude: ngo.latitude,
          longitude: ngo.longitude,
          volunteersNeeded: template.volunteersNeeded,
          volunteersCount: 0,
          helpType: JSON.stringify(template.helpType),
          status: 'PUBLISHED',
        },
      })

      eventCount++
    }
  }

  console.log(`✅ Created ${eventCount} events for NGOs!`)

  // Load knowledge base data from JSON
  console.log('Loading knowledge base data from JSON...')
  const kbDataPath = path.join(process.cwd(), 'scripts', 'knowledge-base-data.json')
  const kbDataRaw = JSON.parse(fs.readFileSync(kbDataPath, 'utf-8'))

  // Filter out empty entries
  const validArticles = kbDataRaw.filter((item: any) => item['Тема'] || item['Название курса'])

  console.log(`Found ${validArticles.length} valid articles to import...`)

  // Create articles from knowledge base
  let articleCount = 0
  for (const articleData of validArticles) {
    try {
      let title = articleData['Название курса'] || articleData['Тема'] || 'Без названия'
      let theme = articleData['Тема'] || ''
      const speaker = articleData['Спикер'] || ''
      const videoUrl = articleData['Ссылка на видео'] || ''
      const hashtagsRaw = articleData['Хэштеги:\n(чтобы сделать поиск по хештегу - копируй хэштег, нажимай ctrl+F или ""поиск по странице"" и вставляй скопированный тег)'] || ''

      if (!title || title.length < 3) continue

      // Extract all hashtags from title, theme, and hashtags field
      const allText = `${title} ${theme} ${hashtagsRaw}`
      const hashtagMatches = allText.match(/#[а-яА-ЯёЁa-zA-Z0-9_]+/g) || []
      const uniqueHashtags = [...new Set(hashtagMatches.map(h => h.toLowerCase()))]

      // Remove hashtags from title
      title = title.replace(/#[а-яА-ЯёЁa-zA-Z0-9_]+/g, '').replace(/\s+/g, ' ').trim()

      // Remove hashtags from theme but keep structure
      theme = theme.replace(/#[а-яА-ЯёЁa-zA-Z0-9_]+/g, '').replace(/\s+/g, ' ').trim()

      // Convert Rutube private link to embed
      const embedUrl = videoUrl ? convertRutubeToEmbed(videoUrl) : null

      // Determine category from hashtags
      let category = 'ngo'
      const hashtagString = uniqueHashtags.join(' ')
      if (hashtagString.includes('#волонтерство') || theme.includes('волонтер')) category = 'volunteers'
      if (hashtagString.includes('#соц_пред') || hashtagString.includes('#соц_проекты')) category = 'ngo'
      if (hashtagString.includes('#фандрайзинг')) category = 'ngo'
      if (hashtagString.includes('#гранты')) category = 'ngo'

      // Create excerpt from theme
      let excerpt = theme.split('\n\n')[0].substring(0, 200)
      if (!excerpt) excerpt = title.substring(0, 200)

      // Create content without hashtags in body
      let content = `# ${title}\n\n`
      if (speaker) content += `**Спикер:** ${speaker}\n\n`
      content += `${theme}\n\n`

      await prisma.article.create({
        data: {
          title: title.substring(0, 200),
          slug: `${slugify(title)}-${articleCount}`,
          content: content.substring(0, 10000),
          excerpt: excerpt,
          coverImage: null,
          category,
          published: true,
          videoUrl: embedUrl, // Use converted embed URL
          tags: uniqueHashtags.length > 0 ? JSON.stringify(uniqueHashtags) : null,
          speaker: speaker || null,
        },
      })

      articleCount++
    } catch (error) {
      console.error(`Error creating article:`, error)
    }
  }

  console.log(`✅ Created ${articleCount} articles from knowledge base!`)

  // Create some volunteer users
  console.log('Creating volunteer users...')
  const volunteerPassword = await bcrypt.hash('volunteer123', 10)
  for (let i = 1; i <= 5; i++) {
    await prisma.user.create({
      data: {
        email: `volunteer${i}@example.com`,
        name: `Волонтер ${i}`,
        password: volunteerPassword,
        role: 'VOLUNTEER',
        city: cities[i % cities.length].name,
      },
    })
  }

  console.log('✅ Seed with REAL data completed successfully!')
  console.log(`
📊 Final Statistics:
- ${cities.length} Rosatom cities
- ${categories.length} categories
- ${ngoCount} real NGOs (from Excel data)
- ${eventCount} events (for NGOs to get volunteers)
- ${articleCount} educational articles/videos (from knowledge base with embed links)
- 5 volunteer users
- 1 admin user

🔑 Login credentials:
Admin: admin@rosatom-volunteers.ru / admin123
Volunteer: volunteer1@example.com / volunteer123
NGO: all NGOs use password123

📹 Video links converted to Rutube embed format for proper playback
  `)
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
