import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Cache static assets aggressively
  async headers() {
    return [
      {
        // Static files - cache 1 year
        source: '/(.*\\.(?:jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot))',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'CDN-Cache-Control', value: 'public, max-age=31536000' },
          { key: 'Vercel-CDN-Cache-Control', value: 'public, max-age=31536000' },
        ],
      },
      {
        // JS/CSS chunks - cache 1 year (Next.js hashes filenames)
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // API routes - no cache (dynamic data)
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        // Pages - stale-while-revalidate
        source: '/((?!api).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ]
  },
}

export default nextConfig
