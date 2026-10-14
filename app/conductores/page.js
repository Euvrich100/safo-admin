'use client'
import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import useAuthGuard from '@/lib/useAuthGuard'
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck, faCircleXmark, faTaxi, faMagnifyingGlass, faXmark, faFileLines, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import AdminNavbar from '@/components/AdminNavbar'
import DocImagen from '@/components/DocImagen'

const FILTROS = [
  { val: 'pendiente', label: 'Pendientes' },
  { val: 'aprobado', label: 'Aprobados' },
  { val: 'rechazado', label: 'Rechazados' },
]

const ESTADO_ESTILO = {
  aprobado: { color: '#1E8E3E', bg: '#E8F5EA' },
  rechazado: { color: '#D92D20', bg: '#FCEAE9' },
  pendiente: { color: '#B45309', bg: '#FEF3E2' },
}

const fmtFecha = (f) => f ? new Date(f).toLocaleDateString('es-PE', { timeZone: 'UTC' }) : '—'

function Dato({ label, valor }) {
  return (
    <div className="rounded-xl p-3 bg-[#F5F5F7]">
      <div className="text-[#A1A1A6] text-xs mb-1">{label}</div>
      <div className="font-medium text-sm text-[#1D1D1F] break-words">{valor || '—'}</div>
    </div>
  )
}

// Ficha completa de la solicitud con documentos y botones de decisión
function FichaConductor({ id, onCerrar, onDecidido }) {
  const [c, setC] = useState(null)
  const [rechazando, setRechazando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    api.get(`/api/admin/conductores/${id}`)
      .then(({ data }) => setC(data))
      .catch(() => { toast.error('No se pudo cargar la solicitud'); onCerrar() })
  }, [id, onCerrar])

  const decidir = async (decision) => {
    if (decision === 'rechazado' && !motivo.trim()) return toast.error('Escribe el motivo del rechazo')
    setEnviando(true)
    try {
      await api.put(`/api/admin/conductores/${id}/documentos`, { decision, motivo: motivo.trim() })
      if (decision === 'aprobado') toast.success('Conductor aprobado')
      else toast('Solicitud rechazada', { icon: <FontAwesomeIcon icon={faCircleXmark} className="text-[#D92D20]" /> })
      onDecidido()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al procesar')
    } finally {
      setEnviando(false)
    }
  }

  const estilo = ESTADO_ESTILO[c?.estado_doc] || ESTADO_ESTILO.pendiente

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl w-full max-w-3xl my-8 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-xl font-semibold text-[#1D1D1F]">{c ? c.nombre : 'Cargando…'}</h2>
            {c && <p className="text-[#6E6E73] text-sm mt-0.5">Registrado el {fmtFecha(c.registrado_en)}</p>}
          </div>
          <div className="flex items-center gap-3">
            {c && (
              <span className="text-xs px-3 py-1 rounded-full font-medium capitalize" style={{ color: estilo.color, background: estilo.bg }}>
                {c.estado_doc}
              </span>
            )}
            <button onClick={onCerrar} className="p-2 rounded-full hover:bg-[#F5F5F7]" aria-label="Cerrar">
              <FontAwesomeIcon icon={faXmark} className="text-lg text-[#6E6E73]" />
            </button>
          </div>
        </div>

        {c && (
          <>
            <h3 className="text-xs font-semibold text-[#6E6E73] uppercase tracking-widest mb-3">Datos personales</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              <Dato label="Celular" valor={c.celular} />
              <Dato label="DNI" valor={c.dni} />
              <Dato label="Nacimiento" valor={fmtFecha(c.fecha_nacimiento)} />
              <div className="col-span-2 md:col-span-3"><Dato label="Dirección" valor={c.direccion} /></div>
            </div>

            <h3 className="text-xs font-semibold text-[#6E6E73] uppercase tracking-widest mb-3">Licencia y vehículo</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              <Dato label="N° licencia" valor={c.licencia_numero} />
              <Dato label="Categoría" valor={c.licencia_categoria} />
              <Dato label="Placa" valor={c.placa} />
              <Dato label="Marca / modelo" valor={[c.vehiculo_marca, c.vehiculo_modelo].filter(Boolean).join(' ')} />
              <Dato label="Color" valor={c.vehiculo_color} />
              <Dato label="Año" valor={c.vehiculo_anno} />
            </div>

            <h3 className="text-xs font-semibold text-[#6E6E73] uppercase tracking-widest mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faFileLines} className="text-sm" /> Documentos (toca una foto para verla completa)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <DocImagen archivo={c.dni_foto_frontal_url} etiqueta="DNI frontal" />
              <DocImagen archivo={c.dni_foto_trasera_url} etiqueta="DNI trasero" />
              <DocImagen archivo={c.licencia_foto_url} etiqueta="Licencia" />
              <DocImagen archivo={c.vehiculo_foto_url} etiqueta="Vehículo" />
              <DocImagen archivo={c.perfil_foto_url} etiqueta="Foto de perfil" />
            </div>

            {c.estado_doc === 'rechazado' && c.rechazo_motivo && (
              <div className="p-3 rounded-xl bg-[#FCEAE9] text-[#D92D20] text-sm mb-4">
                <strong>Motivo del rechazo:</strong> {c.rechazo_motivo}
              </div>
            )}

            {c.estado_doc !== 'aprobado' && (
              rechazando ? (
                <div className="space-y-3">
                  <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3} autoFocus
                    placeholder="Motivo del rechazo (el conductor lo verá al intentar entrar). Ej: La foto de la licencia no se lee."
                    className="w-full px-4 py-3 rounded-xl bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#0A66E0] focus:outline-none text-sm" />
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setRechazando(false)} className="px-5 py-2.5 rounded-full text-sm text-[#6E6E73] border border-[#E2E2E7] hover:bg-[#F5F5F7]">Cancelar</button>
                    <button onClick={() => decidir('rechazado')} disabled={enviando}
                      className="px-5 py-2.5 rounded-full text-sm font-medium text-white bg-[#D92D20] hover:bg-[#B42318] disabled:opacity-50">
                      Confirmar rechazo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 justify-end">
                  {c.estado_doc === 'pendiente' && (
                    <button onClick={() => setRechazando(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-[#D92D20] bg-[#FCEAE9] hover:bg-[#F9D9D6]">
                      <FontAwesomeIcon icon={faCircleXmark} className="text-sm" /> Rechazar
                    </button>
                  )}
                  <button onClick={() => decidir('aprobado')} disabled={enviando}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white bg-[#1E8E3E] hover:bg-[#177530] disabled:opacity-50">
                    <FontAwesomeIcon icon={faCircleCheck} className="text-sm" /> {c.estado_doc === 'rechazado' ? 'Aprobar de todos modos' : 'Aprobar conductor'}
                  </button>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function ConductoresPage() {
  const { listo } = useAuthGuard()
  const [conductores, setConductores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('pendiente')
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto] = useState(null)

  const cargarConductores = useCallback(async () => {
    setCargando(true)
    try {
      const params = new URLSearchParams({ estado_doc: filtro })
      if (busqueda.trim()) params.set('buscar', busqueda.trim())
      const { data } = await api.get(`/api/admin/conductores?${params}`)
      setConductores(data)
    } catch (err) {
      toast.error('Error cargando conductores')
    } finally {
      setCargando(false)
    }
  }, [filtro, busqueda])

  useEffect(() => {
    if (!listo) return
    // Espera a que termine de escribir antes de consultar
    const t = setTimeout(cargarConductores, busqueda ? 350 : 0)
    return () => clearTimeout(t)
  }, [listo, cargarConductores, busqueda])

  const cerrar = useCallback(() => setAbierto(null), [])

  if (!listo) return null

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" />
      <AdminNavbar />

      <main className="p-6 max-w-6xl mx-auto">
        <div className="mb-6 mt-2">
          <h1 className="text-2xl font-semibold text-[#1D1D1F]">Solicitudes de conductores</h1>
          <p className="text-[#6E6E73] text-sm mt-1">Revisa los documentos de cada solicitud y apruébala o recházala</p>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <div className="flex gap-2">
            {FILTROS.map(f => (
              <button key={f.val} onClick={() => setFiltro(f.val)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  filtro === f.val ? 'bg-[#0A66E0] text-white' : 'text-[#6E6E73] border border-[#E2E2E7] hover:bg-[#F5F5F7]'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm text-[#A1A1A6] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, celular, DNI o placa"
              className="w-full pl-10 pr-4 py-2.5 rounded-full text-sm bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#0A66E0] focus:outline-none" />
          </div>
        </div>

        {cargando ? (
          <div className="text-[#A1A1A6] text-center py-20">Cargando...</div>
        ) : conductores.length === 0 ? (
          <div className="rounded-2xl border border-[#E2E2E7] bg-[#F5F5F7] py-20 text-center">
            <FontAwesomeIcon icon={faTaxi} className="text-4xl text-[#A1A1A6] mx-auto mb-3" />
            <div className="text-[#6E6E73]">No hay conductores {filtro === 'pendiente' ? 'pendientes' : filtro + 's'}</div>
          </div>
        ) : (
          <div className="space-y-3">
            {conductores.map(c => {
              const estilo = ESTADO_ESTILO[c.estado_doc] || ESTADO_ESTILO.pendiente
              return (
                <button key={c.id} onClick={() => setAbierto(c.id)}
                  className="w-full text-left rounded-2xl p-5 border border-[#E2E2E7] bg-white hover:border-[#0A66E0] hover:shadow-sm transition">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-semibold text-white bg-[#0A66E0] shrink-0">
                      {c.nombre?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <div className="font-medium text-[#1D1D1F]">{c.nombre}</div>
                      <div className="text-[#6E6E73] text-sm">{c.celular} · DNI {c.dni || '—'}</div>
                    </div>
                    <div className="text-sm text-[#6E6E73]">
                      <div>{c.placa || '—'}</div>
                      <div>{[c.vehiculo_marca, c.vehiculo_modelo].filter(Boolean).join(' ') || '—'}</div>
                    </div>
                    <div className="text-sm text-[#6E6E73] hidden md:block">Enviada<br />{fmtFecha(c.creado_en)}</div>
                    <span className="text-xs px-3 py-1 rounded-full font-medium capitalize" style={{ color: estilo.color, background: estilo.bg }}>
                      {c.estado_doc}
                    </span>
                    <span className="text-[#0A66E0] text-sm font-medium">Revisar <FontAwesomeIcon icon={faArrowRight} className="text-xs ml-1" /></span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>

      {abierto && (
        <FichaConductor id={abierto} onCerrar={cerrar}
          onDecidido={() => { setAbierto(null); cargarConductores() }} />
      )}
    </div>
  )
}
