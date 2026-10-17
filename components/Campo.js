'use client'

// Campo de formulario con etiqueta. Vive fuera de las páginas a propósito: si se define
// dentro de un componente, React lo recrea en cada tecla y el input pierde el foco.
// options: ['A', 'B'] o [{ v: 'a', t: 'Texto' }]
export default function Campo({ label, campo, valor, onCambio, placeholder, type = 'text', maxLength, options, inputMode, opcional = false, ayuda, prefijo, autoComplete, min, max, mayusculas = false }) {
  const id = `c-${campo}`
  const etiqueta = <label htmlFor={id} className="f-etiqueta">{label}{opcional && <small>opcional</small>}</label>
  if (options) {
    return (
      <div className="f-campo">
        {etiqueta}
        <select id={id} value={valor} onChange={e => onCambio(campo, e.target.value)} className="f-input">
          {options.map(o => {
            const v = typeof o === 'string' ? o : o.v
            const t = typeof o === 'string' ? o : o.t
            return <option key={v} value={v}>{t}</option>
          })}
        </select>
        {ayuda && <span className="f-ayuda">{ayuda}</span>}
      </div>
    )
  }
  // En los campos numéricos se limpia primero (pegar «987 654 321» con espacios) y luego se recorta al largo máximo
  const numerico = inputMode === 'numeric'
  const cambiar = e => {
    let v = e.target.value
    if (numerico) v = v.replace(/\D/g, '').slice(0, maxLength || 99)
    else if (mayusculas) v = v.toUpperCase()
    onCambio(campo, v)
  }
  const largo = numerico ? undefined : maxLength
  return (
    <div className="f-campo">
      {etiqueta}
      {prefijo ? (
        <div className="f-grupo">
          <span className="f-prefijo" aria-hidden="true">{prefijo}</span>
          <input id={id} type={type} inputMode={inputMode} placeholder={placeholder} value={valor} maxLength={largo} autoComplete={autoComplete} onChange={cambiar} min={min} max={max} />
        </div>
      ) : (
        <input id={id} type={type} inputMode={inputMode} placeholder={placeholder} value={valor} maxLength={largo} autoComplete={autoComplete} onChange={cambiar} min={min} max={max} className="f-input" />
      )}
      {ayuda && <span className="f-ayuda">{ayuda}</span>}
    </div>
  )
}
