import { Link } from 'react-router-dom'
import { getHomeAdProducts } from '../../../data/productParser'
import { useUserInputStore } from '../../../store'
import type { AdProduct } from '../../../data/productParser'

function AdCard({ ad }: { ad: AdProduct }) {
  const trackClick = useUserInputStore((s) => s.trackClick)

  return (
    <Link
      to={`/product/${ad.id}`}
      onClick={() => trackClick(ad.id)}
      className="block rounded-xl overflow-hidden group relative min-h-[140px] sm:min-h-[160px]"
    >
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(148deg, var(--color-sdm-primary), var(--color-sdm-primary-dark))' }}
      />
      <img
        src={ad.image}
        alt={ad.name}
        className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
      <div className="relative px-4 sm:px-5 py-5 sm:py-8 flex flex-col justify-end h-full">
        <h3 className="text-sm sm:text-lg font-bold text-white">{ad.name}</h3>
        <p className="text-xs sm:text-sm text-white/80 mt-1 line-clamp-2">{ad.description}</p>
      </div>
    </Link>
  )
}

export function ProductAdCards() {
  const ads = getHomeAdProducts().slice(0, 4)
  if (ads.length === 0) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} />
      ))}
    </div>
  )
}
