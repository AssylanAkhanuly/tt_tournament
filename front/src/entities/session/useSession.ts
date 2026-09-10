'use client';

/* Хук сессии: один источник на всю страницу.

   Шапка и карточка спортсмена спрашивают «кто вошёл» одновременно. Отдельный
   запрос из каждого компонента дал бы два ответа, которые на время могут
   разойтись: в шапке «Выйти», а в карточке ещё нет кнопок председателя. Поэтому
   состояние общее (`useSyncExternalStore`), и запрос за ним уходит один раз. */

import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { fetchMe, loginByEmail, logout, ROLE_GSK_CHAIRMAN, type SessionUser } from './api';

type State = { user: SessionUser | null; loaded: boolean };

let state: State = { user: null, loaded: false };
const listeners = new Set<() => void>();

const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// На сервере сессии нет вовсе: куки читает браузер, а страница рендерится как
// для гостя и уточняется после гидратации.
const SERVER: State = { user: null, loaded: false };

let inflight: Promise<void> | null = null;

function load(): Promise<void> {
  if (inflight) return inflight;
  inflight = fetchMe()
    .then((user) => set({ user, loaded: true }))
    .catch(() => set({ user: null, loaded: true }))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useSession() {
  const s = useSyncExternalStore(subscribe, () => state, () => SERVER);

  useEffect(() => {
    if (!state.loaded) void load();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const user = await loginByEmail(email, password);
    set({ user, loaded: true });
    return user;
  }, []);

  const signOut = useCallback(async () => {
    await logout().catch(() => undefined);
    set({ user: null, loaded: true });
  }, []);

  return {
    user: s.user,
    loading: !s.loaded,
    /** По роли экран решает, что показать. Права всё равно проверяет сервер. */
    isGskChairman: !!s.user?.roles.some((r) => r.kind === ROLE_GSK_CHAIRMAN),
    signIn,
    signOut,
    reload: load,
  };
}
