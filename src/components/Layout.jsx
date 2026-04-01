import React, { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import useStore from '../store/useStore'

export default function Layout() {
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useStore()
  const overlayRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname, setSidebarOpen])

  return (
    <div className="min-h-screen bg-surface-deep flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-surface border-b border-surface-line shadow-inner-glow">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Hamburger */}
          <button
            onClick={toggleSidebar}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400
                       hover:text-white hover:bg-surface-hover active:bg-surface-raised transition-all duration-150"
            aria-label="Abrir menú"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shadow-glow-sm">
              <span className="text-white font-display text-sm leading-none tracking-wider">IE</span>
            </div>
            <h1 className="text-white font-display text-2xl tracking-widest leading-none">
              INTER<span className="text-primary">EXA</span>
            </h1>
          </div>

          <div className="w-9" />
        </div>

        {/* Thin crimson line at bottom of header */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </header>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm animate-fade-in"
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

      {/* Main content */}
      <main className="flex-1 pt-14 pb-20 overflow-auto">
        <div className="max-w-2xl mx-auto page-enter">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
