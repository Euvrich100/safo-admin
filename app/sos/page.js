'use client'
import { useState, useEffect, useCallback } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTriangleExclamation, faPhone, faLocationDot, faCircleCheck, faShieldHalved } from '@fortawesome/free-solid-svg-icons'
import api from '@/lib/api'
import useAuthGuard from '@/lib/useAuthGuard'
import AdminNavbar from '@/components/AdminNavbar'
import { hace, fechaHora } from '@/lib/formato'

const FILTROS = [
  { id: 'activa', texto: 'Activas' },
  { id: 'atendida', texto: 'Atendidas' },
  { id: 'todas', texto: 'Todas' },
]

export default function SOSPage() {
  const { listo } = useAuthGuard()
  const [filtro, setFiltro] = useState('activa')
  const [lista, setLista] = useState([])
  const [cargando, setCargando] = useState(true)
  const [notas, setNotas] = useState({})
  const [enviando, setEnviando] = useState(null)

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/admin/sos?estado=${filtro}`)
      setLista(data)
    } catch {
      toast.error('Error cargando las alertas', { id: 'err-sos' })
    } finally {
      setCargando(false)
    }
  }, [filtro])

  useEffect(() => {
    if (!listo) return
    cargar()
    const t = setInterval(cargar, 10000)
    return () => clearInterval(t)
  }, [listo, cargar])

  const atender = async (id) => {
    setEnviando(id)
    try {
      await api.put(`/api/admin/sos/${id}/atender`, { nota: notas[id] || '' })
      toast.success('Alerta marcada como atendida')
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
            <h1 className="text-2xl font-semibold text-[#14213D]">Alertas SOS</h1>
            <p className="text-sm text-[#6E6E73] mt-1">Pasajeros y conductores que pidieron ayuda desde un viaje. Llama primero y luego marca la alerta como atendida.</p>
          </div>
          <div className="inline-flex rounded-xl bg-white border border-[#E6E8EF] p-1">
            {FILTROS.map(f => (
              <button key={f.id} onClick={() => { setFiltro(f.id); setCargando(true) }}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${filtro === f.id ? 'bg-[#14213D] text-white' : 'text-[#6E6E73] hover:text-[#14213D]'}`}>{f.texto}</button>
            ))}
          </div>
        </div>

        {cargando ? (
          <div className="py-20 text-center text-[#6E6E73] text-sm">Cargando...</div>
        ) : lista.length === 0 ? (
          <div className="tarjeta py-20 text-center">
            <FontAwesomeIcon icon={faShieldHalved} className="text-4xl text-[#1D1D1F] mb-3" />
            <p className="text-[#14213D] font-medium">{filtro === 'activa' ? 'No hay alertas activas' : 'No hay alertas para mostrar'}</p>
            <p className="text-sm text-[#8A8F9C] mt-1">Todo tranquilo por ahora.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lista.map(a => {
              const activa = a.estado === 'activa'
              return (
                <article key={a.id} className={`tarjeta p-5 ${activa ? 'border-[#D92D20] ring-2 ring-[#D92D20]/20' : ''}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${activa ? 'bg-[#D92D20] text-white' : 'bg-[#F1F1F3] text-[#1D1D1F]'}`}>
                        <FontAwesomeIcon icon={activa ? faTriangleExclamation : faCircleCheck} />
                      </span>
                      <div className="min-w-0">
                        <h2 className="font-semibold text-[#14213D]">
                          {a.nombre} <span className="text-xs font-normal text-[#6E6E73]">· {a.rol}</span>
                        </h2>
                        <p className="text-sm text-[#6E6E73]">{hace(a.creado_en)} · {fechaHora(a.creado_en)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a href={`tel:${a.celular}`} className="px-3.5 py-2 rounded-full bg-[#14213D] text-white text-sm font-medium">
                        <FontAwesomeIcon icon={faPhone} className="mr-2" />{a.celular}
                      </a>
                      {a.lat && a.lng && (
                        <a href={`https://www.google.com/maps?q=${a.lat},${a.lng}`} target="_blank" rel="noreferrer"
                          className="px-3.5 py-2 rounded-full bg-[#EAF2FE] text-[#0A66E0] text-sm font-medium">
                          <FontAwesomeIcon icon={faLocationDot} className="mr-2" />Ver ubicación
                        </a>
                      )}
                    </div>
                  </div>

                  {a.mensaje && <p className="mt-3 text-sm text-[#14213D] bg-[#F4F6FA] rounded-xl px-4 py-3">“{a.mensaje}”</p>}

                  {a.viaje_id && (
                    <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-[#4B4F5C]">
                      <div><span className="text-[#8A8F9C]">Pasajero:</span> {a.pasajero_nombre} · <a className="underline" href={`tel:${a.pasajero_celular}`}>{a.pasajero_celular}</a></div>
                      <div><span className="text-[#8A8F9C]">Conductor:</span> {a.conductor_nombre} · <a className="underline" href={`tel:${a.conductor_celular}`}>{a.conductor_celular}</a> · {a.placa}</div>
                      <div className="sm:col-span-2"><span className="text-[#8A8F9C]">Recorrido:</span> {a.direccion_origen || 'Origen en el mapa'}{a.direccion_destino ? ` → ${a.direccion_destino}` : ''}</div>
                    </div>
                  )}
                  {!a.viaje_id && <p className="mt-3 text-xs text-[#8A8F9C]">La alerta se envió sin un viaje en curso.</p>}

                  {activa ? (
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <input value={notas[a.id] || ''} onChange={e => setNotas(n => ({ ...n, [a.id]: e.target.value }))}
                        placeholder="Nota: qué se hizo (opcional)" maxLength={500}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[#F4F6FA] text-sm focus:outline-none focus:ring-2 focus:ring-[#0A66E0]/40" />
                      <button onClick={() => atender(a.id)} disabled={enviando === a.id}
                        className="px-5 py-2.5 rounded-xl bg-[#1D1D1F] text-white text-sm font-semibold disabled:opacity-50">
                        {enviando === a.id ? 'Guardando...' : 'Marcar como atendida'}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-[#1D1D1F]">
                      Atendida {hace(a.atendida_en)}{a.nota_admin ? ` · ${a.nota_admin}` : ''}
                    </p>
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
