import { cookies } from "next/headers";
import { serverFetch } from "@/lib/server-auth";
import DashboardClient from "./DashboardClient";
import ClubAdminDashboardClient from "./ClubAdminDashboardClient";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const fetch = (path: string) => serverFetch(path, cookieHeader);

  const user = await fetch("/api/auth/me/");

  // ── Superuser: see all clubs ──────────────────────────────────────────────
  if (user?.is_staff) {
    const clubs = await fetch("/api/clubs/");
    return <DashboardClient user={user} clubs={clubs ?? []} />;
  }

  // ── Club admin (not staff): see only their club's tournaments ─────────────
  if (user?.club_ids_admin?.length > 0) {
    const myClubs = await fetch("/api/clubs/my/");
    // Fetch tournaments for all their clubs in parallel
    const base = process.env.NEXT_PUBLIC_API_URL;
    const tournamentFetches = (myClubs ?? []).map((club: { id: string }) =>
      globalThis.fetch(`${base}/api/tournaments/?club_id=${club.id}`, {
        headers: { Cookie: cookieHeader },
        cache: "no-store",
      }).then((r) => r.ok ? r.json() : [])
    );
    const tournamentArrays = await Promise.all(tournamentFetches);
    const tournaments = tournamentArrays.flat();
    return (
      <ClubAdminDashboardClient
        user={user}
        clubs={myClubs ?? []}
        tournaments={tournaments}
      />
    );
  }

  // ── Player: browse clubs ──────────────────────────────────────────────────
  const clubs = await fetch("/api/clubs/");
  return <DashboardClient user={user} clubs={clubs ?? []} />;
}
