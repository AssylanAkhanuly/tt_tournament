'use client';

/* Правки рейтинга на карточке спортсмена — только председателю ГСК.

   Два действия, оба по Положению и оба с обязательным основанием:
   - неявка без уважительной причины (п. 15.4–15.6) — последствие применяется,
     только когда обстоятельства установлены (п. 15.13), поэтому это решение
     человека, а не автоматика;
   - исправление технической ошибки (п. 21.5–21.6) — прежние записи остаются,
     разница дописывается отдельной строкой.

   Размер штрафа экран не считает: его считает сервер и присылает в ответе.
   Таблица п. 15.4–15.6 здесь только подписью — иначе правило жило бы в двух
   местах. */

import { useState, type FormEvent } from 'react';

import { num2, signed2 } from '@/entities/rating';
import { Panel } from '@/shared/kit/app';
import { useRatingActions } from './useRatingActions';

const FIELD =
  'w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-[13px] outline-none ' +
  'focus:border-blue-500';
const SUBMIT =
  'self-start rounded-lg bg-blue-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-blue-700 ' +
  'disabled:opacity-50';

export function ChairmanPanel({
  userId,
  current,
  onDone,
}: {
  userId: string;
  /** Текущее значение — чтобы исправлять, видя, от чего. */
  current: number;
  onDone: () => void;
}) {
  const { noShow, correct, busy, error, last } = useRatingActions(userId, onDone);
  const [reason, setReason] = useState('');
  const [value, setValue] = useState('');
  const [fixReason, setFixReason] = useState('');

  async function onNoShow(event: FormEvent) {
    event.preventDefault();
    if (await noShow(reason.trim())) setReason('');
  }

  async function onCorrect(event: FormEvent) {
    event.preventDefault();
    const n = Number(value.replace(',', '.'));
    if (!Number.isFinite(n)) return;
    if (await correct(n, fixReason.trim())) {
      setValue('');
      setFixReason('');
    }
  }

  return (
    <Panel
      title="Действия председателя ГСК"
      sub="Каждое действие пишется в историю отдельной строкой — с основанием и автором"
    >
      <div className="grid gap-5 md:grid-cols-2" data-testid="chairman-panel">
        <form onSubmit={onNoShow} className="flex flex-col gap-2">
          <h4 className="text-[13.5px] font-semibold">Неявка без уважительной причины</h4>
          <p className="text-[12px] leading-snug text-neutral-500">
            Первая −0,20, повторная −0,30, далее −0,50 (п. 15.4–15.6). Только когда обстоятельства
            установлены и причина признана неуважительной (п. 15.13).
          </p>
          <textarea
            aria-label="Основание неявки"
            data-testid="noshow-reason"
            required
            rows={2}
            placeholder="Соревнование, дата, почему причина неуважительная"
            className={FIELD}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button type="submit" data-testid="noshow-submit" disabled={busy !== null || !reason.trim()} className={SUBMIT}>
            {busy === 'no_show' ? 'Записываю…' : 'Зафиксировать неявку'}
          </button>
        </form>

        <form onSubmit={onCorrect} className="flex flex-col gap-2">
          <h4 className="text-[13.5px] font-semibold">Исправить значение</h4>
          <p className="text-[12px] leading-snug text-neutral-500">
            Техническая ошибка (п. 21.5). Сейчас <b className="tabular-nums">{num2(current)}</b>; прежние записи
            остаются, разница дописывается строкой (п. 21.6).
          </p>
          <input
            type="text"
            inputMode="decimal"
            aria-label="Исправленное значение"
            data-testid="correction-value"
            required
            placeholder="Например, 40,15"
            className={FIELD + ' tabular-nums'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <textarea
            aria-label="Основание исправления"
            data-testid="correction-reason"
            required
            rows={2}
            placeholder="В чём ошибка и откуда верное значение"
            className={FIELD}
            value={fixReason}
            onChange={(e) => setFixReason(e.target.value)}
          />
          <button
            type="submit"
            data-testid="correction-submit"
            disabled={busy !== null || !value.trim() || !fixReason.trim()}
            className={SUBMIT}
          >
            {busy === 'correction' ? 'Записываю…' : 'Исправить'}
          </button>
        </form>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-[13px] text-red-600" data-testid="chairman-error">
          {error}
        </p>
      )}
      {last && !error && (
        <p className="mt-3 text-[13px] text-green-700" data-testid="chairman-result">
          Записано: {last.kindLabel.replace(/\s*\(.*\)$/, '')}, {signed2(last.delta)} → {num2(last.after)}
        </p>
      )}
    </Panel>
  );
}
