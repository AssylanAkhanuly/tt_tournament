/**
 * Server-side helper for auth-aware data fetching in Server Components.
 *
 * Auth cookies are now first-party to the frontend domain (API calls are
 * proxied via next.config rewrites), so cookies() in the calling page contains
 * the JWT and we can forward it to the backend here.
 *
 * NOTE: a Server Component may NOT mutate cookies (only a Server Action or
 * Route Handler can). So on 401 we simply redirect to /login — we must not call
 * cookies().delete() here, or Next throws "Cookies can only be modified in a
 * Server Action or Route Handler".
 */
import { redirect } from "next/navigation";

/** Call from any Server Component that needs to make authenticated API calls. */
export async function serverFetch(path: string, cookieHeader: string) {
  const base = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${base}${path}`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });

  if (res.status === 401) {
    redirect("/login");
  }

  if (!res.ok) return null;
  return res.json();
}
