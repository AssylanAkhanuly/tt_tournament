import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { User } from "@/lib/types";
import JoinPageClient from "./JoinPageClient";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function JoinPage({ params }: Props) {
  const { token } = await params;
  const cookieStore = await cookies();
  const base = process.env.NEXT_PUBLIC_API_URL;
  const cookieHeader = cookieStore.toString();

  // Fetch tournament by join token (public)
  const tournamentRes = await fetch(`${base}/api/tournaments/join/${token}/`, {
    cache: "no-store",
  });
  if (tournamentRes.status === 404) notFound();
  if (!tournamentRes.ok) notFound();
  const tournament = await tournamentRes.json();

  // Try to get current user (may fail if not logged in)
  let user: User | null = null;
  let alreadyJoined = false;

  const meRes = await fetch(`${base}/api/auth/me/`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (meRes.ok) {
    user = await meRes.json();

    // Check if already a participant
    const participantsRes = await fetch(`${base}/api/tournaments/${tournament.id}/participants/`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (participantsRes.ok) {
      const participants = await participantsRes.json();
      alreadyJoined = participants.some((p: { user: { id: string } }) => p.user.id === user!.id);
    }
  }

  return (
    <JoinPageClient
      tournament={tournament}
      joinToken={token}
      user={user}
      alreadyJoined={alreadyJoined}
    />
  );
}
