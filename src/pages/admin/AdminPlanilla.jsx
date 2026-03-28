import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import useStore from '../../store/useStore'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function AdminPlanilla() {
  const { partidoId } = useParams()
  const navigate = useNavigate()
  const { configTorneo } = useStore()

  const [partido, setPartido] = useState(null)
  const [planillas, setPlanillas] = useState([]) // [{planilla, equipo, jugadores}]
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [saved, setSaved] = useState(false)

  const fetchPlanilla = useCallback(async () => {
    setLoading(true)

    // Datos del partido con equipos
    const { data: partidoData } = await supabase
      .from('partidos')
      .select(`
        *,
        equipo_local:equipos!partidos_equipo_local_id_fkey(*),
        equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(*),
        fecha:fechas(id, numero, torneo_id)
      `)
      .eq('id', partidoId)
      .single()

    if (!partidoData) { setLoading(false); return }
    setPartido(partidoData)

    // Jugadores de cada equipo en esta categoría
    const equipoIds = [partidoData.equipo_local_id, partidoData.equipo_visitante_id]
    const planillasData = []

    for (const equipoId of equipoIds) {
      const equipo = equipoId === partidoData.equipo_local_id
        ? partidoData.equipo_local
        : partidoData.equipo_visitante

      // Buscar o crear planilla
      let { data: planilla } = await supabase
        .from('planillas')
        .select('*')
        .eq('partido_id', partidoId)
        .eq('equipo_id', equipoId)
        .single()

      if (!planilla) {
        const { data: nueva } = await supabase
          .from('planillas')
          .insert({ partido_id: partidoId, equipo_id: equipoId })
          .select()
          .single()
        planilla = nueva
      }

      // Jugadores del equipo en la categoría del partido
      const { data: jugadoresEquipo } = await supabase
        .from('jugadores_equipos')
        .select('*, perfil:profiles(*)')
        .eq('equipo_id', equipoId)
        .eq('categoria', partidoData.categoria)
        .eq('activo', true)

      // Cargar planilla_jugadores existentes
      const { data: pjExistentes } = await supabase
        .from('planilla_jugadores')
        .select('*')
        .eq('planilla_id', planilla.id)

      // Combinar jugadores con datos de planilla
      const jugadores = (jugadoresEquipo || []).map((je) => {
        const pj = pjExistentes?.find((p) => p.jugador_id === je.jugador_id)
        return {
          jugador_id: je.jugador_id,
          nombre: je.perfil?.nombre || '',
          apellido: je.perfil?.apellido || '',
          presente: pj?.presente ?? false,
          goles: pj?.goles ?? 0,
          amarilla: pj?.amarilla ?? false,
          doble_amarilla: pj?.doble_amarilla ?? false,
          roja_directa: pj?.roja_directa ?? false,
          pj_id: pj?.id || null,
        }
      })

      planillasData.push({ planilla, equipo, jugadores })
    }

    setPlanillas(planillasData)
    setLoading(false)
  }, [partidoId])

  useEffect(() => { fetchPlanilla() }, [fetchPlanilla])

  const updateJugador = (planillaIdx, jugadorId, field, value) => {
    setPlanillas((prev) => {
      const next = [...prev]
      const jIdx = next[planillaIdx].jugadores.findIndex((j) => j.jugador_id === jugadorId)
      if (jIdx === -1) return prev
      const jugador = { ...next[planillaIdx].jugadores[jIdx], [field]: value }

      // Lógica: si doble amarilla, la amarilla queda en false (es un evento distinto)
      if (field === 'doble_amarilla' && value) {
        jugador.roja_directa = false
      }
      if (field === 'roja_directa' && value) {
        jugador.doble_amarilla = false
      }

      next[planillaIdx] = {
        ...next[planillaIdx],
        jugadores: [
          ...next[planillaIdx].jugadores.slice(0, jIdx),
          jugador,
          ...next[planillaIdx].jugadores.slice(jIdx + 1),
        ],
      }
      return next
    })
    setSaved(false)
  }

  // Calcular sanciones automáticamente
  const calcularSanciones = async (jugadorId, amarillaAcumulada, dobleAmarilla, rojaDirecta, fechaId) => {
    const sanciones = []
    const config = configTorneo

    if (rojaDirecta) {
      // Suspensión por roja directa (1 partido)
      sanciones.push({
        jugador_id: jugadorId,
        tipo: 'suspension_roja',
        fecha_id_suspension: fechaId,
        monto: config.multa_roja || 300,
        descripcion: 'Expulsión por tarjeta roja directa',
      })
      sanciones.push({
        jugador_id: jugadorId,
        tipo: 'multa_roja',
        monto: config.multa_roja || 300,
        descripcion: 'Multa por tarjeta roja directa',
      })
    }

    if (dobleAmarilla) {
      sanciones.push({
        jugador_id: jugadorId,
        tipo: 'suspension_roja',
        fecha_id_suspension: fechaId,
        monto: config.multa_roja || 300,
        descripcion: 'Expulsión por doble amarilla',
      })
      sanciones.push({
        jugador_id: jugadorId,
        tipo: 'multa_roja',
        monto: config.multa_roja || 300,
        descripcion: 'Multa por doble amarilla',
      })
    }

    if (amarillaAcumulada) {
      // Contar amarillas del jugador en el torneo (solo simples, no dobles)
      const { count } = await supabase
        .from('planilla_jugadores')
        .select('id', { count: 'exact' })
        .eq('jugador_id', jugadorId)
        .eq('amarilla', true)
        .eq('presente', true)

      const totalAmarillas = (count || 0) + 1 // +1 la de hoy
      const limite = config.amarillas_limite || 3

      sanciones.push({
        jugador_id: jugadorId,
        tipo: 'multa_amarilla',
        monto: config.multa_amarilla || 100,
        descripcion: `Amarilla (acumulada ${totalAmarillas})`,
      })

      if (totalAmarillas % limite === 0) {
        sanciones.push({
          jugador_id: jugadorId,
          tipo: 'suspension_amarillas',
          fecha_id_suspension: fechaId,
          monto: 0,
          descripcion: `Suspensión por acumular ${limite} amarillas`,
        })
      }
    }

    // Insertar sanciones
    if (sanciones.length > 0) {
      await supabase.from('sanciones').insert(sanciones)
    }
  }

  const handleGuardar = async () => {
    setSaving(true)
    setMsg('')

    try {
      for (const { planilla, jugadores } of planillas) {
        for (const j of jugadores) {
          const pjData = {
            planilla_id: planilla.id,
            jugador_id: j.jugador_id,
            presente: j.presente,
            goles: j.presente ? (parseInt(j.goles) || 0) : 0,
            amarilla: j.presente && j.amarilla,
            doble_amarilla: j.presente && j.doble_amarilla,
            roja_directa: j.presente && j.roja_directa,
          }

          if (j.pj_id) {
            await supabase.from('planilla_jugadores').update(pjData).eq('id', j.pj_id)
          } else {
            const { data: inserted } = await supabase
              .from('planilla_jugadores')
              .insert(pjData)
              .select()
              .single()

            // Actualizar id para sanciones
            j.pj_id = inserted?.id
          }

          // Calcular sanciones si el jugador estuvo presente y tiene tarjetas
          if (j.presente && (j.amarilla || j.doble_amarilla || j.roja_directa)) {
            await calcularSanciones(
              j.jugador_id,
              j.amarilla,
              j.doble_amarilla,
              j.roja_directa,
              partido?.fecha?.id
            )
          }
        }

        // Cerrar planilla
        await supabase.from('planillas').update({ cerrada: true }).eq('id', planilla.id)
      }

      setSaved(true)
      setMsg('Planilla guardada correctamente. Sanciones calculadas.')
      fetchPlanilla()
    } catch (err) {
      setMsg('Error al guardar: ' + err.message)
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!partido) {
    return (
      <div className="p-4 text-center text-gray-400">
        Partido no encontrado.
        <button onClick={() => navigate(-1)} className="block mx-auto mt-3 text-primary text-sm font-semibold">
          Volver
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h3 className="font-black text-gray-800 text-base">
            {partido.equipo_local?.nombre} vs {partido.equipo_visitante?.nombre}
          </h3>
          <p className="text-xs text-gray-400">
            Fecha {partido.fecha?.numero} · {partido.categoria} · {partido.goles_local}-{partido.goles_visitante}
          </p>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex gap-3 flex-wrap text-xs text-gray-500">
        <span>✓ Presente</span>
        <span className="text-yellow-600">🟨 Amarilla</span>
        <span className="text-orange-600">🟧 Doble</span>
        <span className="text-red-600">🟥 Roja</span>
        <span className="text-green-600">⚽ Goles</span>
      </div>

      {/* Planillas por equipo */}
      {planillas.map((item, pIdx) => (
        <div key={item.planilla.id} className="card overflow-hidden">
          <div className="bg-primary px-4 py-3 flex items-center gap-2">
            {item.equipo?.escudo_url ? (
              <img src={item.equipo.escudo_url} alt="" className="w-6 h-6 object-contain" />
            ) : (
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{item.equipo?.nombre?.[0]}</span>
              </div>
            )}
            <span className="text-white font-bold text-sm">{item.equipo?.nombre}</span>
            <span className="ml-auto text-white/60 text-xs">
              {item.jugadores.filter((j) => j.presente).length} presentes
            </span>
          </div>

          {item.jugadores.length === 0 ? (
            <p className="p-4 text-sm text-gray-400 text-center">No hay jugadores registrados en este equipo.</p>
          ) : (
            <div>
              {/* Header tabla */}
              <div className="grid grid-cols-[1fr_32px_32px_32px_32px_56px] gap-1 px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-400 font-semibold">
                <span>Jugador</span>
                <span className="text-center">✓</span>
                <span className="text-center">🟨</span>
                <span className="text-center">🟧</span>
                <span className="text-center">🟥</span>
                <span className="text-center">⚽</span>
              </div>

              <div className="divide-y divide-gray-50">
                {item.jugadores.map((j) => (
                  <div
                    key={j.jugador_id}
                    className={`grid grid-cols-[1fr_32px_32px_32px_32px_56px] gap-1 items-center px-3 py-2.5 transition-colors ${
                      j.presente ? 'bg-white' : 'bg-gray-50/80'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${j.presente ? 'text-gray-800' : 'text-gray-400'}`}>
                        {j.apellido}, {j.nombre}
                      </p>
                    </div>

                    {/* Presente */}
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={j.presente}
                        onChange={(e) => {
                          updateJugador(pIdx, j.jugador_id, 'presente', e.target.checked)
                          if (!e.target.checked) {
                            updateJugador(pIdx, j.jugador_id, 'goles', 0)
                            updateJugador(pIdx, j.jugador_id, 'amarilla', false)
                            updateJugador(pIdx, j.jugador_id, 'doble_amarilla', false)
                            updateJugador(pIdx, j.jugador_id, 'roja_directa', false)
                          }
                        }}
                        className="w-5 h-5 accent-green-600 cursor-pointer"
                      />
                    </div>

                    {/* Amarilla */}
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={j.amarilla}
                        onChange={(e) => updateJugador(pIdx, j.jugador_id, 'amarilla', e.target.checked)}
                        disabled={!j.presente}
                        className="w-5 h-5 accent-yellow-500 cursor-pointer disabled:opacity-30"
                      />
                    </div>

                    {/* Doble amarilla */}
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={j.doble_amarilla}
                        onChange={(e) => updateJugador(pIdx, j.jugador_id, 'doble_amarilla', e.target.checked)}
                        disabled={!j.presente}
                        className="w-5 h-5 accent-orange-500 cursor-pointer disabled:opacity-30"
                      />
                    </div>

                    {/* Roja directa */}
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={j.roja_directa}
                        onChange={(e) => updateJugador(pIdx, j.jugador_id, 'roja_directa', e.target.checked)}
                        disabled={!j.presente}
                        className="w-5 h-5 accent-red-600 cursor-pointer disabled:opacity-30"
                      />
                    </div>

                    {/* Goles */}
                    <div className="flex justify-center">
                      <input
                        type="number"
                        value={j.goles}
                        onChange={(e) => updateJugador(pIdx, j.jugador_id, 'goles', Math.max(0, parseInt(e.target.value) || 0))}
                        disabled={!j.presente}
                        min="0"
                        max="20"
                        className="w-12 text-center text-sm font-bold border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-30 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen del equipo */}
              <div className="bg-gray-50 border-t border-gray-100 px-4 py-2 flex gap-4 text-xs text-gray-600">
                <span>Presentes: <strong className="text-gray-800">{item.jugadores.filter((j) => j.presente).length}</strong></span>
                <span>Goles: <strong className="text-green-600">{item.jugadores.reduce((s, j) => s + (j.presente ? (j.goles || 0) : 0), 0)}</strong></span>
                <span>🟨 <strong className="text-yellow-600">{item.jugadores.filter((j) => j.presente && j.amarilla).length}</strong></span>
                <span>🟧 <strong className="text-orange-600">{item.jugadores.filter((j) => j.presente && j.doble_amarilla).length}</strong></span>
                <span>🟥 <strong className="text-red-600">{item.jugadores.filter((j) => j.presente && j.roja_directa).length}</strong></span>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Mensaje */}
      {msg && (
        <div className={`p-3 rounded-xl text-sm font-medium ${
          msg.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {msg}
        </div>
      )}

      {/* Botón guardar */}
      <button
        onClick={handleGuardar}
        disabled={saving || saved}
        className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all ${
          saved
            ? 'bg-green-600 text-white'
            : 'bg-primary text-white hover:bg-primary-900 active:scale-95'
        } disabled:opacity-70`}
      >
        {saving ? (
          <>
            <LoadingSpinner size="sm" color="white" />
            Guardando y calculando sanciones...
          </>
        ) : saved ? (
          '✓ Planilla guardada'
        ) : (
          'Guardar planilla'
        )}
      </button>

      {!saved && (
        <p className="text-xs text-gray-400 text-center">
          Al guardar se calcularán automáticamente las sanciones y multas.
        </p>
      )}
    </div>
  )
}
