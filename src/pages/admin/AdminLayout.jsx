import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'

const ADMIN_NAV = [
  { to: '/admin/equipos', label: 'Equipos', icon: '🏆' },
  { to: '/admin/fixture', label: 'Fixture', icon: '📅' },
  { to: '/admin/cuotas', label: 'Cuotas', icon: '💰' },
]

export default function AdminLayout() {
  return (
    <div className="min-h-full">
      {/* Admin header */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-yellow-600 text-sm">⭐</span>
          <span className="text-yellow-700 text-xs font-bold uppercase tracking-wider">Panel de Administración</span>
        </div>
      </div>

      {/* Tabs de admin */}
      <div className="flex bg-white border-b border-gray-200 overflow-x-auto">
        {ADMIN_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="pb-4">
        <Outlet />
      </div>
    </div>
  )
}
