import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: "standalone",  // Add this line
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
