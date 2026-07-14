import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth is checked client-side in app/dashboard/layout.tsx
// (HttpOnly cookies from the Django backend are not visible to the
//  Next.js Edge middleware when running cross-origin in production)
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = { matcher: [] };
