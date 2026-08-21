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
// Соединение обязано пережить турнирный день, а не десять минут, поэтому здесь
// три страховки:
//   1. Пересоздание потока. `EventSource` сам повторяет только сетевой обрыв; на
//      ответ с ошибкой (502 при выкладке бэкенда) он закрывается насовсем — и
//      без этого эфир замер бы до конца трансляции.
//   2. Сторож тишины. Сервер шлёт `ping` раз в три секунды; если несколько
//      подряд не дошло, соединение мертво, даже когда браузер считает иначе
//      (так бывает после сна планшета или обрыва в NAT).
//   3. Запасной опрос, если поток не поднимается вовсе (буферизующий прокси,
//      фильтр в сети зала). Из него раз в минуту пробуем вернуться на поток.

import { useCallback, useEffect, useRef, useState } from 'react';

import { boardStreamUrl, boardUrl } from '@/entities/scoreboard/api';
import { reduce, type ScoreboardAction, type ScoreboardState } from '@/entities/scoreboard/model';

// Сервер шлёт ping раз в три секунды, поэтому тишина — единственный надёжный
// признак: три пропущенных подряд означают, что соединения нет, что бы там ни
// думал браузер. Сначала пробуем поднять поток заново, и лишь если тишина
// держится вдвое дольше — уходим на опрос.
const SILENCE_MS = 9000;
const GIVE_UP_MS = SILENCE_MS * 2;
const RECONNECT_MS = 1000; // пауза перед пересозданием потока
const GUARD_TICK_MS = 3000; // как часто сторож смотрит на признаки жизни
const FALLBACK_POLL_MS = 1000; // опрос запасного пути
const STREAM_RETRY_MS = 60000; // из опроса раз в минуту пробуем снова поток
const RETRY_MS = 1000; // как часто пульт досылает несохранённое

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
    let reconnect: ReturnType<typeof setTimeout> | null = null;
    let lastFrameAt = Date.now(); // когда последний раз слышали сервер
    let lastConnectAt = 0;
    let pollingSince = 0;

    const stopPolling = () => {
      if (poll) clearInterval(poll);
      poll = null;
    };

    const pollOnce = async () => {
      const next = await loadBoard(key);
      if (stopped || !poll) return;
      setConnected(next !== null);
      if (next) applyRef.current(next);
    };

    const startPolling = () => {
      if (stopped || poll) return;
      source?.close();
      source = null;
      pollingSince = Date.now();
      poll = setInterval(pollOnce, FALLBACK_POLL_MS);
      void pollOnce();
    };

    const connect = () => {
      if (stopped) return;
      source?.close();
      lastConnectAt = Date.now();

      const opened = new EventSource(boardStreamUrl(key));
      source = opened;

      const alive = () => {
        lastFrameAt = Date.now();
        stopPolling(); // поток ожил — опрос больше не нужен
        setConnected(true);
      };

      opened.onmessage = (event) => {
        alive();
        try {
          applyRef.current(JSON.parse(event.data) as ScoreboardState);
        } catch {
          // битый кадр пропускаем, следующий придёт целым
        }
      };
      opened.addEventListener('ping', alive);

      opened.onerror = () => {
        setConnected(false);
        // Штатный обрыв браузер повторяет сам (readyState = CONNECTING).
        // CLOSED значит, что он сдался — дальше наша забота.
        if (opened.readyState === EventSource.CLOSED) scheduleReconnect();
      };
    };

    const scheduleReconnect = () => {
      if (stopped || reconnect) return;
      reconnect = setTimeout(() => {
        reconnect = null;
        connect();
      }, RECONNECT_MS);
    };

    const guard = () => {
      if (stopped) return;

      const silence = Date.now() - lastFrameAt;

      if (poll) {
        // Сидим на запасном пути — периодически проверяем, не починился ли поток.
        if (Date.now() - pollingSince > STREAM_RETRY_MS) {
          pollingSince = Date.now();
          connect(); // опрос не гасим, пока поток не докажет, что работает
        }
        return;
      }

      if (silence > GIVE_UP_MS) {
        setConnected(false);
        startPolling(); // поток так и не заговорил — эфир важнее транспорта
        return;
      }

      // Тишина, но ещё есть надежда: поднимаем поток заново, не чаще раза в
      // тот же срок, чтобы не устроить шторм переподключений.
      if (silence > SILENCE_MS && Date.now() - lastConnectAt > SILENCE_MS) {
        setConnected(false);
        connect();
      }
    };

    const guardTimer = setInterval(guard, GUARD_TICK_MS);
    // Планшет спал — проверяем соединение сразу, не дожидаясь такта.
    const onVisible = () => {
      if (document.visibilityState === 'visible') guard();
    };
    document.addEventListener('visibilitychange', onVisible);

    connect();

    return () => {
      stopped = true;
      clearInterval(guardTimer);
      document.removeEventListener('visibilitychange', onVisible);
      if (reconnect) clearTimeout(reconnect);
      stopPolling();
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
