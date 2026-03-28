import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function MisEquipos() {
  const { profile } = useAuth()
  const [equipos, setEquipos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    const fetchEquipos = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('jugadores_equipos')
        .select(`
          *,
          equipo:equipos(id, nombre, escudo_url, categoria)
        `)
        .eq('jugador_id', profile.id)
        .order('created_at', { ascending: false })

      setEquipos(data || [])
      setLoading(false)
    }
    fetchEquipos()
  }, [profile])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const activos = equipos.filter((e) => e.activo)
  const inactivos = equipos.filter((e) => !e.activo)

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-black text-gray-800">Mis Equipos</h2>

      {equipos.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-gray-400">No estás registrado en ningún equipo.</p>
          <p className="text-gray-400 text-sm mt-1">Contactá al administrador.</p>
        </div>
      ) : (
        <>
          {activos.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                Equipos activos
              </p>
              <div className="space-y-3">
                {activos.map((je) => (
                  <EquipoCard key={je.id} je={je} activo={true} />
                ))}
              </div>
            </div>
          )}

          {inactivos.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1 mt-4">
                Historial
              </p>
              <div className="space-y-3">
                {inactivos.map((je) => (
                  <EquipoCard key={je.id} je={je} activo={false} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function EquipoCard({ je, activo }) {
  const CATEGORIA_LABELS = {
    primera: 'Primera División',
    ejecutivo: 'Categoría Ejecutivo',
    master: 'Categoría Master',
  }

  return (
    <div className={`card p-4 ${!activo ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-4">
        {je.equipo?.escudo_url ? (
          <img src={je.equipo.escudo_url} alt="" className="w-14 h-14 object-contain flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 bg-primary/10 rounded-full flex-shrink-0 flex items-center justify-center">
            <span className="text-primary font-black text-xl">{je.equipo?.nombre?.[0]}</span>
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-black text-gray-900 text-base">{je.equipo?.nombre}</h3>
          <p className="text-gray-500 text-sm">
            {CATEGORIA_LABELS[je.categoria] || je.categoria}
          </p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {activo ? 'Activo' : 'Inactivo'}
        </span>
      </div>
    </div>
  )
}
