import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.76"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    localPatterns: [
      {
        pathname: "/uploads/**",
      },
      {
        pathname: "/placeholders/**",
      },
      {
        pathname: "/api/upload-image",
      },
    ],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
