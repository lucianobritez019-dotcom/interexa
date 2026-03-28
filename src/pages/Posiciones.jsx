import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CategoryTabs from '../components/CategoryTabs'
import LoadingSpinner from '../components/LoadingSpinner'
import useStore from '../store/useStore'

export default function Posiciones() {
  const { profile } = useAuth()
  const { categoriaActiva } = useStore()
  const [posiciones, setPosiciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [equipoUsuario, setEquipoUsuario] = useState(null)

  // Obtener el equipo del usuario en la categoría activa
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
      // Obtener equipos
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

      // Obtener partidos jugados de esta categoría
      const { data: partidos } = await supabase
        .from('partidos')
        .select('*')
        .eq('categoria', categoriaActiva)
        .or('jugado.eq.true,walkover.eq.true')

      // Calcular posiciones manualmente
      const tabla = equipos.map((eq) => {
        const pj_list = (partidos || []).filter(
          (p) => p.equipo_local_id === eq.id || p.equipo_visitante_id === eq.id
        )

        let pj = 0, g = 0, e = 0, p = 0, gf = 0, gc = 0, pts = 0

        pj_list.forEach((partido) => {
          pj++
          const esLocal = partido.equipo_local_id === eq.id

          if (partido.walkover) {
            if (partido.walkover_equipo_id === eq.id) {
              // Perdió por walkover
              p++
            } else {
              // Ganó por walkover
              g++
              gf += 3
              pts += 3
            }
          } else {
            const golesA = esLocal ? partido.goles_local : partido.goles_visitante
            const golesC = esLocal ? partido.goles_visitante : partido.goles_local
            gf += golesA
            gc += golesC
            if (golesA > golesC) { g++; pts += 3 }
            else if (golesA === golesC) { e++; pts += 1 }
            else { p++ }
          }
        })

        return {
          equipo_id: eq.id,
          equipo: eq.nombre,
          escudo_url: eq.escudo_url,
          pj, g, e, p, gf, gc,
          dif: gf - gc,
          pts,
        }
      })

      // Ordenar por puntos, diferencia, goles favor
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
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-black text-gray-800">Posiciones</h2>
        <span className="badge-gray capitalize">{categoriaActiva}</span>
      </div>

      <CategoryTabs />

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : posiciones.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-400 text-sm">No hay equipos registrados en esta categoría.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-white">
                <th className="py-2.5 pl-3 pr-1 text-left font-semibold w-6">#</th>
                <th className="py-2.5 px-2 text-left font-semibold">Equipo</th>
                <th className="py-2.5 px-1 text-center font-semibold">PJ</th>
                <th className="py-2.5 px-1 text-center font-semibold">G</th>
                <th className="py-2.5 px-1 text-center font-semibold">E</th>
                <th className="py-2.5 px-1 text-center font-semibold">P</th>
                <th className="py-2.5 px-1 text-center font-semibold">GF</th>
                <th className="py-2.5 px-1 text-center font-semibold">GC</th>
                <th className="py-2.5 px-1 text-center font-semibold">DIF</th>
                <th className="py-2.5 pr-3 pl-1 text-center font-semibold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {posiciones.map((row, idx) => {
                const esEquipoUsuario = row.equipo_id === equipoUsuario
                return (
                  <tr
                    key={row.equipo_id}
                    className={`border-b border-gray-100 last:border-0 transition-colors
                      ${esEquipoUsuario
                        ? 'bg-red-50 border-l-4 border-l-primary'
                        : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                  >
                    <td className="py-3 pl-3 pr-1">
                      <span className={`text-xs font-bold ${idx < 3 ? 'text-primary' : 'text-gray-400'}`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {row.escudo_url ? (
                          <img src={row.escudo_url} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
                        ) : (
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex-shrink-0 flex items-center justify-center">
                            <span className="text-primary text-xs font-bold">{row.equipo[0]}</span>
                          </div>
                        )}
                        <span className={`font-medium truncate ${esEquipoUsuario ? 'text-primary font-bold' : 'text-gray-800'}`}>
                          {row.equipo}
                        </span>
                        {esEquipoUsuario && (
                          <span className="text-primary text-xs">★</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-1 text-center text-gray-600">{row.pj}</td>
                    <td className="py-3 px-1 text-center text-gray-600">{row.g}</td>
                    <td className="py-3 px-1 text-center text-gray-600">{row.e}</td>
                    <td className="py-3 px-1 text-center text-gray-600">{row.p}</td>
                    <td className="py-3 px-1 text-center text-gray-600">{row.gf}</td>
                    <td className="py-3 px-1 text-center text-gray-600">{row.gc}</td>
                    <td className={`py-3 px-1 text-center font-medium ${row.dif > 0 ? 'text-green-600' : row.dif < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {row.dif > 0 ? `+${row.dif}` : row.dif}
                    </td>
                    <td className="py-3 pr-3 pl-1 text-center">
                      <span className="font-black text-primary text-base">{row.pts}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-3">
        ★ Tu equipo &nbsp;·&nbsp; Los primeros 3 puestos en rojo
      </p>
    </div>
  )
}
