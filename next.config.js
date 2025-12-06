/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint enabled - warnings won't fail build, errors will
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
