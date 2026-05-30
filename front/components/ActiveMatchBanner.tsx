"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { ActiveMatch } from "@/lib/api";

export default function ActiveMatchBanner({ match }: { match: ActiveMatch }) {
  return (
    <Link
      href={`/dashboard/tournaments/${match.tournament_id}`}
      className="block mb-4 rounded-2xl overflow-hidden border border-blue-500/30
                 bg-gradient-to-r from-blue-600/25 to-cyan-500/10 hover:from-blue-600/35 transition-all active:scale-[.99]"
    >
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-blue-500/25 flex items-center justify-center shrink-0">
          <Zap size={18} className="text-blue-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-blue-300 uppercase tracking-wide">Ваш матч идёт</p>
          <p className="text-[14px] font-semibold text-white truncate">
            {match.table_number ? `Стол ${match.table_number} · ` : ""}{match.tournament_name}
          </p>
          {match.opponent_name && (
            <p className="text-[12px] text-white/55 truncate">против {match.opponent_name}</p>
          )}
        </div>
        <span className="text-[12px] font-bold text-blue-300 shrink-0">Открыть →</span>
      </div>
    </Link>
  );
}
