'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Antes esta página preguntaba "¿pasajero o conductor?". Ya no hace falta:
// cada botón de la web lleva directo a su registro. Si alguien llega aquí
// por un enlace viejo, lo mandamos al registro de pasajero.
export default function RegistroRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/registro/pasajero') }, [router])
  return null
}
