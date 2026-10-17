import { ESTILO_VIGENCIA } from '@/lib/documentos'

// Etiqueta de color según el estado de un vencimiento: vigente · por vencer · vencido · sin dato
export default function InsigniaVigencia({ estado }) {
  const e = ESTILO_VIGENCIA[estado] || ESTILO_VIGENCIA.sin_dato
  return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap ${e.clase}`}>{e.texto}</span>
}
