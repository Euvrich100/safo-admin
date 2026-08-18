'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { MapPin, User, Car, Phone, CreditCard, Palette, Upload, CheckCircle, Calendar, Hash } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://safo-backend.onrender.com'

export default function RegistroPage() {
  const router = useRouter()
  const [rol, setRol] = useState(null)
  const [paso, setPaso] = useState(1)
  const [cargando, setCargando] = useState(false)
  const [completado, setCompletado] = useState(false)
  const [form, setForm] = useState({
    nombre: '', celular: '', dni: '', fecha_nacimiento: '',
    direccion: '', licencia_numero: '', licencia_categoria: 'A-IIb',
    placa: '', vehiculo_marca: '', vehiculo_modelo: '',
    vehiculo_color: '', vehiculo_anno: '',
  })
  const [archivos, setArchivos] = useState({
    foto_perfil: null,
    foto_dni_frontal: null,
    foto_dni_trasera: null,
    foto_licencia: null,
    foto_vehiculo: null,
  })
  const [previews, setPreviews] = useState({})

  const actualizar = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }))

  const subirArchivo = (campo, archivo) => {
    if (!archivo) return
    setArchivos(a => ({ ...a, [campo]: archivo }))
    const url = URL.createObjectURL(archivo)
    setPreviews(p => ({ ...p, [campo]: url }))
  }

  const FileUpload = ({ campo, label, icono }) => (
    <div>
      <label className="text-xs font-semibold text-[#4D96FF] uppercase tracking-widest mb-2 block">{label}</label>
      <label className="cursor-pointer block">
        <input type="file" accept="image/*" className="hidden"
          onChange={e => subirArchivo(campo, e.target.files[0])} />
        <div className={`w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition ${previews[campo] ? 'border-[#22C55E]' : 'border-[#1A6EFF30] hover:border-[#1A6EFF]'}`}
          style={{ background: '#0D1B4B20' }}>
          {previews[campo] ? (
            <div className="relative w-full h-full">
              <img src={previews[campo]} className="w-full h-full object-cover rounded-xl" />
              <div className="absolute top-2 right-2 bg-[#22C55E] rounded-full p-1">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-6 h-6 text-[#4D96FF50] mb-2" />
              <span className="text-[#4D96FF50] text-xs text-center px-2">{icono} {label}</span>
              <span className="text-[#4D96FF30] text-xs mt-1">Toca para subir foto</span>
            </>
          )}
        </div>
      </label>
    </div>
  )

  const InputField = ({ label, campo, placeholder, type = 'text', maxLength }) => (
    <div>
      <label className="text-xs font-semibold text-[#4D96FF] uppercase tracking-widest mb-2 block">{label}</label>
      <input type={type} placeholder={placeholder} value={form[campo]} maxLength={maxLength}
        onChange={e => actualizar(campo, e.target.value)}
        className="w-full px-4 py-3.5 rounded-xl text-white placeholder-[#4D96FF30] focus:outline-none transition"
        style={{ background: '#0D1B4B30', border: '1.5px solid #1A6EFF25' }}
        onFocus={e => e.target.style.borderColor = '#1A6EFF'}
        onBlur={e => e.target.style.borderColor = '#1A6EFF25'}
      />
    </div>
  )

  const registrarConductor = async () => {
    if (!form.nombre || !form.celular || !form.dni || !form.licencia_numero || !form.placa) {
      return toast.error('Completa todos los campos obligatorios')
    }
    setCargando(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => formData.append(k, v))
      Object.entries(archivos).forEach(([k, v]) => { if (v) formData.append(k, v) })

      const res = await fetch(`${API}/api/auth/registrar-conductor`, {
        method: 'POST', body: formData
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error)
      setCompletado(true)
    } catch (e) {
      toast.error('Error al conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  const registrarPasajero = async () => {
    if (!form.nombre || !form.celular) return toast.error('Completa todos los campos')
    setCargando(true)
    try {
      const res = await fetch(`${API}/api/auth/registrar-pasajero`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: form.nombre, celular: form.celular, dni: form.dni })
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error)
      setCompletado(true)
    } catch (e) {
      toast.error('Error al conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  if (completado) return (
    <div className="min-h-screen bg-[#060B18] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-3xl font-black text-white mb-4">¡Registro exitoso!</h1>
        <p className="text-[#4D96FF80] mb-2">
          {rol === 'conductor'
            ? 'Tu solicitud fue enviada. El administrador revisará tus documentos en menos de 24 horas y te notificará por WhatsApp.'
            : '¡Ya eres parte de SafO! Descarga la app para pedir tu primer taxi seguro.'}
        </p>
        <div className="mt-8 p-4 rounded-2xl border border-[#1A6EFF20]" style={{ background: '#0D1B4B20' }}>
          <p className="text-[#4D96FF] text-sm font-medium">📱 Número registrado</p>
          <p className="text-white text-xl font-bold mt-1">{form.celular}</p>
        </div>
        <button onClick={() => router.push('/')}
          className="mt-6 px-8 py-3 rounded-xl font-bold text-white transition"
          style={{ background: 'linear-gradient(135deg, #1A6EFF, #0D1B4B)' }}>
          Volver al inicio
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#060B18] py-12 px-4 relative overflow-hidden">
      <Toaster position="top-center" toastOptions={{
        style: { background: '#0D1B4B', color: 'white', border: '1px solid #1A6EFF30' }
      }}/>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-5 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #1A6EFF, transparent)' }}/>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <button onClick={() => router.push('/')} className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0D1B4B, #1A6EFF)' }}>
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black text-white">SafO</span>
          </button>
          <h1 className="text-4xl font-black text-white mb-2">Únete a SafO</h1>
          <p className="text-[#4D96FF80]">Plataforma de taxis seguros — Huánuco, Perú</p>
        </div>

        {/* Elegir rol */}
        {!rol && (
          <div className="space-y-4">
            <p className="text-center text-[#4D96FF] text-sm font-semibold mb-6 uppercase tracking-widest">¿Cómo quieres unirte?</p>

            <button onClick={() => setRol('conductor')}
              className="w-full p-6 rounded-2xl border border-[#1A6EFF20] hover:border-[#1A6EFF] transition text-left group"
              style={{ background: 'linear-gradient(135deg, #0D1B4B15, #060B18)' }}>
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: '#1A6EFF15' }}>🚖</div>
                <div className="flex-1">
                  <div className="font-black text-white text-xl group-hover:text-[#4D96FF] transition mb-1">Quiero ser conductor</div>
                  <div className="text-[#4D96FF60] text-sm mb-2">Registra tu vehículo y empieza a ganar llevando pasajeros de forma segura</div>
                  <div className="flex gap-3">
                    <span className="text-xs bg-[#1A6EFF15] text-[#1A6EFF] px-3 py-1 rounded-full">S/ 5.00/mes</span>
                    <span className="text-xs bg-[#22C55E15] text-[#22C55E] px-3 py-1 rounded-full">Conductor verificado</span>
                  </div>
                </div>
              </div>
            </button>

            <button onClick={() => setRol('pasajero')}
              className="w-full p-6 rounded-2xl border border-[#1A6EFF20] hover:border-[#1A6EFF] transition text-left group"
              style={{ background: 'linear-gradient(135deg, #0D1B4B15, #060B18)' }}>
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: '#22C55E15' }}>👤</div>
                <div className="flex-1">
                  <div className="font-black text-white text-xl group-hover:text-[#4D96FF] transition mb-1">Quiero ser pasajero</div>
                  <div className="text-[#4D96FF60] text-sm mb-2">Viaja seguro con conductores verificados y rastreados en tiempo real</div>
                  <div className="flex gap-3">
                    <span className="text-xs bg-[#22C55E15] text-[#22C55E] px-3 py-1 rounded-full">Registro gratis</span>
                    <span className="text-xs bg-[#1A6EFF15] text-[#1A6EFF] px-3 py-1 rounded-full">S/ 1.50 por viaje</span>
                  </div>
                </div>
              </div>
            </button>

            <p className="text-center text-[#4D96FF40] text-sm mt-6">
              ¿Ya tienes cuenta?{' '}
              <button onClick={() => router.push('/login')} className="text-[#4D96FF] hover:text-white transition">
                Inicia sesión
              </button>
            </p>
          </div>
        )}

        {/* Formulario conductor - Paso 1: Datos personales */}
        {rol === 'conductor' && paso === 1 && (
          <div className="rounded-2xl p-8 border border-[#1A6EFF20]"
            style={{ background: 'linear-gradient(135deg, #0D1B4B10, #060B18)' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#1A6EFF15] flex items-center justify-center">
                <User className="w-5 h-5 text-[#1A6EFF]" />
              </div>
              <div>
                <div className="font-bold text-white">Paso 1 de 3 — Datos personales</div>
                <div className="text-[#4D96FF60] text-xs">Información básica del conductor</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center mb-4">
                <FileUpload campo="foto_perfil" label="Foto de perfil" icono="🤳" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Nombre completo *" campo="nombre" placeholder="Juan Pérez García" />
                <InputField label="Celular *" campo="celular" placeholder="999 000 001" type="tel" />
                <InputField label="DNI *" campo="dni" placeholder="12345678" maxLength={8} />
                <InputField label="Fecha de nacimiento" campo="fecha_nacimiento" placeholder="" type="date" />
              </div>
              <InputField label="Dirección" campo="direccion" placeholder="Jr. Huánuco 123, Huánuco" />
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setRol(null)}
                className="flex-1 py-3 rounded-xl text-[#4D96FF60] hover:text-[#4D96FF] transition border border-[#1A6EFF20]">
                ← Volver
              </button>
              <button onClick={() => setPaso(2)}
                className="flex-1 py-3 rounded-xl font-bold text-white transition"
                style={{ background: 'linear-gradient(135deg, #1A6EFF, #0D1B4B)' }}>
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* Formulario conductor - Paso 2: Documentos */}
        {rol === 'conductor' && paso === 2 && (
          <div className="rounded-2xl p-8 border border-[#1A6EFF20]"
            style={{ background: 'linear-gradient(135deg, #0D1B4B10, #060B18)' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#F59E0B15] flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <div className="font-bold text-white">Paso 2 de 3 — Documentos</div>
                <div className="text-[#4D96FF60] text-xs">Sube fotos nítidas de tus documentos</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FileUpload campo="foto_dni_frontal" label="DNI — Parte frontal *" icono="🪪" />
              <FileUpload campo="foto_dni_trasera" label="DNI — Parte trasera *" icono="🪪" />
              <FileUpload campo="foto_licencia" label="Licencia de conducir *" icono="📋" />
              <div className="md:col-span-2 p-4 rounded-xl border border-[#F59E0B20] bg-[#F59E0B08]">
                <p className="text-[#F59E0B] text-xs font-medium">⚠️ Importante</p>
                <p className="text-[#F59E0B80] text-xs mt-1">Las fotos deben ser nítidas, sin reflejos y con todos los datos legibles. Documentos borrosos serán rechazados.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setPaso(1)}
                className="flex-1 py-3 rounded-xl text-[#4D96FF60] hover:text-[#4D96FF] transition border border-[#1A6EFF20]">
                ← Volver
              </button>
              <button onClick={() => setPaso(3)}
                className="flex-1 py-3 rounded-xl font-bold text-white transition"
                style={{ background: 'linear-gradient(135deg, #1A6EFF, #0D1B4B)' }}>
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* Formulario conductor - Paso 3: Vehículo */}
        {rol === 'conductor' && paso === 3 && (
          <div className="rounded-2xl p-8 border border-[#1A6EFF20]"
            style={{ background: 'linear-gradient(135deg, #0D1B4B10, #060B18)' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#22C55E15] flex items-center justify-center">
                <Car className="w-5 h-5 text-[#22C55E]" />
              </div>
              <div>
                <div className="font-bold text-white">Paso 3 de 3 — Tu vehículo</div>
                <div className="text-[#4D96FF60] text-xs">Datos del taxi que usarás en SafO</div>
              </div>
            </div>

            <div className="space-y-4">
              <FileUpload campo="foto_vehiculo" label="Foto del vehículo *" icono="🚖" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Número de licencia *" campo="licencia_numero" placeholder="A123456" />
                <div>
                  <label className="text-xs font-semibold text-[#4D96FF] uppercase tracking-widest mb-2 block">Categoría de licencia</label>
                  <select value={form.licencia_categoria}
                    onChange={e => actualizar('licencia_categoria', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl text-white focus:outline-none transition"
                    style={{ background: '#0D1B4B30', border: '1.5px solid #1A6EFF25' }}>
                    <option value="A-IIb">A-IIb (taxi)</option>
                    <option value="A-IIIb">A-IIIb</option>
                    <option value="B-IIb">B-IIb</option>
                  </select>
                </div>
                <InputField label="Placa del vehículo *" campo="placa" placeholder="ABC-123" />
                <InputField label="Año del vehículo" campo="vehiculo_anno" placeholder="2020" type="number" />
                <InputField label="Marca" campo="vehiculo_marca" placeholder="Toyota" />
                <InputField label="Modelo" campo="vehiculo_modelo" placeholder="Yaris" />
              </div>
              <InputField label="Color" campo="vehiculo_color" placeholder="Blanco" />

              <div className="p-4 rounded-xl border border-[#1A6EFF20] bg-[#1A6EFF08] mt-4">
                <p className="text-[#1A6EFF] text-xs font-semibold mb-2">📋 Resumen de tu registro</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-[#4D96FF80]">
                  <span>👤 {form.nombre || '—'}</span>
                  <span>📱 {form.celular || '—'}</span>
                  <span>🪪 DNI: {form.dni || '—'}</span>
                  <span>🚖 Placa: {form.placa || '—'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setPaso(2)}
                className="flex-1 py-3 rounded-xl text-[#4D96FF60] hover:text-[#4D96FF] transition border border-[#1A6EFF20]">
                ← Volver
              </button>
              <button onClick={registrarConductor} disabled={cargando}
                className="flex-1 py-4 rounded-xl font-bold text-white transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #22C55E, #0D1B4B)' }}>
                {cargando ? 'Enviando solicitud...' : '✅ Enviar solicitud'}
              </button>
            </div>
          </div>
        )}

        {/* Formulario pasajero */}
        {rol === 'pasajero' && (
          <div className="rounded-2xl p-8 border border-[#1A6EFF20]"
            style={{ background: 'linear-gradient(135deg, #0D1B4B10, #060B18)' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#22C55E15] flex items-center justify-center">
                <User className="w-5 h-5 text-[#22C55E]" />
              </div>
              <div>
                <div className="font-bold text-white">Registro de pasajero</div>
                <div className="text-[#4D96FF60] text-xs">Solo necesitas tu nombre y celular</div>
              </div>
            </div>

            <div className="space-y-4">
              <InputField label="Nombre completo *" campo="nombre" placeholder="María García" />
              <InputField label="Celular *" campo="celular" placeholder="999 000 002" type="tel" />
              <InputField label="DNI (opcional)" campo="dni" placeholder="12345678" maxLength={8} />

              <div className="p-4 rounded-xl border border-[#22C55E20] bg-[#22C55E08]">
                <p className="text-[#22C55E] text-xs font-medium">✅ Registro simple y rápido</p>
                <p className="text-[#22C55E60] text-xs mt-1">Como pasajero no necesitas documentos adicionales. Tu seguridad está garantizada por los conductores verificados de SafO.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setRol(null)}
                className="flex-1 py-3 rounded-xl text-[#4D96FF60] hover:text-[#4D96FF] transition border border-[#1A6EFF20]">
                ← Volver
              </button>
              <button onClick={registrarPasajero} disabled={cargando}
                className="flex-1 py-4 rounded-xl font-bold text-white transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #22C55E, #0D1B4B)' }}>
                {cargando ? 'Registrando...' : '✅ Crear cuenta gratis'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}