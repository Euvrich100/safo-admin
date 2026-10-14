import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://safo-backend.onrender.com'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

// Agregar token automáticamente a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('safo_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si el token expira, redirigir al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Un 401 en /api/auth/* es "contraseña o código incorrecto": se muestra el
    // error en la propia pantalla. En cualquier otra ruta significa sesión vencida.
    const esAuth = String(error.config?.url || '').includes('/api/auth/')
    if (error.response?.status === 401 && !esAuth) {
      localStorage.removeItem('safo_token')
      localStorage.removeItem('safo_usuario')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api