import Link from 'next/link'
import Image from 'next/image'
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi'
import { FaVk, FaTelegram } from 'react-icons/fa'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About + Logo */}
          <div>
            <div className="mb-4">
              <img
                src="/images/logo-full.png"
                alt="Логотип Росатома"
                className="h-12 w-auto brightness-0 invert"
              />
            </div>
            <p className="text-sm">
              Волонтерский портал для объединения НКО и волонтеров в городах Росатома
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Навигация</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/map" className="hover:text-white transition-colors">
                  Карта НКО
                </Link>
              </li>
              <li>
                <Link href="/ngo" className="hover:text-white transition-colors">
                  Каталог НКО
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-white transition-colors">
                  Мероприятия
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-white transition-colors">
                  Ресурсы
                </Link>
              </li>
            </ul>
          </div>

          {/* For NGOs */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Для НКО</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/auth/signup?type=ngo" className="hover:text-white transition-colors">
                  Регистрация НКО
                </Link>
              </li>
              <li>
                <Link href="/resources?category=ngo" className="hover:text-white transition-colors">
                  Методические материалы
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  Политика конфиденциальности
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Контакты Росатома</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2">
                <FiMapPin className="mt-0.5 flex-shrink-0" />
                <span>119017, Москва, ул. Большая Ордынка, 24</span>
              </li>
              <li className="flex items-start space-x-2">
                <FiPhone className="mt-0.5 flex-shrink-0" />
                <a href="tel:+74999494535" className="hover:text-white transition-colors">
                  (499) 949-45-35
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <FiMail className="mt-0.5 flex-shrink-0" />
                <a href="mailto:info@rosatom.ru" className="hover:text-white transition-colors">
                  info@rosatom.ru
                </a>
              </li>
            </ul>
            <p className="text-xs mt-3 text-gray-400">
              Понедельник - Четверг: 09:00 - 18:00<br />
              Пятница: 09:00 - 16:45
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p className="mb-2">© {currentYear} Государственная корпорация по атомной энергии "Росатом"</p>
          <p className="text-xs text-gray-400">ИНН 7706413348 | ОГРН 1077799032926</p>
        </div>
      </div>
    </footer>
  )
}
