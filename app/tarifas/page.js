'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoneyBillWave, faMapLocationDot, faPlus, faTrash, faEye, faEyeSlash, faFloppyDisk } from '@fortawesome/free-solid-svg-icons'
import api from '@/lib/api'
import useAuthGuard from '@/lib/useAuthGuard'
import AdminNavbar from '@/components/AdminNavbar'
import { soles } from '@/lib/formato'

const MapaAdmin = dynamic(() => import('@/components/MapaAdmin'), { ssr: false })

const CAMPOS = [
  { clave: 'tarifa_base', titulo: 'Tarifa base', ayuda: 'Monto fijo con el que arranca cada viaje', prefijo: 'S/' },
  { clave: 'tarifa_km', titulo: 'Precio por kilómetro', ayuda: 'Se suma por cada km del recorrido', prefijo: 'S/' },
  { clave: 'tarifa_minuto', titulo: 'Precio por minuto', ayuda: 'Se suma por cada minuto estimado de viaje', prefijo: 'S/' },
  { clave: 'tarifa_minima', titulo: 'Tarifa mínima', ayuda: 'Ningún viaje se cotiza por debajo de este monto', prefijo: 'S/' },
  { clave: 'garantia_viaje', titulo: 'Garantía del pasajero', ayuda: 'Lo que paga al pedir el taxi (se devuelve si nadie lo atiende)', prefijo: 'S/' },
  { clave: 'compensacion_conductor', titulo: 'Compensación al conductor', ayuda: 'Parte de la garantía que recibe si el pasajero cancela con el taxi en camino. El resto es de SafO', prefijo: 'S/' },
  { clave: 'radio_busqueda_km', titulo: 'Radio de búsqueda', ayuda: 'Distancia máxima para mostrar conductores cercanos', prefijo: 'km' },
]

export default function TarifasPage() {
  const { listo } = useAuthGuard()
  const [valores, setValores] = useState(null)
  const [originales, setOriginales] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [zonas, setZonas] = useState([])
  const [nueva, setNueva] = useState({ nombre: '', radio_km: '5', punto: null })
  const [borrando, setBorrando] = useState(null)
  const [ajuste, setAjuste] = useState(1)

  const cargar = useCallback(async () => {
    try {
      const [c, z] = await Promise.all([api.get('/api/admin/configuracion'), api.get('/api/zonas')])
      const v = {}
      CAMPOS.forEach(f => { v[f.clave] = String(c.data.vigentes[f.clave]) })
      setValores(v); setOriginales(v); setZonas(z.data)
    } catch {
      toast.error('Error cargando la configuración', { id: 'err-cfg' })
    }
  }, [])

  useEffect(() => { if (listo) cargar() }, [listo, cargar])

  const cambios = useMemo(() => valores && originales && CAMPOS.some(f => valores[f.clave] !== originales[f.clave]), [valores, originales])

  // Ejemplo en vivo con las tarifas escritas: viaje de 3 km y 10 minutos
  const ejemplo = useMemo(() => {
    if (!valores) return null
    const n = (k) => Number(valores[k]) || 0
    const subtotal = n('tarifa_base') + 3 * n('tarifa_km') + 10 * n('tarifa_minuto')
    const tarifa = Math.max(n('tarifa_minima'), subtotal)
    const garantia = n('garantia_viaje'), comp = Math.min(n('compensacion_conductor'), garantia)
    return { tarifa, garantia, comp, plataforma: garantia - comp }
  }, [valores])

  const guardar = async () => {
    setGuardando(true)
    try {
      const body = {}
      CAMPOS.forEach(f => { if (valores[f.clave] !== originales[f.clave]) body[f.clave] = valores[f.clave] })
      await api.put('/api/admin/configuracion', { valores: body })
      toast.success('Tarifas y comisiones guardadas')
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo guardar')
    } finally {
      setGuardando(false)
    }
  }

  const crearZona = async () => {
    if (!nueva.punto) return toast.error('Toca el mapa para elegir el centro de la zona')
    if (nueva.nombre.trim().length < 2) return toast.error('Ponle un nombre a la zona')
    try {
      await api.post('/api/admin/zonas', { nombre: nueva.nombre.trim(), lat: nueva.punto[0], lng: nueva.punto[1], radio_km: nueva.radio_km })
      toast.success('Zona creada')
      setNueva({ nombre: '', radio_km: '5', punto: null })
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo crear la zona')
    }
  }

  const alternar = async (z) => {
    try {
      await api.put(`/api/admin/zonas/${z.id}`, { activa: !z.activa })
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo actualizar')
    }
  }

  const eliminar = async (z) => {
    if (borrando !== z.id) { setBorrando(z.id); setTimeout(() => setBorrando(b => (b === z.id ? null : b)), 4000); return }
    try {
      await api.delete(`/api/admin/zonas/${z.id}`)
      toast.success('Zona eliminada')
      setBorrando(null)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo eliminar')
    }
  }

  const zonasMapa = useMemo(() => {
    const lista = [...zonas]
    if (nueva.punto) lista.push({ id: 'nueva', nombre: nueva.nombre || 'Nueva zona', lat: nueva.punto[0], lng: nueva.punto[1], radio_km: Number(nueva.radio_km) || 1, activa: true })
    return lista
  }, [zonas, nueva])

  if (!listo || !valores) return <div className="min-h-screen bg-white" />

  const entrada = 'w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#F4F6FA] text-sm font-semibold text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#0A66E0]/40'

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" />
      <AdminNavbar />
      <main className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-[#14213D]">Tarifas, comisiones y zonas</h1>
          <p className="text-sm text-[#6E6E73] mt-1">Los cambios se aplican de inmediato a las nuevas cotizaciones y solicitudes.</p>
        </div>

        {/* Tarifas */}
        <section className="tarjeta tarjeta-sombra p-5 sm:p-6">
          <h2 className="font-semibold text-[#14213D] mb-4"><FontAwesomeIcon icon={faMoneyBillWave} className="text-[#FFC21A] mr-2" />Tarifas y comisiones</h2>
          <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
            {CAMPOS.map(f => (
              <label key={f.clave} className="block">
                <span className="text-sm font-medium text-[#14213D]">{f.titulo}</span>
                <span className="relative block mt-1.5">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8A8F9C]">{f.prefijo}</span>
                  <input type="number" inputMode="decimal" step="0.05" min="0" value={valores[f.clave]}
                    onChange={e => setValores(v => ({ ...v, [f.clave]: e.target.value }))} className={entrada} />
                </span>
                <span className="block text-xs text-[#8A8F9C] mt-1">{f.ayuda}</span>
              </label>
            ))}
          </div>

          {ejemplo && (
            <div className="mt-5 rounded-xl bg-[#FFF6D9] px-4 py-3 text-sm text-[#5C4A00] grid sm:grid-cols-2 gap-1">
              <div>Un viaje de <b>3 km</b> y <b>10 min</b> se cotiza en <b>{soles(ejemplo.tarifa)}</b>.</div>
              <div>Si el pasajero cancela con el taxi en camino: conductor <b>{soles(ejemplo.comp)}</b> · SafO <b>{soles(ejemplo.plataforma)}</b>.</div>
            </div>
          )}

          <div className="mt-5 flex items-center justify-end gap-3">
            {cambios && <span className="text-xs text-[#B45309]">Tienes cambios sin guardar</span>}
            <button onClick={() => setValores(originales)} disabled={!cambios || guardando}
              className="px-4 py-2.5 rounded-xl bg-white border border-[#E6E8EF] text-sm font-medium text-[#6E6E73] disabled:opacity-40">Descartar</button>
            <button onClick={guardar} disabled={!cambios || guardando}
              className="px-5 py-2.5 rounded-xl bg-[#14213D] text-white text-sm font-semibold disabled:opacity-40">
              <FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />{guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </section>

        {/* Zonas */}
        <section className="tarjeta tarjeta-sombra p-5 sm:p-6">
          <h2 className="font-semibold text-[#14213D] mb-1"><FontAwesomeIcon icon={faMapLocationDot} className="text-[#0A66E0] mr-2" />Zonas de servicio</h2>
          <p className="text-sm text-[#6E6E73] mb-4">Solo se pueden pedir taxis desde dentro de una zona activa. Si no hay ninguna activa, no se restringe.</p>

          <div className="grid lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3 relative h-[340px] rounded-xl overflow-hidden border border-[#E6E8EF]">
              <MapaAdmin className="absolute inset-0" zonas={zonasMapa} marcador={nueva.punto} ajustarKey={ajuste}
                onClickMapa={(p) => setNueva(n => ({ ...n, punto: p }))} />
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-xl bg-[#F4F6FA] p-4 space-y-3">
                <div className="text-sm font-semibold text-[#14213D]">Nueva zona</div>
                <p className="text-xs text-[#6E6E73]">{nueva.punto ? `Centro: ${nueva.punto[0].toFixed(4)}, ${nueva.punto[1].toFixed(4)}` : 'Toca el mapa para elegir el centro.'}</p>
                <input value={nueva.nombre} onChange={e => setNueva(n => ({ ...n, nombre: e.target.value }))} placeholder="Nombre (ej. Amarilis)" maxLength={80}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0A66E0]/40" />
                <label className="flex items-center gap-3 text-sm text-[#4B4F5C]">
                  Radio
                  <input type="range" min="1" max="40" step="1" value={nueva.radio_km} onChange={e => setNueva(n => ({ ...n, radio_km: e.target.value }))} className="flex-1 accent-[#0A66E0]" />
                  <b className="w-14 text-right">{nueva.radio_km} km</b>
                </label>
                <button onClick={crearZona} className="w-full py-2.5 rounded-xl bg-[#0A66E0] text-white text-sm font-semibold">
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />Agregar zona
                </button>
              </div>

              <ul className="space-y-2">
                {zonas.map(z => (
                  <li key={z.id} className="flex items-center gap-3 rounded-xl border border-[#E6E8EF] px-3.5 py-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${z.activa ? 'bg-[#0A66E0]' : 'bg-[#C5C8D2]'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[#14213D] truncate">{z.nombre}</div>
                      <div className="text-xs text-[#8A8F9C]">Radio {Number(z.radio_km)} km · {z.activa ? 'Activa' : 'Desactivada'}</div>
                    </div>
                    <button onClick={() => alternar(z)} title={z.activa ? 'Desactivar' : 'Activar'} aria-label={z.activa ? 'Desactivar zona' : 'Activar zona'}
                      className="w-9 h-9 rounded-lg bg-[#F4F6FA] text-[#6E6E73]"><FontAwesomeIcon icon={z.activa ? faEye : faEyeSlash} /></button>
                    <button onClick={() => eliminar(z)} aria-label="Eliminar zona"
                      className={`h-9 rounded-lg text-sm font-medium ${borrando === z.id ? 'px-3 bg-[#D92D20] text-white' : 'w-9 bg-[#FCEAE9] text-[#D92D20]'}`}>
                      {borrando === z.id ? '¿Seguro?' : <FontAwesomeIcon icon={faTrash} />}
                    </button>
                  </li>
                ))}
                {zonas.length === 0 && <li className="text-sm text-[#8A8F9C]">Aún no hay zonas: se puede pedir taxi desde cualquier lugar.</li>}
              </ul>
              <button onClick={() => setAjuste(a => a + 1)} className="text-xs text-[#0A66E0] hover:underline">Centrar mapa en las zonas</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
