// Tipos de vehículo con los que se puede conducir en SafO y los dos servicios que ve el pasajero.
//   Servicio «Taxi» → atienden taxi, carro y bajaj.
//   Servicio «Moto» → atiende la moto lineal.
// Es el único lugar donde se definen: para agregar un tipo nuevo se suma aquí y en el backend (SERVICIOS).
import { faTaxi, faCarSide, faMotorcycle } from '@fortawesome/free-solid-svg-icons'

// Bajaj (motocarro de tres ruedas): FontAwesome no trae uno, se dibuja a mano con el mismo formato.
export const faBajaj = {
  prefix: 'fas', iconName: 'bajaj',
  icon: [512, 512, [], 'e900',
    // cabina con techo curvo y dos ventanas abiertas
    'M40 356V176C40 118 84 80 140 80H292C318 80 336 94 344 118L364 190V356Z' +
    'M84 140V212H190V140ZM214 140V212H326L304 140Z' +
    // trompa delantera con faro, manubrio y la rueda delantera única
    'M372 200H404C426 200 440 214 444 238L452 304V372H372Z' +
    'M432 238a14 14 0 1 0 0 28a14 14 0 1 0 0-28Z' +
    'M376 200L388 148H426V166H400L394 200Z' +
    'M130 354a46 46 0 1 1 0 92a46 46 0 1 1 0-92ZM130 378a22 22 0 1 0 0 44a22 22 0 1 0 0-44Z' +
    'M418 370a38 38 0 1 1 0 76a38 38 0 1 1 0-76ZM418 390a18 18 0 1 0 0 36a18 18 0 1 0 0-36Z'],
}

export const VEHICULOS = {
  taxi: {
    k: 'taxi', t: 'Taxi', servicio: 'taxi', icono: faTaxi,
    detalle: 'Auto de servicio de taxi',
    foto: 'Foto del taxi', marca: 'Toyota', modelo: 'Yaris',
    licencias: ['A-IIa', 'A-IIb', 'A-IIIa', 'A-IIIb', 'A-IIIc'], licenciaDefecto: 'A-IIb',
  },
  carro: {
    k: 'carro', t: 'Carro', servicio: 'taxi', icono: faCarSide,
    detalle: 'Auto particular que presta servicio',
    foto: 'Foto del carro', marca: 'Hyundai', modelo: 'Accent',
    licencias: ['A-IIa', 'A-IIb', 'A-IIIa', 'A-IIIb', 'A-IIIc'], licenciaDefecto: 'A-IIb',
  },
  bajaj: {
    k: 'bajaj', t: 'Bajaj', servicio: 'taxi', icono: faBajaj,
    detalle: 'Mototaxi de tres ruedas',
    foto: 'Foto del bajaj', marca: 'Bajaj', modelo: 'RE',
    licencias: ['B-IIc'], licenciaDefecto: 'B-IIc',
  },
  moto_lineal: {
    k: 'moto_lineal', t: 'Moto lineal', servicio: 'moto', icono: faMotorcycle,
    detalle: 'Moto de dos ruedas',
    foto: 'Foto de la moto', marca: 'Honda', modelo: 'XR 150',
    licencias: ['B-IIb'], licenciaDefecto: 'B-IIb',
  },
}
export const TIPOS_VEHICULO = Object.values(VEHICULOS)

// Lo que el pasajero elige al pedir
export const SERVICIOS = {
  taxi: { k: 'taxi', t: 'Taxi', sub: 'Taxi, carro o bajaj', icono: faTaxi, conductor: 'taxi', elige: 'Elige tu taxi', vacio: 'taxis' },
  moto: { k: 'moto', t: 'Moto', sub: 'Moto lineal', icono: faMotorcycle, conductor: 'moto', elige: 'Elige tu moto', vacio: 'motos' },
}
export const LISTA_SERVICIOS = Object.values(SERVICIOS)

export const nombreVehiculo = (tipo) => VEHICULOS[tipo]?.t || 'Taxi'
export const iconoVehiculo = (tipo) => VEHICULOS[tipo]?.icono || faTaxi
export const servicioDe = (tipo) => VEHICULOS[tipo]?.servicio || 'taxi'

// Dibujo SVG de un icono de FontAwesome para los marcadores del mapa (Leaflet)
export const svgDe = (icono) => {
  const [ancho, alto, , , trazo] = icono.icon
  return `<svg viewBox="0 0 ${ancho} ${alto}" fill="currentColor" aria-hidden="true"><path d="${trazo}"/></svg>`
}

// Tarifa de respaldo para la moto (la oficial la calcula el servidor)
export const TARIFA_MOTO_POR_DEFECTO = { base: 2, km: 0.5, minuto: 0.1, minima: 3, combustible_km: 0.165 }
