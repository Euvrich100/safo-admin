'use client'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShieldHalved, faTriangleExclamation, faClock, faRotate } from '@fortawesome/free-solid-svg-icons'
import api from '@/lib/api'
import Campo from '@/components/Campo'
import CapturaDocumento from '@/components/CapturaDocumento'
import InsigniaVigencia from '@/components/InsigniaVigencia'
import { ASEGURADORAS, PARENTESCOS, URL_APESEG, hoyLima, sumarDias, fechaCorta, textoDias } from '@/lib/documentos'

const errorDe = (e, resp) => e?.response?.data?.error || resp

// Formulario de renovación de un documento. Queda «en revisión» hasta que un administrador lo apruebe.
function FormularioRenovacion({ tipo, docs, onEnviado, onCancelar }) {
  const hoy = hoyLima()
  const [f, setF] = useState({
    soat_tipo: docs.datos.soat_tipo || 'soat', soat_numero: '', soat_aseguradora: '', vence: '',
    licencia_categoria: docs.datos.licencia_categoria || (docs.categorias_licencia[0] || ''),
    fecha: '', numero: docs.datos.permiso_municipal_numero || '',
  })
  const [archivos, setArchivos] = useState({})
  const [enviando, setEnviando] = useState(false)
  const set = (c, v) => setF(x => ({ ...x, [c]: v }))
  const setArchivo = (c, a) => setArchivos(x => ({ ...x, [c]: a }))
  const seguro = f.soat_tipo === 'cat' ? 'CAT' : 'SOAT'

  const enviar = async () => {
    if (!archivos.documento) return toast.error('Sube el documento (foto o PDF)')
    if (tipo === 'soat' && (!f.soat_numero.trim() || !f.soat_aseguradora)) return toast.error('Completa el número de póliza y la aseguradora')
    if (tipo === 'antecedentes' ? !f.fecha : !f.vence) return toast.error('Indica la fecha del documento')
    if (tipo === 'permiso' && !f.numero.trim()) return toast.error('Escribe el número del permiso')
    setEnviando(true)
    try {
      const fd = new FormData()
      if (tipo === 'soat') { fd.append('soat_tipo', f.soat_tipo); fd.append('soat_numero', f.soat_numero); fd.append('soat_aseguradora', f.soat_aseguradora) }
      if (tipo === 'licencia') fd.append('licencia_categoria', f.licencia_categoria)
      if (tipo === 'permiso') fd.append('numero', f.numero)
      if (tipo === 'antecedentes') fd.append('fecha', f.fecha); else fd.append('vence', f.vence)
      fd.append('documento', archivos.documento, archivos.documento.name)
      if (archivos.documento_reverso) fd.append('documento_reverso', archivos.documento_reverso, archivos.documento_reverso.name)
      // Content-Type explícito: con el JSON por defecto de la instancia, axios convertiría el formulario en JSON y se perderían los archivos
      const { data } = await api.put(`/api/conductores/documentos/${tipo}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success(data.mensaje)
      onEnviado()
    } catch (e) {
      toast.error(errorDe(e, 'No se pudo enviar el documento'))
    } finally { setEnviando(false) }
  }

  return (
    <div className="space-y-4 pt-3 border-t border-[#E6E8EF] mt-3" data-renovar={tipo}>
      {tipo === 'soat' && (
        <>
          <div role="radiogroup" aria-label="Tipo de seguro" className="grid grid-cols-2 gap-2">
            {[{ v: 'soat', t: 'SOAT' }, { v: 'cat', t: 'CAT (AFOCAT)' }].map(o => (
              <button key={o.v} type="button" role="radio" aria-checked={f.soat_tipo === o.v} onClick={() => set('soat_tipo', o.v)}
                className={`rounded-[10px] border px-3 py-2 text-[13px] font-medium ${f.soat_tipo === o.v ? 'border-[#16181D] bg-[#F6F7F9] text-[#16181D]' : 'border-[#E8EAEE] bg-white text-[#4A4F5C]'}`}>{o.t}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo valor={f.soat_numero} onCambio={set} label={`N.º de póliza ${seguro}`} campo="soat_numero" mayusculas maxLength={40} />
            <Campo valor={f.soat_aseguradora} onCambio={set} label="Aseguradora" campo="soat_aseguradora" options={[{ v: '', t: 'Elige…' }, ...ASEGURADORAS]} />
          </div>
          <p className="f-ayuda">Comprueba tu placa en <a href={URL_APESEG} target="_blank" rel="noreferrer" className="f-link">APESEG</a> antes de enviarlo.</p>
        </>
      )}
      {tipo === 'licencia' && docs.categorias_licencia.length > 1 && (
        <Campo valor={f.licencia_categoria} onCambio={set} label="Categoría" campo="licencia_categoria" options={docs.categorias_licencia} />
      )}
      {tipo === 'permiso' && <Campo valor={f.numero} onCambio={set} label="N.º de permiso" campo="numero" maxLength={40} />}
      {tipo === 'antecedentes'
        ? <Campo valor={f.fecha} onCambio={set} label="Fecha de emisión" campo="fecha" type="date" min={sumarDias(hoy, -90)} max={hoy} ayuda="Debe tener menos de 90 días." />
        : <Campo valor={f.vence} onCambio={set} label="Nuevo vencimiento" campo="vence" type="date" min={hoy} />}
      <CapturaDocumento campo="documento" label="Documento nuevo" aceptaPdf valor={archivos.documento} onCambio={setArchivo} />
      {tipo === 'licencia' && <CapturaDocumento campo="documento_reverso" label="Reverso de la licencia" opcional valor={archivos.documento_reverso} onCambio={setArchivo} compacto />}
      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <button type="button" onClick={onCancelar} className="f-btn f-btn-sec">Cancelar</button>
        <button type="button" onClick={enviar} disabled={enviando} className="f-btn">{enviando ? 'Enviando…' : 'Enviar a revisión'}</button>
      </div>
    </div>
  )
}

function ContactoEmergencia({ docs, onGuardado }) {
  const [editando, setEditando] = useState(false)
  const [f, setF] = useState({ nombre: '', parentesco: '', celular: '' })
  const [guardando, setGuardando] = useState(false)
  const set = (c, v) => setF(x => ({ ...x, [c]: v }))
  const d = docs.datos

  const abrir = () => { setF({ nombre: d.emergencia_nombre || '', parentesco: d.emergencia_parentesco || '', celular: d.emergencia_celular || '' }); setEditando(true) }
  const guardar = async () => {
    setGuardando(true)
    try {
      await api.put('/api/conductores/emergencia', f)
      toast.success('Contacto actualizado. Lo volveremos a verificar.')
      setEditando(false); onGuardado()
    } catch (e) { toast.error(errorDe(e, 'No se pudo guardar')) } finally { setGuardando(false) }
  }

  return (
    <div className="rounded-xl bg-[#F4F6FA] p-3.5" data-doc-tarjeta="emergencia">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-[#8A8F9C]">Contacto de emergencia</div>
          <div className="font-medium text-[#14213D] text-sm">{d.emergencia_nombre ? `${d.emergencia_nombre} (${d.emergencia_parentesco})` : '—'}</div>
          <div className="text-[13px] text-[#6E6E73]">{d.emergencia_celular || ''}</div>
        </div>
        {!editando && <button type="button" onClick={abrir} className="text-[13px] font-semibold text-[#0A66E0]">Cambiar</button>}
      </div>
      {editando && (
        <div className="space-y-3 mt-3 pt-3 border-t border-[#E6E8EF]">
          <Campo valor={f.nombre} onCambio={set} label="Nombre completo" campo="nombre" maxLength={100} />
          <div className="grid grid-cols-2 gap-3">
            <Campo valor={f.parentesco} onCambio={set} label="Parentesco" campo="parentesco" options={[{ v: '', t: 'Elige…' }, ...PARENTESCOS]} />
            <Campo valor={f.celular} onCambio={set} label="Celular" campo="celular" type="tel" maxLength={9} inputMode="numeric" />
          </div>
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <button type="button" onClick={() => setEditando(false)} className="f-btn f-btn-sec">Cancelar</button>
            <button type="button" onClick={guardar} disabled={guardando} className="f-btn">{guardando ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

// «Mis documentos»: vigencias, renovación y contacto de emergencia del conductor
export default function MisDocumentos({ onCambio }) {
  const [docs, setDocs] = useState(null)
  const [renovando, setRenovando] = useState(null)

  const cargar = useCallback(async () => {
    try { setDocs((await api.get('/api/conductores/documentos')).data) } catch (e) { toast.error(errorDe(e, 'No se pudieron cargar tus documentos'), { id: 'docs' }) }
  }, [])
  useEffect(() => { cargar() }, [cargar])

  if (!docs) return <div className="rounded-2xl bg-white border border-[#E6E8EF] p-5 text-sm text-[#8A8F9C]">Cargando documentos…</div>

  const vig = Object.fromEntries(docs.vigencias.map(v => [v.clave, v]))
  const ant = docs.datos.antecedentes_fecha
  const items = [
    vig.soat && { tipo: 'soat', titulo: vig.soat.etiqueta, vig: vig.soat, detalle: [docs.datos.soat_aseguradora, docs.datos.soat_numero].filter(Boolean).join(' · ') },
    vig.licencia && { tipo: 'licencia', titulo: 'Licencia de conducir', vig: vig.licencia, detalle: [docs.datos.licencia_numero, docs.datos.licencia_categoria].filter(Boolean).join(' · ') },
    vig.revision && { tipo: 'revision', titulo: 'Revisión técnica', vig: vig.revision, detalle: '' },
    vig.permiso && { tipo: 'permiso', titulo: 'Permiso municipal', vig: vig.permiso, detalle: docs.datos.permiso_municipal_numero || '' },
    { tipo: 'antecedentes', titulo: 'Antecedentes', vig: null, detalle: ant ? `Emitido el ${fechaCorta(ant)}` : 'Sin certificado' },
  ].filter(Boolean)
  const observados = docs.rubros.filter(r => r.estado === 'observado')

  return (
    <div className="space-y-3" data-mis-documentos>
      <div className={`rounded-2xl p-4 flex items-start gap-3 ${docs.verificado ? 'bg-[#E6F4EC] text-[#1A7F4B]' : 'bg-[#FEF3E2] text-[#B45309]'}`}>
        <FontAwesomeIcon icon={docs.verificado ? faShieldHalved : faClock} className="mt-0.5" />
        <div className="text-sm">
          <b>{docs.verificado ? 'Documentos verificados' : 'Verificación en curso'}</b>
          <div className="opacity-90">{docs.verificado ? 'Los pasajeros ven que tu identidad y tus documentos fueron revisados por SafO.' : 'Cuando el administrador revise todos tus documentos, los pasajeros verán la insignia de verificado.'}</div>
        </div>
      </div>

      {docs.vencidos.length > 0 && (
        <div role="alert" className="rounded-2xl p-4 bg-[#FCEAE9] text-[#D92D20] text-sm flex gap-3">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" />
          <div><b>No puedes trabajar:</b> tienes vencido {docs.vencidos.join(', ')}. Renuévalo abajo; en cuanto un administrador lo apruebe podrás conectarte de nuevo.</div>
        </div>
      )}
      {observados.map(r => (
        <div key={r.clave} className="rounded-2xl p-4 bg-[#FCEAE9] text-[#D92D20] text-sm"><b>{r.etiqueta}:</b> {r.nota}</div>
      ))}

      {items.map(it => {
        const ren = docs.renovaciones[it.tipo]
        const abierto = renovando === it.tipo
        return (
          <div key={it.tipo} className="rounded-2xl bg-white border border-[#E6E8EF] p-4" data-doc-tarjeta={it.tipo}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-[#14213D]">{it.titulo}</div>
                {it.detalle && <div className="text-[13px] text-[#6E6E73] truncate">{it.detalle}</div>}
                {it.vig && <div className="text-[13px] text-[#6E6E73] mt-0.5">Vence el {fechaCorta(it.vig.vence)} · {textoDias(it.vig)}</div>}
              </div>
              {it.vig && <InsigniaVigencia estado={it.vig.estado} />}
            </div>

            {ren?.estado === 'pendiente' && (
              <div className="mt-3 text-[13px] rounded-xl bg-[#EAF2FE] text-[#0A66E0] px-3 py-2"><FontAwesomeIcon icon={faClock} className="mr-1.5" />Enviado: un administrador lo está revisando.</div>
            )}
            {ren?.estado === 'rechazado' && (
              <div role="alert" className="mt-3 text-[13px] rounded-xl bg-[#FCEAE9] text-[#D92D20] px-3 py-2"><b>Rechazado:</b> {ren.motivo}. Envíalo de nuevo.</div>
            )}

            {abierto ? (
              <FormularioRenovacion tipo={it.tipo} docs={docs} onCancelar={() => setRenovando(null)}
                onEnviado={() => { setRenovando(null); cargar(); onCambio?.() }} />
            ) : ren?.estado === 'pendiente' ? null : (
              <button type="button" onClick={() => setRenovando(it.tipo)}
                className={`mt-3 w-full py-2.5 rounded-xl text-[13.5px] font-semibold ${it.vig && it.vig.estado !== 'vigente' ? 'bg-[#14213D] text-white' : 'bg-[#F4F6FA] text-[#14213D]'}`}>
                <FontAwesomeIcon icon={faRotate} className="mr-2 text-xs" />{it.vig && it.vig.estado !== 'vigente' ? 'Renovar ahora' : 'Actualizar documento'}
              </button>
            )}
          </div>
        )
      })}

      <ContactoEmergencia docs={docs} onGuardado={() => { cargar(); onCambio?.() }} />
    </div>
  )
}

