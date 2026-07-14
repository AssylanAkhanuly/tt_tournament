import type { NextConfig } from "next";

// Proxy /api/* through the Next.js frontend to the real backend.
// This makes the JWT auth cookies FIRST-PARTY to the frontend domain, so:
//  - they work cross-browser (incl. Safari, which blocks third-party cookies)
//  - Server Components can read them via cookies() and forward them
// The backend URL comes from NEXT_PUBLIC_API_URL (set per environment).
const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  // Django requires trailing slashes; don't let Next strip them before the
  // rewrite proxies the request (otherwise POSTs 500 on the backend).
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      // Trailing slash is required by Django. Next's :path* capture drops it,
      // so match the slash explicitly and re-add it on the destination.
      { source: "/api/:path*/", destination: `${BACKEND}/api/:path*/` },
      { source: "/api/:path*", destination: `${BACKEND}/api/:path*` },
    ];
  },
};

export default nextConfig;
