'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Protege páginas del panel: redirige a /login si no hay sesión,
// y expone el usuario guardado localmente.
export default function useAuthGuard() {
  const router = useRouter()
  const [usuario, setUsuario] = useState(null)
  const [listo, setListo] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('safo_token')
    const u = localStorage.getItem('safo_usuario')
    if (!token) {
      router.push('/login')
      return
    }
    if (u) setUsuario(JSON.parse(u))
    setListo(true)
  }, [router])

  return { usuario, listo }
}
