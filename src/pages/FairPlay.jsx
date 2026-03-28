import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import CategoryTabs from '../components/CategoryTabs'
import LoadingSpinner from '../components/LoadingSpinner'
import useStore from '../store/useStore'

export default function FairPlay() {
  const { categoriaActiva } = useStore()
  const [tabla, setTabla] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFairPlay = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('tabla_fair_play')
        .select('*')
        .eq('categoria', categoriaActiva)
        .order('puntos_negativos', { ascending: true })

      if (!error) setTabla(data || [])
      setLoading(false)
    }
    fetchFairPlay()
  }, [categoriaActiva])

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-xl font-black text-gray-800">Fair Play</h2>
        <span className="badge-gray capitalize">{categoriaActiva}</span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Menos puntos negativos = Mejor conducta
      </p>

      <CategoryTabs />

      {/* Leyenda */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <span className="inline-block w-4 h-4 bg-yellow-400 rounded-sm" />
          Amarilla = 1 pto
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <span className="inline-block w-4 h-4 bg-orange-500 rounded-sm" />
          Doble = 3 pts
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <span className="inline-block w-4 h-4 bg-red-600 rounded-sm" />
          Roja = 5 pts
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : tabla.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3">🛡️</div>
          <p className="text-gray-400 text-sm">No hay datos disponibles.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-white">
                <th className="py-2.5 pl-3 pr-1 text-left font-semibold w-6">#</th>
                <th className="py-2.5 px-2 text-left font-semibold">Equipo</th>
                <th className="py-2.5 px-2 text-center font-semibold">
                  <span className="text-yellow-300">🟨</span>
                </th>
                <th className="py-2.5 px-2 text-center font-semibold">
                  <span>🟧</span>
                </th>
                <th className="py-2.5 px-2 text-center font-semibold">
                  <span className="text-red-300">🟥</span>
                </th>
                <th className="py-2.5 pr-3 pl-1 text-center font-semibold">Pts-</th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((row, idx) => (
                <tr
                  key={row.equipo_id}
                  className={`border-b border-gray-100 last:border-0 ${
                    idx === 0 ? 'bg-green-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <td className="py-3 pl-3 pr-1">
                    <span className={`text-xs font-bold ${
                      idx === 0 ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex-shrink-0 flex items-center justify-center">
                        <span className="text-primary text-xs font-bold">{row.equipo[0]}</span>
                      </div>
                      <span className="font-medium text-gray-800 truncate">{row.equipo}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`font-semibold ${row.amarillas > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                      {row.amarillas}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`font-semibold ${row.dobles_amarillas > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                      {row.dobles_amarillas}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`font-semibold ${row.rojas_directas > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {row.rojas_directas}
                    </span>
                  </td>
                  <td className="py-3 pr-3 pl-1 text-center">
                    <span className={`font-black text-base ${
                      row.puntos_negativos === 0 ? 'text-green-600' :
                      row.puntos_negativos <= 5 ? 'text-yellow-600' :
                      row.puntos_negativos <= 10 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {row.puntos_negativos}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
