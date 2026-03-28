import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    } else {
      setProfile(data)
    }
  }, [])

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  // Login usando CI como identificador (CI@interexa.com)
  const login = async (ci, password) => {
    const email = `${ci.trim()}@interexa.com`
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  // Registro de nuevo usuario
  const register = async ({ ci, nombre, apellido, telefono, password }) => {
    const email = `${ci.trim()}@interexa.com`
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { ci, nombre, apellido, rol: 'jugador' },
      },
    })
    if (error) throw error

    // Actualizar perfil con datos extra
    if (data.user) {
      await supabase.from('profiles').upsert({
        user_id: data.user.id,
        ci,
        nombre,
        apellido,
        email,
        telefono,
        rol: 'jugador',
      })
    }
    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = () => {
    if (user?.id) fetchProfile(user.id)
  }

  const isAdmin = profile?.rol === 'admin'
  const isCaptain = profile?.rol === 'capitan' || profile?.rol === 'admin'

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAdmin,
      isCaptain,
      login,
      logout,
      register,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
