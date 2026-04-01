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
  const jugados = fechaActual?.partidos.filter((p) => p.jugado || p.walkover).length ?? 0
  const total   = fechaActual?.partidos.length ?? 0

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-display text-3xl text-white tracking-wider">FIXTURE</h2>
      </div>

      <CategoryTabs />

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : fechas.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-gray-500 text-sm">No hay fechas cargadas aún.</p>
        </div>
      ) : (
        <>
          {/* Fecha selector pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide -mx-1 px-1">
            {fechas.map((fecha) => {
              const tienePendientes = fecha.partidos.some((p) => !p.jugado && !p.walkover)
              const esSel = fecha.id === fechaSeleccionada
              const todosJugados = fecha.partidos.length > 0 &&
                fecha.partidos.every((p) => p.jugado || p.walkover)

              return (
                <button
                  key={fecha.id}
                  onClick={() => setFechaSeleccionada(fecha.id)}
                  className={`relative flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold
                               transition-all duration-200 border ${
                    esSel
                      ? 'bg-primary text-white border-primary shadow-glow-sm'
                      : 'bg-surface text-gray-500 border-surface-line hover:border-primary/40 hover:text-gray-200'
                  }`}
                >
                  F{fecha.numero}
                  {tienePendientes && !esSel && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full border border-surface-deep" />
                  )}
                  {todosJugados && !esSel && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-surface-deep" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Fecha header */}
          {fechaActual && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-base">
                    Fecha {fechaActual.numero}
                    {fechaActual.descripcion && (
                      <span className="text-gray-500 font-normal"> — {fechaActual.descripcion}</span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {fechaActual.fecha_juego && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none"
                          viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        {formatFecha(fechaActual.fecha_juego)}
                      </span>
                    )}
                    {total > 0 && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        jugados === total
                          ? 'bg-green-950/60 text-green-400 border border-green-900/50'
                          : jugados > 0
                          ? 'bg-yellow-950/60 text-yellow-400 border border-yellow-900/50'
                          : 'bg-surface-raised text-gray-500 border border-surface-line'
                      }`}>
                        {jugados}/{total} jugados
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {fechaActual.partidos.length === 0 ? (
                <div className="card p-8 text-center">
                  <p className="text-gray-500 text-sm">
                    No hay partidos para {categoriaActiva} en esta fecha.
                  </p>
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

function TeamBlock({ equipo, side }) {
  return (
    <div className={`flex-1 flex flex-col items-center gap-1.5 ${side === 'right' ? 'items-center' : 'items-center'}`}>
      {equipo?.escudo_url ? (
        <img src={equipo.escudo_url} alt="" className="w-12 h-12 object-contain drop-shadow-lg" />
      ) : (
        <div className="w-12 h-12 bg-primary/15 border border-primary/25 rounded-full flex items-center justify-center">
          <span className="text-primary font-display text-lg leading-none">
            {equipo?.nombre?.[0] ?? '?'}
          </span>
        </div>
      )}
      <p className="text-xs font-semibold text-gray-300 text-center leading-tight max-w-[80px] line-clamp-2">
        {equipo?.nombre ?? '—'}
      </p>
    </div>
  )
}

function PartidoCard({ partido }) {
  const jugado = partido.jugado
  const walkover = partido.walkover
  const pendiente = !jugado && !walkover

  return (
    <div className={`rounded-xl border overflow-hidden transition-all duration-200
      hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40
      ${jugado
        ? 'bg-surface border-surface-line'
        : walkover
        ? 'bg-orange-950/20 border-orange-900/40'
        : 'bg-surface border-surface-line border-dashed'
      }`}
    >
      {/* Top label */}
      {(jugado || walkover || partido.hora_inicio) && (
        <div className={`px-4 pt-2 pb-0 flex items-center justify-between`}>
          {partido.hora_inicio && (
            <span className="text-xs text-gray-600 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none"
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" d="M12 6v6l4 2" />
              </svg>
              {partido.hora_inicio.slice(0, 5)}
            </span>
          )}
          {jugado && (
            <span className="text-xs text-green-500 font-medium ml-auto flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
              Final
            </span>
          )}
          {walkover && (
            <span className="text-xs text-orange-400 font-medium ml-auto">⚠ Walkover</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-3">
        <TeamBlock equipo={partido.equipo_local} side="left" />

        {/* Center score / vs */}
        <div className="flex flex-col items-center px-2 min-w-[90px]">
          {walkover ? (
            <div className="text-center">
              <div className="text-2xl font-display tracking-widest text-orange-400">WO</div>
              <p className="text-orange-500/80 text-xs mt-0.5">
                pierde {partido.walkover_equipo_id === partido.equipo_local_id ? 'local' : 'visitante'}
              </p>
            </div>
          ) : jugado ? (
            <div className="text-center">
              <div className="flex items-center gap-2">
                <span className={`font-display text-4xl leading-none transition-all
                  ${partido.goles_local > partido.goles_visitante ? 'text-white score-glow' : 'text-gray-500'}`}>
                  {partido.goles_local}
                </span>
                <span className="text-gray-700 font-bold text-sm mb-1">—</span>
                <span className={`font-display text-4xl leading-none transition-all
                  ${partido.goles_visitante > partido.goles_local ? 'text-white score-glow' : 'text-gray-500'}`}>
                  {partido.goles_visitante}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-1">
              <span className="text-gray-600 font-display text-2xl tracking-widest">VS</span>
              <div className="flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-yellow-600 text-xs font-medium">Pendiente</span>
              </div>
            </div>
          )}
        </div>

        <TeamBlock equipo={partido.equipo_visitante} side="right" />
      </div>
    </div>
  )
}
