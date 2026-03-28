import React from 'react'

export default function LoadingSpinner({ size = 'md', color = 'primary' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
  }

  const colors = {
    primary: 'border-primary border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent',
  }

  return (
    <div
      className={`${sizes[size]} ${colors[color]} rounded-full animate-spin`}
      role="status"
      aria-label="Cargando..."
    />
  )
}
