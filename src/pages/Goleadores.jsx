import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import CategoryTabs from '../components/CategoryTabs'
import LoadingSpinner from '../components/LoadingSpinner'
import useStore from '../store/useStore'

export default function Goleadores() {
  const { categoriaActiva } = useStore()
  const [goleadores, setGoleadores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGoleadores = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('tabla_goleadores')
        .select('*')
        .eq('categoria', categoriaActiva)
        .order('total_goles', { ascending: false })
        .limit(50)

      if (!error) setGoleadores(data || [])
      setLoading(false)
    }
    fetchGoleadores()
  }, [categoriaActiva])

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-black text-gray-800">Goleadores</h2>
        <span className="badge-gray capitalize">{categoriaActiva}</span>
      </div>

      <CategoryTabs />

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : goleadores.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3">⚽</div>
          <p className="text-gray-400 text-sm">No hay goles registrados aún.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Top 3 destacados */}
          {goleadores.slice(0, 3).length > 0 && (
            <div className="bg-gradient-to-br from-primary to-primary-900 p-4">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Top Goleadores</p>
              <div className="flex items-end justify-center gap-3">
                {/* 2do lugar */}
                {goleadores[1] && (
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2 overflow-hidden">
                      {goleadores[1].foto_url
                        ? <img src={goleadores[1].foto_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-white text-lg font-bold">{goleadores[1].nombre[0]}</span>
                      }
                    </div>
                    <div className="bg-gray-400 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-1">2°</div>
                    <p className="text-white text-xs text-center font-medium leading-tight">
                      {goleadores[1].nombre}
                    </p>
                    <p className="text-white/60 text-xs text-center">{goleadores[1].equipo}</p>
                    <p className="text-white font-black text-xl mt-1">{goleadores[1].total_goles}</p>
                  </div>
                )}
                {/* 1er lugar */}
                {goleadores[0] && (
                  <div className="flex-1 flex flex-col items-center -mt-4">
                    <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center mb-2 overflow-hidden ring-2 ring-yellow-400">
                      {goleadores[0].foto_url
                        ? <img src={goleadores[0].foto_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-white text-2xl font-bold">{goleadores[0].nombre[0]}</span>
                      }
                    </div>
                    <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full mb-1">🥇 1°</div>
                    <p className="text-white text-sm text-center font-bold leading-tight">
                      {goleadores[0].nombre}
                    </p>
                    <p className="text-white/60 text-xs text-center">{goleadores[0].equipo}</p>
                    <p className="text-yellow-400 font-black text-2xl mt-1">{goleadores[0].total_goles}</p>
                  </div>
                )}
                {/* 3er lugar */}
                {goleadores[2] && (
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2 overflow-hidden">
                      {goleadores[2].foto_url
                        ? <img src={goleadores[2].foto_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-white text-lg font-bold">{goleadores[2].nombre[0]}</span>
                      }
                    </div>
                    <div className="bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-1">3°</div>
                    <p className="text-white text-xs text-center font-medium leading-tight">
                      {goleadores[2].nombre}
                    </p>
                    <p className="text-white/60 text-xs text-center">{goleadores[2].equipo}</p>
                    <p className="text-white font-black text-xl mt-1">{goleadores[2].total_goles}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lista completa */}
          <div className="divide-y divide-gray-100">
            {goleadores.map((g, idx) => (
              <div key={g.jugador_id} className="flex items-center gap-3 px-4 py-3">
                <span className={`text-sm font-bold w-6 text-center flex-shrink-0 ${
                  idx === 0 ? 'text-yellow-500' :
                  idx === 1 ? 'text-gray-400' :
                  idx === 2 ? 'text-amber-600' :
                  'text-gray-400'
                }`}>
                  {idx + 1}
                </span>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {g.foto_url
                    ? <img src={g.foto_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-primary font-bold text-sm">{g.nombre[0]}{g.apellido[0]}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {g.nombre} {g.apellido}
                  </p>
                  <p className="text-gray-400 text-xs truncate">{g.equipo}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-2xl font-black text-primary">{g.total_goles}</span>
                  <span className="text-gray-400 text-xs">gol{g.total_goles !== 1 ? 'es' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
