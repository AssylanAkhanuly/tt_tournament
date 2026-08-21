'use client';

// Канал табло: состояние живёт в Django (одна строка на стол).
//
// Читают обе стороны — пульт и плашка в эфире — через одно постоянное
// соединение (SSE). Никаких повторяющихся запросов: сервер сам следит за
// ревизией строки и присылает только то, что изменилось.
//
// Пишет только пульт, обычным PUT. Локально действие применяется сразу (кнопки
// не ждут сети), на сервер уходит получившееся состояние вместе с `rev`, от
// которого отталкивались. Если другой пульт успел записать первым, приходит 409
// — тогда переносим свой счёт на его версию и повторяем.
//
// Запасной путь: если первый кадр потока не пришёл за несколько секунд, значит
// соединение где-то буферизуется (прокси, фильтр в сети зала). Тогда молча
// переходим на опрос — в эфире счёт важнее красоты транспорта.

import { useCallback, useEffect, useRef, useState } from 'react';

import { boardStreamUrl, boardUrl } from '@/entities/scoreboard/api';
import { reduce, type ScoreboardAction, type ScoreboardState } from '@/entities/scoreboard/model';

const STREAM_WATCHDOG_MS = 5000; // столько ждём первый кадр, прежде чем сдаться
const FALLBACK_POLL_MS = 1000; // опрос запасного пути
const RETRY_MS = 1000; // как часто досылаем несохранённое

async function loadBoard(key: string): Promise<ScoreboardState | null> {
  try {
    const response = await fetch(boardUrl(key), { cache: 'no-cache' });
    if (!response.ok) return null;
    return (await response.json()) as ScoreboardState;
  } catch {
    return null;
  }
}

/** Подписка на изменения доски. Возвращает признак живого соединения. */
function useSubscription(key: string, apply: (next: ScoreboardState) => void): boolean {
  const [connected, setConnected] = useState(false);
  const applyRef = useRef(apply);

  // Держим свежий обработчик, не пересоздавая соединение на каждый рендер.
  useEffect(() => {
    applyRef.current = apply;
  });

  useEffect(() => {
    let stopped = false;
    let source: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let watchdog: ReturnType<typeof setTimeout> | null = null;

    const fallBackToPolling = () => {
      if (stopped || poll) return;
      source?.close();
      source = null;

      const tick = async () => {
        const next = await loadBoard(key);
        if (stopped) return;
        setConnected(next !== null);
        if (next) applyRef.current(next);
      };
      poll = setInterval(tick, FALLBACK_POLL_MS);
      void tick();
    };

    source = new EventSource(boardStreamUrl(key));
    watchdog = setTimeout(fallBackToPolling, STREAM_WATCHDOG_MS);

    source.onmessage = (event) => {
      if (watchdog) {
        clearTimeout(watchdog);
        watchdog = null;
      }
      setConnected(true);
      try {
        applyRef.current(JSON.parse(event.data) as ScoreboardState);
      } catch {
        // битый кадр пропускаем, следующий придёт целым
      }
    };

    // EventSource переподключается сам; наше дело — показать оператору, что
    // связи сейчас нет и в эфире висит старый счёт.
    source.onerror = () => setConnected(false);

    return () => {
      stopped = true;
      if (watchdog) clearTimeout(watchdog);
      if (poll) clearInterval(poll);
      source?.close();
    };
  }, [key]);

  return connected;
}

type Channel = {
  state: ScoreboardState;
  /** Связь с сервером жива (иначе в эфире висит старый счёт). */
  connected: boolean;
};

export type ScoreboardControl = Channel & {
  send: (action: ScoreboardAction) => void;
};

/** Только чтение — для плашки в эфире. */
export function useScoreboardMirror(initial: ScoreboardState): Channel {
  const [state, setState] = useState(initial);
  const revRef = useRef(initial.rev);

  const connected = useSubscription(initial.key, (next) => {
    if (next.rev < revRef.current) return; // устаревший кадр
    revRef.current = next.rev;
    setState(next);
  });

  return { state, connected };
}

/** Чтение и запись — для пульта. */
export function useScoreboardControl(initial: ScoreboardState): ScoreboardControl {
  const [state, setStateRaw] = useState(initial);
  const [writeOk, setWriteOk] = useState(true);

  // Состояние держим и в ref: обработчики и таймер должны видеть свежее
  // значение, не дожидаясь следующего рендера.
  const stateRef = useRef(initial);
  const dirty = useRef(false); // есть несохранённые изменения
  const inFlight = useRef(false); // запрос уже в пути

  const setState = useCallback((next: ScoreboardState) => {
    stateRef.current = next;
    setStateRaw(next);
  }, []);

  const push = useCallback(async () => {
    if (inFlight.current || !dirty.current) return;
    inFlight.current = true;
    dirty.current = false;

    try {
      const response = await fetch(boardUrl(stateRef.current.key), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stateRef.current),
      });

      if (response.status === 409) {
        // Другой пульт записал раньше. Счёт у нас свежее — переносим его на
        // версию сервера и отправляем ещё раз.
        const current = (await response.json()) as ScoreboardState;
        setState({ ...stateRef.current, rev: current.rev });
        dirty.current = true;
        setWriteOk(true);
        return;
      }

      if (response.ok) {
        const saved = (await response.json()) as ScoreboardState;
        // Пока запрос шёл, оператор мог нажать ещё несколько раз. Эти нажатия
        // уже в stateRef, и ответ сервера их не содержит — берём из него только
        // версию, иначе очки теряются на быстрой серии.
        setState(dirty.current ? { ...stateRef.current, rev: saved.rev } : saved);
        setWriteOk(true);
      } else {
        setWriteOk(false);
      }
    } catch {
      dirty.current = true; // сеть отвалилась — повторим на следующем такте
      setWriteOk(false);
    } finally {
      inFlight.current = false;
    }
  }, [setState]);

  const streamOk = useSubscription(initial.key, (next) => {
    // Свои несохранённые правки важнее того, что пришло с сервера.
    if (dirty.current || inFlight.current) return;
    if (next.rev < stateRef.current.rev) return;
    setState(next);
  });

  // Досылаем то, что не ушло с первого раза (обрыв сети, конфликт версий).
  useEffect(() => {
    const timer = setInterval(() => {
      if (dirty.current && !inFlight.current) void push();
    }, RETRY_MS);
    return () => clearInterval(timer);
  }, [push]);

  const send = useCallback(
    (action: ScoreboardAction) => {
      setState(reduce(stateRef.current, action)); // сразу, не дожидаясь сети
      dirty.current = true;
      void push();
    },
    [push, setState],
  );

  return { state, connected: streamOk && writeOk, send };
}
