import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import TournamentDetailClient from "./TournamentDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TournamentDetailPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const base = process.env.NEXT_PUBLIC_API_URL;
  const cookieHeader = cookieStore.toString();

  async function fetchJSON(path: string) {
    const res = await fetch(`${base}${path}`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (res.status === 401) redirect("/login");
    if (res.status === 404) notFound();
    if (!res.ok) return null;
    return res.json();
  }

  const [user, tournament, participants] = await Promise.all([
    fetchJSON("/api/auth/me/"),
    fetchJSON(`/api/tournaments/${id}/`),
    fetchJSON(`/api/tournaments/${id}/participants/`),
  ]);

  if (!tournament) notFound();

  // Fetch matches (empty array if tournament hasn't started)
  const matchesRes = await fetch(`${base}/api/tournaments/${id}/matches/`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  const initialMatches = matchesRes.ok ? await matchesRes.json() : [];

  return (
    <TournamentDetailClient
      user={user}
      tournament={tournament}
      participants={participants ?? []}
      initialMatches={initialMatches}
    />
  );
}
