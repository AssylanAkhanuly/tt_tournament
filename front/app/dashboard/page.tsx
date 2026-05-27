import { cookies } from "next/headers";
import { serverFetch } from "@/lib/server-auth";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const fetch = (path: string) => serverFetch(path, cookieHeader);

  const [user, tournaments] = await Promise.all([
    fetch("/api/auth/me/"),
    fetch("/api/tournaments/"),
  ]);

  const myTournaments = user?.is_staff ? null : await fetch("/api/tournaments/my/");

  return (
    <DashboardClient
      user={user}
      allTournaments={tournaments ?? []}
      myTournaments={myTournaments ?? []}
    />
  );
}
