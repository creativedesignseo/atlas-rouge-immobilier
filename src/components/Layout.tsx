import { Suspense, useEffect } from 'react'
import { useLocation, Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // The navbar is fixed and transparent over the home hero. On every other
  // page we add a spacer (h-[80px]) so the content doesn't slide under it.
  const isHome = /^\/(fr|es|en)\/?$/.test(pathname)

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Navbar />
      <main className={`flex-1 ${isHome ? '' : 'pt-[80px]'}`}>
        <Suspense
          fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
