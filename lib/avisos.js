// Avisos del navegador para el conductor: sonido, vibración y notificación del sistema.
// Todo es opcional: si el navegador no lo permite, simplemente no pasa nada.
let audio = null

export const pitar = () => {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    audio = audio || new AC()
    if (audio.state === 'suspended') audio.resume()
    const tono = (frec, inicio, dur) => {
      const osc = audio.createOscillator(), gan = audio.createGain()
      osc.type = 'sine'; osc.frequency.value = frec
      gan.gain.setValueAtTime(0.0001, audio.currentTime + inicio)
      gan.gain.exponentialRampToValueAtTime(0.35, audio.currentTime + inicio + 0.02)
      gan.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + inicio + dur)
      osc.connect(gan).connect(audio.destination)
      osc.start(audio.currentTime + inicio); osc.stop(audio.currentTime + inicio + dur + 0.05)
    }
    tono(880, 0, 0.18); tono(1175, 0.22, 0.18); tono(880, 0.44, 0.18); tono(1175, 0.66, 0.3)
  } catch { /* sin sonido */ }
}

export const vibrar = (patron = [250, 120, 250, 120, 400]) => {
  try { navigator.vibrate?.(patron) } catch { /* sin vibración */ }
}

export const pedirPermisoNotificaciones = () => {
  try {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {})
  } catch { /* sin notificaciones */ }
}

export const notificar = (titulo, cuerpo) => {
  try {
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) new Notification(titulo, { body: cuerpo })
  } catch { /* sin notificaciones */ }
}
