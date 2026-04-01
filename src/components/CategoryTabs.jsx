import React from 'react'
import useStore from '../store/useStore'

const CATEGORIAS = [
  { value: 'primera',   label: 'Primera' },
  { value: 'ejecutivo', label: 'Ejecutivo' },
  { value: 'master',    label: 'Master' },
]

export default function CategoryTabs({ onChange }) {
  const { categoriaActiva, setCategoriaActiva } = useStore()

  const handleChange = (cat) => {
    setCategoriaActiva(cat)
    if (onChange) onChange(cat)
  }

  return (
    <div className="flex bg-surface rounded-xl p-1 mb-4 border border-surface-line gap-1">
      {CATEGORIAS.map((cat) => {
        const isActive = categoriaActiva === cat.value
        return (
          <button
            key={cat.value}
            onClick={() => handleChange(cat.value)}
            className={`flex-1 py-2 px-2 rounded-lg text-sm font-semibold tracking-wide
                        transition-all duration-200 ${
              isActive
                ? 'bg-primary text-white shadow-glow-sm'
                : 'text-gray-500 hover:text-gray-200 hover:bg-surface-raised'
            }`}
          >
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}
