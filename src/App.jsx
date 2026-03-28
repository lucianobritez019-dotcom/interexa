import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { supabase } from './lib/supabase'
import useStore from './store/useStore'

import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/LoadingSpinner'

import Login from './pages/Login'
import Posiciones from './pages/Posiciones'
import Goleadores from './pages/Goleadores'
import Vallas from './pages/Vallas'
import FairPlay from './pages/FairPlay'
import Fixture from './pages/Fixture'
import MiEstado from './pages/MiEstado'
import MiPerfil from './pages/MiPerfil'
import MisEquipos from './pages/MisEquipos'

import AdminLayout from './pages/admin/AdminLayout'
import AdminEquipos from './pages/admin/AdminEquipos'
import AdminFixture from './pages/admin/AdminFixture'
import AdminPlanilla from './pages/admin/AdminPlanilla'
import AdminCuotas from './pages/admin/AdminCuotas'

export default function App() {
  const { loading, user } = useAuth()
  const { setTorneoActivo, setConfigTorneo } = useStore()

  // Cargar torneo activo y config al iniciar
  useEffect(() => {
    const loadTorneo = async () => {
      const { data: torneos } = await supabase
        .from('torneos')
        .select('*')
        .eq('activo', true)
        .limit(1)
        .single()

      if (torneos) {
        setTorneoActivo(torneos)

        const { data: config } = await supabase
          .from('config_torneo')
          .select('*')
          .eq('torneo_id', torneos.id)
          .single()

        if (config) setConfigTorneo(config)
      }
    }
    loadTorneo()
  }, [setTorneoActivo, setConfigTorneo])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <LoadingSpinner size="lg" color="white" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Ruta pública */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Rutas protegidas con layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/posiciones" replace />} />
        <Route path="posiciones" element={<Posiciones />} />
        <Route path="goleadores" element={<Goleadores />} />
        <Route path="vallas" element={<Vallas />} />
        <Route path="fair-play" element={<FairPlay />} />
        <Route path="fixture" element={<Fixture />} />
        <Route path="mi-estado" element={<MiEstado />} />
        <Route path="mi-perfil" element={<MiPerfil />} />
        <Route path="mis-equipos" element={<MisEquipos />} />

        {/* Admin */}
        <Route
          path="admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="equipos" replace />} />
          <Route path="equipos" element={<AdminEquipos />} />
          <Route path="fixture" element={<AdminFixture />} />
          <Route path="planilla/:partidoId" element={<AdminPlanilla />} />
          <Route path="cuotas" element={<AdminCuotas />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
