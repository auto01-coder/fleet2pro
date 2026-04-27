/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disabilita webpack cache per evitare problemi con Node 24
  webpack: (config, { isServer }) => {
    // Fix crypto per Node 24+
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: false,
    }
    return config
  },
}

module.exports = nextConfig
