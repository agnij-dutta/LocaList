import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase limit to 10MB for image uploads
    },
  },
  serverExternalPackages: ['sqlite3'],
};

export default nextConfig;
