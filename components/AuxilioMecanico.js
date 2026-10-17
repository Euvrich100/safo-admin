'use client'
import { useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWrench, faXmark, faPhone, faLock, faClock, faLocationDot, faTruckPickup, faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import api from '@/lib/api'
import Campo from './Campo'
import ClaveInput from './ClaveInput'
import { ESPECIALIDADES, textoEspecialidad, textoVehiculos, numeroWhatsapp } from '@/lib/auxilio'

// Directorio de mecánicos de confianza para conductores con el vehículo malogrado.
//  · autenticado=true  → el conductor ya inició sesión (panel del conductor): se carga directo.
//  · autenticado=false → desde el inicio público: pide celular y contraseña de conductor.
// La lista solo vive en memoria mientras el panel está abierto.
export default function AuxilioMecanico({ autenticado = false, onCerrar }) {
  const [celular, setCelular] = useState('')
  const [clave, setClave] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [mecanicos, setMecanicos] = useState(null)
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    if (!autenticado) return
    let vivo = true
    api.get('/api/auxilio/mecanicos')
      .then(({ data }) => vivo && setMecanicos(data.mecanicos))
      .catch(e => vivo && setError(e.response?.data?.error || 'No se pudo cargar la lista. Intenta de nuevo.'))
    return () => { vivo = false }
  }, [autenticado])

  useEffect(() => {
    const tecla = (e) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [onCerrar])

  const entrar = async () => {
    if (celular.length !== 9) return setError('Ingresa tu celular de 9 dígitos')
    if (!clave) return setError('Ingresa tu contraseña')
    setError(''); setEnviando(true)
    try {
      const { data } = await api.post('/api/auxilio/acceso', { celular, password: clave })
      setMecanicos(data.mecanicos)
      setClave('')
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo verificar. Revisa tu conexión.')
    } finally {
      setEnviando(false)
    }
  }

  const presentes = useMemo(() => {
    const usadas = new Set((mecanicos || []).map(m => m.especialidad))
    return ESPECIALIDADES.filter(e => usadas.has(e.v))
  }, [mecanicos])
  const visibles = (mecanicos || []).filter(m => !filtro || m.especialidad === filtro)

  return (
    <div className="fixed inset-0 z-[2000] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Auxilio mecánico"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="w-full max-w-md max-h-[92vh] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-11 h-11 shrink-0 rounded-full bg-[#EAF2FE] text-[#0A66E0] flex items-center justify-center"><FontAwesomeIcon icon={faWrench} /></span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[#14213D] leading-tight">Auxilio mecánico</h2>
              <p className="text-xs text-[#6E6E73]">Mecánicos de confianza de SafO</p>
            </div>
          </div>
          <button onClick={onCerrar} aria-label="Cerrar" className="w-10 h-10 shrink-0 rounded-full text-[#6E6E73] hover:bg-[#F4F6FA]"><FontAwesomeIcon icon={faXmark} /></button>
        </div>

        <div className="px-5 pb-5 overflow-y-auto">
          {mecanicos === null && !autenticado && (
            <form onSubmit={(e) => { e.preventDefault(); entrar() }} className="space-y-3">
              <p className="text-sm text-[#6E6E73] flex gap-2"><FontAwesomeIcon icon={faLock} className="mt-0.5 text-[#A1A1A6]" />
                Este servicio es solo para conductores de SafO. Ingresa tu celular y tu contraseña.</p>
              <Campo label="Celular" campo="celular" valor={celular} onCambio={(_, v) => setCelular(v)} prefijo="+51" inputMode="numeric" maxLength={9} placeholder="987 654 321" autoComplete="tel-national" />
              <div className="f-campo">
                <label htmlFor="aux-clave" className="f-etiqueta">Contraseña</label>
                <ClaveInput id="aux-clave" value={clave} onChange={setClave} onEnter={entrar} />
              </div>
              {error && <div role="alert" className="f-aviso">{error}</div>}
              <button type="submit" disabled={enviando} className="f-btn">{enviando ? 'Verificando…' : 'Ver mecánicos'}</button>
            </form>
          )}

          {mecanicos === null && autenticado && (
            error ? <div role="alert" className="f-aviso">{error}</div>
                  : <p className="text-sm text-[#6E6E73] text-center py-8">Cargando…</p>
          )}

          {mecanicos !== null && (
            <div className="space-y-3">
              {mecanicos.length === 0 ? (
                <div className="text-center py-8">
                  <span className="w-14 h-14 rounded-full bg-[#F4F6FA] text-[#A1A1A6] flex items-center justify-center text-xl mx-auto"><FontAwesomeIcon icon={faTruckPickup} /></span>
                  <h3 className="font-semibold text-[#14213D] mt-3">Estamos sumando mecánicos</h3>
                  <p className="text-sm text-[#6E6E73] mt-1">Pronto verás aquí los números de talleres con convenio para ayudarte si tu vehículo se malogra.</p>
                </div>
              ) : (
                <>
                  {presentes.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1" role="group" aria-label="Filtrar por especialidad">
                      {[{ v: '', t: 'Todos' }, ...presentes].map(e => (
                        <button key={e.v} onClick={() => setFiltro(e.v)} aria-pressed={filtro === e.v}
                          className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${filtro === e.v ? 'bg-[#0A66E0] border-[#0A66E0] text-white' : 'bg-white border-[#E6E8EF] text-[#6E6E73]'}`}>{e.t}</button>
                      ))}
                    </div>
                  )}
                  {visibles.map(m => (
                    <article key={m.id} className="rounded-2xl border border-[#E6E8EF] p-4" data-mecanico={m.id}>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-[#14213D] leading-snug">{m.nombre}</h3>
                        {m.atiende_24h && <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#e6f4ec] text-[#1a7f4b]">24 horas</span>}
                      </div>
                      <div className="text-sm text-[#0A66E0] font-medium">{textoEspecialidad(m.especialidad)}</div>
                      <div className="mt-1.5 space-y-0.5 text-sm text-[#6E6E73]">
                        {(m.direccion || m.distrito) && <div><FontAwesomeIcon icon={faLocationDot} className="w-4 mr-1.5 text-[#A1A1A6]" />{[m.direccion, m.distrito].filter(Boolean).join(' · ')}</div>}
                        {m.horario && !m.atiende_24h && <div><FontAwesomeIcon icon={faClock} className="w-4 mr-1.5 text-[#A1A1A6]" />{m.horario}</div>}
                        <div><FontAwesomeIcon icon={faCircleInfo} className="w-4 mr-1.5 text-[#A1A1A6]" />Atiende: {textoVehiculos(m.vehiculos)}</div>
                        {m.notas && <div className="pt-1 text-[#14213D]">{m.notas}</div>}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <a href={`tel:${m.telefono}`} className="py-2.5 rounded-xl bg-[#0A66E0] text-white text-sm font-semibold text-center"><FontAwesomeIcon icon={faPhone} className="mr-1.5" />Llamar</a>
                        {m.whatsapp ? (
                          <a href={`https://wa.me/${numeroWhatsapp(m.whatsapp)}`} target="_blank" rel="noopener noreferrer"
                            className="py-2.5 rounded-xl bg-[#e6f4ec] text-[#1a7f4b] text-sm font-semibold text-center"><FontAwesomeIcon icon={faWhatsapp} className="mr-1.5" />WhatsApp</a>
                        ) : <span className="py-2.5 rounded-xl bg-[#F4F6FA] text-[#A1A1A6] text-sm text-center">{m.telefono}</span>}
                      </div>
                    </article>
                  ))}
                  <p className="text-xs text-[#A1A1A6] text-center pt-1">Si hay peligro o heridos, usa el botón SOS o llama al 105 (Policía).</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
