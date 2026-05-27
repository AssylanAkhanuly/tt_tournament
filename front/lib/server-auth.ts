/**
 * Server-side helpers for auth-aware data fetching in Server Components.
 *
 * When a request returns 401 we must:
 *   1. Delete the stale access/refresh cookies so middleware stops looping.
 *   2. Redirect to /login.
 *
 * Next.js App Router lets us write cookies from a Server Component via the
 * `cookies()` API before the response is committed (i.e., before redirect).
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/** Call from any Server Component that needs to make authenticated API calls. */
export async function serverFetch(path: string, cookieHeader: string) {
  const base = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${base}${path}`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });

  if (res.status === 401) {
    // Clear stale JWT cookies so middleware doesn't loop
    const store = await cookies();
    store.delete("access_token");
    store.delete("refresh_token");
    redirect("/login");
  }

  if (!res.ok) return null;
  return res.json();
}
