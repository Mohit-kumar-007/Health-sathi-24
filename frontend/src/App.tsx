import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Highlights } from './components/Highlights'
import { Topics } from './components/Topics'
import { Journey } from './components/Journey'
import { CtaBand } from './components/CtaBand'
import { Footer } from './components/Footer'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AdminUsersPage from './pages/AdminUsersPage'

export default function App() {
  const { pathname } = window.location
  if (pathname === '/login') return <LoginPage />
  if (pathname === '/dashboard') return <DashboardPage />
  if (pathname === '/admin/users') return <AdminUsersPage />

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Highlights />
        <Topics />
        <Journey />
        <CtaBand />
      </main>
      <Footer />
    </>
  )
}
