'use client';

/* Сетка плей-офф плакатом ✳ (23.11.2026, решение владельца продукта: «как сетка
   на лендинге Astana 2027», `astana-2027-landing/src/variants/bracket-section.tsx`).
   Две половины зеркально сходятся к финалу в центре, над финалом — кубок; фон —
   тёмно-синий бренда с радиальным светом; игрок — строка: метка позиции («A1»)
   или посев, фото, фамилия плакатной гарнитурой (`--font-poster`, Oswald),
   ячейка счёта — коралловая слева, голубая справа, у проигравшего приглушена.

   Раскладка — рекурсией по дереву, а не координатами: матч (круг r, место s)
   растёт из матчей (r − 1, 2s) и (r − 1, 2s + 1); поддеревья одной высоты,
   поэтому центры детей — ровно на четверти и трёх четвертях, туда и идёт
   скобка-соединитель. Плакат рисуется в своём размере и масштабируется под
   блок: `contain` — целиком (обзор турнира, последние круги), `width` — по
   ширине с прокруткой вниз (вся сетка в «Расписании»). */

import { useEffect, useRef, useState } from 'react';

import type { Bracket, Match, Side } from '@/entities/bracket/model';

type Half = 'l' | 'r';

const SCORE_BG: Record<Half, string> = { l: 'bg-qtt-coral', r: 'bg-brand-500' };

function Avatar({ side }: { side: Side | null }) {
  return side?.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={side.avatarUrl} alt="" draggable={false} className="w-11 shrink-0 object-cover" />
  ) : (
    <span className="w-11 shrink-0 bg-white/[0.06]" />
  );
}

function Row({ side, score, won, half, live }: { side: Side | null; score?: number | null; won: boolean; half: Half; live: boolean }) {
  const lit = won || live;
  // Места без игрока (группа не сыграна) — метка позиции вместо фамилии.
  const name = side ? (side.placeholder ? side.tag ?? side.name : side.name) : '';
  const tag = side && !side.placeholder ? side.tag ?? side.seed : undefined;
  return (
    <div
      className={
        'flex h-11 items-stretch overflow-hidden rounded-[3px] ' +
        (half === 'r' ? 'flex-row-reverse ' : '') +
        (lit ? 'bg-white/[0.16]' : 'bg-white/[0.08]') +
        (side && !lit && score != null ? ' opacity-60' : '')
      }
      data-testid="poster-row"
    >
      {tag !== undefined && (
        <span className="grid w-9 shrink-0 place-items-center bg-white/10 font-[family-name:var(--font-poster)] text-[13px] font-bold text-white/75">{tag}</span>
      )}
      {side && !side.placeholder && <Avatar side={side} />}
      <span className={'flex min-w-0 flex-1 items-center px-2.5 ' + (half === 'r' ? 'justify-end text-right' : '')}>
        <span className={'truncate font-[family-name:var(--font-poster)] text-[15px] leading-tight font-bold tracking-wide uppercase ' + (side?.placeholder ? 'text-white/70' : 'text-white')}>{name || '—'}</span>
      </span>
      <span
        className={
          'grid w-9 shrink-0 place-items-center font-[family-name:var(--font-poster)] text-[19px] font-bold text-white ' +
          (lit ? SCORE_BG[half] : 'bg-white/10')
        }
      >
        {score ?? ''}
      </span>
    </div>
  );
}

function Card({ m, half }: { m: Match | undefined; half: Half }) {
  const live = m?.status === 'live';
  return (
    <div className="flex w-[230px] flex-col gap-1" data-testid="poster-match" data-match={m?.id}>
      <Row side={m?.a ?? null} score={m?.scoreA} won={m?.winner === 'a'} half={half} live={live} />
      <Row side={m?.b ?? null} score={m?.scoreB} won={m?.winner === 'b'} half={half} live={live} />
    </div>
  );
}

/** Поддерево: дети — колонкой, скобка к их центрам, линия и сам матч. */
function Sub({ at, r, s, min, half }: { at: (r: number, s: number) => Match | undefined; r: number; s: number; min: number; half: Half }) {
  const card = <Card m={at(r, s)} half={half} />;
  if (r <= min) return <div className="py-2">{card}</div>;
  return (
    <div className={'flex items-stretch ' + (half === 'r' ? 'flex-row-reverse' : '')}>
      <div className="flex flex-col">
        <Sub at={at} r={r - 1} s={2 * s} min={min} half={half} />
        <Sub at={at} r={r - 1} s={2 * s + 1} min={min} half={half} />
      </div>
      <div className="relative w-6 shrink-0">
        <div className={'absolute inset-x-0 top-1/4 bottom-1/4 border-y-2 border-white/45 ' + (half === 'l' ? 'border-r-2' : 'border-l-2')} />
      </div>
      <div className="flex items-center">
        <div className="h-0.5 w-6 bg-white/45" />
        {card}
      </div>
    </div>
  );
}

function Final({ m }: { m: Match | undefined }) {
  const live = m?.status === 'live';
  return (
    <div className="flex flex-col items-center px-2" data-testid="poster-final">
      <p className="m-0 bg-[linear-gradient(180deg,var(--color-white)_0%,var(--color-neutral-300)_45%,var(--color-neutral-500)_52%,var(--color-neutral-100)_70%,var(--color-white)_100%)] bg-clip-text font-[family-name:var(--font-poster)] text-[56px] leading-[0.9] font-bold text-transparent uppercase italic">
        Финал
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/bracket/trophy.webp" alt="" draggable={false} className="my-2 h-[180px] w-auto drop-shadow-[0_0_30px_color-mix(in_srgb,var(--color-qtt-peach)_45%,transparent)]" />
      <div className="flex w-[260px] flex-col gap-1">
        <Row side={m?.a ?? null} score={m?.scoreA} won={m?.winner === 'a'} half="l" live={live} />
        <Row side={m?.b ?? null} score={m?.scoreB} won={m?.winner === 'b'} half="r" live={live} />
      </div>
    </div>
  );
}

export function BracketPoster({ bracket, lastRounds, fit = 'contain' }: {
  bracket: Bracket;
  /** Показать только последние N кругов вместе с финалом (3 — восьмёрка, как на лендинге). */
  lastRounds?: number;
  fit?: 'contain' | 'width';
}) {
  const box = useRef<HTMLDivElement>(null);
  const poster = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const b = box.current;
    const p = poster.current;
    if (!b || !p) return;
    const ro = new ResizeObserver(() => {
      const byW = (b.clientWidth - 24) / p.offsetWidth;
      const s = Math.min(1, fit === 'width' ? byW : Math.min(byW, (b.clientHeight - 24) / p.offsetHeight));
      setScale(s);
      setHeight(p.offsetHeight * s);
    });
    ro.observe(b);
    ro.observe(p);
    return () => ro.disconnect();
  }, [fit]);

  const byKey = new Map(bracket.matches.map((m) => [m.round + ':' + m.slot, m]));
  const at = (r: number, s: number) => byKey.get(r + ':' + s);
  const last = Math.max(0, ...bracket.matches.map((m) => m.round));
  const min = Math.max(0, lastRounds ? last - lastRounds + 1 : 0);

  return (
    <div
      ref={box}
      className={
        'relative h-full w-full select-none bg-[radial-gradient(70%_60%_at_50%_42%,var(--color-brand-600)_0%,var(--color-brand-700)_38%,var(--color-brand-800)_68%,var(--color-brand-950)_100%)] ' +
        (fit === 'width' ? 'overflow-y-auto' : 'overflow-hidden')
      }
      data-testid="bracket-poster"
    >
      <div className="relative" style={{ height: fit === 'width' ? height + 24 : '100%' }}>
        <div
          ref={poster}
          className={'absolute left-1/2 flex items-center ' + (fit === 'width' ? 'top-3' : 'top-1/2')}
          style={{ transform: `translate(-50%, ${fit === 'width' ? '0' : '-50%'}) scale(${scale})`, transformOrigin: fit === 'width' ? '50% 0' : '50% 50%' }}
        >
          {last === 0 ? (
            <Final m={at(0, 0)} />
          ) : (
            <>
              <Sub at={at} r={last - 1} s={0} min={min} half="l" />
              <div className="h-0.5 w-8 bg-white/45" />
              <Final m={at(last, 0)} />
              <div className="h-0.5 w-8 bg-white/45" />
              <Sub at={at} r={last - 1} s={1} min={min} half="r" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
