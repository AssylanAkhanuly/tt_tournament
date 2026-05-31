"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light";

const THEME_KEY = "tt_theme_mode";
// Other components (FloatingTabBar, TournamentCalendar, TournamentDetailClient)
// already listen for this event to recolor themselves, so we keep emitting it.
export const THEME_EVENT = "tt_theme_change";

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = mode;
  document.body.classList.toggle("tt-theme-light", mode === "light");
}

/**
 * Shared light/dark theme state. The control now lives in profile settings, but
 * any component can read/toggle the theme through this hook — setting it applies
 * the DOM change, persists to localStorage, and broadcasts `tt_theme_change` so
 * every other instance (and the legacy listeners) stays in sync.
 */
export function useThemeMode() {
  const [theme, setThemeState] = useState<ThemeMode>("dark");

  // Initialise from storage and apply on mount.
  useEffect(() => {
    const stored: ThemeMode = localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
    setThemeState(stored);
    applyTheme(stored);
  }, []);

  // Stay in sync when the theme is changed elsewhere.
  useEffect(() => {
    const onChange = (e: Event) => {
      const mode = (e as CustomEvent).detail as ThemeMode;
      if (mode === "light" || mode === "dark") setThemeState(mode);
    };
    window.addEventListener(THEME_EVENT, onChange);
    return () => window.removeEventListener(THEME_EVENT, onChange);
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem(THEME_KEY, mode);
    applyTheme(mode);
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: mode }));
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: ThemeMode = prev === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
      window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: next }));
      return next;
    });
  }, []);

  return { theme, setTheme, toggle };
}
