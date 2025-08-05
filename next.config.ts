import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during build for deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checking during build for deployment
    ignoreBuildErrors: true,
  },
}

export default nextConfig
