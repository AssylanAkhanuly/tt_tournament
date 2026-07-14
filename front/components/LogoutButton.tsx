"use client";

import { api } from "@/lib/api";
import { useLang } from "@/lib/i18n";

export default function LogoutButton() {
  const { t } = useLang();
  async function handleLogout() {
    try { await api.logout(); } finally { window.location.href = "/login"; }
  }

  return (
    <button
      onClick={handleLogout}
      className="text-[13px] font-medium text-white/50 hover:text-white/80 transition-colors"
    >
      {t.logout}
    </button>
  );
}
