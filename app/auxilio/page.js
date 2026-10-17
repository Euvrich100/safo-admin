'use client'
import { useState, useEffect, useCallback } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWrench, faPlus, faPhone, faPen, faTrash, faEye, faEyeSlash, faXmark } from '@fortawesome/free-solid-svg-icons'
import api from '@/lib/api'
import useAuthGuard from '@/lib/useAuthGuard'
import AdminNavbar from '@/components/AdminNavbar'
import Campo from '@/components/Campo'
import { ESPECIALIDADES, VEHICULOS_AUXILIO, textoEspecialidad, textoVehiculos } from '@/lib/auxilio'

const VACIO = { nombre: '', especialidad: 'general', telefono: '', whatsapp: '', direccion: '', distrito: '', horario: '', atiende_24h: false, vehiculos: 'ambos', notas: '' }

// Formulario fuera de la página para que los campos no pierdan el foco al escribir
function FormMecanico({ inicial, onGuardar, onCancelar }) {
  const [f, setF] = useState({ ...VACIO, ...inicial })
  const [guardando, setGuardando] = useState(false)
  const cambiar = (campo, valor) => setF(x => ({ ...x, [campo]: valor }))
  const enviar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    await onGuardar(f)
    setGuardando(false)
  }
  return (
    <form onSubmit={enviar} className="tarjeta p-5 mb-5 space-y-3" aria-label={inicial?.id ? 'Editar mecánico' : 'Nuevo mecánico'}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[#14213D]">{inicial?.id ? 'Editar mecánico' : 'Nuevo mecánico'}</h2>
        <button type="button" onClick={onCancelar} aria-label="Cerrar formulario" className="w-9 h-9 rounded-full text-[#6E6E73] hover:bg-[#F4F6FA]"><FontAwesomeIcon icon={faXmark} /></button>
      </div>
      <Campo label="Nombre del taller o mecánico" campo="nombre" valor={f.nombre} onCambio={cambiar} maxLength={120} />
      <div className="grid sm:grid-cols-2 gap-3">
        <Campo label="Especialidad" campo="especialidad" valor={f.especialidad} onCambio={cambiar} options={ESPECIALIDADES} />
        <Campo label="Vehículos que atiende" campo="vehiculos" valor={f.vehiculos} onCambio={cambiar} options={VEHICULOS_AUXILIO} />
        <Campo label="Teléfono" campo="telefono" valor={f.telefono} onCambio={cambiar} inputMode="numeric" maxLength={15} placeholder="987654321" />
        <Campo label="WhatsApp" campo="whatsapp" valor={f.whatsapp || ''} onCambio={cambiar} inputMode="numeric" maxLength={15} opcional />
        <Campo label="Dirección" campo="direccion" valor={f.direccion || ''} onCambio={cambiar} maxLength={200} opcional />
        <Campo label="Distrito / zona" campo="distrito" valor={f.distrito || ''} onCambio={cambiar} maxLength={80} opcional />
      </div>
      <label className="flex items-center gap-2 text-sm text-[#14213D]">
        <input type="checkbox" checked={!!f.atiende_24h} onChange={e => cambiar('atiende_24h', e.target.checked)} /> Atiende las 24 horas
      </label>
      {!f.atiende_24h && <Campo label="Horario" campo="horario" valor={f.horario || ''} onCambio={cambiar} maxLength={120} placeholder="Lun a Sáb 8:00–19:00" opcional />}
      <Campo label="Notas para el conductor" campo="notas" valor={f.notas || ''} onCambio={cambiar} maxLength={300} placeholder="Ej: convenio SafO, menciona que eres conductor" opcional />
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={guardando} className="f-btn !w-auto">{guardando ? 'Guardando…' : 'Guardar'}</button>
        <button type="button" onClick={onCancelar} className="f-btn f-btn-sec !w-auto">Cancelar</button>
      </div>
    </form>
  )
}

export default function AuxilioAdminPage() {
  const { listo } = useAuthGuard()
  const [lista, setLista] = useState([])
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState(null) // null | {} (nuevo) | mecánico
  const [borrar, setBorrar] = useState(null)

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/mecanicos')
      setLista(data)
    } catch {
      toast.error('Error cargando los mecánicos', { id: 'err-mec' })
    } finally {
      setCargando(false)
    }
  }, [])
  useEffect(() => { if (listo) cargar() }, [listo, cargar])

  const guardar = async (f) => {
    const cuerpo = { ...f }
    delete cuerpo.id; delete cuerpo.creado_en; delete cuerpo.actualizado_en
    try {
      if (editando?.id) await api.put(`/api/admin/mecanicos/${editando.id}`, cuerpo)
      else await api.post('/api/admin/mecanicos', cuerpo)
      toast.success('Mecánico guardado')
      setEditando(null)
      cargar()
    } catch (e) {
      toast.error(e.response?.data?.error || 'No se pudo guardar')
    }
  }
  const alternar = async (m) => {
    try {
      await api.put(`/api/admin/mecanicos/${m.id}`, { activo: !m.activo })
      cargar()
    } catch (e) { toast.error(e.response?.data?.error || 'No se pudo actualizar') }
  }
  const eliminar = async (m) => {
    try {
      await api.delete(`/api/admin/mecanicos/${m.id}`)
      toast.success('Mecánico eliminado')
      setBorrar(null)
      cargar()
    } catch (e) { toast.error(e.response?.data?.error || 'No se pudo eliminar') }
  }

  if (!listo) return <div className="min-h-screen bg-white" />

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" />
      <AdminNavbar />
      <main className="p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-[#14213D]">Auxilio mecánico</h1>
            <p className="text-sm text-[#6E6E73] mt-1">Mecánicos de confianza que ven los conductores cuando su vehículo se malogra. Solo se muestran los activos.</p>
          </div>
          {!editando && (
            <button onClick={() => setEditando({})} className="f-btn !w-auto"><FontAwesomeIcon icon={faPlus} />Agregar mecánico</button>
          )}
        </div>

        {editando && <FormMecanico key={editando.id || 'nuevo'} inicial={editando} onGuardar={guardar} onCancelar={() => setEditando(null)} />}

        {cargando ? (
          <div className="py-20 text-center text-[#6E6E73] text-sm">Cargando...</div>
        ) : lista.length === 0 ? (
          <div className="tarjeta py-16 text-center">
            <FontAwesomeIcon icon={faWrench} className="text-4xl text-[#C5C8D2] mb-3" />
            <p className="text-[#14213D] font-medium">Aún no hay mecánicos registrados</p>
            <p className="text-sm text-[#6E6E73] mt-1">Agrégalos cuando tengas los convenios. Mientras tanto, los conductores verán un aviso de que pronto habrá números.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lista.map(m => (
              <article key={m.id} className={`tarjeta p-5 ${m.activo ? '' : 'opacity-60'}`} data-mecanico={m.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-[#14213D]">{m.nombre}
                      {!m.activo && <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F1F1F3] text-[#6E6E73]">Oculto</span>}
                      {m.atiende_24h && <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#e6f4ec] text-[#1a7f4b]">24 h</span>}
                    </h2>
                    <p className="text-sm text-[#6E6E73] mt-0.5">
                      {textoEspecialidad(m.especialidad)} · {textoVehiculos(m.vehiculos)} ·{' '}
                      <a href={`tel:${m.telefono}`} className="underline"><FontAwesomeIcon icon={faPhone} className="text-[10px] mr-1" />{m.telefono}</a>
                    </p>
                    {(m.direccion || m.distrito) && <p className="text-sm text-[#6E6E73]">{[m.direccion, m.distrito].filter(Boolean).join(' · ')}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => alternar(m)} className="px-3 py-2 rounded-xl bg-[#F4F6FA] text-[#14213D] text-sm font-semibold">
                      <FontAwesomeIcon icon={m.activo ? faEyeSlash : faEye} className="mr-1.5" />{m.activo ? 'Ocultar' : 'Mostrar'}
                    </button>
                    <button onClick={() => { setEditando(m); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="px-3 py-2 rounded-xl bg-[#EAF2FE] text-[#0A66E0] text-sm font-semibold">
                      <FontAwesomeIcon icon={faPen} className="mr-1.5" />Editar
                    </button>
                    {borrar === m.id ? (
                      <button onClick={() => eliminar(m)} className="px-3 py-2 rounded-xl bg-[#D92D20] text-white text-sm font-semibold">¿Seguro? Eliminar</button>
                    ) : (
                      <button onClick={() => setBorrar(m.id)} aria-label={`Eliminar ${m.nombre}`} className="px-3 py-2 rounded-xl bg-white border border-[#D92D20] text-[#D92D20] text-sm font-semibold">
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                </div>
                {(m.horario || m.notas) && <p className="mt-2 text-sm text-[#14213D]">{[!m.atiende_24h && m.horario, m.notas].filter(Boolean).join(' — ')}</p>}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
