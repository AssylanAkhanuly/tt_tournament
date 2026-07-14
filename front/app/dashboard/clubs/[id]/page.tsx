import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { serverFetch } from "@/lib/server-auth";
import ClubDetailClient from "./ClubDetailClient";

interface Props {
  params:       Promise<{ id: string }>;
  searchParams: Promise<{ view?: string; tab?: string }>;
}

export default async function ClubPage({ params, searchParams }: Props) {
  const { id }   = await params;
  const { view, tab } = await searchParams;

  const cookieStore  = await cookies();
  const cookieHeader = cookieStore.toString();
  const fetch = (path: string) => serverFetch(path, cookieHeader);

  const [user, club, tournaments, tables] = await Promise.all([
    fetch("/api/auth/me/"),
    fetch(`/api/clubs/${id}/`),
    fetch(`/api/tournaments/?club_id=${id}`),
    fetch(`/api/clubs/${id}/tables/`),
  ]);

  if (!club) notFound();

  // Players (non-admin) are not allowed to browse the club detail page.
  const isAdmin = user?.is_staff || user?.club_ids_admin?.includes(id);
  if (!isAdmin) redirect("/dashboard");

  const initialView = view === "calendar" ? "calendar" : "list";
  const initialTab  = (["tournaments", "tables", "admins", "settings"].includes(tab ?? "")
    ? tab
    : "tournaments") as "tournaments" | "tables" | "admins" | "settings";

  return (
    <ClubDetailClient
      user={user}
      club={club}
      initialTournaments={tournaments ?? []}
      initialTables={tables ?? []}
      initialView={initialView}
      initialTab={initialTab}
    />
  );
}
