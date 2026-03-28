import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  {
    to: '/posiciones',
    label: 'Posiciones',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24"
        stroke={active ? '#8B0000' : 'currentColor'} strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 10h18M3 6h18M3 14h12M3 18h8" />
      </svg>
    ),
  },
  {
    to: '/goleadores',
    label: 'Goleadores',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24"
        stroke={active ? '#8B0000' : 'currentColor'} strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 2v4m0 12v4M2 12h4m12 0h4" />
      </svg>
    ),
  },
  {
    to: '/vallas',
    label: 'Vallas',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24"
        stroke={active ? '#8B0000' : 'currentColor'} strokeWidth={active ? 2.5 : 2}>
        <rect x="2" y="7" width="20" height="10" rx="1" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7v10M10 7v10M14 7v10M18 7v10" />
      </svg>
    ),
  },
  {
    to: '/fair-play',
    label: 'Fair Play',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24"
        stroke={active ? '#8B0000' : 'currentColor'} strokeWidth={active ? 2.5 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-bottom">
      <div className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors
                ${isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-700'}`}
            >
              {item.icon(isActive)}
              <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-primary' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-t-full" />
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
