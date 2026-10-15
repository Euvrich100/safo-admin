'use client'
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCommentDots, faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import api from '@/lib/api'
import { hace } from '@/lib/formato'

const ETIQUETA = {
  abierto: ['Recibido', 'bg-[#FEF3E2] text-[#B45309]'],
  en_revision: ['En revisión', 'bg-[#EAF2FE] text-[#0A66E0]'],
  resuelto: ['Resuelto', 'bg-[#E8F5EA] text-[#1E8E3E]'],
  rechazado: ['Rechazado', 'bg-[#FCEAE9] text-[#D92D20]'],
}

// Formulario de reclamo + historial con las respuestas del equipo de SafO.
// `viajes` (opcional): [{ id, texto }] para vincular el reclamo a un viaje.
export default function ReclamosPanel({ viajes = [] }) {
  const [lista, setLista] = useState([])
  const [asunto, setAsunto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [viajeId, setViajeId] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cargar = useCallback(async () => {
    try { setLista((await api.get('/api/reclamos/mios')).data) } catch { /* se reintenta al reabrir */ }
  }, [])
  useEffect(() => { cargar() }, [cargar])

  const enviar = async () => {
    if (asunto.trim().length < 4) return toast.error('Escribe un asunto (mínimo 4 letras)')
    if (descripcion.trim().length < 10) return toast.error('Cuéntanos qué pasó (mínimo 10 caracteres)')
    setEnviando(true)
    try {
      const { data } = await api.post('/api/reclamos', { asunto, descripcion, viaje_id: viajeId || undefined })
      toast.success(data.mensaje)
      setAsunto(''); setDescripcion(''); setViajeId('')
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo enviar el reclamo')
    } finally {
      setEnviando(false)
    }
  }

  const campo = 'w-full px-4 py-3 rounded-xl bg-[#F4F6FA] text-sm text-[#14213D] placeholder-[#A1A1A6] focus:outline-none focus:ring-2 focus:ring-[#0A66E0]/40'

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-[#E6E8EF] bg-white p-5 space-y-3">
        <h3 className="font-semibold text-[#14213D]"><FontAwesomeIcon icon={faCommentDots} className="text-[#7C5CFC] mr-2" />Enviar un reclamo</h3>
        <p className="text-sm text-[#6E6E73]">Si algo salió mal en un viaje, cuéntanoslo. El equipo de SafO lo revisa y te responde aquí.</p>
        {viajes.length > 0 && (
          <select value={viajeId} onChange={e => setViajeId(e.target.value)} className={campo} aria-label="Viaje relacionado">
            <option value="">Sin viaje relacionado</option>
            {viajes.map(v => <option key={v.id} value={v.id}>{v.texto}</option>)}
          </select>
        )}
        <input value={asunto} onChange={e => setAsunto(e.target.value)} maxLength={120} placeholder="Asunto (ej. Me cobraron de más)" className={campo} />
        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} maxLength={2000} rows={4} placeholder="Describe lo que pasó" className={`${campo} resize-y`} />
        <button onClick={enviar} disabled={enviando}
          className="w-full py-3 rounded-xl bg-[#14213D] text-white font-semibold text-sm disabled:opacity-50">
          <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />{enviando ? 'Enviando...' : 'Enviar reclamo'}
        </button>
      </div>

      {lista.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-[#14213D] px-1">Mis reclamos</h3>
          {lista.map(r => {
            const [texto, clase] = ETIQUETA[r.estado] || ETIQUETA.abierto
            return (
              <article key={r.id} className="rounded-2xl border border-[#E6E8EF] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium text-[#14213D]">{r.asunto}</div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${clase}`}>{texto}</span>
                </div>
                <p className="text-sm text-[#6E6E73] mt-1 whitespace-pre-wrap">{r.descripcion}</p>
                <p className="text-xs text-[#A1A1A6] mt-2">{hace(r.creado_en)}</p>
                {r.respuesta && (
                  <div className="mt-3 rounded-xl bg-[#F4F6FA] px-4 py-3 text-sm">
                    <div className="text-xs font-semibold text-[#0A66E0] mb-1">Respuesta de SafO</div>
                    <div className="text-[#14213D] whitespace-pre-wrap">{r.respuesta}</div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
