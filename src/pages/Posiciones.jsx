import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CategoryTabs from '../components/CategoryTabs'
import LoadingSpinner from '../components/LoadingSpinner'
import useStore from '../store/useStore'

const MEDAL = ['medal-1', 'medal-2', 'medal-3']
const MEDAL_ICON = ['🥇', '🥈', '🥉']

export default function Posiciones() {
  const { profile } = useAuth()
  const { categoriaActiva } = useStore()
  const [posiciones, setPosiciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [equipoUsuario, setEquipoUsuario] = useState(null)

  useEffect(() => {
    const fetchEquipoUsuario = async () => {
      if (!profile?.id) return
      const { data } = await supabase
        .from('jugadores_equipos')
        .select('equipo_id, categoria')
        .eq('jugador_id', profile.id)
        .eq('categoria', categoriaActiva)
        .eq('activo', true)
        .single()
      setEquipoUsuario(data?.equipo_id || null)
    }
    fetchEquipoUsuario()
  }, [profile, categoriaActiva])

  useEffect(() => {
    const fetchPosiciones = async () => {
      setLoading(true)
      const { data: equipos } = await supabase
        .from('equipos')
        .select('id, nombre, escudo_url')
        .eq('categoria', categoriaActiva)
        .eq('activo', true)

      if (!equipos?.length) {
        setPosiciones([])
        setLoading(false)
        return
      }

      const { data: partidos } = await supabase
        .from('partidos')
        .select('*')
        .eq('categoria', categoriaActiva)
        .or('jugado.eq.true,walkover.eq.true')

      const tabla = equipos.map((eq) => {
        const pj_list = (partidos || []).filter(
          (p) => p.equipo_local_id === eq.id || p.equipo_visitante_id === eq.id
        )
        let pj = 0, g = 0, e = 0, p = 0, gf = 0, gc = 0, pts = 0
        pj_list.forEach((partido) => {
          pj++
          const esLocal = partido.equipo_local_id === eq.id
          if (partido.walkover) {
            if (partido.walkover_equipo_id === eq.id) { p++ }
            else { g++; gf += 3; pts += 3 }
          } else {
            const golesA = esLocal ? partido.goles_local : partido.goles_visitante
            const golesC = esLocal ? partido.goles_visitante : partido.goles_local
            gf += golesA; gc += golesC
            if (golesA > golesC) { g++; pts += 3 }
            else if (golesA === golesC) { e++; pts += 1 }
            else { p++ }
          }
        })
        return { equipo_id: eq.id, equipo: eq.nombre, escudo_url: eq.escudo_url, pj, g, e, p, gf, gc, dif: gf - gc, pts }
      })

      tabla.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts
        if (b.dif !== a.dif) return b.dif - a.dif
        return b.gf - a.gf
      })

      setPosiciones(tabla)
      setLoading(false)
    }
    fetchPosiciones()
  }, [categoriaActiva])

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-display text-3xl text-white tracking-wider">POSICIONES</h2>
        <span className="badge-gray capitalize">{categoriaActiva}</span>
      </div>

      <CategoryTabs />

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : posiciones.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-gray-500 text-sm">No hay equipos registrados en esta categoría.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Table header */}
          <div className="bg-gradient-to-r from-primary/80 via-primary to-primary/80 px-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-white/90">
                  <th className="py-3 pl-3 pr-1 text-left font-semibold tracking-wider w-8">#</th>
                  <th className="py-3 px-2 text-left font-semibold tracking-wider">Equipo</th>
                  <th className="py-3 px-1 text-center font-semibold">PJ</th>
                  <th className="py-3 px-1 text-center font-semibold">G</th>
                  <th className="py-3 px-1 text-center font-semibold">E</th>
                  <th className="py-3 px-1 text-center font-semibold">P</th>
                  <th className="py-3 px-1 text-center font-semibold">GD</th>
                  <th className="py-3 pr-3 pl-1 text-center font-bold tracking-wider">PTS</th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Table body */}
          <table className="w-full text-sm">
            <tbody>
              {posiciones.map((row, idx) => {
                const esEquipoUsuario = row.equipo_id === equipoUsuario
                const isTop3 = idx < 3

                return (
                  <tr
                    key={row.equipo_id}
                    className={`border-b border-surface-line last:border-0 transition-all duration-150
                      group cursor-default
                      ${esEquipoUsuario
                        ? 'bg-primary/12 border-l-2 border-l-primary'
                        : 'hover:bg-surface-hover'
                      }`}
                  >
                    {/* Position */}
                    <td className="py-3 pl-3 pr-1 w-8">
                      {isTop3 ? (
                        <span className={`text-sm ${MEDAL[idx]}`}>{MEDAL_ICON[idx]}</span>
                      ) : (
                        <span className="text-xs font-bold text-gray-600 group-hover:text-gray-400 transition-colors">
                          {idx + 1}
                        </span>
                      )}
                    </td>

                    {/* Team */}
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {row.escudo_url ? (
                          <img src={row.escudo_url} alt="" className="w-6 h-6 object-contain flex-shrink-0 rounded" />
                        ) : (
                          <div className="w-6 h-6 bg-primary/15 border border-primary/20 rounded-full flex-shrink-0 flex items-center justify-center">
                            <span className="text-primary text-xs font-bold">{row.equipo[0]}</span>
                          </div>
                        )}
                        <span className={`font-semibold truncate text-xs transition-colors ${
                          esEquipoUsuario ? 'text-primary' : 'text-gray-200 group-hover:text-white'
                        }`}>
                          {row.equipo}
                        </span>
                        {esEquipoUsuario && (
                          <span className="text-primary text-xs flex-shrink-0">◀</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-1 text-center text-xs text-gray-500 group-hover:text-gray-300 transition-colors">{row.pj}</td>
                    <td className="py-3 px-1 text-center text-xs text-green-500 font-medium">{row.g}</td>
                    <td className="py-3 px-1 text-center text-xs text-gray-500">{row.e}</td>
                    <td className="py-3 px-1 text-center text-xs text-red-500/80 font-medium">{row.p}</td>

                    {/* Goal diff */}
                    <td className={`py-3 px-1 text-center text-xs font-semibold ${
                      row.dif > 0 ? 'text-green-400' : row.dif < 0 ? 'text-red-400' : 'text-gray-600'
                    }`}>
                      {row.dif > 0 ? `+${row.dif}` : row.dif}
                    </td>

                    {/* Points */}
                    <td className="py-3 pr-3 pl-1 text-center">
                      <span className={`font-display text-xl leading-none transition-all ${
                        isTop3 ? 'text-white score-glow' : 'text-gray-300 group-hover:text-white'
                      }`}>
                        {row.pts}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-700">
        <span>◀ Tu equipo</span>
        <span>·</span>
        <span>🥇 Top 3</span>
      </div>
    </div>
  )
}
