// Formatos compartidos de fechas y montos (zona horaria de Perú).
// Las fechas del servidor son TIMESTAMP sin zona (guardadas en UTC): se interpretan como UTC.
export const aFecha = (valor) => {
  if (!valor) return null
  const s = String(valor)
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + 'Z')
}

export const hace = (valor) => {
  const f = aFecha(valor)
  if (!f) return ''
  const seg = Math.max(0, Math.round((Date.now() - f.getTime()) / 1000))
  if (seg < 60) return 'hace instantes'
  const min = Math.round(seg / 60)
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.round(h / 24)
  return `hace ${d} día${d === 1 ? '' : 's'}`
}

export const fechaHora = (valor) => {
  const f = aFecha(valor)
  if (!f) return ''
  return f.toLocaleString('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const soles = (n) => `S/ ${Number(n || 0).toFixed(2)}`
