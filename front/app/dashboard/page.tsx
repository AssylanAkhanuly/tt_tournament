import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/server-auth";
import DashboardClient from "./DashboardClient";
import TournamentsHomeClient from "./TournamentsHomeClient";

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

  // ── Club admin (not staff): go directly to their club page ────────────────
  if (user?.club_ids_admin?.length > 0) {
    redirect(`/dashboard/clubs/${user.club_ids_admin[0]}`);
  }

  // ── Player: show tournament listing ──────────────────────────────────────
  const [tournaments, clubs] = await Promise.all([
    fetch("/api/tournaments/"),
    fetch("/api/clubs/"),
  ]);
  return <TournamentsHomeClient tournaments={tournaments ?? []} clubs={clubs ?? []} />;
}
