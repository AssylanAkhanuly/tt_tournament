"use client";

import { useState } from "react";
import { Tournament, User } from "@/lib/types";
import TournamentCard from "@/components/TournamentCard";
import TournamentForm from "@/components/TournamentForm";

interface Props {
  user: User;
  allTournaments: Tournament[];
  myTournaments: Tournament[];
}

export default function DashboardClient({ user, allTournaments, myTournaments }: Props) {
  const [tournaments, setTournaments] = useState<Tournament[]>(allTournaments);
  const [showForm, setShowForm] = useState(false);

  function handleCreated(t: Tournament) {
    setTournaments((prev) => [t, ...prev]);
    setShowForm(false);
  }

  // Admin view
  if (user.is_staff) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Мои турниры</h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
          >
            {showForm ? "Отмена" : "+ Создать турнир"}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Новый турнир</h2>
            <TournamentForm onCreated={handleCreated} />
          </div>
        )}

        {tournaments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🏓</p>
            <p>Турниров пока нет. Создайте первый!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} showQR />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Player view
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Мои турниры</h1>

      {myTournaments.length === 0 ? (
        <p className="text-gray-500 text-sm">Вы ещё не присоединились ни к одному турниру.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {myTournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Все турниры</h2>
        {tournaments.length === 0 ? (
          <p className="text-gray-400 text-sm">Нет доступных турниров.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
