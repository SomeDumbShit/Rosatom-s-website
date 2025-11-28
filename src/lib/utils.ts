import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  const d = new Date(date)
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string) {
  const d = new Date(date)
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function slugify(text: string): string {
  // Карта транслитерации русских букв
  const cyrillicMap: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  }

  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return text
    .toString()
    .toLowerCase()
    // Транслитерация кириллицы
    .split('')
    .map(char => cyrillicMap[char] || char)
    .join('')
    .replace(/\s+/g, '-')
    .replace(p, (c) => b.charAt(a.indexOf(c)))
    .replace(/&/g, '-and-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

// Все 32 города присутствия ГК Росатом согласно ТЗ хакатона
export const ROSATOM_CITIES = [
  'Ангарск',
  'Байкальск',
  'Балаково',
  'Билибино',
  'Волгодонск',
  'Глазов',
  'Десногорск',
  'Димитровград',
  'Железногорск',
  'Заречный (Пензенская обл.)',
  'Заречный (Свердловская обл.)',
  'Зеленогорск',
  'Краснокаменск',
  'Курчатов',
  'Лесной',
  'Неман',
  'Нижний Новгород',
  'Нововоронеж',
  'Новоуральск',
  'Обнинск',
  'Озерск',
  'Омск',
  'Певек',
  'Полярные Зори',
  'Саров',
  'Северск',
  'Снежинск',
  'Советск',
  'Сосновый Бор',
  'Трехгорный',
  'Удомля',
  'Усолье-Сибирское',
  'Электросталь',
  'Энергодар',
]

// Категории НКО с маппингом на английские теги
export const NGO_CATEGORIES_MAP = {
  'Помощь детям': 'children',
  'Помощь пожилым': 'elderly',
  'Помощь животным': 'animals',
  'Экология': 'ecology',
  'Образование': 'education',
  'Здравоохранение': 'healthcare',
  'Культура': 'culture',
  'Спорт': 'sports',
  'Pro Bono': 'probono',
  'Другое': 'other',
  'Социальная помощь': 'social',
}

export const NGO_CATEGORIES = Object.keys(NGO_CATEGORIES_MAP)

// Обратный маппинг: тег -> русское название
export const NGO_TAGS_TO_LABELS = Object.fromEntries(
  Object.entries(NGO_CATEGORIES_MAP).map(([label, tag]) => [tag, label])
)

export const HELP_TYPES = [
  'Нужны руки',
  'Автоволонтер',
  'Pro Bono',
  'Финансовая помощь',
  'Материальная помощь',
]

export const ORGANIZATION_TYPES = [
  'Фонд',
  'Приют',
  'Организация',
  'Инициативная группа',
  'Другое',
]

// Coordinates of all 32 Rosatom cities for map display
export const CITY_COORDINATES: Record<string, [number, number]> = {
  'Ангарск': [52.5406, 103.8886],
  'Байкальск': [51.5167, 104.1500],
  'Балаково': [52.0266, 47.7956],
  'Билибино': [68.0544, 166.4464],
  'Волгодонск': [47.5132, 42.1530],
  'Глазов': [58.1394, 52.6581],
  'Десногорск': [54.1500, 33.2833],
  'Димитровград': [54.2139, 49.6186],
  'Железногорск': [56.2511, 93.5327],
  'Заречный (Пензенская обл.)': [53.2000, 45.1667],
  'Заречный (Свердловская обл.)': [56.8167, 61.3167],
  'Зеленогорск': [56.1128, 94.5958],
  'Краснокаменск': [50.0986, 118.0367],
  'Курчатов': [51.6605, 35.6569],
  'Лесной': [58.6356, 59.7847],
  'Неман': [55.0333, 22.0333],
  'Нижний Новгород': [56.3269, 44.0059],
  'Нововоронеж': [51.3064, 39.2214],
  'Новоуральск': [57.2439, 60.0839],
  'Обнинск': [55.0956, 36.6072],
  'Озерск': [55.7556, 60.7028],
  'Омск': [54.9885, 73.3242],
  'Певек': [69.7011, 170.3133],
  'Полярные Зори': [67.3667, 32.5000],
  'Саров': [54.9333, 43.3167],
  'Северск': [56.6000, 84.8833],
  'Снежинск': [56.0850, 60.7350],
  'Советск': [55.0833, 21.8833],
  'Сосновый Бор': [59.9000, 29.0833],
  'Трехгорный': [54.8167, 58.4500],
  'Удомля': [57.8786, 35.0053],
  'Усолье-Сибирское': [52.7511, 103.6450],
  'Электросталь': [55.7897, 38.4461],
  'Энергодар': [47.4986, 34.6564],
}
