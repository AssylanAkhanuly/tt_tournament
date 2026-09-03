/* Аттестация: вопрос и выбор ответа ✳ (30.08.2026).

   Комментарий федерации (09.2026) требует ОНЛАЙН-аттестации: судья проходит
   тест в системе, а не приносит скан протокола. Значит нужны две вещи, которых
   в дизайн-системе не было: вопрос с вариантами ответа (его видит судья) и тот
   же вопрос в разборе — с отмеченным верным вариантом (его видит председатель
   в базе и судья после теста).

   Компонент один на оба случая: если бы вопрос рисовали отдельно для теста и
   отдельно для базы, формулировка и варианты разъехались бы на первой правке.
   Отличается режим (`mode`), а не разметка. */

import type { ReactNode } from 'react';
import { Check, X } from 'lucide-react';

/** Вариант ответа. Про `right` знает только система — судья во время теста нет. */
export type Answer = { id: string; t: string; right?: boolean };

export type Question = {
  id: string;
  /** Тема базы: по ней вопросы и пополняются. */
  topic?: string;
  /** Сам вопрос — правила настольного тенниса формулируются длинно. */
  t: string;
  answers: Answer[];
  /** Пояснение с пунктом правил: показывается в разборе, а не во время теста. */
  why?: string;
};

/** Что показывает карточка вопроса:
    - `test` — судья отвечает: варианты кликабельны, верный не подсвечен;
    - `review` — разбор: виден верный вариант и ответ судьи;
    - `bank` — вопрос в базе у председателя: верный отмечен, отвечать нечего. */
export type QuizMode = 'test' | 'review' | 'bank';

const LETTER = ['А', 'Б', 'В', 'Г', 'Д', 'Е'];

/** Один вариант ответа. Буква слева — не украшение: судья читает вопрос
    глазами, а нажимает не глядя, и буква держит крупную область нажатия. */
function Option({
  i,
  a,
  mode,
  picked,
  onPick,
}: {
  i: number;
  a: Answer;
  mode: QuizMode;
  picked?: boolean;
  onPick?: () => void;
}) {
  const show = mode !== 'test';
  const right = show && a.right;
  const wrongPick = show && picked && !a.right;
  const tone = right
    ? 'border-green-300 bg-green-50'
    : wrongPick
    ? 'border-red-300 bg-red-50'
    : picked
    ? 'border-blue-400 bg-blue-50'
    : 'border-neutral-200 bg-white hover:border-neutral-300';
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={picked}
      className={'flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left ' + tone}
    >
      <span
        className={
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ' +
          (right
            ? 'bg-green-600 text-white'
            : wrongPick
            ? 'bg-red-600 text-white'
            : picked
            ? 'bg-blue-600 text-white'
            : 'bg-neutral-100 text-neutral-500')
        }
      >
        {right ? <Check size={13} /> : wrongPick ? <X size={13} /> : LETTER[i]}
      </span>
      <span className="text-[13.5px] leading-snug">{a.t}</span>
    </button>
  );
}

/** Карточка вопроса: формулировка и варианты ответа.

    `picked` приходит снаружи: во время теста ответ судьи — состояние экрана, а
    не карточки, иначе «отвечено 7 из 20» неоткуда взять. */
export function QuestionCard({
  q,
  n,
  total,
  mode = 'test',
  picked,
  onPick,
  extra,
}: {
  q: Question;
  /** Номер вопроса в тесте — «Вопрос 7 из 20». */
  n?: number;
  total?: number;
  mode?: QuizMode;
  picked?: string;
  onPick?: (id: string) => void;
  /** Правый край шапки: тема, значок «устарел», кнопки правки. */
  extra?: ReactNode;
}) {
  return (
    /* Карточка внутри карточки убрана ✳ (03.09.2026): вопрос стоит на белом
       листе теста, и своя рамка со своей тенью давала вторую рамку вокруг того
       же самого — а варианты внутри неё оказывались третьим уровнем. Границу
       рисует то, что её требует: варианты ответа, по которым кликают. */
    <div>
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {(n || q.topic) && (
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              {n ? 'Вопрос ' + n + (total ? ' из ' + total : '') : q.topic}
              {n && q.topic ? ' · ' + q.topic : ''}
            </div>
          )}
          <div className="text-[14px] font-semibold leading-snug">{q.t}</div>
        </div>
        {extra && <div className="shrink-0">{extra}</div>}
      </div>

      <div className="flex flex-col gap-2">
        {q.answers.map((a, i) => (
          <Option
            key={a.id}
            i={i}
            a={a}
            mode={mode}
            picked={picked === a.id}
            onPick={onPick ? () => onPick(a.id) : undefined}
          />
        ))}
      </div>

      {/* Пояснение — только в разборе: во время теста оно и есть ответ. */}
      {mode !== 'test' && q.why && (
        <div className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-[12.5px] leading-relaxed text-neutral-600">
          {q.why}
        </div>
      )}
    </div>
  );
}

/** Ход теста: сколько отвечено и сколько осталось.

    Числом, а не только полосой: «отвечено 7 из 20» читается быстрее, чем
    оценивается длина заливки, а полоса рядом отвечает на «много ли осталось». */
export function QuizProgress({
  done,
  total,
  left,
}: {
  done: number;
  total: number;
  /** Сколько времени осталось, если тест на время. */
  left?: string;
}) {
  const pct = Math.round((done / Math.max(1, total)) * 100);
  return (
    <div className="mb-4 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium">
          Отвечено <b className="tabular-nums">{done}</b> из {total}
        </span>
        {left && <span className="text-[12.5px] tabular-nums text-neutral-500">осталось {left}</span>}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: pct + '%' }} />
      </div>
    </div>
  );
}

/** Итог теста: балл, порог и что из него следует.

    Порог стоит рядом с баллом всегда, даже когда тест сдан: без него «18 из 20»
    не значит ничего. Само число — настройка аттестации ✳ (значение по
    умолчанию правит коллегия, не трогая экран), поэтому приходит пропом, а не
    зашито здесь. */
export function QuizResult({
  right,
  total,
  pass,
  till,
}: {
  right: number;
  total: number;
  /** Сколько нужно для сдачи. */
  pass: number;
  /** До какой даты действует аттестация, если сдана. */
  till?: string;
}) {
  const ok = right >= pass;
  return (
    <div className={'rounded-xl border p-4 ' + (ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50')}>
      <div className="flex items-baseline gap-2">
        <span className={'text-3xl font-bold tabular-nums ' + (ok ? 'text-green-700' : 'text-red-700')}>
          {right}
        </span>
        <span className="text-[15px] text-neutral-500">из {total}</span>
        <span className="ml-auto text-[12.5px] text-neutral-500">порог — {pass}</span>
      </div>
      <div className={'mt-1.5 text-[13.5px] font-medium ' + (ok ? 'text-green-900' : 'text-red-900')}>
        {ok ? 'Аттестация сдана' + (till ? ' — действует до ' + till : '') : 'Аттестация не сдана — допуска к судейству нет'}
      </div>
      <div className="mt-1 text-[12.5px] leading-relaxed text-neutral-600">
        {ok
          ? 'Допуск проставился сам: отдельного решения коллегии не требуется.'
          : 'Пересдача — в пределах числа попыток, заданного настройкой аттестации; пока тест не сдан, в наряд судью не назначают.'}
      </div>
    </div>
  );
}
