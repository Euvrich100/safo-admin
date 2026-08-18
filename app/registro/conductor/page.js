'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { MapPin, Upload, CheckCircle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://safo-backend.onrender.com'

export default function RegistroConductorPage() {
  const router = useRouter()
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
    foto_perfil: null, foto_dni_frontal: null,
    foto_dni_trasera: null, foto_licencia: null, foto_vehiculo: null,
  })
  const [previews, setPreviews] = useState({})

  const set = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }))

  const subirArchivo = (campo, archivo) => {
    if (!archivo) return
    setArchivos(a => ({ ...a, [campo]: archivo }))
    setPreviews(p => ({ ...p, [campo]: URL.createObjectURL(archivo) }))
  }

  const FileBox = ({ campo, label, emoji }) => (
    <div>
      <label className="text-xs font-semibold text-[#4D96FF] uppercase tracking-widest mb-2 block">{label}</label>
      <label className="cursor-pointer block">
        <input type="file" accept="image/*" className="hidden"
          onChange={e => subirArchivo(campo, e.target.files[0])} />
        <div className={`w-full h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition overflow-hidden ${previews[campo] ? 'border-[#22C55E]' : 'border-[#1A6EFF30] hover:border-[#1A6EFF]'}`}
          style={{ background: '#0D1B4B20' }}>
          {previews[campo] ? (
            <div className="relative w-full h-full">
              <img src={previews[campo]} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 bg-[#22C55E] rounded-full p-1">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            </div>
          ) : (
            <>
              <span className="text-2xl mb-1">{emoji}</span>
              <span className="text-[#4D96FF50] text-xs">{label}</span>
              <span className="text-[#4D96FF30] text-xs mt-0.5 flex items-center gap-1">
                <Upload className="w-3 h-3" /> Subir foto
              </span>
            </>
          )}
        </div>
      </label>
    </div>
  )

  const Campo = ({ label, campo, placeholder, type = 'text', maxLength, options }) => (
    <div>
      <label className="text-xs font-semibold text-[#4D96FF] uppercase tracking-widest mb-2 block">{label}</label>
      {options ? (
        <select value={form[campo]} onChange={e => set(campo, e.target.value)}
          className="w-full px-4 py-3.5 rounded-xl text-white focus:outline-none bg-[#0D1B4B30] border border-[#1A6EFF25] focus:border-[#1A6EFF] transition">
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} placeholder={placeholder} value={form[campo]} maxLength={maxLength}
          onChange={e => set(campo, e.target.value)}
          className="w-full px-4 py-3.5 rounded-xl text-white placeholder-[#4D96FF30] focus:outline-none bg-[#0D1B4B30] border border-[#1A6EFF25] focus:border-[#1A6EFF] transition"
        />
      )}
    </div>
  )

  const registrar = async () => {
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

  if (completado) return (
    <div className="min-h-screen bg-[#060B18] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-3xl font-black text-white mb-4">¡Solicitud enviada!</h1>
        <p className="text-[#4D96FF80] mb-6">El administrador revisará tus documentos en menos de 24 horas y te contactará al {form.celular}.</p>
        <div className="p-4 rounded-2xl border border-[#1A6EFF20] mb-6" style={{ background: '#0D1B4B20' }}>
          <p className="text-[#4D96FF] text-sm">Estado de solicitud</p>
          <p className="text-[#F59E0B] text-lg font-bold mt-1">⏳ En revisión</p>
        </div>
        <button onClick={() => router.push('/')}
          className="px-8 py-3 rounded-xl font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #1A6EFF, #0D1B4B)' }}>
          Volver al inicio
        </button>
      </div>
    </div>
  )

  const pasos = ['Datos personales', 'Documentos', 'Vehículo']

  return (
    <div className="min-h-screen bg-[#060B18] py-10 px-4 relative overflow-hidden">
      <Toaster position="top-center" toastOptions={{
        style: { background: '#0D1B4B', color: 'white', border: '1px solid #1A6EFF30' }
      }}/>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-5 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #1A6EFF, transparent)' }}/>

      <div className="max-w-xl mx-auto relative z-10">
        <button onClick={() => router.push('/')} className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0D1B4B, #1A6EFF)' }}>
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xl text-white">Saf<span style={{ color: '#1A6EFF' }}>O</span></span>
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Únete como conductor 🚖</h1>
          <p className="text-[#4D96FF80]">Suscripción S/ 5.00/mes — Empieza a ganar llevando pasajeros seguros</p>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-2 mb-8">
          {pasos.map((p, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${paso > i + 1 ? 'bg-[#22C55E] text-white' : paso === i + 1 ? 'bg-[#1A6EFF] text-white' : 'bg-[#1A6EFF20] text-[#4D96FF50]'}`}>
                {paso > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-xs ${paso === i + 1 ? 'text-white font-medium' : 'text-[#4D96FF40]'}`}>{p}</span>
              {i < pasos.length - 1 && <div className={`flex-1 h-0.5 ${paso > i + 1 ? 'bg-[#22C55E]' : 'bg-[#1A6EFF20]'}`}/>}
            </div>
          ))}
        </div>

        {/* Paso 1 */}
        {paso === 1 && (
          <div className="rounded-2xl p-6 border border-[#1A6EFF20] space-y-4"
            style={{ background: 'linear-gradient(135deg, #0D1B4B10, #060B18)' }}>
            <div className="grid grid-cols-1 gap-4">
              <Campo label="Nombre completo *" campo="nombre" placeholder="Juan Pérez García" />
              <Campo label="Celular *" campo="celular" placeholder="999 000 001" type="tel" />
              <div className="grid grid-cols-2 gap-4">
                <Campo label="DNI *" campo="dni" placeholder="12345678" maxLength={8} />
                <Campo label="Fecha de nacimiento" campo="fecha_nacimiento" placeholder="" type="date" />
              </div>
              <Campo label="Dirección" campo="direccion" placeholder="Jr. Huánuco 123" />
            </div>
            <button onClick={() => setPaso(2)}
              className="w-full py-4 rounded-xl font-bold text-white mt-2"
              style={{ background: 'linear-gradient(135deg, #1A6EFF, #0D1B4B)' }}>
              Siguiente — Documentos →
            </button>
          </div>
        )}

        {/* Paso 2 */}
        {paso === 2 && (
          <div className="rounded-2xl p-6 border border-[#1A6EFF20] space-y-4"
            style={{ background: 'linear-gradient(135deg, #0D1B4B10, #060B18)' }}>
            <div className="grid grid-cols-2 gap-4">
              <FileBox campo="foto_perfil" label="Foto de perfil" emoji="🤳" />
              <FileBox campo="foto_dni_frontal" label="DNI frontal *" emoji="🪪" />
              <FileBox campo="foto_dni_trasera" label="DNI trasero *" emoji="🪪" />
              <FileBox campo="foto_licencia" label="Licencia *" emoji="📋" />
            </div>
            <div className="p-3 rounded-xl border border-[#F59E0B20] bg-[#F59E0B08]">
              <p className="text-[#F59E0B] text-xs">⚠️ Fotos nítidas, sin reflejos y con todos los datos legibles.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPaso(1)}
                className="flex-1 py-3 rounded-xl text-[#4D96FF60] border border-[#1A6EFF20]">← Volver</button>
              <button onClick={() => setPaso(3)}
                className="flex-1 py-3 rounded-xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #1A6EFF, #0D1B4B)' }}>
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* Paso 3 */}
        {paso === 3 && (
          <div className="rounded-2xl p-6 border border-[#1A6EFF20] space-y-4"
            style={{ background: 'linear-gradient(135deg, #0D1B4B10, #060B18)' }}>
            <FileBox campo="foto_vehiculo" label="Foto del vehículo *" emoji="🚖" />
            <div className="grid grid-cols-2 gap-4">
              <Campo label="N° de licencia *" campo="licencia_numero" placeholder="A123456" />
              <Campo label="Categoría" campo="licencia_categoria" options={['A-IIb', 'A-IIIb', 'B-IIb']} />
              <Campo label="Placa *" campo="placa" placeholder="ABC-123" />
              <Campo label="Año" campo="vehiculo_anno" placeholder="2020" type="number" />
              <Campo label="Marca" campo="vehiculo_marca" placeholder="Toyota" />
              <Campo label="Modelo" campo="vehiculo_modelo" placeholder="Yaris" />
            </div>
            <Campo label="Color" campo="vehiculo_color" placeholder="Blanco" />

            <div className="p-4 rounded-xl border border-[#1A6EFF20] bg-[#1A6EFF08]">
              <p className="text-[#4D96FF] text-xs font-semibold mb-2">📋 Resumen</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-[#4D96FF80]">
                <span>👤 {form.nombre || '—'}</span>
                <span>📱 {form.celular || '—'}</span>
                <span>🪪 {form.dni || '—'}</span>
                <span>🚖 {form.placa || '—'}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPaso(2)}
                className="flex-1 py-3 rounded-xl text-[#4D96FF60] border border-[#1A6EFF20]">← Volver</button>
              <button onClick={registrar} disabled={cargando}
                className="flex-1 py-4 rounded-xl font-bold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #22C55E, #0D1B4B)' }}>
                {cargando ? 'Enviando...' : '✅ Enviar solicitud'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}