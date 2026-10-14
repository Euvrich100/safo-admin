'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faKey, faXmark, faCopy } from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'

// Muestra la contraseña temporal generada por el administrador para que se la entregue al usuario
export default function ClaveTemporalModal({ datos, onCerrar }) {
  if (!datos) return null
  const copiar = async () => {
    try { await navigator.clipboard.writeText(datos.clave_temporal); toast.success('Contraseña copiada') }
    catch { toast.error('No se pudo copiar; anótala a mano') }
  }
  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-full bg-[#EAF2FE] text-[#0A66E0] flex items-center justify-center"><FontAwesomeIcon icon={faKey} /></div>
          <button onClick={onCerrar} aria-label="Cerrar" className="p-2 rounded-full hover:bg-[#F5F5F7]"><FontAwesomeIcon icon={faXmark} className="text-[#6E6E73]" /></button>
        </div>
        <h2 className="text-lg font-semibold text-[#1D1D1F]">Contraseña temporal</h2>
        <p className="text-sm text-[#6E6E73] mt-1 mb-4">Para {datos.nombre} ({datos.celular}). Entrégasela por un canal seguro; podrá cambiarla en «Mi cuenta». Solo se muestra ahora.</p>
        <div className="rounded-xl bg-[#F5F5F7] py-4 text-center text-3xl font-semibold tracking-[0.25em] text-[#14213D] select-all">{datos.clave_temporal}</div>
        <button onClick={copiar} className="mt-4 w-full py-3 rounded-full font-semibold text-white bg-[#0A66E0] hover:bg-[#084FB0] transition">
          <FontAwesomeIcon icon={faCopy} className="mr-2" />Copiar
        </button>
      </div>
    </div>
  )
}
