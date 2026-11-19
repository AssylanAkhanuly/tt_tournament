import { useCallback, useEffect, useState } from 'react';

/** Запрос с состоянием «грузится / данные / ошибка» и перечитыванием.
    `key` — когда перезапрашивать (id, отбор); `reload()` — перечитать то же. */
export function useLoad<T>(run: () => Promise<T>, key: string) {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<{ data: T | null; error: string | null }>({ data: null, error: null });
  useEffect(() => {
    let live = true;
    run()
      .then((data) => live && setState({ data, error: null }))
      .catch((e: Error) => live && setState({ data: null, error: e.message }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);
  return { ...state, reload: useCallback(() => setTick((t) => t + 1), []) };
}
