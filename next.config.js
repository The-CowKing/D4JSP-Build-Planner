/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/builder',
  assetPrefix: '/builder',
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    styledComponents: true,
  },
  images: {
    domains: ['isjkdbmfxpxuuloqosib.supabase.co'],
    unoptimized: true,
  },
};

module.exports = nextConfig;
