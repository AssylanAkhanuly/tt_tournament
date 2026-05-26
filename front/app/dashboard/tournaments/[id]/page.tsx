import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import dynamic from "next/dynamic";
import ParticipantList from "@/components/ParticipantList";
import Link from "next/link";

// QRCodeDisplay uses window.location.origin — load client-only
const QRCodeDisplay = dynamic(() => import("@/components/QRCodeDisplay"), { ssr: false });

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

  const startsAt = tournament.starts_at
    ? new Date(tournament.starts_at).toLocaleDateString("ru-RU", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-8">
      {/* Back */}
      <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
        ← Назад к турнирам
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{tournament.name}</h1>
        {tournament.description && (
          <p className="text-gray-500 mt-2">{tournament.description}</p>
        )}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
          {startsAt && <span>📅 {startsAt}</span>}
          <span>👥 {tournament.participant_count} участников</span>
          <span>Создан: {new Date(tournament.created_at).toLocaleDateString("ru-RU")}</span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* QR code — admins only */}
        {user?.is_staff && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">QR-код для вступления</h2>
            <QRCodeDisplay joinToken={tournament.join_token} />
          </div>
        )}

        {/* Participants */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            Участники ({participants?.length ?? 0})
          </h2>
          <ParticipantList participants={participants ?? []} />
        </div>
      </div>
    </div>
  );
}
