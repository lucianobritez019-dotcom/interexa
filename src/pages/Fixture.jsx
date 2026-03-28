import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import CategoryTabs from '../components/CategoryTabs'
import LoadingSpinner from '../components/LoadingSpinner'
import useStore from '../store/useStore'

export default function Fixture() {
  const { categoriaActiva, torneoActivo } = useStore()
  const [fechas, setFechas] = useState([])
  const [loading, setLoading] = useState(true)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null)

  useEffect(() => {
    const fetchFixture = async () => {
      if (!torneoActivo?.id) return
      setLoading(true)

      const { data: fechasData } = await supabase
        .from('fechas')
        .select('*')
        .eq('torneo_id', torneoActivo.id)
        .order('numero', { ascending: true })

      if (!fechasData?.length) {
        setFechas([])
        setLoading(false)
        return
      }

      // Obtener partidos de cada fecha para esta categoría
      const { data: partidos } = await supabase
        .from('partidos')
        .select(`
          *,
          equipo_local:equipos!partidos_equipo_local_id_fkey(id, nombre, escudo_url),
          equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(id, nombre, escudo_url)
        `)
        .eq('categoria', categoriaActiva)
        .in('fecha_id', fechasData.map((f) => f.id))
        .order('id')

      const fechasConPartidos = fechasData.map((fecha) => ({
        ...fecha,
        partidos: (partidos || []).filter((p) => p.fecha_id === fecha.id),
      }))

      setFechas(fechasConPartidos)

      // Seleccionar la primera fecha con partidos pendientes, o la última
      const pendiente = fechasConPartidos.find((f) =>
        f.partidos.some((p) => !p.jugado && !p.walkover)
      )
      setFechaSeleccionada(pendiente?.id || fechasConPartidos[fechasConPartidos.length - 1]?.id)
      setLoading(false)
    }
    fetchFixture()
  }, [categoriaActiva, torneoActivo])

  const formatFecha = (dateStr) => {
    if (!dateStr) return null
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('es-UY', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const fechaActual = fechas.find((f) => f.id === fechaSeleccionada)

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-black text-gray-800">Fixture</h2>
      </div>

      <CategoryTabs />

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : fechas.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-gray-400 text-sm">No hay fechas cargadas aún.</p>
        </div>
      ) : (
        <>
          {/* Selector de fecha */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {fechas.map((fecha) => {
              const tienePendientes = fecha.partidos.some((p) => !p.jugado && !p.walkover)
              const esSel = fecha.id === fechaSeleccionada
              return (
                <button
                  key={fecha.id}
                  onClick={() => setFechaSeleccionada(fecha.id)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm font-semibold transition-all border ${
                    esSel
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary/30'
                  }`}
                >
                  <span>F{fecha.numero}</span>
                  {tienePendientes && !esSel && (
                    <span className="ml-1 inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Detalle fecha */}
          {fechaActual && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-700">
                  Fecha {fechaActual.numero}
                  {fechaActual.descripcion && ` — ${fechaActual.descripcion}`}
                </h3>
                {fechaActual.fecha_juego && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                    {formatFecha(fechaActual.fecha_juego)}
                  </span>
                )}
              </div>

              {fechaActual.partidos.length === 0 ? (
                <div className="card p-6 text-center">
                  <p className="text-gray-400 text-sm">No hay partidos en esta fecha para {categoriaActiva}.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fechaActual.partidos.map((partido) => (
                    <PartidoCard key={partido.id} partido={partido} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PartidoCard({ partido }) {
  const jugado = partido.jugado || partido.walkover

  return (
    <div className={`card ${jugado ? '' : 'border-dashed'}`}>
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Equipo local */}
        <div className="flex-1 flex flex-col items-center gap-1">
          {partido.equipo_local?.escudo_url ? (
            <img src={partido.equipo_local.escudo_url} alt="" className="w-10 h-10 object-contain" />
          ) : (
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-bold text-sm">{partido.equipo_local?.nombre?.[0]}</span>
            </div>
          )}
          <p className="text-xs font-semibold text-gray-700 text-center leading-tight">
            {partido.equipo_local?.nombre}
          </p>
        </div>

        {/* Resultado / vs */}
        <div className="flex flex-col items-center px-3 min-w-[80px]">
          {partido.walkover ? (
            <div className="bg-orange-100 border border-orange-300 rounded-lg px-2 py-1 text-center">
              <p className="text-orange-700 font-bold text-xs">WO</p>
              <p className="text-orange-600 text-xs">
                {partido.walkover_equipo_id === partido.equipo_local_id
                  ? 'Local'
                  : 'Visitante'}
              </p>
            </div>
          ) : partido.jugado ? (
            <div className="bg-primary/5 rounded-xl px-3 py-2 text-center">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-primary">{partido.goles_local}</span>
                <span className="text-gray-300 font-bold">—</span>
                <span className="text-2xl font-black text-primary">{partido.goles_visitante}</span>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-gray-300 font-bold text-xl">VS</span>
              <p className="text-xs text-yellow-600 font-medium mt-0.5 bg-yellow-50 px-2 py-0.5 rounded-full">
                Pendiente
              </p>
            </div>
          )}
        </div>

        {/* Equipo visitante */}
        <div className="flex-1 flex flex-col items-center gap-1">
          {partido.equipo_visitante?.escudo_url ? (
            <img src={partido.equipo_visitante.escudo_url} alt="" className="w-10 h-10 object-contain" />
          ) : (
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-bold text-sm">{partido.equipo_visitante?.nombre?.[0]}</span>
            </div>
          )}
          <p className="text-xs font-semibold text-gray-700 text-center leading-tight">
            {partido.equipo_visitante?.nombre}
          </p>
        </div>
      </div>
    </div>
  )
}
