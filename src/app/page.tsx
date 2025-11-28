import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import CitySelector from '@/components/home/CitySelector'
import SearchBar from '@/components/home/SearchBar'
import MapWidget from '@/components/home/MapWidget'
import UrgentHelp from '@/components/home/UrgentHelp'
import NGOCatalog from '@/components/home/NGOCatalog'
import EducationalResources from '@/components/home/EducationalResources'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <Hero />

        {/* City Selector - key feature from specification */}
        <section className="py-12 bg-gray-50">
          <div className="container-custom">
            <CitySelector />
          </div>
        </section>

        <section className="py-12 bg-white">
          <div className="container-custom">
            <SearchBar />
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Интерактивная Карта НКО
            </h2>
            <MapWidget />
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container-custom">
            <h2 className="text-3xl font-bold mb-8">
              Срочная Помощь
            </h2>
            <UrgentHelp />
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <h2 className="text-3xl font-bold mb-8">
              Каталог НКО
            </h2>
            <NGOCatalog limit={8} />
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container-custom">
            <h2 className="text-3xl font-bold mb-8">
              Образовательные Ресурсы
            </h2>
            <EducationalResources limit={4} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
