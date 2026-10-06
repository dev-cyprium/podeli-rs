import type { NextConfig } from "next";

const localStorage =
  process.env.NODE_ENV === "development" &&
  process.env.CONVEX_DEPLOYMENT?.startsWith("local:")
    ? new URL("/api/storage/**", process.env.NEXT_PUBLIC_CONVEX_URL!)
    : null;

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: Boolean(localStorage),
    remotePatterns: [
      ...(localStorage ? [localStorage] : []),
      {
        protocol: "https",
        hostname: "**.clerk.accounts.dev",
      },
      {
        protocol: "https",
        hostname: "**.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
};

export default nextConfig;
