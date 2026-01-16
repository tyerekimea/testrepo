
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Add allowed development origins to fix cross-origin issues in preview.
    allowedDevOrigins: [
      "*.firebase.studio",
      "*.cloudworkstations.dev",
      "localhost:9003",
      "*.app.github.dev",
      "*.github.dev",
    ],
    serverActions: {
      // This remains for server action specific origins if needed,
      // but allowedDevOrigins handles the dev server requests.
      allowedOrigins: [
        "*.firebase.studio",
        "*.cloudworkstations.dev",
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
