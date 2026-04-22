/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = { 
      ...config.resolve.fallback,
      fs: false,
      path: false,
      stream: false,
      zlib: false,
      // Add these for PDF.js
      canvas: false,
      worker_threads: false,
      child_process: false
    };
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['pdfjs-dist', 'mammoth', 'xlsx'],
    // Add this if using Option 2
    serverActions: true,
  }
};

module.exports = nextConfig;