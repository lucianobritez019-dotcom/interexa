import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import CategoryTabs from '../components/CategoryTabs'
import LoadingSpinner from '../components/LoadingSpinner'
import useStore from '../store/useStore'

export default function Vallas() {
  const { categoriaActiva } = useStore()
  const [vallas, setVallas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVallas = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('tabla_vallas')
        .select('*')
        .eq('categoria', categoriaActiva)
        .order('goles_recibidos', { ascending: true })

      if (!error) setVallas(data || [])
      setLoading(false)
    }
    fetchVallas()
  }, [categoriaActiva])

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-black text-gray-800">Vallas Menos Vencidas</h2>
      </div>

      <CategoryTabs />

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : vallas.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3">🥅</div>
          <p className="text-gray-400 text-sm">No hay datos disponibles.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-white font-bold text-sm">Equipos</p>
              </div>
              <p className="text-white/80 text-xs font-semibold w-8 text-center">PJ</p>
              <p className="text-white/80 text-xs font-semibold w-10 text-center">GR</p>
              <p className="text-white/80 text-xs font-semibold w-10 text-center">PI</p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {vallas.map((row, idx) => (
              <div key={row.equipo_id}
                className={`flex items-center gap-3 px-4 py-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                <span className={`text-sm font-bold w-5 text-center flex-shrink-0 ${
                  idx === 0 ? 'text-primary' : 'text-gray-400'
                }`}>
                  {idx + 1}
                </span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {row.escudo_url ? (
                    <img src={row.escudo_url} alt="" className="w-7 h-7 object-contain flex-shrink-0" />
                  ) : (
                    <div className="w-7 h-7 bg-primary/10 rounded-full flex-shrink-0 flex items-center justify-center">
                      <span className="text-primary text-xs font-bold">{row.equipo[0]}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{row.equipo}</p>
                    {row.porterias_imbatidas > 0 && (
                      <p className="text-green-600 text-xs font-medium">
                        🔒 {row.porterias_imbatidas} portería{row.porterias_imbatidas !== 1 ? 's' : ''} imbatida{row.porterias_imbatidas !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-gray-500 text-sm w-8 text-center">{row.partidos_jugados}</span>
                <span className={`font-bold text-sm w-10 text-center ${
                  idx === 0 ? 'text-primary' : 'text-gray-700'
                }`}>
                  {row.goles_recibidos}
                </span>
                <span className="text-gray-500 text-sm w-10 text-center">{row.porterias_imbatidas}</span>
              </div>
            ))}
          </div>

          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-400">GR = Goles Recibidos &nbsp;·&nbsp; PI = Porterías Imbatidas</p>
          </div>
        </div>
      )}
    </div>
  )
}
