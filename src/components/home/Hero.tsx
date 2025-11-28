import Link from 'next/link'
import { FaMapMarkedAlt, FaBook, FaCalendarAlt, FaNewspaper } from 'react-icons/fa'

export default function Hero() {
  return (
    <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
      <div className="container-custom">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Платформа добрых дел городов Росатома
            </h1>
            <p className="text-xl mb-8 text-primary-100">
              Найдите возможность помочь или зарегистрируйте свою организацию
            </p>
          </div>

          {/* Призывы к действию из ТЗ */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/map" className="bg-white/95 text-gray-800 p-6 rounded-lg hover:bg-white transition-all hover:scale-105 shadow-lg">
              <FaMapMarkedAlt className="text-4xl text-primary-600 mb-3 mx-auto" />
              <h3 className="font-bold text-lg mb-2 text-center">Карта</h3>
              <p className="text-sm text-gray-600 text-center">
                Найдите организации по городу и направлению деятельности
              </p>
            </Link>

            <Link href="/resources" className="bg-white/95 text-gray-800 p-6 rounded-lg hover:bg-white transition-all hover:scale-105 shadow-lg">
              <FaBook className="text-4xl text-primary-600 mb-3 mx-auto" />
              <h3 className="font-bold text-lg mb-2 text-center">База знаний</h3>
              <p className="text-sm text-gray-600 text-center">
                Просматривайте видео и материалы для скачивания
              </p>
            </Link>

            <Link href="/events" className="bg-white/95 text-gray-800 p-6 rounded-lg hover:bg-white transition-all hover:scale-105 shadow-lg">
              <FaCalendarAlt className="text-4xl text-primary-600 mb-3 mx-auto" />
              <h3 className="font-bold text-lg mb-2 text-center">Календарь</h3>
              <p className="text-sm text-gray-600 text-center">
                Отметьте интересные события, чтобы ничего не пропустить
              </p>
            </Link>

            <Link href="/resources" className="bg-white/95 text-gray-800 p-6 rounded-lg hover:bg-white transition-all hover:scale-105 shadow-lg">
              <FaNewspaper className="text-4xl text-primary-600 mb-3 mx-auto" />
              <h3 className="font-bold text-lg mb-2 text-center">Новости</h3>
              <p className="text-sm text-gray-600 text-center">
                Будьте в курсе последних инициатив и грантов
              </p>
            </Link>
          </div>

          {/* Кнопки регистрации */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="bg-white text-primary-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition-colors text-center">
              Стать волонтером
            </Link>
            <Link href="/auth/signup?type=ngo" className="bg-primary-700 text-white border-2 border-white px-8 py-4 rounded-lg font-bold hover:bg-primary-800 transition-colors text-center">
              Зарегистрировать НКО
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
