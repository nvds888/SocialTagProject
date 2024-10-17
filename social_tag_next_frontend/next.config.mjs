/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*', // Proxy to Backend
      },
    ];
  },
  // Add TypeScript configuration to ignore build errors
  typescript: {
    ignoreBuildErrors: true,
  },
  // Add any other necessary configurations here
};

export default nextConfig;
