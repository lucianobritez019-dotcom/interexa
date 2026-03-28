import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import useStore from '../../store/useStore'
import LoadingSpinner from '../../components/LoadingSpinner'

const CATEGORIAS = ['primera', 'ejecutivo', 'master']

export default function AdminFixture() {
  const { torneoActivo } = useStore()
  const navigate = useNavigate()
  const [fechas, setFechas] = useState([])
  const [equipos, setEquipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'fecha' | 'partido'
  const [formFecha, setFormFecha] = useState({ numero: '', fecha_juego: '', descripcion: '' })
  const [formPartido, setFormPartido] = useState({
    fecha_id: '', equipo_local_id: '', equipo_visitante_id: '',
    categoria: 'primera', goles_local: 0, goles_visitante: 0,
    jugado: false, walkover: false, walkover_equipo_id: '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('primera')

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
    setModal(null)
    setMsg('')
    fetchData()
    setSaving(false)
  }

  const handleSavePartido = async () => {
    const { fecha_id, equipo_local_id, equipo_visitante_id, categoria } = formPartido
    if (!fecha_id || !equipo_local_id || !equipo_visitante_id) {
      setMsg('Completá todos los campos obligatorios.')
      return
    }
    if (equipo_local_id === equipo_visitante_id) {
      setMsg('Local y visitante no pueden ser el mismo equipo.')
      return
    }
    setSaving(true)
    const payload = {
      fecha_id,
      equipo_local_id,
      equipo_visitante_id,
      categoria,
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
    setModal(null)
    setMsg('')
    fetchData()
    setSaving(false)
  }

  const handleDeletePartido = async (id) => {
    if (!confirm('¿Eliminar este partido?')) return
    await supabase.from('partidos').delete().eq('id', id)
    fetchData()
  }

  const equiposFiltrados = equipos.filter((e) => e.categoria === categoriaFiltro)

  if (!torneoActivo) {
    return (
      <div className="p-4 text-center text-gray-400">
        No hay torneo activo configurado.
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-gray-700">Fixture — {torneoActivo.nombre}</h3>
        <button
          onClick={() => { setFormFecha({ numero: '', fecha_juego: '', descripcion: '' }); setModal('fecha'); setMsg('') }}
          className="btn-primary text-xs py-2"
        >
          + Fecha
        </button>
      </div>

      {/* Filtro categoría */}
      <div className="flex gap-2">
        {CATEGORIAS.map((c) => (
          <button
            key={c}
            onClick={() => setCategoriaFiltro(c)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              categoriaFiltro === c ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : fechas.length === 0 ? (
        <div className="card p-6 text-center text-gray-400 text-sm">
          No hay fechas creadas aún.
        </div>
      ) : (
        <div className="space-y-4">
          {fechas.map((fecha) => {
            const partidos = (fecha.partidos || []).filter((p) => p.categoria === categoriaFiltro)
            return (
              <div key={fecha.id} className="card overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-800">Fecha {fecha.numero}</span>
                    {fecha.fecha_juego && (
                      <span className="text-xs text-gray-400 ml-2">
                        {new Date(fecha.fecha_juego + 'T00:00:00').toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setFormPartido({
                        fecha_id: fecha.id,
                        equipo_local_id: '',
                        equipo_visitante_id: '',
                        categoria: categoriaFiltro,
                        goles_local: 0,
                        goles_visitante: 0,
                        jugado: false,
                        walkover: false,
                        walkover_equipo_id: '',
                      })
                      setModal('partido')
                      setMsg('')
                    }}
                    className="text-xs bg-primary text-white px-2 py-1 rounded-lg font-semibold"
                  >
                    + Partido
                  </button>
                </div>

                {partidos.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-gray-400">No hay partidos en {categoriaFiltro}.</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {partidos.map((partido) => (
                      <div key={partido.id} className="flex items-center gap-2 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {partido.equipo_local?.nombre} vs {partido.equipo_visitante?.nombre}
                          </p>
                          <p className="text-xs text-gray-400">
                            {partido.walkover ? '⚠️ Walkover' :
                             partido.jugado ? `${partido.goles_local} - ${partido.goles_visitante}` :
                             '⏳ Pendiente'}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {partido.jugado && !partido.walkover && (
                            <button
                              onClick={() => navigate(`/admin/planilla/${partido.id}`)}
                              className="text-xs text-green-600 hover:text-green-800 font-semibold px-2 py-1 rounded hover:bg-green-50 transition-colors"
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
                                goles_local: partido.goles_local,
                                goles_visitante: partido.goles_visitante,
                                jugado: partido.jugado,
                                walkover: partido.walkover,
                                walkover_equipo_id: partido.walkover_equipo_id || '',
                              })
                              setModal('partido')
                              setMsg('')
                            }}
                            className="text-xs text-blue-600 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeletePartido(partido.id)}
                            className="text-xs text-red-500 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            ✕
                          </button>
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

      {/* Modal Fecha */}
      {modal === 'fecha' && (
        <ModalBase title="Nueva Fecha" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Número de fecha *</label>
              <input
                type="number"
                value={formFecha.numero}
                onChange={(e) => setFormFecha({ ...formFecha, numero: e.target.value })}
                className="input-field"
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de juego</label>
              <input
                type="date"
                value={formFecha.fecha_juego}
                onChange={(e) => setFormFecha({ ...formFecha, fecha_juego: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
              <input
                type="text"
                value={formFecha.descripcion}
                onChange={(e) => setFormFecha({ ...formFecha, descripcion: e.target.value })}
                className="input-field"
                placeholder="Ej: Jornada inaugural"
              />
            </div>
            {msg && <p className="text-red-600 text-sm">{msg}</p>}
            <button onClick={handleSaveFecha} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
              {saving && <LoadingSpinner size="sm" color="white" />}
              {saving ? 'Guardando...' : 'Crear fecha'}
            </button>
          </div>
        </ModalBase>
      )}

      {/* Modal Partido */}
      {modal === 'partido' && (
        <ModalBase title={formPartido.id ? 'Editar Partido' : 'Nuevo Partido'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Equipo Local *</label>
              <select
                value={formPartido.equipo_local_id}
                onChange={(e) => setFormPartido({ ...formPartido, equipo_local_id: e.target.value })}
                className="input-field"
              >
                <option value="">Seleccioná</option>
                {equiposFiltrados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Equipo Visitante *</label>
              <select
                value={formPartido.equipo_visitante_id}
                onChange={(e) => setFormPartido({ ...formPartido, equipo_visitante_id: e.target.value })}
                className="input-field"
              >
                <option value="">Seleccioná</option>
                {equiposFiltrados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>

            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formPartido.jugado}
                  onChange={(e) => setFormPartido({ ...formPartido, jugado: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm font-medium text-gray-700">Jugado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formPartido.walkover}
                  onChange={(e) => setFormPartido({ ...formPartido, walkover: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm font-medium text-gray-700">Walkover</span>
              </label>
            </div>

            {formPartido.jugado && !formPartido.walkover && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Goles Local</label>
                  <input
                    type="number"
                    value={formPartido.goles_local}
                    onChange={(e) => setFormPartido({ ...formPartido, goles_local: e.target.value })}
                    className="input-field"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Goles Visitante</label>
                  <input
                    type="number"
                    value={formPartido.goles_visitante}
                    onChange={(e) => setFormPartido({ ...formPartido, goles_visitante: e.target.value })}
                    className="input-field"
                    min="0"
                  />
                </div>
              </div>
            )}

            {formPartido.walkover && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Equipo que dio WO</label>
                <select
                  value={formPartido.walkover_equipo_id}
                  onChange={(e) => setFormPartido({ ...formPartido, walkover_equipo_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Seleccioná</option>
                  {[formPartido.equipo_local_id, formPartido.equipo_visitante_id]
                    .filter(Boolean)
                    .map((eqId) => {
                      const eq = equipos.find((e) => e.id === eqId)
                      return eq ? <option key={eq.id} value={eq.id}>{eq.nombre}</option> : null
                    })}
                </select>
              </div>
            )}

            {msg && <p className="text-red-600 text-sm">{msg}</p>}
            <button onClick={handleSavePartido} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
              {saving && <LoadingSpinner size="sm" color="white" />}
              {saving ? 'Guardando...' : 'Guardar partido'}
            </button>
          </div>
        </ModalBase>
      )}
    </div>
  )
}

function ModalBase({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-xl">×</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
