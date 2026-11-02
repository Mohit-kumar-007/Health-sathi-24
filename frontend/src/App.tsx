import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Highlights } from './components/Highlights'
import { Topics } from './components/Topics'
import { Journey } from './components/Journey'
import { CtaBand } from './components/CtaBand'
import { Footer } from './components/Footer'
import { usePathname } from './lib/router'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminCoursesPage from './pages/AdminCoursesPage'
import AdminCourseEditPage from './pages/AdminCourseEditPage'
import LessonPage from './pages/LessonPage'
import { ContactPage, PrivacyPage, TermsPage } from './pages/LegalPages'

const LESSON_ROUTE = /^\/learn\/([^/]+)(?:\/([a-f0-9]{24}))?$/
const ADMIN_COURSE_ROUTE = /^\/admin\/courses\/([a-f0-9]{24})$/

export default function App() {
  const pathname = usePathname().replace(/\/+$/, '') || '/'

  if (pathname === '/login') return <LoginPage />
  if (pathname === '/dashboard') return <DashboardPage />
  if (pathname === '/admin/users') return <AdminUsersPage />
  if (pathname === '/admin/courses') return <AdminCoursesPage />

  if (pathname === '/privacy') return <PrivacyPage />
  if (pathname === '/terms') return <TermsPage />
  if (pathname === '/contact') return <ContactPage />

  const adminCourseRoute = pathname.match(ADMIN_COURSE_ROUTE)
  if (adminCourseRoute) return <AdminCourseEditPage courseId={adminCourseRoute[1]} />

  const lessonRoute = pathname.match(LESSON_ROUTE)
  if (lessonRoute) return <LessonPage courseSlug={lessonRoute[1]} lessonId={lessonRoute[2]} />

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
