import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useStore from '../store/useStore'

const MENU_ITEMS = [
  {
    section: 'Estadísticas',
    items: [
      { to: '/posiciones', label: 'Posiciones', icon: '📊' },
      { to: '/goleadores', label: 'Goleadores', icon: '⚽' },
      { to: '/vallas', label: 'Vallas', icon: '🥅' },
      { to: '/fair-play', label: 'Fair Play', icon: '🛡️' },
      { to: '/fixture', label: 'Fixture', icon: '📅' },
    ],
  },
  {
    section: 'Mi Cuenta',
    items: [
      { to: '/mi-estado', label: 'Mi Estado', icon: '📋' },
      { to: '/mis-equipos', label: 'Mis Equipos', icon: '👥' },
      { to: '/mi-perfil', label: 'Mi Perfil', icon: '👤' },
    ],
  },
]

const ADMIN_ITEMS = [
  { to: '/admin/equipos', label: 'Equipos', icon: '🏆' },
  { to: '/admin/fixture', label: 'Fixture Admin', icon: '⚙️' },
  { to: '/admin/cuotas', label: 'Cuotas', icon: '💰' },
]

export default function Sidebar({ onClose }) {
  const { profile, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const { setSidebarOpen } = useStore()

  const handleLogout = async () => {
    await logout()
    setSidebarOpen(false)
    navigate('/login')
  }

  const handleNavClick = () => {
    if (onClose) onClose()
    setSidebarOpen(false)
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header del sidebar */}
      <div className="bg-primary px-5 pt-12 pb-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
              <span className="text-primary font-black text-sm leading-none">IE</span>
            </div>
            <div>
              <h1 className="text-white font-black text-xl tracking-tight leading-none">InterExa</h1>
              <p className="text-red-200 text-xs mt-0.5">Torneo de Fútbol</p>
            </div>
          </div>
          <button
            onClick={handleNavClick}
            className="text-white/70 hover:text-white p-1 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Info usuario */}
        {profile && (
          <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {profile.foto_url ? (
                <img src={profile.foto_url} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-sm">
                  {profile.nombre?.[0]}{profile.apellido?.[0]}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {profile.nombre} {profile.apellido}
              </p>
              <p className="text-red-200 text-xs truncate">CI: {profile.ci}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 inline-block ${
                profile.rol === 'admin' ? 'bg-yellow-400 text-yellow-900' :
                profile.rol === 'capitan' ? 'bg-blue-400 text-blue-900' :
                'bg-white/20 text-white'
              }`}>
                {profile.rol === 'admin' ? 'Admin' :
                 profile.rol === 'capitan' ? 'Capitán' : 'Jugador'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {MENU_ITEMS.map((section) => (
          <div key={section.section} className="mb-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">
              {section.section}
            </p>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}

        {/* Sección Admin */}
        {isAdmin && (
          <div className="mb-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">
              Administración
            </p>
            {ADMIN_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-6 flex-shrink-0 border-t border-gray-100 pt-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar sesión
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">InterExa v1.0</p>
      </div>
    </div>
  )
}
