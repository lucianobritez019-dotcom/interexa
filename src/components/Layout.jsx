import React, { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import useStore from '../store/useStore'

export default function Layout() {
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useStore()
  const overlayRef = useRef(null)
  const location = useLocation()

  // Cerrar sidebar al cambiar de ruta
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname, setSidebarOpen])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-primary shadow-lg">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={toggleSidebar}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-white hover:bg-white/10 active:bg-white/20 transition-colors"
            aria-label="Abrir menú"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
              <span className="text-primary font-black text-xs leading-none">IE</span>
            </div>
            <h1 className="text-white font-black text-lg tracking-tight">InterExa</h1>
          </div>

          {/* Espacio derecho para balance */}
          <div className="w-9" />
        </div>
      </header>

      {/* Overlay sidebar */}
      {sidebarOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 z-50 shadow-2xl transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 pt-14 pb-20 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  )
}
