import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Uncomment for mobile build (static export)
  // output: 'export',
  // images: {
  //   unoptimized: true,
  // },
  // trailingSlash: true,
  experimental: {
    serverActions: {
      allowedOrigins: [
        "*.firebase.studio",
        "localhost:9003",
        "*.app.github.dev",
        "*.github.dev",
      ],
    },
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;