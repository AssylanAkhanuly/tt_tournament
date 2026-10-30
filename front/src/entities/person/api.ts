/* Профиль человека ✳ (28.10.2026) — транспорт и модель. Единственное место,
   где фронт ходит в `/api/auth/people/`. Телефон — персональные данные:
   сервер отдаёт профиль только председателю ГСК и администратору федерации. */

import { useCallback, useEffect, useState } from 'react';

export type PersonRole = {
  kind: string;
  label: string;
  scope: string;
  /** У роли с областью «турнир» — какой турнир. */
  tournament: { id: string; name: string } | null;
};

/** `phone` — null, если у учётки вместо номера служебная метка. */
export type Person = { id: string; name: string; email: string | null; phone: string | null; roles: PersonRole[] };

export async function fetchPerson(id: string): Promise<Person> {
  const res = await fetch(`/api/auth/people/${id}/`, { credentials: 'include' });
  if (!res.ok) throw new Error('Профиль не загрузился (' + res.status + ')');
  return (await res.json()) as Person;
}

export function usePerson(id: string) {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<{ data: Person | null; error: string | null; at: string } | null>(null);
  const at = id + '#' + tick;

  useEffect(() => {
    let live = true;
    fetchPerson(id)
      .then((data) => live && setState({ data, error: null, at }))
      .catch((e: Error) => live && setState({ data: null, error: e.message, at }));
    return () => {
      live = false;
    };
  }, [id, at]);

  return {
    data: state?.data ?? null,
    error: state?.error ?? null,
    loading: state?.at !== at,
    reload: useCallback(() => setTick((t) => t + 1), []),
  };
}
