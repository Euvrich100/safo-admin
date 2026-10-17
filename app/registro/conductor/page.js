'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTaxi, faShieldHalved, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import SafoLogo from '@/components/SafoLogo'
import ClaveInput from '@/components/ClaveInput'
import Campo from '@/components/Campo'
import CapturaDocumento from '@/components/CapturaDocumento'
import { CIUDAD } from '@/lib/ciudad'
import { VEHICULOS, TIPOS_VEHICULO, SERVICIOS, exigeRevision, exigeInterior } from '@/lib/vehiculos'
import { ASEGURADORAS, PARENTESCOS, URL_APESEG, hoyLima, sumarDias, diasEntre } from '@/lib/documentos'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://safo-backend.onrender.com'

const PASOS = ['Tus datos', 'Identidad', 'Vehículo', 'Licencia', 'Seguro y revisión', 'Antecedentes y envío']

export default function RegistroConductorPage() {
  const router = useRouter()
  const hoy = hoyLima()
  const [paso, setPaso] = useState(1)
  const [cargando, setCargando] = useState(false)
  const [completado, setCompletado] = useState(false)
  const [form, setForm] = useState({
    nombre: '', celular: '', dni: '', fecha_nacimiento: '', direccion: '',
    password: '', repetir: '',
    tipo_vehiculo: 'taxi', placa: '', vehiculo_marca: '', vehiculo_modelo: '', vehiculo_anno: '', vehiculo_color: '', vehiculo_serie: '',
    es_propietario: 'true', propietario_nombre: '',
    licencia_numero: '', licencia_categoria: VEHICULOS.taxi.licenciaDefecto, licencia_vence: '',
    soat_tipo: 'soat', soat_numero: '', soat_aseguradora: '', soat_vence: '',
    revision_tecnica_vence: '',
    tiene_permiso: false, permiso_municipal_numero: '', permiso_municipal_vence: '',
    antecedentes_fecha: '',
    emergencia_nombre: '', emergencia_parentesco: '', emergencia_celular: '',
    acepta_terminos: false,
  })
  const [archivos, setArchivos] = useState({})

  const set = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }))
  const setArchivo = (campo, archivo) => setArchivos(a => ({ ...a, [campo]: archivo }))
  const vehiculo = VEHICULOS[form.tipo_vehiculo]
  const conRevision = exigeRevision(form.tipo_vehiculo)
  const conInterior = exigeInterior(form.tipo_vehiculo)
  const esDueno = form.es_propietario === 'true'
  const seguro = form.soat_tipo === 'cat' ? 'CAT' : 'SOAT'

  // Al cambiar de vehículo, la categoría de licencia pasa a la que le corresponde
  const elegirVehiculo = (tipo) => setForm(f => ({ ...f, tipo_vehiculo: tipo, licencia_categoria: VEHICULOS[tipo].licenciaDefecto }))

  // Cada paso devuelve el primer problema que encuentra (o null)
  const validar = (n) => {
    const f = form
    const falta = (campos) => {
      const l = campos.filter(([c]) => !archivos[c]).map(([, e]) => e)
      return l.length ? 'Falta subir: ' + l.join(', ') : null
    }
    if (n === 1) {
      if (!f.nombre.trim()) return 'Escribe tu nombre completo'
      if (!/^\d{9}$/.test(f.celular)) return 'El celular debe tener 9 dígitos'
      if (!/^\d{8}$/.test(f.dni)) return 'El DNI debe tener 8 dígitos'
      if (!f.fecha_nacimiento) return 'Indica tu fecha de nacimiento'
      if (diasEntre(f.fecha_nacimiento, hoy) / 365.25 < 18) return 'Debes ser mayor de edad para conducir'
      if (f.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
      if (f.password !== f.repetir) return 'Las contraseñas no coinciden'
    }
    if (n === 2) {
      return falta([['foto_dni_frontal', 'DNI (frente)'], ['foto_dni_trasera', 'DNI (reverso)'], ['foto_selfie_dni', 'selfie con tu DNI'], ['foto_perfil', 'foto de tu rostro']])
    }
    if (n === 3) {
      if (!/^[A-Za-z0-9]{5,7}$/.test(f.placa.replace(/[\s-]+/g, ''))) return 'Escribe la placa del vehículo. Ejemplo: ABC-123'
      if (!f.vehiculo_marca.trim() || !f.vehiculo_modelo.trim() || !f.vehiculo_color.trim()) return 'Indica la marca, el modelo y el color del vehículo'
      const anno = Number(f.vehiculo_anno)
      if (!Number.isInteger(anno) || anno < 1980 || anno > new Date().getFullYear() + 1) return 'Año del vehículo inválido'
      if (!esDueno && !f.propietario_nombre.trim()) return 'Escribe el nombre del propietario del vehículo'
      const docs = [['foto_vehiculo', 'foto del frente'], ['foto_vehiculo_trasera', 'foto de atrás']]
      if (conInterior) docs.push(['foto_vehiculo_interior', 'foto del interior'])
      docs.push(['doc_tarjeta_propiedad', 'tarjeta de propiedad'])
      if (!esDueno) docs.push(['doc_autorizacion_propietario', 'autorización del propietario'])
      return falta(docs)
    }
    if (n === 4) {
      if (!f.licencia_numero.trim()) return 'Escribe el número de tu licencia'
      if (!f.licencia_vence) return 'Indica la fecha de vencimiento de tu licencia'
      if (f.licencia_vence < hoy) return 'Tu licencia está vencida. Revalídala para poder registrarte'
      return falta([['foto_licencia', 'licencia (frente)'], ['foto_licencia_trasera', 'licencia (reverso)']])
    }
    if (n === 5) {
      if (!f.soat_numero.trim()) return `Escribe el número de póliza de tu ${seguro}`
      if (!f.soat_aseguradora) return `Elige la aseguradora de tu ${seguro}`
      if (!f.soat_vence) return `Indica el vencimiento de tu ${seguro}`
      if (f.soat_vence < hoy) return `Tu ${seguro} está vencido. Renuévalo para poder registrarte`
      if (conRevision) {
        if (!f.revision_tecnica_vence) return 'Indica el vencimiento de tu revisión técnica'
        if (f.revision_tecnica_vence < hoy) return 'Tu revisión técnica está vencida. Renuévala para poder registrarte'
      }
      if (f.tiene_permiso) {
        if (!f.permiso_municipal_numero.trim()) return 'Escribe el número de tu permiso municipal'
        if (!f.permiso_municipal_vence || f.permiso_municipal_vence < hoy) return 'El permiso municipal está vencido o sin fecha de vencimiento'
      }
      const docs = [['doc_soat', seguro]]
      if (conRevision) docs.push(['doc_revision_tecnica', 'revisión técnica'])
      if (f.tiene_permiso) docs.push(['doc_permiso_municipal', 'permiso municipal'])
      return falta(docs)
    }
    if (n === 6) {
      if (!f.antecedentes_fecha) return 'Indica la fecha de emisión de tu certificado de antecedentes'
      if (f.antecedentes_fecha > hoy) return 'La fecha del certificado no puede ser futura'
      if (diasEntre(f.antecedentes_fecha, hoy) > 90) return 'Tu certificado de antecedentes tiene más de 90 días. Saca uno reciente'
      const err = falta([['doc_antecedentes', 'certificado de antecedentes']])
      if (err) return err
      if (!f.emergencia_nombre.trim() || !f.emergencia_parentesco) return 'Indica el nombre y el parentesco de tu contacto de emergencia'
      if (!/^\d{9}$/.test(f.emergencia_celular)) return 'El celular del contacto de emergencia debe tener 9 dígitos'
      if (f.emergencia_celular === f.celular) return 'El contacto de emergencia debe ser otra persona, con otro celular'
      if (!f.acepta_terminos) return 'Acepta los términos y el tratamiento de tus datos para continuar'
    }
    return null
  }

  const avanzar = () => {
    const error = validar(paso)
    if (error) return toast.error(error, { id: 'validacion' })
    setPaso(p => p + 1)
    window.scrollTo?.({ top: 0 })
  }
  const volver = () => { setPaso(p => p - 1); window.scrollTo?.({ top: 0 }) }

  const registrar = async () => {
    for (let n = 1; n <= 6; n++) {
      const error = validar(n)
      if (error) { setPaso(n); return toast.error(error, { id: 'validacion' }) }
    }
    setCargando(true)
    try {
      const formData = new FormData()
      const omitir = ['repetir', 'tiene_permiso']
      Object.entries(form).forEach(([k, v]) => {
        if (omitir.includes(k) || v === '' || v === null) return
        formData.append(k, String(v))
      })
      Object.entries(archivos).forEach(([k, v]) => { if (v) formData.append(k, v, v.name) })
      const res = await fetch(`${API}/api/auth/registrar-conductor`, { method: 'POST', body: formData })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) return toast.error(data.error || 'No se pudo enviar la solicitud')
      setCompletado(true)
    } catch {
      toast.error('Error al conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  const marco = (hijos, ancho = 'max-w-[26rem]') => (
    <div className="min-h-screen bg-white flex flex-col items-center px-6 py-10 sm:py-14">
      <Toaster position="top-center" toastOptions={{ style: { background: '#16181D', color: 'white', fontSize: 14 } }} />
      <div className={`w-full ${ancho}`}>
        <button onClick={() => router.push('/')} className="mb-10 block" aria-label="Ir al inicio"><SafoLogo size={64} showText priority /></button>
        {hijos}
      </div>
    </div>
  )

  if (completado) return marco(
    <>
      <span className="insignia-taxi mb-5" aria-hidden="true"><FontAwesomeIcon icon={faTaxi} /></span>
      <h1 className="text-[1.75rem] leading-tight font-semibold text-[#16181D] mb-1.5">Solicitud enviada</h1>
      <p className="text-[15px] leading-relaxed text-[#4A4F5C] mb-7">El administrador revisará uno por uno tus documentos en menos de 24 horas y te avisará al {CIUDAD.prefijoTelefono} {form.celular}. Cuando te aprueben, entra con tu celular y tu contraseña.</p>
      <div className="f-aviso mb-6">
        Estado de tu solicitud
        <div className="text-[1.05rem] font-semibold text-[#16181D] mt-0.5">En revisión</div>
      </div>
      <button onClick={() => router.push('/')} className="f-btn">Volver al inicio</button>
    </>
  )

  const subidos = Object.values(archivos).filter(Boolean).length

  return marco(
    <>
      <div className="mb-7">
        <h1 className="text-[1.75rem] leading-tight font-semibold text-[#16181D] mb-1.5">Conduce con SafO</h1>
        <p className="text-[15px] text-[#4A4F5C]">Pedimos tus credenciales completas porque los pasajeros viajan con confianza. Las revisamos antes de activarte.</p>
      </div>

      <div className="mb-7" role="progressbar" aria-valuemin={1} aria-valuemax={PASOS.length} aria-valuenow={paso} aria-label="Avance del registro">
        <div className="flex gap-1.5 mb-2.5">
          {PASOS.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${paso >= i + 1 ? 'bg-[#16181D]' : 'bg-[#E8EAEE]'}`} />
          ))}
        </div>
        <p className="text-[13px] text-[#4A4F5C]"><span className="font-semibold text-[#16181D]">Paso {paso} de {PASOS.length}</span> · {PASOS[paso - 1]}</p>
      </div>

      {paso === 1 && (
        <div className="space-y-5">
          <Campo valor={form.nombre} onCambio={set} label="Nombre completo (como en tu DNI)" campo="nombre" placeholder="Ej. Juan Pérez García" autoComplete="name" />
          <Campo valor={form.celular} onCambio={set} label="Celular" campo="celular" placeholder="987 654 321" type="tel" maxLength={9} inputMode="numeric" prefijo={CIUDAD.prefijoTelefono} autoComplete="tel-national" />
          <div className="grid grid-cols-2 gap-4">
            <Campo valor={form.dni} onCambio={set} label="DNI" campo="dni" placeholder="8 dígitos" maxLength={8} inputMode="numeric" />
            <Campo valor={form.fecha_nacimiento} onCambio={set} label="Nacimiento" campo="fecha_nacimiento" type="date" max={sumarDias(hoy, -18 * 365)} />
          </div>
          <Campo valor={form.direccion} onCambio={set} label="Dirección" campo="direccion" placeholder="Av. Principal 123" opcional />
          <div className="f-campo">
            <label htmlFor="clave" className="f-etiqueta">Contraseña <small>mínimo 6 caracteres</small></label>
            <ClaveInput id="clave" value={form.password} onChange={v => set('password', v)} autoComplete="new-password" placeholder="Con ella entrarás a la app" />
          </div>
          <div className="f-campo">
            <label htmlFor="repetir" className="f-etiqueta">Repite la contraseña</label>
            <ClaveInput id="repetir" value={form.repetir} onChange={v => set('repetir', v)} autoComplete="new-password" placeholder="Escríbela otra vez" onEnter={avanzar} />
          </div>
          <button onClick={avanzar} className="f-btn">Continuar</button>
        </div>
      )}

      {paso === 2 && (
        <div className="space-y-5">
          <p className="f-aviso"><FontAwesomeIcon icon={faShieldHalved} className="mr-1.5" />Con estas fotos confirmamos que eres quien dices ser. Usa buena luz, sin reflejos y con todos los datos legibles.</p>
          <div className="grid grid-cols-2 gap-4">
            <CapturaDocumento campo="foto_dni_frontal" label="DNI, frente" valor={archivos.foto_dni_frontal} onCambio={setArchivo} compacto />
            <CapturaDocumento campo="foto_dni_trasera" label="DNI, reverso" valor={archivos.foto_dni_trasera} onCambio={setArchivo} compacto />
          </div>
          <CapturaDocumento campo="foto_selfie_dni" label="Selfie sosteniendo tu DNI" frontal
            ayuda="Tu rostro y el DNI deben verse completos y nítidos, en la misma foto." valor={archivos.foto_selfie_dni} onCambio={setArchivo} />
          <CapturaDocumento campo="foto_perfil" label="Foto de tu rostro" frontal
            ayuda="De frente, sin lentes oscuros ni gorra. Es la foto que verá el pasajero antes de subir." valor={archivos.foto_perfil} onCambio={setArchivo} />
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <button onClick={volver} className="f-btn f-btn-sec">Volver</button>
            <button onClick={avanzar} className="f-btn">Continuar</button>
          </div>
        </div>
      )}

      {paso === 3 && (
        <div className="space-y-5">
          <div className="f-campo">
            <span className="f-etiqueta" id="tipo-vehiculo">¿Con qué vas a trabajar?</span>
            <div role="radiogroup" aria-labelledby="tipo-vehiculo" className="grid grid-cols-2 gap-2.5">
              {TIPOS_VEHICULO.map(t => {
                const activo = form.tipo_vehiculo === t.k
                return (
                  <button key={t.k} type="button" role="radio" aria-checked={activo} onClick={() => elegirVehiculo(t.k)}
                    className={`text-left rounded-[12px] border px-3.5 py-3 transition ${activo ? 'border-[#16181D] bg-[#F6F7F9] ring-2 ring-[#16181D]/10' : 'border-[#E8EAEE] bg-white hover:border-[#C2C6D0]'}`}>
                    <span className="flex items-center gap-2.5">
                      <span className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-[17px] shrink-0 ${activo ? 'bg-[#16181D] text-[#FFC21A]' : 'bg-[#F1F2F5] text-[#4A4F5C]'}`}>
                        <FontAwesomeIcon icon={t.icono} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-semibold text-[#16181D] leading-tight">{t.t}</span>
                        <span className="block text-[11.5px] text-[#7A7F8C] leading-tight mt-0.5">{t.detalle}</span>
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
            <span className="f-ayuda">Recibirás pedidos del servicio <b className="text-[#16181D]">{SERVICIOS[vehiculo.servicio].t}</b>{vehiculo.servicio === 'taxi' ? ' (el pasajero ve taxis, carros y bajajs juntos).' : ' (pasajeros que piden moto).'}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Campo valor={form.placa} onCambio={set} label="Placa" campo="placa" placeholder="ABC-123" maxLength={8} mayusculas />
            <Campo valor={form.vehiculo_anno} onCambio={set} label="Año" campo="vehiculo_anno" placeholder="2020" type="number" />
            <Campo valor={form.vehiculo_marca} onCambio={set} label="Marca" campo="vehiculo_marca" placeholder={vehiculo.marca} />
            <Campo valor={form.vehiculo_modelo} onCambio={set} label="Modelo" campo="vehiculo_modelo" placeholder={vehiculo.modelo} />
            <Campo valor={form.vehiculo_color} onCambio={set} label="Color" campo="vehiculo_color" placeholder="Blanco" />
            <Campo valor={form.vehiculo_serie} onCambio={set} label="N.º de chasis / serie" campo="vehiculo_serie" placeholder="Figura en tu tarjeta" maxLength={30} mayusculas opcional />
          </div>

          <p className="f-aviso">Las fotos del vehículo ayudan al pasajero a reconocerlo. La placa debe verse legible.</p>
          <div className={`grid gap-4 ${conInterior ? 'grid-cols-2' : 'grid-cols-2'}`}>
            <CapturaDocumento campo="foto_vehiculo" label={`${vehiculo.foto} (frente)`} valor={archivos.foto_vehiculo} onCambio={setArchivo} compacto />
            <CapturaDocumento campo="foto_vehiculo_trasera" label="Parte de atrás" valor={archivos.foto_vehiculo_trasera} onCambio={setArchivo} compacto />
            {conInterior && <CapturaDocumento campo="foto_vehiculo_interior" label="Interior" valor={archivos.foto_vehiculo_interior} onCambio={setArchivo} compacto />}
          </div>

          <div className="f-campo">
            <span className="f-etiqueta" id="dueno">¿El vehículo es tuyo?</span>
            <div role="radiogroup" aria-labelledby="dueno" className="grid grid-cols-2 gap-2.5">
              {[{ v: 'true', t: 'Sí, soy el propietario' }, { v: 'false', t: 'No, es de otra persona' }].map(o => (
                <button key={o.v} type="button" role="radio" aria-checked={form.es_propietario === o.v} onClick={() => set('es_propietario', o.v)}
                  className={`rounded-[10px] border px-3 py-2.5 text-[13.5px] font-medium transition ${form.es_propietario === o.v ? 'border-[#16181D] bg-[#F6F7F9] ring-2 ring-[#16181D]/10 text-[#16181D]' : 'border-[#E8EAEE] bg-white text-[#4A4F5C] hover:border-[#C2C6D0]'}`}>
                  {o.t}
                </button>
              ))}
            </div>
          </div>
          {!esDueno && (
            <Campo valor={form.propietario_nombre} onCambio={set} label="Nombre del propietario" campo="propietario_nombre" placeholder="Como figura en la tarjeta de propiedad" />
          )}
          <CapturaDocumento campo="doc_tarjeta_propiedad" label="Tarjeta de propiedad (o de identificación vehicular)" aceptaPdf
            ayuda="Foto del frente. La placa debe coincidir con la que escribiste." valor={archivos.doc_tarjeta_propiedad} onCambio={setArchivo} />
          {!esDueno && (
            <CapturaDocumento campo="doc_autorizacion_propietario" label="Autorización del propietario" aceptaPdf
              ayuda="Carta firmada por el propietario que te autoriza a usar el vehículo como transporte." valor={archivos.doc_autorizacion_propietario} onCambio={setArchivo} />
          )}

          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <button onClick={volver} className="f-btn f-btn-sec">Volver</button>
            <button onClick={avanzar} className="f-btn">Continuar</button>
          </div>
        </div>
      )}

      {paso === 4 && (
        <div className="space-y-5">
          <p className="f-aviso"><FontAwesomeIcon icon={faShieldHalved} className="mr-1.5" />Tu licencia debe estar vigente y ser de la categoría que corresponde a tu {vehiculo.t.toLowerCase()}.</p>
          <div className="grid grid-cols-2 gap-4">
            <Campo valor={form.licencia_numero} onCambio={set} label="N.º de licencia" campo="licencia_numero" placeholder="Q12345678" mayusculas maxLength={30} />
            <Campo valor={form.licencia_categoria} onCambio={set} label="Categoría" campo="licencia_categoria" options={vehiculo.licencias} />
          </div>
          <Campo valor={form.licencia_vence} onCambio={set} label="Vence el" campo="licencia_vence" type="date" min={hoy} />
          <div className="grid grid-cols-2 gap-4">
            <CapturaDocumento campo="foto_licencia" label="Licencia, frente" valor={archivos.foto_licencia} onCambio={setArchivo} compacto />
            <CapturaDocumento campo="foto_licencia_trasera" label="Licencia, reverso" valor={archivos.foto_licencia_trasera} onCambio={setArchivo} compacto />
          </div>
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <button onClick={volver} className="f-btn f-btn-sec">Volver</button>
            <button onClick={avanzar} className="f-btn">Continuar</button>
          </div>
        </div>
      )}

      {paso === 5 && (
        <div className="space-y-5">
          <div className="f-campo">
            <span className="f-etiqueta" id="tipo-seguro">Seguro obligatorio</span>
            <div role="radiogroup" aria-labelledby="tipo-seguro" className="grid grid-cols-2 gap-2.5">
              {[{ v: 'soat', t: 'SOAT' }, { v: 'cat', t: 'CAT (AFOCAT)' }].map(o => (
                <button key={o.v} type="button" role="radio" aria-checked={form.soat_tipo === o.v} onClick={() => set('soat_tipo', o.v)}
                  className={`rounded-[10px] border px-3 py-2.5 text-[13.5px] font-medium transition ${form.soat_tipo === o.v ? 'border-[#16181D] bg-[#F6F7F9] ring-2 ring-[#16181D]/10 text-[#16181D]' : 'border-[#E8EAEE] bg-white text-[#4A4F5C] hover:border-[#C2C6D0]'}`}>
                  {o.t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Campo valor={form.soat_numero} onCambio={set} label={`N.º de póliza ${seguro}`} campo="soat_numero" placeholder="Ej. 2024-123456" mayusculas maxLength={40} />
            <Campo valor={form.soat_aseguradora} onCambio={set} label="Aseguradora" campo="soat_aseguradora" options={[{ v: '', t: 'Elige…' }, ...ASEGURADORAS]} />
          </div>
          <Campo valor={form.soat_vence} onCambio={set} label={`${seguro} vence el`} campo="soat_vence" type="date" min={hoy} />
          <p className="f-ayuda">
            Comprueba que figure vigente con tu placa en{' '}
            <a href={URL_APESEG} target="_blank" rel="noreferrer" className="f-link">APESEG<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="ml-1 text-[10px]" /></a>.
            {' '}Nosotros también lo verificamos antes de aprobarte.
          </p>
          <CapturaDocumento campo="doc_soat" label={`Certificado ${seguro}`} aceptaPdf
            ayuda="El certificado digital en PDF o una foto nítida del físico." valor={archivos.doc_soat} onCambio={setArchivo} />

          {conRevision ? (
            <>
              <Campo valor={form.revision_tecnica_vence} onCambio={set} label="Revisión técnica vence el" campo="revision_tecnica_vence" type="date" min={hoy} />
              <CapturaDocumento campo="doc_revision_tecnica" label="Certificado de revisión técnica" aceptaPdf valor={archivos.doc_revision_tecnica} onCambio={setArchivo} />
            </>
          ) : (
            <p className="f-aviso">La moto lineal no necesita certificado de revisión técnica en SafO.</p>
          )}

          <label className="flex items-start gap-2.5 text-[13.5px] text-[#4A4F5C] cursor-pointer">
            <input type="checkbox" checked={form.tiene_permiso} onChange={e => set('tiene_permiso', e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#16181D]" />
            <span>Tengo permiso o autorización de la municipalidad para prestar servicio <small className="text-[#8A8F9C]">(opcional)</small></span>
          </label>
          {form.tiene_permiso && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Campo valor={form.permiso_municipal_numero} onCambio={set} label="N.º de permiso" campo="permiso_municipal_numero" maxLength={40} />
                <Campo valor={form.permiso_municipal_vence} onCambio={set} label="Vence el" campo="permiso_municipal_vence" type="date" min={hoy} />
              </div>
              <CapturaDocumento campo="doc_permiso_municipal" label="Permiso municipal" aceptaPdf valor={archivos.doc_permiso_municipal} onCambio={setArchivo} />
            </div>
          )}

          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <button onClick={volver} className="f-btn f-btn-sec">Volver</button>
            <button onClick={avanzar} className="f-btn">Continuar</button>
          </div>
        </div>
      )}

      {paso === 6 && (
        <div className="space-y-5">
          <Campo valor={form.antecedentes_fecha} onCambio={set} label="Fecha de emisión del certificado de antecedentes" campo="antecedentes_fecha" type="date" min={sumarDias(hoy, -90)} max={hoy}
            ayuda="Debe tener menos de 90 días. Puede ser el certificado de antecedentes policiales o penales." />
          <CapturaDocumento campo="doc_antecedentes" label="Certificado de antecedentes" aceptaPdf valor={archivos.doc_antecedentes} onCambio={setArchivo} />

          <div className="f-campo">
            <span className="f-etiqueta">Contacto de emergencia</span>
            <span className="f-ayuda">Alguien a quien podamos llamar si ocurre algo durante un viaje.</span>
          </div>
          <Campo valor={form.emergencia_nombre} onCambio={set} label="Nombre completo" campo="emergencia_nombre" placeholder="Ej. Rosa Pérez" maxLength={100} />
          <div className="grid grid-cols-2 gap-4">
            <Campo valor={form.emergencia_parentesco} onCambio={set} label="Parentesco" campo="emergencia_parentesco" options={[{ v: '', t: 'Elige…' }, ...PARENTESCOS]} />
            <Campo valor={form.emergencia_celular} onCambio={set} label="Celular" campo="emergencia_celular" placeholder="987 654 321" type="tel" maxLength={9} inputMode="numeric" />
          </div>

          <dl className="f-aviso grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="text-[#7A7F8C]">Nombre</dt><dd className="text-[#16181D] font-medium truncate">{form.nombre || '—'}</dd>
            <dt className="text-[#7A7F8C]">Celular</dt><dd className="text-[#16181D] font-medium tabular-nums">{form.celular || '—'}</dd>
            <dt className="text-[#7A7F8C]">Vehículo</dt><dd className="text-[#16181D] font-medium">{vehiculo.t} · {form.placa || '—'}</dd>
            <dt className="text-[#7A7F8C]">Documentos</dt><dd className="text-[#16181D] font-medium">{subidos} adjuntos</dd>
          </dl>

          <label className="flex items-start gap-2.5 text-[13.5px] leading-snug text-[#4A4F5C] cursor-pointer">
            <input type="checkbox" checked={form.acepta_terminos} onChange={e => set('acepta_terminos', e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#16181D]" />
            <span>Declaro que los datos y documentos son verdaderos, y autorizo a SafO a verificarlos y a tratar mis datos personales para la seguridad de los viajes.</span>
          </label>

          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <button onClick={volver} className="f-btn f-btn-sec">Volver</button>
            <button onClick={registrar} disabled={cargando} className="f-btn">{cargando ? 'Enviando…' : 'Enviar solicitud'}</button>
          </div>
        </div>
      )}

      <p className="text-center text-[14px] text-[#4A4F5C] mt-8">
        ¿Ya tienes cuenta?{' '}
        <button onClick={() => router.push('/login')} className="f-link">Inicia sesión</button>
      </p>
    </>,
    'max-w-[30rem]'
  )
}
