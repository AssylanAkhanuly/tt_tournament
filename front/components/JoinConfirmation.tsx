"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Tournament } from "@/lib/types";

interface Props {
  tournament: Tournament;
  joinToken: string;
  alreadyJoined?: boolean;
}

export default function JoinConfirmation({ tournament, joinToken, alreadyJoined }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(alreadyJoined ?? false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setLoading(true);
    setError(null);
    try {
      await api.joinByToken(joinToken);
      setJoined(true);
    } catch {
      setError("Не удалось присоединиться. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  }

  if (joined) {
    return (
      <div className="text-center space-y-4">
        <div className="text-5xl">🏓</div>
        <h2 className="text-xl font-bold text-gray-900">Вы участник!</h2>
        <p className="text-gray-500">Вы успешно присоединились к турниру «{tournament.name}».</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
        >
          Перейти в кабинет
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
        <h2 className="text-lg font-bold text-gray-900">{tournament.name}</h2>
        {tournament.description && (
          <p className="text-gray-600 text-sm mt-1">{tournament.description}</p>
        )}
        <p className="text-sm text-gray-500 mt-2">👥 {tournament.participant_count} участников</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleJoin}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-lg transition-colors"
      >
        {loading ? "Присоединение..." : "Присоединиться к турниру"}
      </button>
    </div>
  );
}
