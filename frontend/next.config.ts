import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-bcf1c007022c4efb921568837ba2d575.r2.dev',
        port: '',
        pathname: '/**',
      },

      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001', 
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'bruinhottake.brandonle.dev',
        port: '',
        pathname: '/**',
      },
  ],

  },
  
};

export default nextConfig;
