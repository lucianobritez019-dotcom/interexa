import React from 'react'
import useStore from '../store/useStore'

const CATEGORIAS = [
  { value: 'primera', label: 'Primera' },
  { value: 'ejecutivo', label: 'Ejecutivo' },
  { value: 'master', label: 'Master' },
]

export default function CategoryTabs({ onChange }) {
  const { categoriaActiva, setCategoriaActiva } = useStore()

  const handleChange = (cat) => {
    setCategoriaActiva(cat)
    if (onChange) onChange(cat)
  }

  return (
    <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
      {CATEGORIAS.map((cat) => (
        <button
          key={cat.value}
          onClick={() => handleChange(cat.value)}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
            categoriaActiva === cat.value
              ? 'bg-primary text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}
