import Link from "next/link";
import { Tournament } from "@/lib/types";

interface Props {
  tournament: Tournament;
  showQR?: boolean;
}

export default function TournamentCard({ tournament, showQR = false }: Props) {
  const startsAt = tournament.starts_at
    ? new Date(tournament.starts_at).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-lg truncate">{tournament.name}</h3>
          {tournament.description && (
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{tournament.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            {startsAt && <span>📅 {startsAt}</span>}
            <span>👥 {tournament.participant_count} участников</span>
          </div>
        </div>

        {showQR && (
          <Link
            href={`/dashboard/tournaments/${tournament.id}`}
            className="flex-shrink-0 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium transition-colors"
          >
            QR-код
          </Link>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Создан: {new Date(tournament.created_at).toLocaleDateString("ru-RU")}
        </span>
        <Link
          href={`/dashboard/tournaments/${tournament.id}`}
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          Открыть →
        </Link>
      </div>
    </div>
  );
}
