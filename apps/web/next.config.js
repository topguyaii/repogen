/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.image2url.com',
        pathname: '/r2/**',
      },
    ],
  },
}

module.exports = nextConfig
