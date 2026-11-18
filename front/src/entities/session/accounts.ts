/* Аккаунты, с которых входили на этом устройстве ✳ (11.09.2026) — карточки
   выбора на странице входа.

   Хранятся только имя, почта и id учётки: ни токенов, ни паролей. Переход по
   карточке в другой аккаунт — без пароля ✳ (19.11.2026, решение владельца
   продукта), пока у устройства жива его сессия (30 дней): токен лежит в
   httpOnly-куке `acct_<id>`, которую ставит сервер и не видят скрипты страницы
   (`switchAccount`). Нет такой сессии — карточка подставляет почту, пароль
   вводится как обычно.

   Список читается через `useSyncExternalStore`: на сервере он пуст, в браузере
   берётся из localStorage — разметка до гидратации совпадает, и эффект с
   setState для этого не нужен. */

import { useSyncExternalStore } from 'react';

import type { SessionUser } from './api';

export type KnownAccount = { email: string; name: string; id?: string };

const KEY = 'fnt.accounts';
const LIMIT = 5;
const EMPTY: KnownAccount[] = [];

let cache: KnownAccount[] | null = null;
const listeners = new Set<() => void>();

function read(): KnownAccount[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(raw)
      ? raw.filter((a): a is KnownAccount => typeof a?.email === 'string' && typeof a?.name === 'string')
      : EMPTY;
  } catch {
    return EMPTY;
  }
}

/** Список с этого устройства; последний вошедший — первым. */
export function knownAccounts(): KnownAccount[] {
  if (cache === null) cache = read();
  return cache;
}

export function rememberAccount(user: SessionUser): void {
  if (!user.email) return;
  try {
    const rest = knownAccounts().filter((a) => a.email !== user.email);
    const next = [{ email: user.email, name: user.name, id: user.id }, ...rest].slice(0, LIMIT);
    if (JSON.stringify(next) === JSON.stringify(knownAccounts())) return;
    localStorage.setItem(KEY, JSON.stringify(next));
    cache = next;
    listeners.forEach((l) => l());
  } catch {
    // Хранилище закрыто (приватное окно) — выбора аккаунтов просто не будет.
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function useKnownAccounts(): KnownAccount[] {
  return useSyncExternalStore(subscribe, knownAccounts, () => EMPTY);
}
