import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-sdm-bg)' }}>
      <Header />
      <main className="flex-1">
        <div className="page-container py-6 sm:py-8">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}
