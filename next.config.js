/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // For Docker deployments
  serverExternalPackages: ['@prisma/client']
}

module.exports = nextConfig
