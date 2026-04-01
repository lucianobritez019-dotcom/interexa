import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import useStore from '../../store/useStore'
import LoadingSpinner from '../../components/LoadingSpinner'

const CATEGORIAS = ['primera', 'ejecutivo', 'master']
const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// ── Algoritmo round-robin ──────────────────────────────────
function generateRoundRobin(teams) {
  if (teams.length < 2) return []
  const list = [...teams]
  if (list.length % 2 !== 0) list.push(null) // ghost = libre
  const n = list.length
  const rotating = [...list]
  const rounds = []
  for (let r = 0; r < n - 1; r++) {
    const pairs = []
    for (let i = 0; i < n / 2; i++) {
      const home = rotating[i]
      const away = rotating[n - 1 - i]
      if (home !== null && away !== null) pairs.push({ local: home, visitante: away })
    }
    rounds.push(pairs)
    // Rotar manteniendo rotating[0] fijo
    rotating.splice(1, 0, rotating.pop())
  }
  return rounds
}

// ── Fechas disponibles según días de semana ────────────────
function getAvailableDates(startDateStr, diasDisponibles, count) {
  const dates = []
  const cur = new Date(startDateStr + 'T12:00:00')
  while (dates.length < count) {
    if (diasDisponibles.includes(cur.getDay())) {
      dates.push(cur.toISOString().split('T')[0])
    }
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

// ── Slots de hora (cada 60 min) ────────────────────────────
function getTimeSlots(horaInicio, horaFin) {
  const [h1] = horaInicio.split(':').map(Number)
  const [h2] = horaFin.split(':').map(Number)
  const slots = []
  for (let h = h1; h < h2; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
  }
  return slots
}

function fmtDate(str) {
  if (!str) return ''
  return new Date(str + 'T00:00:00').toLocaleDateString('es-UY', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function fmtHora(t) {
  if (!t) return ''
  return t.slice(0, 5)
}

export default function AdminFixture() {
  const { torneoActivo } = useStore()
  const navigate = useNavigate()
  const [fechas, setFechas] = useState([])
  const [equipos, setEquipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [categoriaFiltro, setCategoriaFiltro] = useState('primera')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // Form: fecha manual
  const [formFecha, setFormFecha] = useState({ numero: '', fecha_juego: '', descripcion: '' })
  // Form: partido manual
  const [formPartido, setFormPartido] = useState({
    fecha_id: '', equipo_local_id: '', equipo_visitante_id: '',
    categoria: 'primera', hora_inicio: '',
    goles_local: 0, goles_visitante: 0,
    jugado: false, walkover: false, walkover_equipo_id: '',
  })
  // Form: generar fixture
  const [genCfg, setGenCfg] = useState({
    fechaInicio: '',
    diasDisponibles: [6],
    horaInicio: '14:00',
    horaFin: '20:00',
    tipo: 'ida',
    categorias: ['primera', 'ejecutivo', 'master'],
  })
  const [genPreview, setGenPreview] = useState(null)
  // Form: reprogramar fecha
  const [reprogFecha, setReprogFecha] = useState(null) // { id, numero, fecha_juego }
  const [reprogNuevaFecha, setReprogNuevaFecha] = useState('')

  const fetchData = async () => {
    if (!torneoActivo?.id) { setLoading(false); return }
    setLoading(true)
    const [fechasRes, equiposRes] = await Promise.all([
      supabase
        .from('fechas')
        .select(`*, partidos(*, equipo_local:equipos!partidos_equipo_local_id_fkey(nombre), equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(nombre))`)
        .eq('torneo_id', torneoActivo.id)
        .order('numero'),
      supabase.from('equipos').select('*').eq('activo', true).order('nombre'),
    ])
    setFechas(fechasRes.data || [])
    setEquipos(equiposRes.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [torneoActivo])

  // ── Postergar 1 semana ─────────────────────────────────
  const handlePostergar = async (fecha) => {
    if (!fecha.fecha_juego) { alert('Esta fecha no tiene día asignado.'); return }
    if (!confirm(`¿Postergar Fecha ${fecha.numero} una semana?`)) return
    const d = new Date(fecha.fecha_juego + 'T12:00:00')
    d.setDate(d.getDate() + 7)
    const nuevaFecha = d.toISOString().split('T')[0]
    await supabase.from('fechas').update({ fecha_juego: nuevaFecha }).eq('id', fecha.id)
    fetchData()
  }

  // ── Reprogramar a otra fecha ───────────────────────────
  const handleReprogramar = async () => {
    if (!reprogNuevaFecha) { setMsg('Seleccioná una fecha.'); return }
    setSaving(true)
    await supabase.from('fechas').update({ fecha_juego: reprogNuevaFecha }).eq('id', reprogFecha.id)
    setModal(null)
    setReprogFecha(null)
    setReprogNuevaFecha('')
    setMsg('')
    fetchData()
    setSaving(false)
  }

  // ── Guardar fecha manual ───────────────────────────────
  const handleSaveFecha = async () => {
    if (!formFecha.numero) { setMsg('Número de fecha requerido.'); return }
    setSaving(true)
    const payload = {
      torneo_id: torneoActivo.id,
      numero: parseInt(formFecha.numero),
      fecha_juego: formFecha.fecha_juego || null,
      descripcion: formFecha.descripcion || null,
    }
    const { error } = formFecha.id
      ? await supabase.from('fechas').update(payload).eq('id', formFecha.id)
      : await supabase.from('fechas').insert(payload)
    if (error) { setMsg('Error: ' + error.message); setSaving(false); return }
    setModal(null); setMsg(''); fetchData(); setSaving(false)
  }

  // ── Guardar partido manual ─────────────────────────────
  const handleSavePartido = async () => {
    const { fecha_id, equipo_local_id, equipo_visitante_id } = formPartido
    if (!fecha_id || !equipo_local_id || !equipo_visitante_id) {
      setMsg('Completá todos los campos obligatorios.'); return
    }
    if (equipo_local_id === equipo_visitante_id) {
      setMsg('Local y visitante no pueden ser el mismo equipo.'); return
    }
    setSaving(true)
    const payload = {
      fecha_id,
      equipo_local_id,
      equipo_visitante_id,
      categoria: formPartido.categoria,
      hora_inicio: formPartido.hora_inicio || null,
      goles_local: parseInt(formPartido.goles_local) || 0,
      goles_visitante: parseInt(formPartido.goles_visitante) || 0,
      jugado: formPartido.jugado,
      walkover: formPartido.walkover,
      walkover_equipo_id: formPartido.walkover ? formPartido.walkover_equipo_id || null : null,
    }
    const { error } = formPartido.id
      ? await supabase.from('partidos').update(payload).eq('id', formPartido.id)
      : await supabase.from('partidos').insert(payload)
    if (error) { setMsg('Error: ' + error.message); setSaving(false); return }
    setModal(null); setMsg(''); fetchData(); setSaving(false)
  }

  const handleDeletePartido = async (id) => {
    if (!confirm('¿Eliminar este partido?')) return
    await supabase.from('partidos').delete().eq('id', id)
    fetchData()
  }

  // ── Preview fixture ────────────────────────────────────
  const buildPreview = () => {
    const { fechaInicio, diasDisponibles, horaInicio, horaFin, tipo, categorias } = genCfg
    if (!fechaInicio || diasDisponibles.length === 0 || !horaInicio || !horaFin) {
      setMsg('Completá todos los campos.'); return
    }
    if (horaInicio >= horaFin) { setMsg('Hora fin debe ser posterior a hora inicio.'); return }
    setMsg('')

    const slots = getTimeSlots(horaInicio, horaFin)
    if (slots.length === 0) { setMsg('El rango de horario no permite ningún partido.'); return }

    // Calcular rounds por categoría
    const roundsByCat = {}
    for (const cat of categorias) {
      const teamsInCat = equipos.filter((e) => e.categoria === cat)
      let rounds = generateRoundRobin(teamsInCat)
      if (tipo === 'ida_vuelta') {
        const vuelta = rounds.map((r) => r.map((p) => ({ local: p.visitante, visitante: p.local })))
        rounds = [...rounds, ...vuelta]
      }
      roundsByCat[cat] = rounds
    }

    const maxRondas = Math.max(...Object.values(roundsByCat).map((r) => r.length), 0)
    if (maxRondas === 0) { setMsg('No hay equipos en las categorías seleccionadas.'); return }

    // Construir fechas del fixture
    const availDates = getAvailableDates(fechaInicio, diasDisponibles, maxRondas)
    const preview = []
    for (let i = 0; i < maxRondas; i++) {
      const fecha = availDates[i]
      let slotIdx = 0
      const matches = []
      for (const cat of categorias) {
        const catRounds = roundsByCat[cat] || []
        if (i >= catRounds.length) continue
        for (const pair of catRounds[i]) {
          matches.push({
            categoria: cat,
            local: pair.local.nombre,
            visitante: pair.visitante.nombre,
            local_id: pair.local.id,
            visitante_id: pair.visitante.id,
            hora: slots[slotIdx % slots.length],
          })
          slotIdx++
        }
      }
      preview.push({ numero: i + 1, fecha, matches })
    }
    setGenPreview(preview)
  }

  // ── Generar y guardar fixture ──────────────────────────
  const handleGenerar = async () => {
    if (!genPreview) return
    if (!confirm(`¿Generar ${genPreview.length} fechas con ${genPreview.reduce((s, f) => s + f.matches.length, 0)} partidos? Esto no elimina fechas existentes.`)) return
    setSaving(true)
    setMsg('')

    // Obtener el número máximo de fecha existente
    const maxExistente = fechas.reduce((m, f) => Math.max(m, f.numero), 0)

    for (const fechaData of genPreview) {
      const numFecha = maxExistente + fechaData.numero
      // Insertar fecha
      const { data: fechaInsertada, error: errFecha } = await supabase
        .from('fechas')
        .insert({ torneo_id: torneoActivo.id, numero: numFecha, fecha_juego: fechaData.fecha })
        .select()
        .single()
      if (errFecha) { setMsg('Error insertando fecha: ' + errFecha.message); setSaving(false); return }

      // Insertar partidos
      const partidosPayload = fechaData.matches.map((m) => ({
        fecha_id: fechaInsertada.id,
        equipo_local_id: m.local_id,
        equipo_visitante_id: m.visitante_id,
        categoria: m.categoria,
        hora_inicio: m.hora + ':00',
      }))
      const { error: errP } = await supabase.from('partidos').insert(partidosPayload)
      if (errP) { setMsg('Error insertando partidos: ' + errP.message); setSaving(false); return }
    }

    setModal(null)
    setGenPreview(null)
    setMsg('')
    fetchData()
    setSaving(false)
  }

  const equiposFiltrados = equipos.filter((e) => e.categoria === categoriaFiltro)

  if (!torneoActivo) {
    return <div className="p-4 text-center text-gray-400">No hay torneo activo configurado.</div>
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-gray-700">Fixture — {torneoActivo.nombre}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => { setFormFecha({ numero: '', fecha_juego: '', descripcion: '' }); setModal('fecha'); setMsg('') }}
            className="text-xs border border-gray-200 text-gray-600 px-3 py-2 rounded-lg font-semibold hover:bg-gray-50"
          >
            + Fecha manual
          </button>
          <button
            onClick={() => { setGenPreview(null); setModal('generar'); setMsg('') }}
            className="btn-primary text-xs py-2"
          >
            ⚡ Generar fixture
          </button>
        </div>
      </div>

      {/* Filtro categoría */}
      <div className="flex gap-2 overflow-x-auto">
        {CATEGORIAS.map((c) => (
          <button key={c} onClick={() => setCategoriaFiltro(c)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              categoriaFiltro === c ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >{c}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>
      ) : fechas.length === 0 ? (
        <div className="card p-6 text-center text-gray-400 text-sm">No hay fechas creadas aún.</div>
      ) : (
        <div className="space-y-4">
          {fechas.map((fecha) => {
            const partidos = (fecha.partidos || [])
              .filter((p) => p.categoria === categoriaFiltro)
              .sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''))
            return (
              <div key={fecha.id} className="card overflow-hidden">
                {/* Fecha header */}
                <div className="bg-gray-50 border-b border-gray-100 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-gray-800">Fecha {fecha.numero}</span>
                      {fecha.fecha_juego && (
                        <p className="text-xs text-gray-500 mt-0.5">{fmtDate(fecha.fecha_juego)}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {fecha.fecha_juego && (
                        <button
                          onClick={() => handlePostergar(fecha)}
                          className="text-xs text-amber-600 border border-amber-200 bg-amber-50 px-2 py-1 rounded-lg font-semibold hover:bg-amber-100 transition-colors"
                        >
                          +1 semana
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setReprogFecha(fecha)
                          setReprogNuevaFecha(fecha.fecha_juego || '')
                          setModal('reprogramar')
                          setMsg('')
                        }}
                        className="text-xs text-blue-600 border border-blue-200 bg-blue-50 px-2 py-1 rounded-lg font-semibold hover:bg-blue-100 transition-colors"
                      >
                        Reprogramar
                      </button>
                      <button
                        onClick={() => {
                          setFormPartido({
                            fecha_id: fecha.id, equipo_local_id: '', equipo_visitante_id: '',
                            categoria: categoriaFiltro, hora_inicio: '',
                            goles_local: 0, goles_visitante: 0, jugado: false, walkover: false, walkover_equipo_id: '',
                          })
                          setModal('partido'); setMsg('')
                        }}
                        className="text-xs bg-primary text-white px-2 py-1 rounded-lg font-semibold"
                      >
                        + Partido
                      </button>
                    </div>
                  </div>
                </div>

                {/* Partidos */}
                {partidos.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-gray-400">No hay partidos en {categoriaFiltro}.</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {partidos.map((partido) => (
                      <div key={partido.id} className="flex items-center gap-2 px-4 py-3">
                        {partido.hora_inicio && (
                          <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">
                            {fmtHora(partido.hora_inicio)}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {partido.equipo_local?.nombre} <span className="text-gray-400">vs</span> {partido.equipo_visitante?.nombre}
                          </p>
                          <p className="text-xs text-gray-400">
                            {partido.walkover ? '⚠️ Walkover' :
                             partido.jugado ? `${partido.goles_local} - ${partido.goles_visitante}` :
                             '⏳ Pendiente'}
                          </p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {partido.jugado && !partido.walkover && (
                            <button
                              onClick={() => navigate(`/admin/planilla/${partido.id}`)}
                              className="text-xs text-green-600 font-semibold px-2 py-1 rounded hover:bg-green-50"
                            >
                              Planilla
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setFormPartido({
                                id: partido.id,
                                fecha_id: partido.fecha_id,
                                equipo_local_id: partido.equipo_local_id,
                                equipo_visitante_id: partido.equipo_visitante_id,
                                categoria: partido.categoria,
                                hora_inicio: partido.hora_inicio ? fmtHora(partido.hora_inicio) : '',
                                goles_local: partido.goles_local,
                                goles_visitante: partido.goles_visitante,
                                jugado: partido.jugado,
                                walkover: partido.walkover,
                                walkover_equipo_id: partido.walkover_equipo_id || '',
                              })
                              setModal('partido'); setMsg('')
                            }}
                            className="text-xs text-blue-600 font-semibold px-2 py-1 rounded hover:bg-blue-50"
                          >Editar</button>
                          <button
                            onClick={() => handleDeletePartido(partido.id)}
                            className="text-xs text-red-500 font-semibold px-2 py-1 rounded hover:bg-red-50"
                          >✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal: Generar Fixture ── */}
      {modal === 'generar' && (
        <ModalBase title="⚡ Generar Fixture" onClose={() => { setModal(null); setGenPreview(null) }} wide>
          <div className="space-y-4">
            {!genPreview ? (
              <>
                {/* Configuración */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de inicio</label>
                    <input type="date" value={genCfg.fechaInicio}
                      onChange={(e) => setGenCfg({ ...genCfg, fechaInicio: e.target.value })}
                      className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Hora inicio</label>
                    <input type="time" value={genCfg.horaInicio}
                      onChange={(e) => setGenCfg({ ...genCfg, horaInicio: e.target.value })}
                      className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Hora fin</label>
                    <input type="time" value={genCfg.horaFin}
                      onChange={(e) => setGenCfg({ ...genCfg, horaFin: e.target.value })}
                      className="input-field" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Días disponibles</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DIAS_SEMANA.map((d, i) => (
                      <button key={i}
                        onClick={() => {
                          const next = genCfg.diasDisponibles.includes(i)
                            ? genCfg.diasDisponibles.filter((x) => x !== i)
                            : [...genCfg.diasDisponibles, i].sort()
                          setGenCfg({ ...genCfg, diasDisponibles: next })
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          genCfg.diasDisponibles.includes(i)
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >{d}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo</label>
                  <div className="flex gap-2">
                    {[['ida', 'Solo ida'], ['ida_vuelta', 'Ida y vuelta']].map(([val, lbl]) => (
                      <button key={val}
                        onClick={() => setGenCfg({ ...genCfg, tipo: val })}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                          genCfg.tipo === val
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >{lbl}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Categorías</label>
                  <div className="flex gap-2">
                    {CATEGORIAS.map((c) => (
                      <button key={c}
                        onClick={() => {
                          const next = genCfg.categorias.includes(c)
                            ? genCfg.categorias.filter((x) => x !== c)
                            : [...genCfg.categorias, c]
                          setGenCfg({ ...genCfg, categorias: next })
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize border transition-colors ${
                          genCfg.categorias.includes(c)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-500 border-gray-200'
                        }`}
                      >{c}</button>
                    ))}
                  </div>
                </div>

                {msg && <p className="text-red-600 text-sm">{msg}</p>}

                <button onClick={buildPreview} className="btn-primary w-full">
                  Ver preview →
                </button>
              </>
            ) : (
              <>
                {/* Preview */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-gray-700">
                    {genPreview.length} fechas · {genPreview.reduce((s, f) => s + f.matches.length, 0)} partidos
                  </p>
                  <button onClick={() => setGenPreview(null)} className="text-xs text-gray-400 hover:text-gray-600">
                    ← Modificar
                  </button>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {genPreview.map((f) => (
                    <div key={f.numero} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs font-bold text-gray-600 mb-2">
                        Fecha {fechas.reduce((m, x) => Math.max(m, x.numero), 0) + f.numero} — {fmtDate(f.fecha)}
                      </p>
                      <div className="space-y-1">
                        {f.matches.map((m, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-primary w-10 flex-shrink-0">{m.hora}</span>
                            <span className="text-gray-400 capitalize w-16 flex-shrink-0">[{m.categoria}]</span>
                            <span className="text-gray-700">{m.local} <span className="text-gray-300">vs</span> {m.visitante}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {msg && <p className="text-red-600 text-sm">{msg}</p>}

                <button onClick={handleGenerar} disabled={saving}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {saving && <LoadingSpinner size="sm" color="white" />}
                  {saving ? 'Generando...' : '✓ Confirmar y generar'}
                </button>
              </>
            )}
          </div>
        </ModalBase>
      )}

      {/* ── Modal: Fecha manual ── */}
      {modal === 'fecha' && (
        <ModalBase title={formFecha.id ? 'Editar Fecha' : 'Nueva Fecha'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Número de fecha *</label>
              <input type="number" value={formFecha.numero} min="1"
                onChange={(e) => setFormFecha({ ...formFecha, numero: e.target.value })}
                className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de juego</label>
              <input type="date" value={formFecha.fecha_juego}
                onChange={(e) => setFormFecha({ ...formFecha, fecha_juego: e.target.value })}
                className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
              <input type="text" value={formFecha.descripcion}
                onChange={(e) => setFormFecha({ ...formFecha, descripcion: e.target.value })}
                className="input-field" placeholder="Ej: Jornada inaugural" />
            </div>
            {msg && <p className="text-red-600 text-sm">{msg}</p>}
            <button onClick={handleSaveFecha} disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {saving && <LoadingSpinner size="sm" color="white" />}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </ModalBase>
      )}

      {/* ── Modal: Partido ── */}
      {modal === 'partido' && (
        <ModalBase title={formPartido.id ? 'Editar Partido' : 'Nuevo Partido'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Categoría</label>
                <select value={formPartido.categoria}
                  onChange={(e) => setFormPartido({ ...formPartido, categoria: e.target.value })}
                  className="input-field">
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Hora inicio</label>
                <input type="time" value={formPartido.hora_inicio}
                  onChange={(e) => setFormPartido({ ...formPartido, hora_inicio: e.target.value })}
                  className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Equipo Local *</label>
              <select value={formPartido.equipo_local_id}
                onChange={(e) => setFormPartido({ ...formPartido, equipo_local_id: e.target.value })}
                className="input-field">
                <option value="">Seleccioná</option>
                {equipos.filter((e) => e.categoria === formPartido.categoria).map((e) =>
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Equipo Visitante *</label>
              <select value={formPartido.equipo_visitante_id}
                onChange={(e) => setFormPartido({ ...formPartido, equipo_visitante_id: e.target.value })}
                className="input-field">
                <option value="">Seleccioná</option>
                {equipos.filter((e) => e.categoria === formPartido.categoria).map((e) =>
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                )}
              </select>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formPartido.jugado}
                  onChange={(e) => setFormPartido({ ...formPartido, jugado: e.target.checked })}
                  className="w-4 h-4 accent-primary" />
                <span className="text-sm font-medium text-gray-700">Jugado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formPartido.walkover}
                  onChange={(e) => setFormPartido({ ...formPartido, walkover: e.target.checked })}
                  className="w-4 h-4 accent-primary" />
                <span className="text-sm font-medium text-gray-700">Walkover</span>
              </label>
            </div>
            {formPartido.jugado && !formPartido.walkover && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Goles Local</label>
                  <input type="number" value={formPartido.goles_local} min="0"
                    onChange={(e) => setFormPartido({ ...formPartido, goles_local: e.target.value })}
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Goles Visitante</label>
                  <input type="number" value={formPartido.goles_visitante} min="0"
                    onChange={(e) => setFormPartido({ ...formPartido, goles_visitante: e.target.value })}
                    className="input-field" />
                </div>
              </div>
            )}
            {formPartido.walkover && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Equipo que dio WO</label>
                <select value={formPartido.walkover_equipo_id}
                  onChange={(e) => setFormPartido({ ...formPartido, walkover_equipo_id: e.target.value })}
                  className="input-field">
                  <option value="">Seleccioná</option>
                  {[formPartido.equipo_local_id, formPartido.equipo_visitante_id].filter(Boolean).map((id) => {
                    const eq = equipos.find((e) => e.id === id)
                    return eq ? <option key={eq.id} value={eq.id}>{eq.nombre}</option> : null
                  })}
                </select>
              </div>
            )}
            {msg && <p className="text-red-600 text-sm">{msg}</p>}
            <button onClick={handleSavePartido} disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {saving && <LoadingSpinner size="sm" color="white" />}
              {saving ? 'Guardando...' : 'Guardar partido'}
            </button>
          </div>
        </ModalBase>
      )}

      {/* ── Modal: Reprogramar ── */}
      {modal === 'reprogramar' && reprogFecha && (
        <ModalBase title={`Reprogramar Fecha ${reprogFecha.numero}`} onClose={() => { setModal(null); setReprogFecha(null) }}>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Fecha actual: <strong>{reprogFecha.fecha_juego ? fmtDate(reprogFecha.fecha_juego) : 'Sin fecha asignada'}</strong>
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nueva fecha</label>
              <input type="date" value={reprogNuevaFecha}
                onChange={(e) => setReprogNuevaFecha(e.target.value)}
                className="input-field" />
            </div>
            {msg && <p className="text-red-600 text-sm">{msg}</p>}
            <button onClick={handleReprogramar} disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {saving && <LoadingSpinner size="sm" color="white" />}
              {saving ? 'Guardando...' : 'Confirmar reprogramación'}
            </button>
          </div>
        </ModalBase>
      )}
    </div>
  )
}

function ModalBase({ title, children, onClose, wide }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className={`bg-white rounded-2xl w-full ${wide ? 'max-w-lg' : 'max-w-md'} max-h-[90vh] overflow-y-auto shadow-2xl`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-xl">×</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
