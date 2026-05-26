import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const base = process.env.NEXT_PUBLIC_API_URL;
  const cookieHeader = cookieStore.toString();

  async function fetchJSON(path: string) {
    const res = await fetch(`${base}${path}`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (res.status === 401) redirect("/login");
    if (!res.ok) return null;
    return res.json();
  }

  const [user, tournaments] = await Promise.all([
    fetchJSON("/api/auth/me/"),
    fetchJSON("/api/tournaments/"),
  ]);

  const myTournaments = user?.is_staff ? null : await fetchJSON("/api/tournaments/my/");

  return (
    <DashboardClient
      user={user}
      allTournaments={tournaments ?? []}
      myTournaments={myTournaments ?? []}
    />
  );
}
