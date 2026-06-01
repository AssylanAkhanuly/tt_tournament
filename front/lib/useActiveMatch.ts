"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ActiveMatch } from "./api";

const POLL_MS = 10000;

/** Polls the user's current match (in-progress OR awaiting score confirmation)
 *  so the nav and the global prompt can stay focused on it. Returns the match
 *  plus a `refresh` to re-poll immediately after an action (confirm/reject). */
export function useActiveMatch(enabled: boolean): { match: ActiveMatch | null; refresh: () => void } {
  const [match, setMatch] = useState<ActiveMatch | null>(null);
  const aliveRef = useRef(true);

  const refresh = useCallback(() => {
    if (!enabled) return;
    api.getMyActiveMatch()
      .then((r) => { if (aliveRef.current) setMatch(r.active_match); })
      .catch(() => { /* keep last state on error */ });
  }, [enabled]);

  useEffect(() => {
    aliveRef.current = true;
    if (!enabled) { setMatch(null); return; }
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => { aliveRef.current = false; clearInterval(id); };
  }, [enabled, refresh]);

  return { match, refresh };
}
