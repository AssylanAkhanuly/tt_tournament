"use client";

import { useEffect, useState } from "react";
import { User } from "@/lib/types";
import { api } from "@/lib/api";
import LogoutButton from "@/components/LogoutButton";
import SpinCoachLogo from "@/components/SpinCoachLogo";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch(() => { window.location.href = "/login"; })
      .finally(() => setReady(true));
  }, []);

  if (!ready || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <SpinCoachLogo variant="light" size="sm" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.name}
              {user.is_staff && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  Админ
                </span>
              )}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
