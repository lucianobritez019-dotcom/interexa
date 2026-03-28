import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function MiEstado() {
  const { profile } = useAuth()
  const [sanciones, setSanciones] = useState([])
  const [cuotas, setCuotas] = useState([])
  const [equipos, setEquipos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return

    const fetchEstado = async () => {
      setLoading(true)

      const [sancionesRes, cuotasRes, equiposRes] = await Promise.all([
        supabase
          .from('sanciones')
          .select(`*, fecha:fechas(numero, fecha_juego)`)
          .eq('jugador_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('cuotas')
          .select('*')
          .eq('jugador_id', profile.id)
          .order('anio', { ascending: false })
          .order('mes', { ascending: false }),
        supabase
          .from('jugadores_equipos')
          .select('*, equipo:equipos(nombre, categoria, escudo_url)')
          .eq('jugador_id', profile.id)
          .eq('activo', true),
      ])

      setSanciones(sancionesRes.data || [])
      setCuotas(cuotasRes.data || [])
      setEquipos(equiposRes.data || [])
      setLoading(false)
    }

    fetchEstado()
  }, [profile])

  const sancionesPendientes = sanciones.filter(
    (s) => s.tipo.startsWith('multa') && !s.pagada
  )
  const suspensionActiva = sanciones.find(
    (s) => (s.tipo === 'suspension_amarillas' || s.tipo === 'suspension_roja') && s.fecha_id_suspension
  )
  const cuotasPendientes = cuotas.filter((c) => !c.pagada)
  const deudaTotal =
    sancionesPendientes.reduce((sum, s) => sum + Number(s.monto || 0), 0) +
    cuotasPendientes.reduce((sum, c) => sum + Number(c.monto || 0), 0)

  const estaActivo = !suspensionActiva && equipos.length > 0

  const MESES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-black text-gray-800">Mi Estado</h2>

      {/* Estado general */}
      <div className={`card p-5 border-l-4 ${estaActivo ? 'border-l-green-500' : 'border-l-red-600'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Estado</p>
            <p className={`text-2xl font-black mt-1 ${estaActivo ? 'text-green-600' : 'text-red-600'}`}>
              {estaActivo ? 'Activo' : 'Inactivo'}
            </p>
            {suspensionActiva && (
              <p className="text-xs text-red-500 mt-1">
                Suspendido hasta fecha {suspensionActiva.fecha?.numero || '—'}
              </p>
            )}
          </div>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
            estaActivo ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <span className="text-2xl">{estaActivo ? '✅' : '🚫'}</span>
          </div>
        </div>
      </div>

      {/* Mis equipos */}
      {equipos.length > 0 && (
        <div className="card p-4">
          <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span>👥</span> Mis Equipos
          </h3>
          <div className="space-y-2">
            {equipos.map((je) => (
              <div key={je.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                {je.equipo?.escudo_url ? (
                  <img src={je.equipo.escudo_url} alt="" className="w-8 h-8 object-contain" />
                ) : (
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold text-xs">{je.equipo?.nombre?.[0]}</span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{je.equipo?.nombre}</p>
                  <p className="text-gray-400 text-xs capitalize">{je.categoria}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deuda total */}
      {deudaTotal > 0 && (
        <div className="card p-4 border border-red-200 bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-600 font-medium uppercase tracking-wide">Deuda total</p>
              <p className="text-3xl font-black text-red-700 mt-1">${deudaTotal.toFixed(0)}</p>
            </div>
            <span className="text-4xl">💸</span>
          </div>
        </div>
      )}

      {/* Sanciones */}
      <div className="card p-4">
        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>🟨</span> Sanciones
          {sancionesPendientes.length > 0 && (
            <span className="badge-red ml-auto">{sancionesPendientes.length} pendiente{sancionesPendientes.length !== 1 ? 's' : ''}</span>
          )}
        </h3>

        {sanciones.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Sin sanciones registradas.</p>
        ) : (
          <div className="space-y-2">
            {sanciones.map((s) => (
              <div key={s.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  s.pagada ? 'bg-gray-50 border-gray-100' : 'bg-red-50 border-red-100'
                }`}>
                <span className="text-lg flex-shrink-0">
                  {s.tipo === 'suspension_amarillas' ? '🟨' :
                   s.tipo === 'suspension_roja' ? '🟥' :
                   s.tipo === 'multa_amarilla' ? '💛' : '🔴'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 capitalize">
                    {s.tipo.replace(/_/g, ' ')}
                  </p>
                  {s.descripcion && (
                    <p className="text-xs text-gray-500 truncate">{s.descripcion}</p>
                  )}
                  {s.fecha && (
                    <p className="text-xs text-gray-400">Fecha {s.fecha.numero}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {s.monto > 0 && (
                    <p className={`font-bold text-sm ${s.pagada ? 'text-gray-400 line-through' : 'text-red-600'}`}>
                      ${s.monto}
                    </p>
                  )}
                  <span className={`text-xs font-medium ${s.pagada ? 'text-green-600' : 'text-red-600'}`}>
                    {s.pagada ? 'Pagada' : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cuotas */}
      <div className="card p-4">
        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>💰</span> Cuotas
          {cuotasPendientes.length > 0 && (
            <span className="badge-red ml-auto">{cuotasPendientes.length} pendiente{cuotasPendientes.length !== 1 ? 's' : ''}</span>
          )}
        </h3>

        {cuotas.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Sin cuotas registradas.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {cuotas.map((c) => (
              <div key={c.id}
                className={`p-3 rounded-xl border text-center ${
                  c.pagada ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                }`}>
                <p className="text-xs font-bold text-gray-600">
                  {MESES[c.mes]} {c.anio}
                </p>
                <p className={`font-black text-lg ${c.pagada ? 'text-green-600' : 'text-red-600'}`}>
                  ${c.monto}
                </p>
                <span className={`text-xs font-medium ${c.pagada ? 'text-green-600' : 'text-red-500'}`}>
                  {c.pagada ? '✓ Pagada' : 'Pendiente'}
                </span>
                {c.fecha_pago && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(c.fecha_pago).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
