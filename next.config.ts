import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverActions: {
    bodySizeLimit: '10mb', // Increase limit to 10MB for image uploads
  },
  experimental: {
    serverComponentsExternalPackages: ['sqlite3'],
  },
};

export default nextConfig;
