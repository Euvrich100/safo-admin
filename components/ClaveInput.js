'use client'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'

// Campo de contraseña con botón para mostrar u ocultar lo escrito
export default function ClaveInput({ value, onChange, placeholder = 'Contraseña', autoComplete = 'current-password', onEnter, className = '' }) {
  const [ver, setVer] = useState(false)
  return (
    <div className="relative">
      <input
        type={ver ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={72}
        className={`w-full pl-4 pr-12 py-3.5 rounded-xl text-[#1D1D1F] placeholder-[#A1A1A6] focus:outline-none bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#0A66E0] transition ${className}`}
      />
      <button type="button" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full text-[#6E6E73] hover:bg-[#E8E8ED] transition">
        <FontAwesomeIcon icon={ver ? faEyeSlash : faEye} />
      </button>
    </div>
  )
}
