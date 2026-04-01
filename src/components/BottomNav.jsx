import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  {
    to: '/posiciones',
    label: 'Tabla',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24"
        stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h12M3 18h8" />
      </svg>
    ),
  },
  {
    to: '/goleadores',
    label: 'Goles',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24"
        stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
        <circle cx="12" cy="12" r="10" strokeLinecap="round" />
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 2v4m0 12v4M2 12h4m12 0h4m-4.93-7.07-2.83 2.83m-4.24 4.24-2.83 2.83m0-9.9 2.83 2.83m4.24 4.24 2.83 2.83" />
      </svg>
    ),
  },
  {
    to: '/fixture',
    label: 'Fixture',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24"
        stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
        <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" />
        <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    to: '/mi-perfil',
    label: 'Perfil',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24"
        stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-surface-line z-40 safe-bottom">
      {/* Top glow line */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 relative
                transition-all duration-200
                ${isActive
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-gray-300 active:text-gray-200'
                }`}
            >
              {/* Active pill indicator at top */}
              <span
                className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-b-full bg-primary transition-all duration-300 ${
                  isActive ? 'w-8 opacity-100' : 'w-0 opacity-0'
                }`}
              />

              {/* Icon wrapper with glow on active */}
              <span className={`transition-all duration-200 ${isActive ? 'drop-shadow-[0_0_6px_rgba(204,26,26,0.6)]' : ''}`}>
                {item.icon(isActive)}
              </span>

              <span className={`text-[10px] font-semibold leading-none tracking-wide transition-colors duration-200 ${
                isActive ? 'text-primary' : 'text-gray-600'
              }`}>
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
