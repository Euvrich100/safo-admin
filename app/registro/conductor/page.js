'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { Upload, CheckCircle } from 'lucide-react'
import SafoLogo from '@/components/SafoLogo'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://safo-backend.onrender.com'

const CLASE_INPUT = 'w-full px-4 py-3.5 rounded-xl text-[#1D1D1F] placeholder-[#A1A1A6] focus:outline-none bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#0A66E0] transition'

// IMPORTANTE: estos componentes viven FUERA de RegistroConductorPage. Si se
// definen dentro, React crea un componente nuevo en cada tecla, desmonta el
// <input> y se pierde el foco (solo dejaba escribir una letra por vez).
function FileBox({ campo, label, emoji, preview, onArchivo }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#6E6E73] uppercase tracking-widest mb-2 block">{label}</label>
      <label className="cursor-pointer block">
        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={e => onArchivo(campo, e.target.files[0])} />
        <div className={`w-full h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition overflow-hidden bg-[#F5F5F7] ${preview ? 'border-[#1E8E3E]' : 'border-[#D2D2D7] hover:border-[#0A66E0]'}`}>
          {preview ? (
            <div className="relative w-full h-full">
              <img src={preview} alt={label} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 bg-[#1E8E3E] rounded-full p-1">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            </div>
          ) : (
            <>
              <span className="text-2xl mb-1">{emoji}</span>
              <span className="text-[#6E6E73] text-xs">{label}</span>
              <span className="text-[#A1A1A6] text-xs mt-0.5 flex items-center gap-1">
                <Upload className="w-3 h-3" /> Subir foto
              </span>
            </>
          )}
        </div>
      </label>
    </div>
  )
}

function Campo({ label, campo, valor, onCambio, placeholder, type = 'text', maxLength, options, inputMode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#6E6E73] uppercase tracking-widest mb-2 block">{label}</label>
      {options ? (
        <select value={valor} onChange={e => onCambio(campo, e.target.value)} className={CLASE_INPUT}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} inputMode={inputMode} placeholder={placeholder} value={valor} maxLength={maxLength}
          onChange={e => onCambio(campo, inputMode === 'numeric' ? e.target.value.replace(/\D/g, '') : e.target.value)} className={CLASE_INPUT} />
      )}
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

  const irPaso2 = () => {
    if (!form.nombre.trim()) return toast.error('Escribe tu nombre completo')
    if (!/^\d{9}$/.test(form.celular)) return toast.error('El celular debe tener 9 dígitos')
    if (!/^\d{8}$/.test(form.dni)) return toast.error('El DNI debe tener 8 dígitos')
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
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-4">¡Solicitud enviada!</h1>
        <p className="text-[#6E6E73] mb-6">El administrador revisará tus documentos en menos de 24 horas y te contactará al {form.celular}.</p>
        <div className="p-4 rounded-2xl bg-[#F5F5F7] mb-6">
          <p className="text-[#6E6E73] text-sm">Estado de solicitud</p>
          <p className="text-[#B45309] text-lg font-semibold mt-1">⏳ En revisión</p>
        </div>
        <button onClick={() => router.push('/')}
          className="px-8 py-3 rounded-full font-semibold text-white bg-[#0A66E0] hover:bg-[#084FB0]">
          Volver al inicio
        </button>
      </div>
    </div>
  )

  const pasos = ['Datos personales', 'Documentos', 'Vehículo']

  return (
    <div className="min-h-screen bg-white py-10 px-4">
      <Toaster position="top-center" toastOptions={{
        style: { background: '#1D1D1F', color: 'white' }
      }}/>

      <div className="max-w-xl mx-auto">
        <button onClick={() => router.push('/')} className="flex items-center mb-8">
          <SafoLogo size={34} priority />
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2 tracking-tight">Únete como conductor 🚖</h1>
          <p className="text-[#6E6E73]">Suscripción S/ 5.00/mes — Empieza a ganar llevando pasajeros seguros</p>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-2 mb-8">
          {pasos.map((p, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${paso > i + 1 ? 'bg-[#1E8E3E] text-white' : paso === i + 1 ? 'bg-[#0A66E0] text-white' : 'bg-[#F5F5F7] text-[#A1A1A6]'}`}>
                {paso > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-xs ${paso === i + 1 ? 'text-[#1D1D1F] font-medium' : 'text-[#A1A1A6]'}`}>{p}</span>
              {i < pasos.length - 1 && <div className={`flex-1 h-0.5 ${paso > i + 1 ? 'bg-[#1E8E3E]' : 'bg-[#E2E2E7]'}`}/>}
            </div>
          ))}
        </div>

        {/* Paso 1 */}
        {paso === 1 && (
          <div className="rounded-2xl p-6 border border-[#E2E2E7] space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Campo valor={form.nombre} onCambio={set} label="Nombre completo *" campo="nombre" placeholder="Juan Pérez García" />
              <Campo valor={form.celular} onCambio={set} label="Celular *" campo="celular" placeholder="999000001" type="tel" maxLength={9} inputMode="numeric" />
              <div className="grid grid-cols-2 gap-4">
                <Campo valor={form.dni} onCambio={set} label="DNI *" campo="dni" placeholder="12345678" maxLength={8} inputMode="numeric" />
                <Campo valor={form.fecha_nacimiento} onCambio={set} label="Fecha de nacimiento" campo="fecha_nacimiento" placeholder="" type="date" />
              </div>
              <Campo valor={form.direccion} onCambio={set} label="Dirección" campo="direccion" placeholder="Jr. Huánuco 123" />
            </div>
            <button onClick={irPaso2}
              className="w-full py-4 rounded-full font-semibold text-white mt-2 bg-[#0A66E0] hover:bg-[#084FB0]">
              Siguiente — Documentos →
            </button>
          </div>
        )}

        {/* Paso 2 */}
        {paso === 2 && (
          <div className="rounded-2xl p-6 border border-[#E2E2E7] space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FileBox preview={previews.foto_perfil} onArchivo={subirArchivo} campo="foto_perfil" label="Foto de perfil" emoji="🤳" />
              <FileBox preview={previews.foto_dni_frontal} onArchivo={subirArchivo} campo="foto_dni_frontal" label="DNI frontal *" emoji="🪪" />
              <FileBox preview={previews.foto_dni_trasera} onArchivo={subirArchivo} campo="foto_dni_trasera" label="DNI trasero *" emoji="🪪" />
              <FileBox preview={previews.foto_licencia} onArchivo={subirArchivo} campo="foto_licencia" label="Licencia *" emoji="📋" />
            </div>
            <div className="p-3 rounded-xl bg-[#FEF3E2]">
              <p className="text-[#B45309] text-xs">⚠️ Fotos nítidas, sin reflejos y con todos los datos legibles.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPaso(1)}
                className="flex-1 py-3 rounded-full text-[#6E6E73] border border-[#E2E2E7] hover:bg-[#F5F5F7]">← Volver</button>
              <button onClick={irPaso3}
                className="flex-1 py-3 rounded-full font-semibold text-white bg-[#0A66E0] hover:bg-[#084FB0]">
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* Paso 3 */}
        {paso === 3 && (
          <div className="rounded-2xl p-6 border border-[#E2E2E7] space-y-4">
            <FileBox preview={previews.foto_vehiculo} onArchivo={subirArchivo} campo="foto_vehiculo" label="Foto del vehículo *" emoji="🚖" />
            <div className="grid grid-cols-2 gap-4">
              <Campo valor={form.licencia_numero} onCambio={set} label="N° de licencia *" campo="licencia_numero" placeholder="A123456" />
              <Campo valor={form.licencia_categoria} onCambio={set} label="Categoría" campo="licencia_categoria" options={['A-IIb', 'A-IIIb', 'B-IIb']} />
              <Campo valor={form.placa} onCambio={set} label="Placa *" campo="placa" placeholder="ABC-123" />
              <Campo valor={form.vehiculo_anno} onCambio={set} label="Año" campo="vehiculo_anno" placeholder="2020" type="number" />
              <Campo valor={form.vehiculo_marca} onCambio={set} label="Marca" campo="vehiculo_marca" placeholder="Toyota" />
              <Campo valor={form.vehiculo_modelo} onCambio={set} label="Modelo" campo="vehiculo_modelo" placeholder="Yaris" />
            </div>
            <Campo valor={form.vehiculo_color} onCambio={set} label="Color" campo="vehiculo_color" placeholder="Blanco" />

            <div className="p-4 rounded-xl bg-[#EAF2FE]">
              <p className="text-[#0A66E0] text-xs font-semibold mb-2">📋 Resumen</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-[#0A66E0] opacity-80">
                <span>👤 {form.nombre || '—'}</span>
                <span>📱 {form.celular || '—'}</span>
                <span>🪪 {form.dni || '—'}</span>
                <span>🚖 {form.placa || '—'}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPaso(2)}
                className="flex-1 py-3 rounded-full text-[#6E6E73] border border-[#E2E2E7] hover:bg-[#F5F5F7]">← Volver</button>
              <button onClick={registrar} disabled={cargando}
                className="flex-1 py-4 rounded-full font-semibold text-white disabled:opacity-50 bg-[#1E8E3E] hover:bg-[#177530]">
                {cargando ? 'Enviando...' : '✅ Enviar solicitud'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
