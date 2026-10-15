'use client'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'

// Campo de contraseña con botón para mostrar u ocultar lo escrito
export default function ClaveInput({ id, value, onChange, placeholder = 'Tu contraseña', autoComplete = 'current-password', onEnter, className = '' }) {
  const [ver, setVer] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={ver ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={72}
        className={`f-input !pr-11 ${className}`}
      />
      <button type="button" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg text-[#7A7F8C] hover:text-[#16181D] hover:bg-[#F6F7F9] transition">
        <FontAwesomeIcon icon={ver ? faEyeSlash : faEye} className="text-[14px]" />
      </button>
    </div>
  )
}
