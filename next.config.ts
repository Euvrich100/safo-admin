/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  // El export estático no tiene servidor para optimizar imágenes en runtime
  images: { unoptimized: true }
}

module.exports = nextConfig