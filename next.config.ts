import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "montocosmetictools.com",
      },
      {
        protocol: "https",
        hostname: "www.montocosmetictools.com",
      },
      {
        protocol: "https",
        hostname: "pontohairclub.com",
      },
      {
        protocol: "https",
        hostname: "www.pontohairclub.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "rubyrose.com.co",
      },
      {
        protocol: "https",
        hostname: "www.rubyrose.com.co",
      },
      {
        protocol: "https",
        hostname: "cocopinkstore.com",
      },
      {
        protocol: "https",
        hostname: "www.cocopinkstore.com",
      },
    ],
  },
};

export default nextConfig;
