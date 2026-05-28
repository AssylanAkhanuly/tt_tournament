"use client";

import { api } from "@/lib/api";

export default function LogoutButton() {
  async function handleLogout() {
    try { await api.logout(); } finally { window.location.href = "/login"; }
  }

  return (
    <button
      onClick={handleLogout}
      className="text-[13px] font-medium text-white/50 hover:text-white/80 transition-colors"
    >
      Выйти
    </button>
  );
}
