/** @type {import('next').NextConfig} */
const { execSync } = require('child_process');

let gitSha = 'unknown';
let gitShaFull = 'unknown';
try {
  gitSha = execSync('git rev-parse --short HEAD').toString().trim();
  gitShaFull = execSync('git rev-parse HEAD').toString().trim();
} catch (_) {
  // not a git repo at build time (e.g. some CI envs)
}

const buildTime = new Date().toISOString();

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    styledComponents: true,
  },
  images: {
    domains: ['isjkdbmfxpxuuloqosib.supabase.co'],
  },
  env: {
    NEXT_PUBLIC_GIT_SHA: gitSha,
    NEXT_PUBLIC_GIT_SHA_FULL: gitShaFull,
    NEXT_PUBLIC_BUILD_TIME: buildTime,
  },
};

module.exports = nextConfig;
