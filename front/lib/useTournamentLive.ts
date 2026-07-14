"use client";

import { useEffect, useRef } from "react";
import { api, TournamentState } from "./api";

const DEFAULT_INTERVAL_MS = 3500;

/**
 * Keeps a tournament's roster and scores live without a page refresh by polling
 * GET /api/tournaments/<id>/state/. This replaces SSE, which can't work on the
 * single-worker backend (one stream would block the only request thread).
 *
 * Each poll sends the last revision it saw; the server replies "unchanged"
 * cheaply, so `onUpdate` fires only when something actually changed. Polling
 * pauses while the tab is hidden and resumes immediately when it's focused
 * again, so a phone left on the standings page costs nothing in the background.
 */
export function useTournamentLive(opts: {
  tournamentId: string;
  enabled: boolean;
  onUpdate: (state: TournamentState) => void;
  intervalMs?: number;
}) {
  const { tournamentId, enabled, onUpdate, intervalMs = DEFAULT_INTERVAL_MS } = opts;

  // Keep the callback in a ref so a new inline onUpdate each render doesn't
  // tear down and restart the polling loop.
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const revRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;
    // Fresh subscription: forget any prior revision so the first poll pulls a
    // full snapshot rather than a "changed:false".
    revRef.current = undefined;

    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      if (!stopped) timer = setTimeout(tick, intervalMs);
    };

    const tick = async () => {
      if (stopped) return;
      if (typeof document !== "undefined" && document.hidden) {
        schedule(); // idle while hidden; cheap no-op until visible again
        return;
      }
      try {
        const state = await api.getTournamentState(tournamentId, revRef.current);
        if (stopped) return;
        revRef.current = state.rev;
        if (state.changed) onUpdateRef.current(state);
      } catch {
        /* transient network/server error — keep last state, retry next tick */
      }
      schedule();
    };

    const onVisible = () => {
      if (stopped || document.hidden) return;
      if (timer) clearTimeout(timer);
      tick(); // catch up the moment the tab is focused
    };

    tick(); // immediate first poll
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [tournamentId, enabled, intervalMs]);
}
