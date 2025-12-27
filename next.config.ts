import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.fallback = { fs: false };

    return config;
  },
  output: 'export',  // This tells Next.js to generate static files
  images: {
    unoptimized: true,  // Disable image optimization for static export
  },
  redirects: async () => [
    {
      source: '/',
      destination: '/player',
      permanent: true,
    },
  ]
};

export default nextConfig;
