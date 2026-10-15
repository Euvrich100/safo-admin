'use client'
import { useState, useEffect, useCallback } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCommentDots, faPhone, faRoute, faInbox } from '@fortawesome/free-solid-svg-icons'
import api from '@/lib/api'
import useAuthGuard from '@/lib/useAuthGuard'
import AdminNavbar from '@/components/AdminNavbar'
import { hace, fechaHora } from '@/lib/formato'

const FILTROS = [
  { id: '', texto: 'Todos' },
  { id: 'abierto', texto: 'Abiertos' },
  { id: 'en_revision', texto: 'En revisión' },
  { id: 'resuelto', texto: 'Resueltos' },
  { id: 'rechazado', texto: 'Rechazados' },
]
const ETIQUETA = {
  abierto: { texto: 'Abierto', clase: 'bg-[#FEF3E2] text-[#B45309]' },
  en_revision: { texto: 'En revisión', clase: 'bg-[#EAF2FE] text-[#0A66E0]' },
  resuelto: { texto: 'Resuelto', clase: 'bg-[#E8F5EA] text-[#1E8E3E]' },
  rechazado: { texto: 'Rechazado', clase: 'bg-[#FCEAE9] text-[#D92D20]' },
}

export default function ReclamosPage() {
  const { listo } = useAuthGuard()
  const [filtro, setFiltro] = useState('')
  const [lista, setLista] = useState([])
  const [cargando, setCargando] = useState(true)
  const [respuestas, setRespuestas] = useState({})
  const [enviando, setEnviando] = useState(null)

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/admin/reclamos${filtro ? `?estado=${filtro}` : ''}`)
      setLista(data)
    } catch {
      toast.error('Error cargando los reclamos', { id: 'err-reclamos' })
    } finally {
      setCargando(false)
    }
  }, [filtro])

  useEffect(() => { if (listo) cargar() }, [listo, cargar])

  const responder = async (r, estado) => {
    const respuesta = (respuestas[r.id] ?? r.respuesta ?? '').trim()
    if ((estado === 'resuelto' || estado === 'rechazado') && !respuesta) {
      return toast.error('Escribe una respuesta para el usuario')
    }
    setEnviando(r.id + estado)
    try {
      await api.put(`/api/admin/reclamos/${r.id}`, { estado, respuesta })
      toast.success('Reclamo actualizado')
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo actualizar')
    } finally {
      setEnviando(null)
    }
  }

  if (!listo) return <div className="min-h-screen bg-white" />

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" />
      <AdminNavbar />
      <main className="p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-[#14213D]">Reclamos</h1>
            <p className="text-sm text-[#6E6E73] mt-1">Quejas de pasajeros y conductores. Tu respuesta les aparece en su cuenta.</p>
          </div>
          <div className="inline-flex flex-wrap rounded-xl bg-white border border-[#E6E8EF] p-1">
            {FILTROS.map(f => (
              <button key={f.id} onClick={() => { setFiltro(f.id); setCargando(true) }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filtro === f.id ? 'bg-[#14213D] text-white' : 'text-[#6E6E73] hover:text-[#14213D]'}`}>{f.texto}</button>
            ))}
          </div>
        </div>

        {cargando ? (
          <div className="py-20 text-center text-[#6E6E73] text-sm">Cargando...</div>
        ) : lista.length === 0 ? (
          <div className="tarjeta py-20 text-center">
            <FontAwesomeIcon icon={faInbox} className="text-4xl text-[#C5C8D2] mb-3" />
            <p className="text-[#14213D] font-medium">No hay reclamos {filtro ? 'con este estado' : 'por ahora'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lista.map(r => {
              const et = ETIQUETA[r.estado]
              const cerrado = r.estado === 'resuelto' || r.estado === 'rechazado'
              return (
                <article key={r.id} className="tarjeta p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="w-10 h-10 rounded-xl bg-[#F1EEFF] text-[#7C5CFC] flex items-center justify-center shrink-0">
                        <FontAwesomeIcon icon={faCommentDots} />
                      </span>
                      <div className="min-w-0">
                        <h2 className="font-semibold text-[#14213D]">{r.asunto}</h2>
                        <p className="text-sm text-[#6E6E73]">
                          {r.nombre} <span className="text-xs">({r.rol})</span> ·{' '}
                          <a href={`tel:${r.celular}`} className="underline"><FontAwesomeIcon icon={faPhone} className="text-[10px] mr-1" />{r.celular}</a> · {hace(r.creado_en)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${et.clase}`}>{et.texto}</span>
                  </div>

                  <p className="mt-3 text-sm text-[#14213D] bg-[#F4F6FA] rounded-xl px-4 py-3 whitespace-pre-wrap">{r.descripcion}</p>
                  {r.viaje_id && (
                    <p className="mt-2 text-xs text-[#6E6E73]">
                      <FontAwesomeIcon icon={faRoute} className="mr-1.5" />Viaje: {r.direccion_origen || 'Origen en el mapa'}{r.direccion_destino ? ` → ${r.direccion_destino}` : ''}
                    </p>
                  )}

                  {cerrado ? (
                    <div className="mt-3 text-sm bg-[#F4F6FA] rounded-xl px-4 py-3">
                      <div className="text-xs text-[#8A8F9C] mb-1">Respuesta enviada · {fechaHora(r.resuelto_en)}</div>
                      <div className="text-[#14213D] whitespace-pre-wrap">{r.respuesta}</div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <textarea rows={2} maxLength={2000} placeholder="Escribe tu respuesta para el usuario…"
                        value={respuestas[r.id] ?? r.respuesta ?? ''} onChange={e => setRespuestas(x => ({ ...x, [r.id]: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-[#F4F6FA] text-sm focus:outline-none focus:ring-2 focus:ring-[#0A66E0]/40 resize-y" />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {r.estado === 'abierto' && (
                          <button onClick={() => responder(r, 'en_revision')} disabled={!!enviando}
                            className="px-4 py-2 rounded-xl bg-[#EAF2FE] text-[#0A66E0] text-sm font-semibold disabled:opacity-50">Pasar a revisión</button>
                        )}
                        <button onClick={() => responder(r, 'resuelto')} disabled={!!enviando}
                          className="px-4 py-2 rounded-xl bg-[#1E8E3E] text-white text-sm font-semibold disabled:opacity-50">Resolver</button>
                        <button onClick={() => responder(r, 'rechazado')} disabled={!!enviando}
                          className="px-4 py-2 rounded-xl bg-white border border-[#D92D20] text-[#D92D20] text-sm font-semibold disabled:opacity-50">Rechazar</button>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
