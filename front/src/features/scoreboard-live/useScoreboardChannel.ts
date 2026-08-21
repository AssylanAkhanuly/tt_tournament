'use client';

// Канал табло: состояние живёт в Django (одна строка на стол), обе стороны
// работают с ним по HTTP.
//
// Оверлей опрашивает счёт несколько раз в секунду. Это дёшево: пока `rev` не
// сдвинулся, сервер отвечает 304 без тела — браузер сам шлёт `If-None-Match`,
// потому что мы просим `cache: 'no-cache'` (не «не кэшируй», а «перепроверь»).
//
// Пульт пишет: локально применяет то же действие сразу (кнопки не ждут сети),
// а на сервер отправляет получившееся состояние вместе с `rev`, от которого
// отталкивался. Если другой пульт успел записать первым, сервер отвечает 409 —
// тогда переносим свой счёт на его версию и повторяем.
//
// Когда бэкенд переедет на ASGI ради уведомлений, опрос в `subscribe` меняется
// на SSE; всё остальное — ручки, состояние, пульт, плашка — остаётся как есть.

import { useCallback, useEffect, useRef, useState } from 'react';

import { boardUrl } from '@/entities/scoreboard/api';
import { reduce, type ScoreboardAction, type ScoreboardState } from '@/entities/scoreboard/model';

const OVERLAY_POLL_MS = 400; // задержка в эфире; за кодировщиком её не видно
const CONTROL_TICK_MS = 300; // как часто пульт досылает несохранённое
const CONTROL_POLL_MS = 2000; // пульт сам себе источник правды, опрашивает редко
const CONFLICT_RETRY_MS = 150;

async function loadBoard(key: string): Promise<ScoreboardState | null> {
  try {
    const response = await fetch(boardUrl(key), { cache: 'no-cache' });
    if (!response.ok) return null;
    return (await response.json()) as ScoreboardState;
  } catch {
    return null;
  }
}

type Channel = {
  state: ScoreboardState;
  /** Последний обмен с сервером удался (иначе в эфире висит старый счёт). */
  connected: boolean;
};

export type ScoreboardControl = Channel & {
  send: (action: ScoreboardAction) => void;
};

/** Только чтение — для плашки в эфире. */
export function useScoreboardMirror(initial: ScoreboardState): Channel {
  const [state, setState] = useState(initial);
  const [connected, setConnected] = useState(true);
  const revRef = useRef(initial.rev);

  useEffect(() => {
    let stopped = false;

    const tick = async () => {
      const next = await loadBoard(initial.key);
      if (stopped) return;
      setConnected(next !== null);
      if (next && next.rev >= revRef.current) {
        revRef.current = next.rev;
        setState(next);
      }
    };

    const timer = setInterval(tick, OVERLAY_POLL_MS);
    void tick();
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [initial.key]);

  return { state, connected };
}

/** Чтение и запись — для пульта. */
export function useScoreboardControl(initial: ScoreboardState): ScoreboardControl {
  const [state, setStateRaw] = useState(initial);
  const [connected, setConnected] = useState(true);

  // Состояние держим и в ref: обработчики и таймер должны видеть свежее
  // значение, не дожидаясь следующего рендера.
  const stateRef = useRef(initial);
  const dirty = useRef(false); // есть несохранённые изменения
  const inFlight = useRef(false); // запрос уже в пути
  const lastPoll = useRef(0);

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
        setConnected(true);
        return;
      }

      if (response.ok) {
        const saved = (await response.json()) as ScoreboardState;
        // Пока запрос шёл, оператор мог нажать ещё несколько раз. Эти нажатия
        // уже в stateRef, и ответ сервера их не содержит — берём из него только
        // версию, иначе очки теряются на быстрой серии.
        setState(dirty.current ? { ...stateRef.current, rev: saved.rev } : saved);
        setConnected(true);
      } else {
        setConnected(false);
      }
    } catch {
      dirty.current = true; // сеть отвалилась — повторим на следующем такте
      setConnected(false);
    } finally {
      inFlight.current = false;
    }
  }, [setState]);

  // Один таймер на всё: досылает несохранённое, а в простое изредка
  // перечитывает — вдруг счёт ведут с двух пультов.
  useEffect(() => {
    const timer = setInterval(async () => {
      if (inFlight.current) return;

      if (dirty.current) {
        setTimeout(() => void push(), CONFLICT_RETRY_MS);
        return;
      }

      if (Date.now() - lastPoll.current < CONTROL_POLL_MS) return;
      lastPoll.current = Date.now();

      const next = await loadBoard(stateRef.current.key);
      setConnected(next !== null);
      if (next && !dirty.current && !inFlight.current && next.rev > stateRef.current.rev) {
        setState(next);
      }
    }, CONTROL_TICK_MS);

    return () => clearInterval(timer);
  }, [push, setState]);

  const send = useCallback(
    (action: ScoreboardAction) => {
      setState(reduce(stateRef.current, action)); // сразу, не дожидаясь сети
      dirty.current = true;
      void push();
    },
    [push, setState],
  );

  return { state, connected, send };
}
