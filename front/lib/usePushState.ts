"use client";

import { useCallback, useEffect, useState } from "react";
import { currentPushState, disablePush, enablePush, pushSupported, PushState } from "./push";

/**
 * Shared push-notification state: current permission/subscription status plus
 * enable/disable actions. Drives the first-visit prompt, the settings toggle,
 * and the "not enabled" warning badge.
 */
export function usePushState() {
  const [state, setState] = useState<PushState>("default");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!pushSupported()) { setState("unsupported"); return; }
    try { setState(await currentPushState()); } catch { /* keep last */ }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Re-check on focus — the user may have changed the browser permission.
  useEffect(() => {
    const onVis = () => { if (!document.hidden) refresh(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  const enable = useCallback(async () => {
    setBusy(true);
    try { await enablePush(); await refresh(); } finally { setBusy(false); }
  }, [refresh]);

  const disable = useCallback(async () => {
    setBusy(true);
    try { await disablePush(); await refresh(); } finally { setBusy(false); }
  }, [refresh]);

  return {
    state,
    busy,
    supported: state !== "unsupported",
    enabled: state === "subscribed",
    blocked: state === "denied",
    /** Supported, not blocked, and not yet subscribed — i.e. one tap away. */
    needsEnable: state === "default" || state === "unsubscribed",
    /** Supported but not currently receiving — drives the warning badge. */
    needsAttention: state === "default" || state === "unsubscribed" || state === "denied",
    enable,
    disable,
    refresh,
  };
}
