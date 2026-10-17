'use client'
import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import useAuthGuard from '@/lib/useAuthGuard'
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck, faCircleXmark, faTaxi, faMagnifyingGlass, faXmark, faFileLines, faArrowRight, faKey, faListCheck, faArrowUpRightFromSquare, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import AdminNavbar from '@/components/AdminNavbar'
import DocImagen from '@/components/DocImagen'
import ClaveTemporalModal from '@/components/ClaveTemporalModal'
import InsigniaVigencia from '@/components/InsigniaVigencia'
import { TIPOS_VEHICULO, nombreVehiculo, iconoVehiculo } from '@/lib/vehiculos'
import { URL_APESEG, URL_SBS_SOAT, fechaCorta, hoyLima, diasEntre, textoDias } from '@/lib/documentos'

const FILTROS = [
  { val: 'pendiente', label: 'Pendientes' },
  { val: 'aprobado', label: 'Aprobados' },
  { val: 'rechazado', label: 'Rechazados' },
]

const ESTADO_ESTILO = {
  aprobado: { color: '#1D1D1F', bg: '#F1F1F3' },
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

const ETIQUETA_ARCHIVO = {
  dni_foto_frontal_url: 'DNI, frente', dni_foto_trasera_url: 'DNI, reverso', selfie_dni_url: 'Selfie con DNI', perfil_foto_url: 'Foto de rostro',
  licencia_foto_url: 'Licencia, frente', licencia_foto_trasera_url: 'Licencia, reverso',
  vehiculo_foto_url: 'Vehículo, frente', vehiculo_foto_trasera_url: 'Vehículo, atrás', vehiculo_foto_interior_url: 'Vehículo, interior',
  tarjeta_propiedad_url: 'Tarjeta de propiedad', autorizacion_propietario_url: 'Autorización del propietario',
  soat_foto_url: 'Certificado SOAT/CAT', revision_tecnica_foto_url: 'Revisión técnica', antecedentes_url: 'Antecedentes', permiso_municipal_url: 'Permiso municipal',
}

// Datos que el administrador debe cotejar con los documentos de cada rubro
const datosDelRubro = (c) => ({
  identidad: [['Nombre', c.nombre], ['DNI', c.dni], ['Nacimiento', fechaCorta(c.fecha_nacimiento)], ['Dirección', c.direccion]],
  licencia: [['N° de licencia', c.licencia_numero], ['Categoría', c.licencia_categoria], ['Vence', fechaCorta(c.licencia_vence)]],
  vehiculo: [['Tipo', nombreVehiculo(c.tipo_vehiculo)], ['Placa', c.placa], ['Marca / modelo', [c.vehiculo_marca, c.vehiculo_modelo].filter(Boolean).join(' ')], ['Color', c.vehiculo_color], ['Año', c.vehiculo_anno], ['Chasis / serie', c.vehiculo_serie]],
  propiedad: [['¿Es el propietario?', c.es_propietario === false ? 'No' : 'Sí'], ['Propietario', c.es_propietario === false ? c.propietario_nombre : c.nombre]],
  seguro: [['Tipo', c.soat_tipo === 'cat' ? 'CAT (AFOCAT)' : 'SOAT'], ['N° de póliza', c.soat_numero], ['Aseguradora', c.soat_aseguradora], ['Vence', fechaCorta(c.soat_vence)], ['Placa a consultar', c.placa]],
  revision: [['Vence', fechaCorta(c.revision_tecnica_vence)]],
  antecedentes: [['Emitido el', fechaCorta(c.antecedentes_fecha)], ['Antigüedad', c.antecedentes_fecha ? `${diasEntre(c.antecedentes_fecha, hoyLima())} días` : '—']],
  emergencia: [['Nombre', c.emergencia_nombre], ['Parentesco', c.emergencia_parentesco], ['Celular', c.emergencia_celular]],
  permiso: [['N° de permiso', c.permiso_municipal_numero], ['Vence', fechaCorta(c.permiso_municipal_vence)]],
})

const TITULO = 'text-xs font-semibold text-[#6E6E73] uppercase tracking-widest mb-3'

// Un rubro de la lista de revisión: datos + documentos + «Correcto» / «Observar»
function RubroRevision({ r, c, onCambiar, ocupado }) {
  const [observando, setObservando] = useState(false)
  const [nota, setNota] = useState('')
  const datos = datosDelRubro(c)[r.clave] || []
  const archivos = r.archivos.filter(a => c[a])
  const borde = r.estado === 'ok' ? 'border-[#1A7F4B]' : r.estado === 'observado' ? 'border-[#D92D20]' : 'border-[#E2E2E7]'

  return (
    <div className={`rounded-2xl border p-4 ${borde}`} data-rubro={r.clave}>
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div>
          <div className="font-semibold text-[#1D1D1F] flex items-center gap-2">
            {r.etiqueta}
            {!r.obligatorio && <span className="text-[11px] font-normal text-[#8A8F9C]">opcional</span>}
          </div>
          <p className="text-[12.5px] text-[#6E6E73] mt-0.5 max-w-xl"><FontAwesomeIcon icon={faListCheck} className="mr-1.5 text-[11px]" />{r.comprobar}</p>
        </div>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap ${r.estado === 'ok' ? 'text-[#1A7F4B] bg-[#E6F4EC]' : r.estado === 'observado' ? 'text-[#D92D20] bg-[#FCEAE9]' : 'text-[#B45309] bg-[#FEF3E2]'}`}>
          {r.estado === 'ok' ? 'Correcto' : r.estado === 'observado' ? 'Observado' : 'Por revisar'}
        </span>
      </div>

      {datos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-3">
          {datos.map(([l, v]) => <Dato key={l} label={l} valor={v} />)}
        </div>
      )}

      {r.clave === 'seguro' && (
        <div className="flex flex-wrap gap-2 mb-3">
          <a href={c.enlace_consulta_soat || URL_APESEG} target="_blank" rel="noreferrer"
            className="px-3.5 py-2 rounded-full text-[13px] font-medium text-[#0A66E0] bg-[#EAF2FE] hover:bg-[#D9E8FC] transition">
            Consultar placa {c.placa} en APESEG <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="ml-1 text-[10px]" />
          </a>
          <a href={URL_SBS_SOAT} target="_blank" rel="noreferrer"
            className="px-3.5 py-2 rounded-full text-[13px] font-medium text-[#0A66E0] bg-[#EAF2FE] hover:bg-[#D9E8FC] transition">
            Reporte SOAT/CAT en la SBS <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="ml-1 text-[10px]" />
          </a>
        </div>
      )}

      {archivos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {archivos.map(a => <DocImagen key={a} archivo={c[a]} etiqueta={ETIQUETA_ARCHIVO[a]} />)}
        </div>
      ) : r.archivos.length > 0 && (
        <p className="text-[12.5px] text-[#D92D20] mb-3">No subió ningún documento de este rubro.</p>
      )}

      {r.estado === 'observado' && r.nota && (
        <p className="text-sm p-2.5 rounded-lg bg-[#FCEAE9] text-[#D92D20] mb-3"><strong>Observación:</strong> {r.nota}</p>
      )}

      {observando ? (
        <div className="space-y-2">
          <textarea value={nota} onChange={e => setNota(e.target.value)} rows={2} autoFocus aria-label={`Observación de ${r.etiqueta}`}
            placeholder="¿Qué se observa? Ej. La póliza no figura en APESEG con esta placa."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#0A66E0] focus:outline-none text-sm" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setObservando(false)} className="px-4 py-2 rounded-full text-sm text-[#6E6E73] border border-[#E2E2E7] hover:bg-[#F5F5F7]">Cancelar</button>
            <button disabled={ocupado} onClick={async () => { if (await onCambiar(r.clave, 'observado', nota)) { setObservando(false); setNota('') } }}
              className="px-4 py-2 rounded-full text-sm font-medium text-white bg-[#D92D20] hover:bg-[#B42318] disabled:opacity-50">Guardar observación</button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 justify-end flex-wrap">
          {r.estado && (
            <button disabled={ocupado} onClick={() => onCambiar(r.clave, null)} className="px-3.5 py-2 rounded-full text-[13px] text-[#6E6E73] hover:bg-[#F5F5F7]">Deshacer</button>
          )}
          {r.estado !== 'observado' && (
            <button disabled={ocupado} onClick={() => setObservando(true)}
              className="px-4 py-2 rounded-full text-sm font-medium text-[#D92D20] bg-[#FCEAE9] hover:bg-[#F9D9D6] disabled:opacity-50">Observar</button>
          )}
          {r.estado !== 'ok' && (
            <button disabled={ocupado} onClick={() => onCambiar(r.clave, 'ok')}
              className="px-4 py-2 rounded-full text-sm font-medium text-[#1A7F4B] bg-[#E6F4EC] hover:brightness-95 disabled:opacity-50">
              <FontAwesomeIcon icon={faCircleCheck} className="mr-1.5 text-xs" />Correcto
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Documento renovado por un conductor ya registrado, a la espera de que el admin lo apruebe
function RenovacionPendiente({ tipo, r, onDecidir, ocupado }) {
  const [rechazando, setRechazando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const nombre = { soat: 'SOAT / CAT', licencia: 'Licencia', revision: 'Revisión técnica', antecedentes: 'Antecedentes', permiso: 'Permiso municipal' }[tipo]
  const datos = [
    r.numero && ['N° de póliza / permiso', r.numero], r.aseguradora && ['Aseguradora', r.aseguradora], r.tipo && ['Tipo', r.tipo === 'cat' ? 'CAT' : 'SOAT'],
    r.categoria && ['Categoría', r.categoria], r.vence && ['Nuevo vencimiento', fechaCorta(r.vence)], r.fecha && ['Emitido el', fechaCorta(r.fecha)],
  ].filter(Boolean)
  return (
    <div className="rounded-2xl border border-[#0A66E0] p-4" data-renovacion={tipo}>
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="font-semibold text-[#1D1D1F]">Renovación: {nombre}</div>
        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium text-[#0A66E0] bg-[#EAF2FE]">Enviada {fechaCorta(String(r.subido_en).slice(0, 10))}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3">
        {datos.map(([l, v]) => <Dato key={l} label={l} valor={v} />)}
        <DocImagen archivo={r.archivo} etiqueta="Nuevo documento" />
        {r.archivo_reverso && <DocImagen archivo={r.archivo_reverso} etiqueta="Reverso" />}
      </div>
      {tipo === 'soat' && <p className="text-[12.5px] text-[#6E6E73] mb-3">Antes de aprobar, comprueba la placa en APESEG.</p>}
      {rechazando ? (
        <div className="space-y-2">
          <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={2} autoFocus aria-label="Motivo del rechazo de la renovación"
            placeholder="Motivo (el conductor lo verá). Ej. El certificado es de otra placa."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#0A66E0] focus:outline-none text-sm" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setRechazando(false)} className="px-4 py-2 rounded-full text-sm text-[#6E6E73] border border-[#E2E2E7]">Cancelar</button>
            <button disabled={ocupado} onClick={() => onDecidir(tipo, 'rechazado', motivo)} className="px-4 py-2 rounded-full text-sm font-medium text-white bg-[#D92D20] disabled:opacity-50">Confirmar rechazo</button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 justify-end">
          <button disabled={ocupado} onClick={() => setRechazando(true)} className="px-4 py-2 rounded-full text-sm font-medium text-[#D92D20] bg-[#FCEAE9] hover:bg-[#F9D9D6] disabled:opacity-50">Rechazar</button>
          <button disabled={ocupado} onClick={() => onDecidir(tipo, 'aprobado')} className="px-4 py-2 rounded-full text-sm font-medium text-white bg-[#1D1D1F] disabled:opacity-50">
            <FontAwesomeIcon icon={faCircleCheck} className="mr-1.5 text-xs" />Aprobar y aplicar
          </button>
        </div>
      )}
    </div>
  )
}

// Ficha completa de la solicitud con documentos, lista de revisión y botones de decisión
function FichaConductor({ id, onCerrar, onDecidido }) {
  const [c, setC] = useState(null)
  const [rechazando, setRechazando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [claveTemp, setClaveTemp] = useState(null)

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

  const cambiarRubro = async (rubro, estado, nota) => {
    if (estado === 'observado' && !String(nota || '').trim()) { toast.error('Explica qué se observa'); return false }
    setEnviando(true)
    try {
      const { data } = await api.put(`/api/admin/conductores/${id}/verificacion`, { rubro, estado, nota })
      setC(data)
      return true
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo guardar')
      return false
    } finally {
      setEnviando(false)
    }
  }

  const decidirRenovacion = async (tipo, decision, motivoR) => {
    if (decision === 'rechazado' && !String(motivoR || '').trim()) return toast.error('Escribe el motivo del rechazo')
    setEnviando(true)
    try {
      const { data } = await api.put(`/api/admin/conductores/${id}/renovaciones/${tipo}`, { decision, motivo: motivoR })
      setC(data)
      toast.success(decision === 'aprobado' ? 'Documento actualizado' : 'Renovación rechazada')
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo procesar')
    } finally {
      setEnviando(false)
    }
  }

  const restablecerClave = async () => {
    if (!window.confirm(`¿Generar una contraseña temporal para ${c.nombre}? La contraseña actual dejará de funcionar.`)) return
    try {
      const { data } = await api.post(`/api/admin/usuarios/${c.usuario_id}/restablecer-clave`)
      setClaveTemp(data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo restablecer la contraseña')
    }
  }

  const estilo = ESTADO_ESTILO[c?.estado_doc] || ESTADO_ESTILO.pendiente
  const obligatorios = c ? c.checklist.filter(r => r.obligatorio) : []
  const correctos = obligatorios.filter(r => r.estado === 'ok').length
  const pendientesRenov = c ? Object.entries(c.renovaciones || {}).filter(([, r]) => r.estado === 'pendiente') : []
  const puedeAprobar = c && c.faltantes.length === 0 && c.vencidos.length === 0 && correctos === obligatorios.length

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl w-full max-w-4xl my-8 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-xl font-semibold text-[#1D1D1F]">{c ? c.nombre : 'Cargando…'}</h2>
            {c && <p className="text-[#6E6E73] text-sm mt-0.5">Registrado el {fmtFecha(c.registrado_en)} · {nombreVehiculo(c.tipo_vehiculo)} {c.placa}</p>}
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
            <ClaveTemporalModal datos={claveTemp} onCerrar={() => setClaveTemp(null)} />

            {(c.faltantes.length > 0 || c.vencidos.length > 0) && (
              <div className="p-3 rounded-xl bg-[#FCEAE9] text-[#D92D20] text-sm mb-4 space-y-1" role="alert">
                {c.faltantes.length > 0 && <div><FontAwesomeIcon icon={faTriangleExclamation} className="mr-1.5" /><strong>Solicitud incompleta.</strong> Falta: {c.faltantes.join(', ')}.</div>}
                {c.vencidos.length > 0 && <div><FontAwesomeIcon icon={faTriangleExclamation} className="mr-1.5" /><strong>Vencido:</strong> {c.vencidos.join(', ')}. No podrá trabajar hasta renovarlo.</div>}
              </div>
            )}

            <h3 className={TITULO}>Vigencias</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {c.vigencias.map(v => (
                <div key={v.clave} className="rounded-xl p-3 bg-[#F5F5F7]" data-vigencia={v.clave}>
                  <div className="text-[#A1A1A6] text-xs mb-1">{v.etiqueta}</div>
                  <div className="font-medium text-sm text-[#1D1D1F] mb-1.5">{fechaCorta(v.vence)}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <InsigniaVigencia estado={v.estado} />
                    {v.dias !== null && <span className="text-[11px] text-[#8A8F9C]">{textoDias(v)}</span>}
                  </div>
                </div>
              ))}
            </div>

            {pendientesRenov.length > 0 && (
              <>
                <h3 className={TITULO}>Renovaciones por revisar</h3>
                <div className="space-y-3 mb-6">
                  {pendientesRenov.map(([tipo, r]) => <RenovacionPendiente key={tipo} tipo={tipo} r={r} onDecidir={decidirRenovacion} ocupado={enviando} />)}
                </div>
              </>
            )}

            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
              <h3 className={`${TITULO} !mb-0 flex items-center gap-2`}><FontAwesomeIcon icon={faFileLines} className="text-sm" /> Revisión de credenciales</h3>
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-[#6E6E73]" data-progreso>{correctos} de {obligatorios.length} rubros correctos</span>
                <button onClick={restablecerClave} className="px-3.5 py-1.5 rounded-full text-[13px] font-medium text-[#0A66E0] bg-[#EAF2FE] hover:bg-[#D9E8FC] transition">
                  <FontAwesomeIcon icon={faKey} className="text-xs mr-1.5" />Restablecer contraseña
                </button>
              </div>
            </div>
            <p className="text-[12.5px] text-[#6E6E73] mb-3">Toca una foto para verla completa. Marca cada rubro como «Correcto» tras cotejar los datos con los documentos.</p>
            <div className="space-y-3 mb-6">
              {c.checklist.map(r => <RubroRevision key={r.clave} r={r} c={c} onCambiar={cambiarRubro} ocupado={enviando} />)}
            </div>

            <div className="text-[12.5px] text-[#6E6E73] mb-6">
              Aceptó los términos y el tratamiento de datos el {c.acepta_terminos_en ? fmtFecha(c.acepta_terminos_en) : '—'}.
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
                <div className="flex gap-3 justify-end items-center flex-wrap">
                  {!puedeAprobar && <span className="text-[12.5px] text-[#6E6E73]">Para aprobar, todos los rubros obligatorios deben estar en «Correcto».</span>}
                  {c.estado_doc === 'pendiente' && (
                    <button onClick={() => setRechazando(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-[#D92D20] bg-[#FCEAE9] hover:bg-[#F9D9D6]">
                      <FontAwesomeIcon icon={faCircleXmark} className="text-sm" /> Rechazar
                    </button>
                  )}
                  <button onClick={() => decidir('aprobado')} disabled={enviando || !puedeAprobar}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white bg-[#1D1D1F] hover:bg-[#000000] disabled:opacity-40 disabled:cursor-not-allowed">
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
  const [tipo, setTipo] = useState('')
  const [docsFiltro, setDocsFiltro] = useState('')
  const [abierto, setAbierto] = useState(null)

  const cargarConductores = useCallback(async () => {
    setCargando(true)
    try {
      const params = new URLSearchParams({ estado_doc: filtro })
      if (busqueda.trim()) params.set('buscar', busqueda.trim())
      if (tipo) params.set('tipo_vehiculo', tipo)
      if (docsFiltro) params.set('documentos', docsFiltro)
      const { data } = await api.get(`/api/admin/conductores?${params}`)
      setConductores(data)
    } catch (err) {
      toast.error('Error cargando conductores')
    } finally {
      setCargando(false)
    }
  }, [filtro, busqueda, tipo, docsFiltro])

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

        <div className="flex gap-2 mb-6 flex-wrap items-center" role="group" aria-label="Filtrar por tipo de vehículo">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8A8F9C] mr-1">Vehículo</span>
          {[{ k: '', t: 'Todos', icono: null }, ...TIPOS_VEHICULO].map(x => (
            <button key={x.k} onClick={() => setTipo(x.k)} aria-pressed={tipo === x.k}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${tipo === x.k ? 'bg-[#14213D] text-white' : 'text-[#6E6E73] border border-[#E2E2E7] hover:bg-[#F5F5F7]'}`}>
              {x.icono && <FontAwesomeIcon icon={x.icono} className="mr-1.5" />}{x.t}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-6 flex-wrap items-center" role="group" aria-label="Filtrar por documentos">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8A8F9C] mr-1">Documentos</span>
          {[{ k: '', t: 'Todos' }, { k: 'vencidos', t: 'Con vencidos' }, { k: 'renovaciones', t: 'Renovaciones por revisar' }].map(x => (
            <button key={x.k} onClick={() => setDocsFiltro(x.k)} aria-pressed={docsFiltro === x.k}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${docsFiltro === x.k ? 'bg-[#14213D] text-white' : 'text-[#6E6E73] border border-[#E2E2E7] hover:bg-[#F5F5F7]'}`}>
              {x.t}
            </button>
          ))}
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
                      {(c.vencidos?.length > 0 || c.por_vencer?.length > 0 || c.renovaciones_pendientes > 0) && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {c.vencidos?.length > 0 && <span className="text-[11px] px-2 py-0.5 rounded-full font-medium text-[#D92D20] bg-[#FCEAE9]">Vencido: {c.vencidos.join(', ')}</span>}
                          {c.por_vencer?.length > 0 && <span className="text-[11px] px-2 py-0.5 rounded-full font-medium text-[#B45309] bg-[#FEF3E2]">Por vencer: {c.por_vencer.join(', ')}</span>}
                          {c.renovaciones_pendientes > 0 && <span className="text-[11px] px-2 py-0.5 rounded-full font-medium text-[#0A66E0] bg-[#EAF2FE]">{c.renovaciones_pendientes} renovación por revisar</span>}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-[#6E6E73]">
                      <div><FontAwesomeIcon icon={iconoVehiculo(c.tipo_vehiculo)} className="mr-1.5 text-[#A1A1A6]" />{nombreVehiculo(c.tipo_vehiculo)} · {c.placa || '—'}</div>
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
