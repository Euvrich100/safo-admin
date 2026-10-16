'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCloudArrowUp, faCircleCheck, faTaxi, faCircleUser, faIdCard, faAddressCard } from '@fortawesome/free-solid-svg-icons'
import SafoLogo from '@/components/SafoLogo'
import ClaveInput from '@/components/ClaveInput'
import { CIUDAD } from '@/lib/ciudad'
import { VEHICULOS, TIPOS_VEHICULO, SERVICIOS } from '@/lib/vehiculos'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://safo-backend.onrender.com'

// IMPORTANTE: estos componentes viven FUERA de RegistroConductorPage. Si se
// definen dentro, React crea un componente nuevo en cada tecla, desmonta el
// <input> y se pierde el foco (solo dejaba escribir una letra por vez).
function FileBox({ campo, label, icono, preview, onArchivo, opcional = false }) {
  return (
    <div className="f-campo">
      <span className="f-etiqueta">{label}{opcional && <small>opcional</small>}</span>
      <label className="cursor-pointer block">
        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          aria-label={label} onChange={e => onArchivo(campo, e.target.files[0])} />
        <div className={`w-full h-28 rounded-[10px] border flex flex-col items-center justify-center transition overflow-hidden ${preview ? 'border-[#16181D]' : 'border-dashed border-[#C2C6D0] bg-[#F6F7F9] hover:border-[#0A66E0] hover:bg-white'}`}>
          {preview ? (
            <div className="relative w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt={label} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 bg-[#16181D] rounded-full w-5 h-5 flex items-center justify-center">
                <FontAwesomeIcon icon={faCircleCheck} className="text-[11px] text-white" />
              </div>
            </div>
          ) : (
            <>
              <FontAwesomeIcon icon={icono} className="text-xl mb-1.5 text-[#7A7F8C]" />
              <span className="text-[13px] text-[#4A4F5C] font-medium"><FontAwesomeIcon icon={faCloudArrowUp} className="mr-1.5 text-xs" />Subir foto</span>
            </>
          )}
        </div>
      </label>
    </div>
  )
}

function Campo({ label, campo, valor, onCambio, placeholder, type = 'text', maxLength, options, inputMode, opcional = false, ayuda, prefijo, autoComplete }) {
  const id = `c-${campo}`
  const etiqueta = <label htmlFor={id} className="f-etiqueta">{label}{opcional && <small>opcional</small>}</label>
  if (options) {
    return (
      <div className="f-campo">
        {etiqueta}
        <select id={id} value={valor} onChange={e => onCambio(campo, e.target.value)} className="f-input">
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    )
  }
  // En los campos numéricos se limpia primero (pegar «987 654 321» con espacios) y luego se recorta al largo máximo
  const numerico = inputMode === 'numeric'
  const cambiar = e => onCambio(campo, numerico ? e.target.value.replace(/\D/g, '').slice(0, maxLength || 99) : e.target.value)
  const largo = numerico ? undefined : maxLength
  return (
    <div className="f-campo">
      {etiqueta}
      {prefijo ? (
        <div className="f-grupo">
          <span className="f-prefijo" aria-hidden="true">{prefijo}</span>
          <input id={id} type={type} inputMode={inputMode} placeholder={placeholder} value={valor} maxLength={largo} autoComplete={autoComplete} onChange={cambiar} />
        </div>
      ) : (
        <input id={id} type={type} inputMode={inputMode} placeholder={placeholder} value={valor} maxLength={largo} autoComplete={autoComplete} onChange={cambiar} className="f-input" />
      )}
      {ayuda && <span className="f-ayuda">{ayuda}</span>}
    </div>
  )
}

export default function RegistroConductorPage() {
  const router = useRouter()
  const [paso, setPaso] = useState(1)
  const [cargando, setCargando] = useState(false)
  const [completado, setCompletado] = useState(false)
  const [form, setForm] = useState({
    nombre: '', celular: '', dni: '', fecha_nacimiento: '',
    direccion: '', licencia_numero: '', licencia_categoria: 'A-IIb',
    tipo_vehiculo: 'taxi', placa: '', vehiculo_marca: '', vehiculo_modelo: '',
    vehiculo_color: '', vehiculo_anno: '',
    password: '', repetir: '',
  })
  const [archivos, setArchivos] = useState({
    foto_perfil: null, foto_dni_frontal: null,
    foto_dni_trasera: null, foto_licencia: null, foto_vehiculo: null,
  })
  const [previews, setPreviews] = useState({})

  const set = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }))
  const vehiculo = VEHICULOS[form.tipo_vehiculo]

  // Al cambiar de vehículo, la categoría de licencia pasa a la que le corresponde
  const elegirVehiculo = (tipo) => setForm(f => ({ ...f, tipo_vehiculo: tipo, licencia_categoria: VEHICULOS[tipo].licenciaDefecto }))

  const subirArchivo = (campo, archivo) => {
    if (!archivo) return
    setArchivos(a => ({ ...a, [campo]: archivo }))
    setPreviews(p => ({ ...p, [campo]: URL.createObjectURL(archivo) }))
  }

  const irPaso2 = () => {
    if (!form.nombre.trim()) return toast.error('Escribe tu nombre completo')
    if (!/^\d{9}$/.test(form.celular)) return toast.error('El celular debe tener 9 dígitos')
    if (!/^\d{8}$/.test(form.dni)) return toast.error('El DNI debe tener 8 dígitos')
    if (form.password.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres')
    if (form.password !== form.repetir) return toast.error('Las contraseñas no coinciden')
    setPaso(2)
  }

  const irPaso3 = () => {
    const faltan = []
    if (!archivos.foto_dni_frontal) faltan.push('DNI frontal')
    if (!archivos.foto_dni_trasera) faltan.push('DNI trasero')
    if (!archivos.foto_licencia) faltan.push('licencia')
    if (faltan.length) return toast.error('Falta subir: ' + faltan.join(', '))
    setPaso(3)
  }

  const registrar = async () => {
    if (!form.licencia_numero.trim() || !form.placa.trim()) {
      return toast.error('Completa el número de licencia y la placa')
    }
    if (!archivos.foto_vehiculo) return toast.error('Sube la foto del vehículo')
    setCargando(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (k !== 'repetir') formData.append(k, v) })
      Object.entries(archivos).forEach(([k, v]) => { if (v) formData.append(k, v) })
      const res = await fetch(`${API}/api/auth/registrar-conductor`, {
        method: 'POST', body: formData
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error)
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
      <p className="text-[15px] leading-relaxed text-[#4A4F5C] mb-7">El administrador revisará tus documentos en menos de 24 horas y te avisará al {CIUDAD.prefijoTelefono} {form.celular}. Cuando te aprueben, entra con tu celular y tu contraseña.</p>
      <div className="f-aviso mb-6">
        Estado de tu solicitud
        <div className="text-[1.05rem] font-semibold text-[#16181D] mt-0.5">En revisión</div>
      </div>
      <button onClick={() => router.push('/')} className="f-btn">Volver al inicio</button>
    </>
  )

  const pasos = ['Datos personales', 'Documentos', 'Vehículo']

  return marco(
    <>
      <div className="mb-7">
        <h1 className="text-[1.75rem] leading-tight font-semibold text-[#16181D] mb-1.5">Conduce con SafO</h1>
        <p className="text-[15px] text-[#4A4F5C]">Registra tus datos y documentos. Los revisamos antes de activarte.</p>
      </div>

      {/* Avance: tres tramos y el nombre del paso actual */}
      <div className="mb-7" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={paso} aria-label="Avance del registro">
        <div className="flex gap-1.5 mb-2.5">
          {pasos.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${paso >= i + 1 ? 'bg-[#16181D]' : 'bg-[#E8EAEE]'}`} />
          ))}
        </div>
        <p className="text-[13px] text-[#4A4F5C]"><span className="font-semibold text-[#16181D]">Paso {paso} de 3</span> · {pasos[paso - 1]}</p>
      </div>

      {paso === 1 && (
        <div className="space-y-5">
          <Campo valor={form.nombre} onCambio={set} label="Nombre completo" campo="nombre" placeholder="Ej. Juan Pérez García" autoComplete="name" />
          <Campo valor={form.celular} onCambio={set} label="Celular" campo="celular" placeholder="987 654 321" type="tel" maxLength={9} inputMode="numeric" prefijo={CIUDAD.prefijoTelefono} autoComplete="tel-national" />
          <div className="grid grid-cols-2 gap-4">
            <Campo valor={form.dni} onCambio={set} label="DNI" campo="dni" placeholder="8 dígitos" maxLength={8} inputMode="numeric" />
            <Campo valor={form.fecha_nacimiento} onCambio={set} label="Nacimiento" campo="fecha_nacimiento" placeholder="" type="date" opcional />
          </div>
          <Campo valor={form.direccion} onCambio={set} label="Dirección" campo="direccion" placeholder="Av. Principal 123" opcional />
          <div className="f-campo">
            <label htmlFor="clave" className="f-etiqueta">Contraseña <small>mínimo 6 caracteres</small></label>
            <ClaveInput id="clave" value={form.password} onChange={v => set('password', v)} autoComplete="new-password" placeholder="Con ella entrarás a la app" />
          </div>
          <div className="f-campo">
            <label htmlFor="repetir" className="f-etiqueta">Repite la contraseña</label>
            <ClaveInput id="repetir" value={form.repetir} onChange={v => set('repetir', v)} autoComplete="new-password" placeholder="Escríbela otra vez" onEnter={irPaso2} />
          </div>
          <button onClick={irPaso2} className="f-btn">Continuar con documentos</button>
        </div>
      )}

      {paso === 2 && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FileBox preview={previews.foto_dni_frontal} onArchivo={subirArchivo} campo="foto_dni_frontal" label="DNI, frente" icono={faIdCard} />
            <FileBox preview={previews.foto_dni_trasera} onArchivo={subirArchivo} campo="foto_dni_trasera" label="DNI, reverso" icono={faIdCard} />
            <FileBox preview={previews.foto_licencia} onArchivo={subirArchivo} campo="foto_licencia" label="Licencia" icono={faAddressCard} />
            <FileBox preview={previews.foto_perfil} onArchivo={subirArchivo} campo="foto_perfil" label="Tu foto" icono={faCircleUser} opcional />
          </div>
          <p className="f-aviso">Usa fotos nítidas, sin reflejos y con todos los datos legibles.</p>
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <button onClick={() => setPaso(1)} className="f-btn f-btn-sec">Volver</button>
            <button onClick={irPaso3} className="f-btn">Continuar</button>
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
          <FileBox preview={previews.foto_vehiculo} onArchivo={subirArchivo} campo="foto_vehiculo" label={vehiculo.foto} icono={vehiculo.icono} />
          <div className="grid grid-cols-2 gap-4">
            <Campo valor={form.licencia_numero} onCambio={set} label="N.º de licencia" campo="licencia_numero" placeholder="A123456" />
            <Campo valor={form.licencia_categoria} onCambio={set} label="Categoría" campo="licencia_categoria" options={vehiculo.licencias} />
            <Campo valor={form.placa} onCambio={set} label="Placa" campo="placa" placeholder="ABC-123" />
            <Campo valor={form.vehiculo_anno} onCambio={set} label="Año" campo="vehiculo_anno" placeholder="2020" type="number" opcional />
            <Campo valor={form.vehiculo_marca} onCambio={set} label="Marca" campo="vehiculo_marca" placeholder={vehiculo.marca} opcional />
            <Campo valor={form.vehiculo_modelo} onCambio={set} label="Modelo" campo="vehiculo_modelo" placeholder={vehiculo.modelo} opcional />
          </div>
          <Campo valor={form.vehiculo_color} onCambio={set} label="Color" campo="vehiculo_color" placeholder="Blanco" opcional />

          <dl className="f-aviso grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="text-[#7A7F8C]">Nombre</dt><dd className="text-[#16181D] font-medium truncate">{form.nombre || '—'}</dd>
            <dt className="text-[#7A7F8C]">Celular</dt><dd className="text-[#16181D] font-medium tabular-nums">{form.celular || '—'}</dd>
            <dt className="text-[#7A7F8C]">DNI</dt><dd className="text-[#16181D] font-medium tabular-nums">{form.dni || '—'}</dd>
            <dt className="text-[#7A7F8C]">Vehículo</dt><dd className="text-[#16181D] font-medium">{vehiculo.t}</dd>
            <dt className="text-[#7A7F8C]">Placa</dt><dd className="text-[#16181D] font-medium">{form.placa || '—'}</dd>
          </dl>

          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <button onClick={() => setPaso(2)} className="f-btn f-btn-sec">Volver</button>
            <button onClick={registrar} disabled={cargando} className="f-btn">{cargando ? 'Enviando…' : 'Enviar solicitud'}</button>
          </div>
        </div>
      )}

      <p className="text-center text-[14px] text-[#4A4F5C] mt-8">
        ¿Ya tienes cuenta?{' '}
        <button onClick={() => router.push('/login')} className="f-link">Inicia sesión</button>
      </p>
    </>,
    'max-w-[28rem]'
  )
}
