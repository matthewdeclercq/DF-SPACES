/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration for Next.js 15
  experimental: {
    // Remove any experimental features that might cause issues
  },
  // Ensure proper routing
  trailingSlash: false,
  // Enable strict mode for better debugging
  reactStrictMode: true,
}

module.exports = nextConfig 