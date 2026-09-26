import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
