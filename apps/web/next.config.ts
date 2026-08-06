import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@umrolink/ui'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
  allowedDevOrigins: ['barokah.umrolink.test', 'umrolink.test'],
};

export default nextConfig;
