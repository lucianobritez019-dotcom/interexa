import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../../components/LoadingSpinner'

const CATEGORIAS = ['primera', 'ejecutivo', 'master']

const EQUIPO_INIT = { nombre: '', categoria: 'primera', escudo_url: '' }

export default function AdminEquipos() {
  const [equipos, setEquipos] = useState([])
  const [jugadores, setJugadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'equipo' | 'jugador' | 'asignar'
  const [form, setForm] = useState(EQUIPO_INIT)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('primera')

  const [formJugador, setFormJugador] = useState({
    ci: '', nombre: '', apellido: '', telefono: '', password: '', rol: 'jugador',
  })

  const [asignacion, setAsignacion] = useState({ jugador_id: '', equipo_id: '', categoria: 'primera' })

  const fetchData = async () => {
    setLoading(true)
    const [eqRes, jRes] = await Promise.all([
      supabase.from('equipos').select('*').order('nombre'),
      supabase.from('profiles').select('*').order('apellido'),
    ])
    setEquipos(eqRes.data || [])
    setJugadores(jRes.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  // CRUD Equipo
  const handleSaveEquipo = async () => {
    if (!form.nombre.trim()) { setMsg('El nombre es obligatorio.'); return }
    setSaving(true)
    const payload = {
      nombre: form.nombre,
      categoria: form.categoria,
      escudo_url: form.escudo_url || null,
    }
    const { error } = form.id
      ? await supabase.from('equipos').update(payload).eq('id', form.id)
      : await supabase.from('equipos').insert(payload)

    if (error) { setMsg('Error al guardar equipo.'); setSaving(false); return }
    setMsg('')
    setModal(null)
    setForm(EQUIPO_INIT)
    fetchData()
    setSaving(false)
  }

  const handleDeleteEquipo = async (id) => {
    if (!confirm('¿Eliminar este equipo?')) return
    await supabase.from('equipos').delete().eq('id', id)
    fetchData()
  }

  // Crear jugador
  const handleSaveJugador = async () => {
    const { ci, nombre, apellido, password } = formJugador
    if (!ci || !nombre || !apellido || !password) {
      setMsg('Todos los campos son obligatorios.')
      return
    }
    setSaving(true)
    setMsg('')

    const email = `${ci.trim()}@interexa.com`
    const { data, error } = await supabase.auth.admin
      ? await supabase.auth.signUp({
          email,
          password,
          options: { data: { ci, nombre, apellido, rol: formJugador.rol } },
        })
      : { error: { message: 'signUp no disponible' } }

    // Intentar signUp normal (funciona en modo anon para crear usuario)
    const signUpRes = await supabase.auth.signUp({
      email,
      password,
      options: { data: { ci, nombre, apellido, rol: formJugador.rol } },
    })

    if (signUpRes.error) {
      setMsg(`Error: ${signUpRes.error.message}`)
      setSaving(false)
      return
    }

    // Asegurar perfil
    if (signUpRes.data?.user) {
      await supabase.from('profiles').upsert({
        user_id: signUpRes.data.user.id,
        ci,
        nombre,
        apellido,
        email,
        telefono: formJugador.telefono,
        rol: formJugador.rol,
      })
    }

    setMsg('Jugador creado correctamente.')
    setModal(null)
    setFormJugador({ ci: '', nombre: '', apellido: '', telefono: '', password: '', rol: 'jugador' })
    fetchData()
    setSaving(false)
  }

  // Asignar jugador a equipo
  const handleAsignar = async () => {
    const { jugador_id, equipo_id, categoria } = asignacion
    if (!jugador_id || !equipo_id) { setMsg('Seleccioná jugador y equipo.'); return }
    setSaving(true)
    const { error } = await supabase.from('jugadores_equipos').upsert({
      jugador_id,
      equipo_id,
      categoria,
      activo: true,
    })
    if (error) setMsg('Error al asignar.')
    else {
      setMsg('Jugador asignado correctamente.')
      setModal(null)
    }
    setSaving(false)
  }

  const equiposFiltrados = equipos.filter((e) => e.categoria === categoriaFiltro)

  return (
    <div className="p-4 space-y-4">
      {/* Controles */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-bold text-gray-700">Equipos y Jugadores</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setModal('jugador'); setMsg('') }}
            className="text-xs bg-blue-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            + Jugador
          </button>
          <button
            onClick={() => { setModal('asignar'); setMsg('') }}
            className="text-xs bg-green-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Asignar
          </button>
          <button
            onClick={() => { setModal('equipo'); setForm(EQUIPO_INIT); setMsg('') }}
            className="btn-primary text-xs py-2"
          >
            + Equipo
          </button>
        </div>
      </div>

      {/* Filtro categoría */}
      <div className="flex gap-2 overflow-x-auto">
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
      ) : (
        <div className="space-y-3">
          {equiposFiltrados.length === 0 ? (
            <div className="card p-6 text-center text-gray-400 text-sm">
              No hay equipos en {categoriaFiltro}.
            </div>
          ) : (
            equiposFiltrados.map((eq) => (
              <EquipoAdminCard
                key={eq.id}
                equipo={eq}
                jugadores={jugadores}
                onEdit={() => { setForm({ ...eq }); setModal('equipo'); setMsg('') }}
                onDelete={() => handleDeleteEquipo(eq.id)}
              />
            ))
          )}
        </div>
      )}

      {/* Modal Equipo */}
      {modal === 'equipo' && (
        <Modal title={form.id ? 'Editar Equipo' : 'Nuevo Equipo'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="input-field"
                placeholder="Ej: Club Atlético"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Categoría *</label>
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="input-field"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">URL del escudo</label>
              <input
                type="url"
                value={form.escudo_url}
                onChange={(e) => setForm({ ...form, escudo_url: e.target.value })}
                className="input-field"
                placeholder="https://..."
              />
            </div>
            {msg && <p className="text-red-600 text-sm">{msg}</p>}
            <button
              onClick={handleSaveEquipo}
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {saving && <LoadingSpinner size="sm" color="white" />}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Jugador */}
      {modal === 'jugador' && (
        <Modal title="Nuevo Jugador" onClose={() => setModal(null)}>
          <div className="space-y-3">
            {['ci', 'nombre', 'apellido', 'telefono', 'password'].map((field) => (
              <div key={field}>
                <label className="block text-xs font-semibold text-gray-600 mb-1 capitalize">
                  {field === 'ci' ? 'CI *' : field === 'password' ? 'Contraseña *' : field + (field === 'telefono' ? '' : ' *')}
                </label>
                <input
                  type={field === 'password' ? 'password' : field === 'ci' ? 'text' : 'text'}
                  value={formJugador[field]}
                  onChange={(e) => setFormJugador({ ...formJugador, [field]: e.target.value })}
                  className="input-field"
                  placeholder={field === 'ci' ? '12345678' : field === 'password' ? 'Mínimo 6 caracteres' : ''}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Rol</label>
              <select
                value={formJugador.rol}
                onChange={(e) => setFormJugador({ ...formJugador, rol: e.target.value })}
                className="input-field"
              >
                <option value="jugador">Jugador</option>
                <option value="capitan">Capitán</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {msg && <p className={`text-sm ${msg.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
            <button
              onClick={handleSaveJugador}
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {saving && <LoadingSpinner size="sm" color="white" />}
              {saving ? 'Creando...' : 'Crear jugador'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Asignar */}
      {modal === 'asignar' && (
        <Modal title="Asignar Jugador a Equipo" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Jugador</label>
              <select
                value={asignacion.jugador_id}
                onChange={(e) => setAsignacion({ ...asignacion, jugador_id: e.target.value })}
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
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Categoría</label>
              <select
                value={asignacion.categoria}
                onChange={(e) => setAsignacion({ ...asignacion, categoria: e.target.value, equipo_id: '' })}
                className="input-field"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Equipo</label>
              <select
                value={asignacion.equipo_id}
                onChange={(e) => setAsignacion({ ...asignacion, equipo_id: e.target.value })}
                className="input-field"
              >
                <option value="">Seleccioná un equipo</option>
                {equipos
                  .filter((e) => e.categoria === asignacion.categoria)
                  .map((e) => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
              </select>
            </div>
            {msg && <p className={`text-sm ${msg.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
            <button
              onClick={handleAsignar}
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {saving && <LoadingSpinner size="sm" color="white" />}
              {saving ? 'Asignando...' : 'Asignar jugador'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function EquipoAdminCard({ equipo, jugadores, onEdit, onDelete }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          {equipo.escudo_url
            ? <img src={equipo.escudo_url} alt="" className="w-full h-full object-contain" />
            : <span className="text-primary font-black text-sm">{equipo.nombre[0]}</span>
          }
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-800">{equipo.nombre}</p>
          <p className="text-gray-400 text-xs capitalize">{equipo.categoria}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
          >
            Borrar
          </button>
        </div>
      </div>
    </div>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
          >
            ×
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
