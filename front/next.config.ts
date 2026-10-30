import type { NextConfig } from "next";

// Proxy /api/* through the Next.js frontend to the real backend.
// This makes the JWT auth cookies FIRST-PARTY to the frontend domain, so:
//  - they work cross-browser (incl. Safari, which blocks third-party cookies)
//  - Server Components can read them via cookies() and forward them
// The backend URL comes from NEXT_PUBLIC_API_URL (set per environment).
// Local default is 127.0.0.1, not localhost: Node resolves localhost to ::1
// first, Django's runserver listens on IPv4 only, and the proxy then fails
// intermittently with ECONNREFUSED ::1:8000 (500s and stuck logins in e2e).
const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  // No Next.js badge in dev: it sits on top of the scoreboard overlays.
  devIndicators: false,
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
  // Routes are English since 10.09.2026 (product owner's decision). The old
  // transliterated paths were already shared, so they redirect; the query
  // string (e.g. /vhod?next=…) is carried over by Next.
  async redirects() {
    return [
      { source: "/reyting/:id", destination: "/rating/:id", permanent: true },
      { source: "/reyting", destination: "/rating", permanent: true },
      { source: "/vhod", destination: "/login", permanent: true },
      { source: "/setka", destination: "/bracket", permanent: true },
      // «Протоколы» became «Турниры» on 11.09.2026; «Турниры» were removed from
      // the ГСК chairman on 28.10.2026 — all tournaments live in the calendar.
      { source: "/rating/protocols/:path*", destination: "/calendar", permanent: true },
      { source: "/rating/tournaments/:path*", destination: "/calendar", permanent: true },
      // The tournament page lives in each role's cabinet since 30.10.2026
      // (product owner's decision): /dashboard/tournaments/<id>,
      // /gsk/tournaments/<id>, /referee/tournaments/<id>. The ГСК chairman's
      // old /calendar/<id> pages moved to /gsk; /tournaments/<id> is a share
      // link that sends the viewer into their own cabinet (a page, not here).
      { source: "/calendar/:id/:section", destination: "/gsk/tournaments/:id/:section", permanent: true },
      { source: "/calendar/:id", destination: "/gsk/tournaments/:id", permanent: true },
    ];
  },
};

export default nextConfig;
