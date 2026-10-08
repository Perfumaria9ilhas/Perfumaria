import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.76"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }] },
      { source: "/api/admin/:path*", headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }] },
      { source: "/admin/sw.js", headers: [{ key: "Service-Worker-Allowed", value: "/admin" }, { key: "Cache-Control", value: "no-store" }, { key: "Content-Type", value: "application/javascript; charset=utf-8" }] },
    ];
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
