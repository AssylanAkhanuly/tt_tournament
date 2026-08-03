/* Турнирные компоненты — то, чего нет в обычных библиотеках: строка матча,
   плитка стола, дельта рейтинга, номер посева, ввод счёта, строка рейтинга. */

import type { ReactNode } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Avatar } from './base';
import { Stepper } from './forms';
import './domain.css';

const cx = (...p: (string | false | undefined)[]) => p.filter(Boolean).join(' ');

export type Player = { name: string; avatar?: string };

/* ── Строка матча ───────────────────────────────────────────── */

export function MatchRow({
  home,
  away,
  score,
  note,
  winner,
  live,
  className,
}: {
  home: Player;
  away: Player;
  score: ReactNode;
  note?: ReactNode;
  winner?: 'home' | 'away';
  live?: boolean;
  className?: string;
}) {
  return (
    <div className={cx('ui-match', live && 'live', className)}>
      <span className={cx('side', winner === 'home' && 'win')}>
        {home.avatar && <Avatar src={home.avatar} size="sm" />}
        <span className="nm">{home.name}</span>
      </span>
      <span className="sc">
        {score}
        {note && <small>{note}</small>}
      </span>
      <span className={cx('side', 'r', winner === 'away' && 'win')}>
        <span className="nm">{away.name}</span>
        {away.avatar && <Avatar src={away.avatar} size="sm" />}
      </span>
    </div>
  );
}

/* ── Плитка стола ───────────────────────────────────────────── */

export function TableTile({
  number,
  score,
  busy,
  className,
}: {
  number: number | string;
  score?: ReactNode;
  busy?: boolean;
  className?: string;
}) {
  return (
    <div className={cx('ui-tabletile', busy && 'busy', className)}>
      <div className="tn">
        Стол {number}
        <span className="st" />
      </div>
      <div className="sc">{score ?? '—'}</div>
    </div>
  );
}

/* ── Дельта рейтинга ────────────────────────────────────────── */

export function RatingDelta({ value, className }: { value: number; className?: string }) {
  const tone = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  return (
    <span className={cx('ui-delta', tone, className)}>
      {value > 0 ? <TrendingUp size={13} /> : value < 0 ? <TrendingDown size={13} /> : null}
      {value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '0'}
    </span>
  );
}

/* ── Номер посева ───────────────────────────────────────────── */

export function SeedBadge({ seed, className }: { seed: number; className?: string }) {
  return <span className={cx('ui-seed', seed <= 8 && 'top', className)}>№{seed}</span>;
}

/* ── Ввод счёта ─────────────────────────────────────────────── */

export function ScoreInput({
  home,
  away,
  homePoints = 0,
  awayPoints = 0,
  serving = 'home',
  sets,
  className,
}: {
  home: Player;
  away: Player;
  homePoints?: number;
  awayPoints?: number;
  serving?: 'home' | 'away';
  sets?: [number, number][];
  className?: string;
}) {
  return (
    <div className={cx('ui-score', className)}>
      {(
        [
          [home, homePoints, 'home'],
          [away, awayPoints, 'away'],
        ] as [Player, number, string][]
      ).map(([p, pts, side]) => (
        <div className="pl" key={side}>
          {p.avatar && <Avatar src={p.avatar} size="sm" />}
          <span className="who">
            <div className="nm">{p.name}</div>
            <div className="mt">{serving === side ? 'подача' : 'приём'}</div>
          </span>
          {serving === side && <span className="serve" />}
          <Stepper value={pts} />
        </div>
      ))}
      {sets && (
        <div className="sets">
          {sets.map(([a, b], i) => (
            <span className="setchip" key={i}>
              {a > b ? <b>{a}</b> : a}–{b > a ? <b>{b}</b> : b}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Строка рейтинга ────────────────────────────────────────── */

export function RankRow({
  position,
  player,
  meta,
  points,
  delta,
  className,
}: {
  position: number;
  player: Player;
  meta?: ReactNode;
  points: ReactNode;
  delta?: number;
  className?: string;
}) {
  return (
    <div className={cx('ui-rank', position <= 3 && 'top3', className)}>
      <span className="pos">{position}</span>
      {player.avatar && <Avatar src={player.avatar} size="sm" />}
      <span className="who">
        <div className="nm">{player.name}</div>
        {meta && <div className="mt">{meta}</div>}
      </span>
      <span className="pts">{points}</span>
      {delta != null && <RatingDelta value={delta} />}
    </div>
  );
}
