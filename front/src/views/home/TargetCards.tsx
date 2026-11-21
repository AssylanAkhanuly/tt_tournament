'use client';

/* «Active Targets» главной по образцу ✳ (21.11.2026): карточка с линией и
   отметкой недели и карточка со столбиками. Графики — SVG по заданным точкам,
   данных за ними пока нет. */

import { ChartColumn, Heart } from 'lucide-react';
import { useState } from 'react';

// Линия здоровья: ровно, подъём, пик на отметке, затухающие волны.
const LINE = [8, 8, 9, 10, 9, 10, 12, 16, 14, 12, 18, 30, 44, 38, 26, 30, 36, 30, 24, 28, 34, 28, 22, 26, 30, 24, 18, 20, 22, 16, 12, 14, 12];
const MARK = 12;

function smooth(points: [number, number][]) {
  return points.reduce((d, [x, y], i) => {
    if (i === 0) return `M${x},${y}`;
    const [px, py] = points[i - 1];
    const cx = (px + x) / 2;
    return `${d} C${cx},${py} ${cx},${y} ${x},${y}`;
  }, '');
}

function HealthChart() {
  const w = 280;
  const h = 60;
  const step = w / (LINE.length - 1);
  const pts = LINE.map((v, i) => [i * step, h - v] as [number, number]);
  const [mx, my] = pts[MARK];
  return (
    <svg viewBox={`0 0 ${w} ${h + 4}`} className="h-16 w-full" aria-hidden>
      {pts.map(([x], i) => (i > 16 && i % 1 === 0 ? <line key={i} x1={x} y1={20} x2={x} y2={h} className="stroke-neutral-100" /> : null))}
      <path d={smooth(pts)} fill="none" className="stroke-neutral-400" strokeWidth="1.2" />
      <line x1={mx} y1={4} x2={mx} y2={my} className="stroke-neutral-500" strokeDasharray="2 2" />
      <circle cx={mx} cy={4} r="2.2" className="fill-neutral-800" />
    </svg>
  );
}

function WealthChart() {
  const n = 96;
  const bars = Array.from({ length: n }, (_, i) => {
    const noise = ((i * 37) % 11) / 11;
    const inMid = i >= 34 && i <= 60;
    const base = inMid ? 26 + ((i * 53) % 17) : 12 + noise * 18;
    return { h: Math.min(52, base + (i === 52 ? 14 : 0)), dark: inMid };
  });
  return (
    <svg viewBox={`0 0 ${n * 3} 56`} className="h-16 w-full" preserveAspectRatio="none" aria-hidden>
      {bars.map((b, i) => (
        <rect key={i} x={i * 3} y={56 - b.h} width="1.6" height={b.h} className={b.dark ? 'fill-neutral-600' : 'fill-neutral-200'} />
      ))}
    </svg>
  );
}

function Card({ title, pillar, value, caption, icon, children, extra }: {
  title: string;
  pillar: string;
  value: string;
  caption: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3.5" data-testid="home-target">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-[13px] font-semibold text-neutral-950">{title}</h3>
          <p className="text-[9.5px] tracking-wide text-neutral-500 uppercase">{pillar}</p>
        </div>
        <span className="grid size-7 place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-400">{icon}</span>
      </div>
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <span className="text-[19px] font-semibold text-neutral-950">{value}</span>
          <span className="text-[9px] text-neutral-500">{caption}</span>
        </div>
        {extra}
      </div>
      {children}
    </article>
  );
}

export function TargetCards() {
  const [week, setWeek] = useState('W2');
  return (
    <div className="grid grid-cols-2 gap-3 max-lg:grid-cols-1">
      <Card
        title="Health & Longevity"
        pillar="Physical pillar"
        value="78%"
        caption="VO2 Max Target"
        icon={<Heart size={13} />}
        extra={
          <span className="flex gap-1">
            {['W1', 'W2', 'W3'].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeek(w)}
                className={'rounded px-1.5 py-0.5 text-[8.5px] ' + (w === week ? 'bg-neutral-950 text-white' : 'border border-neutral-200 text-neutral-500')}
              >
                {w}
              </button>
            ))}
          </span>
        }
      >
        <HealthChart />
      </Card>
      <Card title="Financial Freedom" pillar="Wealth pillar" value="45%" caption="Portfolio Growth" icon={<ChartColumn size={13} />}>
        <WealthChart />
      </Card>
    </div>
  );
}
