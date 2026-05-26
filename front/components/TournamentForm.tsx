"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { ApiError, Tournament } from "@/lib/types";

interface Props {
  onCreated: (tournament: Tournament) => void;
}

export default function TournamentForm({ onCreated }: Props) {
  const [form, setForm] = useState({ name: "", description: "", starts_at: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        ...(form.starts_at ? { starts_at: new Date(form.starts_at).toISOString() } : {}),
      };
      const tournament = await api.createTournament(payload);
      onCreated(tournament);
      setForm({ name: "", description: "", starts_at: "" });
    } catch (err) {
      const e = err as ApiError;
      setError(e.detail as string ?? "Не удалось создать турнир.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Название турнира *</label>
        <input
          type="text"
          value={form.name}
          onChange={update("name")}
          placeholder="Чемпионат Казахстана 2026"
          required
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
        <textarea
          value={form.description}
          onChange={update("description")}
          placeholder="Открытый турнир по настольному теннису..."
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Дата начала</label>
        <input
          type="datetime-local"
          value={form.starts_at}
          onChange={update("starts_at")}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold transition-colors"
      >
        {loading ? "Создание..." : "Создать турнир"}
      </button>
    </form>
  );
}
