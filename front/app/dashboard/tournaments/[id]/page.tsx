import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { serverFetch } from "@/lib/server-auth";
import TournamentDetailClient from "./TournamentDetailClient";

interface Props { params: Promise<{ id: string }> }

export default async function TournamentDetailPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const base = process.env.NEXT_PUBLIC_API_URL;
  const cookieHeader = cookieStore.toString();
  const fetch = (path: string) => serverFetch(path, cookieHeader);

  const [user, tournament, participants] = await Promise.all([
    fetch("/api/auth/me/"),
    fetch(`/api/tournaments/${id}/`),
    fetch(`/api/tournaments/${id}/participants/`),
  ]);

  if (!tournament) notFound();

  // Fetch matches, tables, and groups server-side so the bracket/group stage
  // render on first paint (no empty flash while the client fetches).
  const [matchesRes, tablesRes, groupsRes] = await Promise.all([
    globalThis.fetch(`${base}/api/tournaments/${id}/matches/`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }),
    globalThis.fetch(`${base}/api/tournaments/${id}/tables/`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }),
    globalThis.fetch(`${base}/api/tournaments/${id}/groups/`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }),
  ]);

  const initialMatches = matchesRes.ok ? await matchesRes.json() : [];
  const tournamentTables = tablesRes.ok ? await tablesRes.json() : [];
  const initialGroups = groupsRes.ok ? await groupsRes.json() : [];

  return (
    <TournamentDetailClient
      user={user}
      tournament={tournament}
      participants={participants ?? []}
      initialMatches={initialMatches}
      tournamentTables={tournamentTables}
      initialGroups={initialGroups}
    />
  );
}
