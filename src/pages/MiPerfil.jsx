import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function MiPerfil() {
  const { profile, refreshProfile } = useAuth()
  const [stats, setStats] = useState({ goles: 0, partidos: 0, amarillas: 0, rojas: 0 })
  const [pierna, setPierna] = useState('derecha')
  const [saving, setSaving] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [msg, setMsg] = useState('')
  const fileInputRef = useRef()

  useEffect(() => {
    if (profile) {
      setPierna(profile.pierna_habil || 'derecha')
    }
  }, [profile])

  useEffect(() => {
    if (!profile?.id) return
    const fetchStats = async () => {
      const { data } = await supabase
        .from('planilla_jugadores')
        .select('goles, amarilla, doble_amarilla, roja_directa, presente')
        .eq('jugador_id', profile.id)
        .eq('presente', true)

      if (data) {
        setStats({
          goles: data.reduce((s, r) => s + (r.goles || 0), 0),
          partidos: data.length,
          amarillas: data.filter((r) => r.amarilla).length,
          rojas: data.filter((r) => r.roja_directa || r.doble_amarilla).length,
        })
      }
    }
    fetchStats()
  }, [profile])

  const handleSavePierna = async (value) => {
    setSaving(true)
    setMsg('')
    const { error } = await supabase
      .from('profiles')
      .update({ pierna_habil: value })
      .eq('id', profile.id)

    if (error) {
      setMsg('Error al guardar.')
    } else {
      setMsg('Guardado.')
      refreshProfile()
      setTimeout(() => setMsg(''), 2000)
    }
    setSaving(false)
  }

  const handleFotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setMsg('La foto debe pesar menos de 2MB.')
      return
    }
    setUploadingFoto(true)
    setMsg('')

    const ext = file.name.split('.').pop()
    const path = `avatars/${profile.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('fotos')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setMsg('Error al subir la foto.')
      setUploadingFoto(false)
      return
    }

    const { data: urlData } = supabase.storage.from('fotos').getPublicUrl(path)
    const foto_url = urlData.publicUrl

    await supabase.from('profiles').update({ foto_url }).eq('id', profile.id)
    refreshProfile()
    setMsg('Foto actualizada.')
    setTimeout(() => setMsg(''), 2000)
    setUploadingFoto(false)
  }

  if (!profile) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-black text-gray-800">Mi Ficha</h2>

      {/* Foto y nombre */}
      <div className="card p-5">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-2 ring-primary/20">
              {profile.foto_url ? (
                <img src={profile.foto_url} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-black text-2xl">
                  {profile.nombre?.[0]}{profile.apellido?.[0]}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFoto}
              title="Cambiar foto"
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-900 transition-colors"
            >
              {uploadingFoto ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFotoUpload}
            />
          </div>

          <div>
            <h3 className="font-black text-gray-900 text-lg">
              {profile.nombre} {profile.apellido}
            </h3>
            <p className="text-gray-500 text-sm">CI: {profile.ci}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
              profile.rol === 'admin' ? 'bg-yellow-100 text-yellow-800' :
              profile.rol === 'capitan' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-600'
            }`}>
              {profile.rol === 'admin' ? '⭐ Admin' :
               profile.rol === 'capitan' ? '🅲 Capitán' : '⚽ Jugador'}
            </span>
          </div>
        </div>
        {msg && (
          <p className={`text-sm font-medium mt-3 ${msg.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {msg}
          </p>
        )}
      </div>

      {/* Estadísticas — solo lectura */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Partidos', value: stats.partidos, icon: '⚽', color: 'text-blue-600' },
          { label: 'Goles', value: stats.goles, icon: '🥅', color: 'text-green-600' },
          { label: 'Amarillas', value: stats.amarillas, icon: '🟨', color: 'text-yellow-600' },
          { label: 'Rojas', value: stats.rojas, icon: '🟥', color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="card p-3 text-center">
            <span className="text-xl">{s.icon}</span>
            <p className={`font-black text-xl ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pierna hábil — editable */}
      <div className="card p-4 space-y-3">
        <h3 className="font-bold text-gray-700">Mi ficha</h3>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">Pierna hábil</label>
          <div className="flex gap-2">
            {['derecha', 'izquierda'].map((op) => (
              <button
                key={op}
                disabled={saving}
                onClick={() => {
                  setPierna(op)
                  handleSavePierna(op)
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  pierna === op
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'
                }`}
              >
                {op.charAt(0).toUpperCase() + op.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Teléfono</label>
          <TeléfonoField profile={profile} refreshProfile={refreshProfile} supabase={supabase} />
        </div>
      </div>
    </div>
  )
}

function TeléfonoField({ profile, refreshProfile, supabase }) {
  const [val, setVal] = useState(profile.telefono || '')
  const [saved, setSaved] = useState(false)

  const save = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ telefono: val })
      .eq('id', profile.id)
    if (!error) {
      refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div className="flex gap-2">
      <input
        type="tel"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="099 123 456"
        className="input-field flex-1"
      />
      <button
        onClick={save}
        className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-900 transition-colors"
      >
        {saved ? '✓' : 'Guardar'}
      </button>
    </div>
  )
}
