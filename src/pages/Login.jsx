import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Login() {
  const [ci, setCi] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!ci.trim() || !password.trim()) {
      setError('Ingresá tu CI y contraseña.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await login(ci, password)
      navigate('/', { replace: true })
    } catch (err) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('CI o contraseña incorrectos.')
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Tu cuenta aún no fue confirmada.')
      } else {
        setError('Error al iniciar sesión. Intentá de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-deep relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(204,26,26,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Decorative arcs — like a football field */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50%" cy="35%" r="120" fill="none" stroke="white" strokeWidth="1" />
        <circle cx="50%" cy="35%" r="60" fill="none" stroke="white" strokeWidth="1" />
        <line x1="0" y1="60%" x2="100%" y2="60%" stroke="white" strokeWidth="1" />
        <rect x="30%" y="70%" width="40%" height="20%" fill="none" stroke="white" strokeWidth="1" />
        <rect x="38%" y="70%" width="24%" height="10%" fill="none" stroke="white" strokeWidth="1" />
      </svg>

      {/* Glow blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-64 h-64 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-80 h-80 rounded-full bg-primary/6 blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10 animate-fade-up">
          <div className="w-20 h-20 bg-primary/10 border-2 border-primary/40 rounded-2xl flex items-center justify-center mb-4 shadow-glow relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/5 animate-glow-pulse" />
            <span className="text-primary font-display text-3xl leading-none relative z-10 tracking-wider">IE</span>
          </div>
          <h1 className="text-white font-display text-5xl tracking-widest leading-none">
            INTER<span className="text-primary">EXA</span>
          </h1>
          <p className="text-gray-600 text-xs mt-2 tracking-[0.2em] uppercase font-medium">
            Torneo de Fútbol Amateur
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-surface border border-surface-line rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
            {/* Card top glow strip */}
            <div className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

            <div className="p-6">
              <h2 className="text-white font-display text-2xl tracking-wider mb-0.5">BIENVENIDO</h2>
              <p className="text-gray-500 text-sm mb-6">Ingresá con tu CI y contraseña</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* CI */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wider uppercase">
                    Cédula de Identidad
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={ci}
                      onChange={(e) => setCi(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ej: 12345678"
                      className="input-field pl-9"
                      inputMode="numeric"
                      autoComplete="username"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wider uppercase">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field pl-9 pr-10"
                      autoComplete="current-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600
                                 hover:text-gray-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
                          viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
                          viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 bg-red-950/60 border border-red-900/60
                                  text-red-400 rounded-lg p-3 text-sm animate-fade-in">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white font-bold py-3 rounded-xl flex items-center
                             justify-center gap-2 mt-2 transition-all duration-200
                             hover:bg-primary-700 active:scale-[0.98]
                             disabled:opacity-50 shadow-glow hover:shadow-glow-lg
                             tracking-wider text-sm"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      Ingresando...
                    </>
                  ) : (
                    'INGRESAR'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <p className="text-gray-700 text-xs mt-6 tracking-wide">
          ¿No tenés cuenta? Contactá al administrador.
        </p>
      </div>
    </div>
  )
}
