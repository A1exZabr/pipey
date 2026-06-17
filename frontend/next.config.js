/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Use 'export' for Capacitor builds, 'standalone' for server deployment
  output: process.env.BUILD_MODE === 'capacitor' ? 'export' : 'standalone',
  images: {
    domains: ['localhost'],
    unoptimized: process.env.BUILD_MODE === 'capacitor', // Required for static export
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Trailing slash for better Capacitor compatibility
  trailingSlash: process.env.BUILD_MODE === 'capacitor',
}

module.exports = nextConfig
