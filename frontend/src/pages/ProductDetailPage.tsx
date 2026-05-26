import { useParams, Link } from 'react-router-dom'
import { Card, CardBody, CardHeader, Button, Badge } from '../components/ui'
import { getProductById } from '../data/productParser'
import { Header } from '../components/layout'
import { colors } from '../config/theme'

const CATEGORY_LABELS: Record<string, string> = {
  deposits_and_savings_accounts_individuals: 'Вклады',
  loans_individuals: 'Кредиты',
  debit_cards: 'Дебетовые карты',
  rko_business_packages: 'РКО',
  deposits_business: 'Депозиты бизнеса',
  additional_business_services: 'Услуги',
}

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const product = productId ? getProductById(productId) : undefined

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: colors.bg }}>
        <Header />
        <div className="flex flex-col items-center justify-center flex-1 text-center page-container py-10">
          <h1 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>
            Продукт не найден
          </h1>
          <Link to="/"><Button variant="primary">На главную</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: colors.bg }}>
      <Header />
      <div className="page-container py-5 sm:py-8 max-w-3xl w-full">
        <Link
          to="/"
          className="text-sm font-semibold mb-5 inline-flex items-center gap-1 transition-opacity duration-200 hover:opacity-80"
          style={{ color: colors.primary.DEFAULT }}
        >
          <span aria-hidden>←</span> На главную
        </Link>

        <Card className="mb-4 sm:mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <h1 className="text-lg sm:text-xl font-bold" style={{ color: colors.text.primary }}>
                {product.name}
              </h1>
              <Badge variant="info">{CATEGORY_LABELS[product.category] ?? product.category}</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <div
              className="relative rounded-xl overflow-hidden mb-4 h-40 sm:h-48"
              style={{ background: `linear-gradient(145deg, ${colors.primary.bg}, ${colors.bg})` }}
            >
              <img
                src={product.image}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover opacity-80"
                onError={(e) => { (e.target as HTMLImageElement).remove() }}
              />
            </div>
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: colors.text.secondary }}>
              {product.description}
            </p>
          </CardBody>
        </Card>

        <div className="text-center sm:text-left">
          <Link to="/">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">На главную</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
