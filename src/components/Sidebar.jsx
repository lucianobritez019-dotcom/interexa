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
      { to: '/vallas',     label: 'Vallas',      icon: '🥅' },
      { to: '/fair-play',  label: 'Fair Play',   icon: '🛡️' },
      { to: '/fixture',    label: 'Fixture',      icon: '📅' },
    ],
  },
  {
    section: 'Mi Cuenta',
    items: [
      { to: '/mi-estado',  label: 'Mi Estado',  icon: '📋' },
      { to: '/mis-equipos',label: 'Mis Equipos',icon: '👥' },
      { to: '/mi-perfil',  label: 'Mi Perfil',  icon: '👤' },
    ],
  },
]

const ADMIN_ITEMS = [
  { to: '/admin/equipos', label: 'Equipos',      icon: '🏆' },
  { to: '/admin/fixture', label: 'Fixture Admin',icon: '⚙️' },
  { to: '/admin/cuotas',  label: 'Cuotas',        icon: '💰' },
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

  const rolLabel = profile?.rol === 'admin' ? 'Admin' :
                   profile?.rol === 'capitan' ? 'Capitán' : 'Jugador'
  const rolColor = profile?.rol === 'admin'   ? 'bg-gold/20 text-gold border border-gold/30' :
                   profile?.rol === 'capitan' ? 'bg-blue-900/50 text-blue-300 border border-blue-800/50' :
                                                'bg-surface-raised text-gray-400 border border-surface-line'

  return (
    <div className="h-full flex flex-col bg-surface border-r border-surface-line">
      {/* Header */}
      <div className="relative overflow-hidden flex-shrink-0">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-surface to-surface-deep" />
        <div className="absolute inset-0 grid-pattern opacity-40" />

        <div className="relative px-5 pt-12 pb-5">
          {/* Logo row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-glow-sm">
                <span className="text-white font-display text-sm leading-none">IE</span>
              </div>
              <div>
                <h1 className="text-white font-display text-xl tracking-widest leading-none">
                  INTER<span className="text-primary">EXA</span>
                </h1>
                <p className="text-gray-500 text-xs mt-0.5 tracking-wide">TORNEO DE FÚTBOL</p>
              </div>
            </div>
            <button
              onClick={handleNavClick}
              className="text-gray-500 hover:text-white p-1.5 rounded-lg transition-colors hover:bg-surface-raised"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User card */}
          {profile && (
            <div className="flex items-center gap-3 bg-surface-raised/60 backdrop-blur-sm rounded-xl p-3 border border-surface-line">
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {profile.foto_url ? (
                  <img src={profile.foto_url} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary font-bold text-sm">
                    {profile.nombre?.[0]}{profile.apellido?.[0]}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold text-sm truncate leading-tight">
                  {profile.nombre} {profile.apellido}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">CI: {profile.ci}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${rolColor}`}>
                {rolLabel}
              </span>
            </div>
          )}
        </div>

        {/* Bottom border glow */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {MENU_ITEMS.map((section) => (
          <div key={section.section} className="mb-5">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest px-3 mb-2">
              {section.section}
            </p>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium
                   transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/15 text-white border border-primary/25 shadow-glow-sm'
                      : 'text-gray-500 hover:text-gray-100 hover:bg-surface-raised hover:translate-x-1'
                  }`
                }
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}

        {/* Admin section */}
        {isAdmin && (
          <div className="mb-5">
            <p className="text-xs font-bold text-gold/70 uppercase tracking-widest px-3 mb-2">
              Administración
            </p>
            {ADMIN_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium
                   transition-all duration-200 ${
                    isActive
                      ? 'bg-gold/10 text-gold border border-gold/20'
                      : 'text-gray-500 hover:text-gold/80 hover:bg-gold/5 hover:translate-x-1'
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
      <div className="flex-shrink-0 border-t border-surface-line px-3 pt-3 pb-5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                     text-gray-500 hover:text-red-400 hover:bg-red-950/30 transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar sesión
        </button>
        <p className="text-center text-xs text-gray-700 mt-3 tracking-widest">INTEREXA v1.0</p>
      </div>
    </div>
  )
}
