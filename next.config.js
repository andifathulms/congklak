/**
 * Static export for GitHub Pages. PRD §14.
 * basePath must match the repository name, or asset URLs break on Pages.
 * Set BASE_PATH='' locally to serve from the root.
 */
const basePath = process.env.BASE_PATH ?? '/lumbung'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  reactStrictMode: true,
}

module.exports = nextConfig
