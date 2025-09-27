/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Use internal URL when running inside Docker container to reach backend service
    const backendBase = process.env.NEXT_INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendBase}/api/v1/:path*`,
      },
    ];
  },
  reactStrictMode: true,
};

module.exports = nextConfig
