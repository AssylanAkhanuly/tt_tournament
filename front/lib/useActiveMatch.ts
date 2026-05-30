"use client";

import { useEffect, useState } from "react";
import { api, ActiveMatch } from "./api";

const POLL_MS = 20000;

/** Polls the user's current in-progress match so Home/nav can stay focused on it. */
export function useActiveMatch(enabled: boolean): ActiveMatch | null {
  const [match, setMatch] = useState<ActiveMatch | null>(null);

  useEffect(() => {
    if (!enabled) {
      setMatch(null);
      return;
    }
    let alive = true;
    const load = () =>
      api.getMyActiveMatch()
        .then((r) => { if (alive) setMatch(r.active_match); })
        .catch(() => { /* keep last state on error */ });
    load();
    const id = setInterval(load, POLL_MS);
    return () => { alive = false; clearInterval(id); };
  }, [enabled]);

  return match;
}
