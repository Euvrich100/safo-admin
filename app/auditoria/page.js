'use client'
import { useState, useEffect, useCallback } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import api from '@/lib/api'
import useAuthGuard from '@/lib/useAuthGuard'
import AdminNavbar from '@/components/AdminNavbar'
import { fechaHora } from '@/lib/formato'

const ACCIONES = {
  'conductor.revisar_documentos': 'Revisó documentos de un conductor',
  'suscripcion.confirmar': 'Confirmó un pago de suscripción',
  'usuario.cambiar_estado': 'Cambió el estado de un usuario',
  'usuario.restablecer_clave': 'Restableció una contraseña',
  'configuracion.guardar': 'Cambió tarifas o comisiones',
  'zona.crear': 'Creó una zona de servicio',
  'zona.actualizar': 'Actualizó una zona de servicio',
  'zona.eliminar': 'Eliminó una zona de servicio',
  'reclamo.resolver': 'Respondió un reclamo',
  'sos.atender': 'Atendió una alerta SOS',
}
const POR_PAGINA = 50

export default function AuditoriaPage() {
  const { listo } = useAuthGuard()
  const [filas, setFilas] = useState([])
  const [buscar, setBuscar] = useState('')
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [abierta, setAbierta] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const { data } = await api.get(`/api/admin/auditoria?page=${pagina}&limit=${POR_PAGINA}${buscar ? `&accion=${encodeURIComponent(buscar)}` : ''}`)
      setFilas(data)
    } catch {
      toast.error('Error cargando la auditoría', { id: 'err-aud' })
    } finally {
      setCargando(false)
    }
  }, [pagina, buscar])

  useEffect(() => {
    if (!listo) return
    const t = setTimeout(cargar, 250)
    return () => clearTimeout(t)
  }, [listo, cargar])

  if (!listo) return <div className="min-h-screen bg-white" />

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" />
      <AdminNavbar />
      <main className="p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-[#14213D]">Auditoría</h1>
            <p className="text-sm text-[#6E6E73] mt-1">Bitácora de lo que hace cada administrador. Solo se registran las acciones que se completaron.</p>
          </div>
          <label className="relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A1A6] text-sm" />
            <input value={buscar} onChange={e => { setBuscar(e.target.value); setPagina(1) }} placeholder="Filtrar: zona, sos, usuario…"
              className="pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E6E8EF] text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#0A66E0]/40" />
          </label>
        </div>

        <div className="tarjeta tarjeta-sombra overflow-hidden">
          {cargando ? (
            <div className="py-16 text-center text-sm text-[#6E6E73]">Cargando...</div>
          ) : filas.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#8A8F9C]">Aún no hay acciones registradas.</div>
          ) : (
            <ul>
              {filas.map(f => (
                <li key={f.id} className="border-b border-[#F0F1F5] last:border-0">
                  <button onClick={() => setAbierta(a => (a === f.id ? null : f.id))} className="w-full text-left px-5 py-3.5 flex items-center gap-4 hover:bg-[#FAFBFD]">
                    <span className="text-xs text-[#8A8F9C] w-28 shrink-0">{fechaHora(f.creado_en)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-[#14213D] truncate">{ACCIONES[f.accion] || f.accion}</span>
                      <span className="block text-xs text-[#8A8F9C] truncate">{f.usuario_nombre || 'Sistema'}{f.entidad_id ? ` · ${f.entidad} ${String(f.entidad_id).slice(0, 8)}` : ''} · {f.ip}</span>
                    </span>
                    <FontAwesomeIcon icon={faChevronDown} className={`text-xs text-[#C5C8D2] transition ${abierta === f.id ? 'rotate-180' : ''}`} />
                  </button>
                  {abierta === f.id && (
                    <pre className="mx-5 mb-4 p-3 rounded-xl bg-[#F4F6FA] text-xs text-[#4B4F5C] overflow-x-auto whitespace-pre-wrap">{JSON.stringify(f.detalle, null, 2)}</pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 text-sm">
          <button disabled={pagina === 1 || cargando} onClick={() => setPagina(p => p - 1)}
            className="px-4 py-2 rounded-xl bg-white border border-[#E6E8EF] disabled:opacity-40">← Anteriores</button>
          <span className="text-[#8A8F9C]">Página {pagina}</span>
          <button disabled={filas.length < POR_PAGINA || cargando} onClick={() => setPagina(p => p + 1)}
            className="px-4 py-2 rounded-xl bg-white border border-[#E6E8EF] disabled:opacity-40">Siguientes →</button>
        </div>
      </main>
    </div>
  )
}
