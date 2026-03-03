/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  // Enable compression for production
  compress: true,
  // Generate ETags for caching
  generateEtags: true,
  // Power the app with the React compiler (Next.js 14+)
  reactStrictMode: true,
}

module.exports = nextConfig
