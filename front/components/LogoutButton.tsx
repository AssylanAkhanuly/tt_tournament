"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await api.logout();
    } finally {
      router.push("/login");
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
    >
      Выйти
    </button>
  );
}
