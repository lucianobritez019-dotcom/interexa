import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../../components/LoadingSpinner'

const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const MESES_CORTO = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const ANIO_ACTUAL = new Date().getFullYear()
const MES_ACTUAL = new Date().getMonth() + 1

const CUOTA_INIT = {
  jugador_id: '',
  mes: MES_ACTUAL,
  anio: ANIO_ACTUAL,
  monto: 500,
  pagada: false,
  fecha_pago: '',
  descripcion: '',
}

export default function AdminCuotas() {
  const [jugadores, setJugadores] = useState([])
  const [cuotas, setCuotas] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [modal, setModal] = useState(null) // 'nueva' | 'masiva'
  const [form, setForm] = useState(CUOTA_INIT)
  const [filtroJugador, setFiltroJugador] = useState('')
  const [filtroMes, setFiltroMes] = useState(MES_ACTUAL)
  const [filtroAnio, setFiltroAnio] = useState(ANIO_ACTUAL)
  const [filtroPagada, setFiltroPagada] = useState('todas') // 'todas' | 'pagadas' | 'pendientes'

  // Modal masiva
  const [masiva, setMasiva] = useState({
    mes: MES_ACTUAL,
    anio: ANIO_ACTUAL,
    monto: 500,
    jugadoresSeleccionados: [],
  })

  const fetchData = async () => {
    setLoading(true)
    const [jRes, cRes] = await Promise.all([
      supabase.from('profiles').select('id, nombre, apellido, ci').order('apellido'),
      supabase
        .from('cuotas')
        .select('*, jugador:profiles(id, nombre, apellido, ci)')
        .order('anio', { ascending: false })
        .order('mes', { ascending: false })
        .order('created_at', { ascending: false }),
    ])
    setJugadores(jRes.data || [])
    setCuotas(cRes.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleSaveCuota = async () => {
    if (!form.jugador_id || !form.mes || !form.anio || !form.monto) {
      setMsg('Completá todos los campos obligatorios.')
      return
    }
    setSaving(true)
    setMsg('')

    const payload = {
      jugador_id: form.jugador_id,
      mes: parseInt(form.mes),
      anio: parseInt(form.anio),
      monto: parseFloat(form.monto),
      pagada: form.pagada,
      fecha_pago: form.pagada && form.fecha_pago ? form.fecha_pago : null,
      descripcion: form.descripcion || null,
    }

    const { error } = form.id
      ? await supabase.from('cuotas').update(payload).eq('id', form.id)
      : await supabase.from('cuotas').insert(payload)

    if (error) {
      setMsg('Error al guardar: ' + error.message)
    } else {
      setMsg(form.id ? 'Cuota actualizada.' : 'Cuota registrada correctamente.')
      setModal(null)
      setForm(CUOTA_INIT)
      fetchData()
    }
    setSaving(false)
  }

  const handleMarcarPagada = async (cuota) => {
    const fechaHoy = new Date().toISOString().split('T')[0]
    const { error } = await supabase
      .from('cuotas')
      .update({ pagada: !cuota.pagada, fecha_pago: !cuota.pagada ? fechaHoy : null })
      .eq('id', cuota.id)

    if (!error) fetchData()
  }

  const handleDeleteCuota = async (id) => {
    if (!confirm('¿Eliminar esta cuota?')) return
    await supabase.from('cuotas').delete().eq('id', id)
    fetchData()
  }

  const handleCuotaMasiva = async () => {
    if (!masiva.jugadoresSeleccionados.length) {
      setMsg('Seleccioná al menos un jugador.')
      return
    }
    setSaving(true)
    setMsg('')

    const inserts = masiva.jugadoresSeleccionados.map((jId) => ({
      jugador_id: jId,
      mes: parseInt(masiva.mes),
      anio: parseInt(masiva.anio),
      monto: parseFloat(masiva.monto),
      pagada: false,
    }))

    const { error } = await supabase.from('cuotas').insert(inserts)

    if (error) {
      setMsg('Error: ' + error.message)
    } else {
      setMsg(`${inserts.length} cuota(s) generadas para ${MESES[masiva.mes]} ${masiva.anio}.`)
      setModal(null)
      setMasiva({ ...masiva, jugadoresSeleccionados: [] })
      fetchData()
    }
    setSaving(false)
  }

  const toggleJugadorMasiva = (jId) => {
    setMasiva((prev) => ({
      ...prev,
      jugadoresSeleccionados: prev.jugadoresSeleccionados.includes(jId)
        ? prev.jugadoresSeleccionados.filter((id) => id !== jId)
        : [...prev.jugadoresSeleccionados, jId],
    }))
  }

  const seleccionarTodos = () => {
    setMasiva((prev) => ({
      ...prev,
      jugadoresSeleccionados:
        prev.jugadoresSeleccionados.length === jugadores.length
          ? []
          : jugadores.map((j) => j.id),
    }))
  }

  // Filtrar cuotas
  const cuotasFiltradas = cuotas.filter((c) => {
    const nombreCompleto = `${c.jugador?.apellido} ${c.jugador?.nombre}`.toLowerCase()
    const matchJugador = !filtroJugador || nombreCompleto.includes(filtroJugador.toLowerCase())
    const matchMes = !filtroMes || c.mes === parseInt(filtroMes)
    const matchAnio = !filtroAnio || c.anio === parseInt(filtroAnio)
    const matchPagada =
      filtroPagada === 'todas' ? true :
      filtroPagada === 'pagadas' ? c.pagada :
      !c.pagada
    return matchJugador && matchMes && matchAnio && matchPagada
  })

  const totalDeuda = cuotasFiltradas
    .filter((c) => !c.pagada)
    .reduce((sum, c) => sum + Number(c.monto || 0), 0)

  const totalCobrado = cuotasFiltradas
    .filter((c) => c.pagada)
    .reduce((sum, c) => sum + Number(c.monto || 0), 0)

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-gray-700">Gestión de Cuotas</h3>
        <div className="flex gap-2">
          <button
            onClick={() => { setModal('masiva'); setMsg('') }}
            className="text-xs bg-green-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Generar masiva
          </button>
          <button
            onClick={() => { setForm(CUOTA_INIT); setModal('nueva'); setMsg('') }}
            className="btn-primary text-xs py-2"
          >
            + Cuota
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500 font-medium">Pendiente</p>
          <p className="text-xl font-black text-red-600">${totalDeuda.toFixed(0)}</p>
          <p className="text-xs text-gray-400">{cuotasFiltradas.filter((c) => !c.pagada).length} cuotas</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500 font-medium">Cobrado</p>
          <p className="text-xl font-black text-green-600">${totalCobrado.toFixed(0)}</p>
          <p className="text-xs text-gray-400">{cuotasFiltradas.filter((c) => c.pagada).length} cuotas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Mes</label>
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value ? parseInt(e.target.value) : '')}
              className="input-field text-xs py-1.5"
            >
              <option value="">Todos</option>
              {MESES.slice(1).map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Año</label>
            <select
              value={filtroAnio}
              onChange={(e) => setFiltroAnio(e.target.value ? parseInt(e.target.value) : '')}
              className="input-field text-xs py-1.5"
            >
              <option value="">Todos</option>
              {[ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Buscar jugador</label>
          <input
            type="text"
            value={filtroJugador}
            onChange={(e) => setFiltroJugador(e.target.value)}
            placeholder="Nombre o apellido..."
            className="input-field text-xs py-1.5"
          />
        </div>
        <div className="flex gap-2">
          {['todas', 'pendientes', 'pagadas'].map((f) => (
            <button
              key={f}
              onClick={() => setFiltroPagada(f)}
              className={`flex-1 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filtroPagada === f ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Lista cuotas */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : cuotasFiltradas.length === 0 ? (
        <div className="card p-6 text-center text-gray-400 text-sm">
          No hay cuotas con los filtros aplicados.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-50">
            {cuotasFiltradas.map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-3 px-4 py-3 ${c.pagada ? 'bg-white' : 'bg-red-50/30'}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {c.jugador?.apellido}, {c.jugador?.nombre}
                  </p>
                  <p className="text-xs text-gray-400">
                    {MESES_CORTO[c.mes]} {c.anio}
                    {c.descripcion && ` · ${c.descripcion}`}
                  </p>
                  {c.fecha_pago && (
                    <p className="text-xs text-green-600">
                      Pagado: {new Date(c.fecha_pago + 'T00:00:00').toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
                <span className={`font-black text-base flex-shrink-0 ${c.pagada ? 'text-green-600' : 'text-red-600'}`}>
                  ${c.monto}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleMarcarPagada(c)}
                    title={c.pagada ? 'Marcar como pendiente' : 'Marcar como pagada'}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      c.pagada
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'
                    }`}
                  >
                    {c.pagada ? '✓' : '○'}
                  </button>
                  <button
                    onClick={() => {
                      setForm({
                        id: c.id,
                        jugador_id: c.jugador_id,
                        mes: c.mes,
                        anio: c.anio,
                        monto: c.monto,
                        pagada: c.pagada,
                        fecha_pago: c.fecha_pago || '',
                        descripcion: c.descripcion || '',
                      })
                      setModal('nueva')
                      setMsg('')
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDeleteCuota(c.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-red-400 hover:bg-red-50 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {msg && !modal && (
        <div className={`p-3 rounded-xl text-sm font-medium ${
          msg.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {msg}
        </div>
      )}

      {/* Modal nueva/editar cuota */}
      {modal === 'nueva' && (
        <ModalBase title={form.id ? 'Editar Cuota' : 'Nueva Cuota'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Jugador *</label>
              <select
                value={form.jugador_id}
                onChange={(e) => setForm({ ...form, jugador_id: e.target.value })}
                className="input-field"
              >
                <option value="">Seleccioná un jugador</option>
                {jugadores.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.apellido}, {j.nombre} — CI {j.ci}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mes *</label>
                <select
                  value={form.mes}
                  onChange={(e) => setForm({ ...form, mes: parseInt(e.target.value) })}
                  className="input-field"
                >
                  {MESES.slice(1).map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Año *</label>
                <select
                  value={form.anio}
                  onChange={(e) => setForm({ ...form, anio: parseInt(e.target.value) })}
                  className="input-field"
                >
                  {[ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Monto ($) *</label>
              <input
                type="number"
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
                className="input-field"
                min="0"
                step="50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
              <input
                type="text"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="input-field"
                placeholder="Ej: Cuota mensual torneo 2025"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.pagada}
                onChange={(e) => setForm({ ...form, pagada: e.target.checked })}
                className="w-4 h-4 accent-green-600"
              />
              <span className="text-sm font-medium text-gray-700">Marcar como pagada</span>
            </label>

            {form.pagada && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de pago</label>
                <input
                  type="date"
                  value={form.fecha_pago}
                  onChange={(e) => setForm({ ...form, fecha_pago: e.target.value })}
                  className="input-field"
                />
              </div>
            )}

            {msg && (
              <p className={`text-sm font-medium ${msg.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {msg}
              </p>
            )}

            <button
              onClick={handleSaveCuota}
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {saving && <LoadingSpinner size="sm" color="white" />}
              {saving ? 'Guardando...' : form.id ? 'Actualizar cuota' : 'Registrar cuota'}
            </button>
          </div>
        </ModalBase>
      )}

      {/* Modal generación masiva */}
      {modal === 'masiva' && (
        <ModalBase title="Generar Cuotas Masivas" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Generá cuotas pendientes para múltiples jugadores a la vez.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mes</label>
                <select
                  value={masiva.mes}
                  onChange={(e) => setMasiva({ ...masiva, mes: parseInt(e.target.value) })}
                  className="input-field"
                >
                  {MESES.slice(1).map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Año</label>
                <select
                  value={masiva.anio}
                  onChange={(e) => setMasiva({ ...masiva, anio: parseInt(e.target.value) })}
                  className="input-field"
                >
                  {[ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Monto por cuota ($)</label>
              <input
                type="number"
                value={masiva.monto}
                onChange={(e) => setMasiva({ ...masiva, monto: e.target.value })}
                className="input-field"
                min="0"
                step="50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-600">
                  Jugadores ({masiva.jugadoresSeleccionados.length}/{jugadores.length} seleccionados)
                </label>
                <button
                  onClick={seleccionarTodos}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  {masiva.jugadoresSeleccionados.length === jugadores.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>
              <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                {jugadores.map((j) => (
                  <label
                    key={j.id}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={masiva.jugadoresSeleccionados.includes(j.id)}
                      onChange={() => toggleJugadorMasiva(j.id)}
                      className="w-4 h-4 accent-primary flex-shrink-0"
                    />
                    <span className="text-sm text-gray-800">
                      {j.apellido}, {j.nombre}
                      <span className="text-gray-400 text-xs ml-1">CI {j.ci}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {msg && (
              <p className={`text-sm font-medium ${msg.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {msg}
              </p>
            )}

            <button
              onClick={handleCuotaMasiva}
              disabled={saving || !masiva.jugadoresSeleccionados.length}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {saving && <LoadingSpinner size="sm" color="white" />}
              {saving
                ? 'Generando...'
                : `Generar ${masiva.jugadoresSeleccionados.length} cuota${masiva.jugadoresSeleccionados.length !== 1 ? 's' : ''}`}
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
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-xl"
          >
            ×
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
