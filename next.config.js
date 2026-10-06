/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
