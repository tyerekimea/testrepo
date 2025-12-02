/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    'https://9000-firebase-studio-1761198320704.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev',
    // It is good practice to add the other potential ports you might use too:
    'https://9003-firebase-studio-1761198320704.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev',
    'https://9002-firebase-studio-1761198320704.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      // Used by Genkit
      'uglify-js': false,
      '@babel/core': false,
      'node-gyp': false,
      'node-pre-gyp': false,
      'mock-aws-s3': false,
      'aws-sdk': false,
      'nock': false,
    };
    return config;
  }
};

// Use module.exports for .js files instead of export default
module.exports = nextConfig;
