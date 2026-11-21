'use client';

/* Главная по образцу ✳ (21.11.2026, решение владельца продукта: «точная копия
   образца, дальше заменяем каждую часть по одной»). Пока это макет с текстом
   образца: данных федерации, входа и переходов нет; углы скруглены и цвета —
   как в образце, а не по правилам кита. Страница на всё окно, без внешних
   полей. Части: сайдбар (`HomeSidebar`), шапка с пейзажем, фильтр и квартал,
   «Active Targets» (`TargetCards`), «Vision Board», «Life Pillars», «Quick
   Stats». */

import {
  Bell,
  BriefcaseBusiness,
  Calendar,
  ChartColumn,
  ChevronDown,
  ChevronLeft,
  CircleDashed,
  Eye,
  Heart,
  HeartHandshake,
  History,
  ListChecks,
  Plus,
  SquarePen,
  TextAlignEnd,
  TrendingUp,
  UsersRound,
  Image as ImageIcon,
  Timer,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Landscape, VisionArt } from './art';
import { FILTERS, PILLARS, STATS, VISION } from './data';
import { HomeSidebar } from './HomeSidebar';
import { TargetCards } from './TargetCards';

const ICON: Record<string, ReactNode> = {
  heart: <Heart size={15} />,
  briefcase: <BriefcaseBusiness size={15} />,
  users: <UsersRound size={15} />,
  trend: <TrendingUp size={15} />,
  target: <History size={15} />,
  list: <ListChecks size={15} />,
  bars: <ChartColumn size={15} />,
};

function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-[14.5px] font-semibold text-neutral-950">
      <span className="text-neutral-700">{icon}</span>
      {children}
    </h2>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50" data-testid="home-hero">
      <div className="absolute inset-y-0 right-0 w-[62%] [mask-image:linear-gradient(to_right,transparent,black_35%)]">
        <Landscape />
      </div>
      <div className="relative flex flex-col gap-2 px-7 py-8">
        <p className="text-[10px] tracking-wider text-sky-600 uppercase">Welcome back</p>
        <h1 className="text-[26px] font-bold text-neutral-950">Life Goals</h1>
        <p className="text-[12.5px] text-neutral-500">Strategic alignment and quarterly targets.</p>
        <div className="mt-5 flex gap-3">
          <button type="button" className="flex h-10 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-[12px] text-white shadow-lg">
            <Plus size={16} /> New Goal
          </button>
          <button type="button" className="flex h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-[12px] text-neutral-800">
            <Eye size={16} /> Vision Board
          </button>
        </div>
      </div>
    </section>
  );
}

function VisionCard({ v }: { v: (typeof VISION)[number] }) {
  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-neutral-200 bg-white p-1.5" data-testid="home-vision">
      <div className="relative flex h-24 items-end justify-center rounded-lg bg-neutral-100">
        <span className="absolute top-2 left-2 grid size-5 place-items-center rounded border border-neutral-200 bg-white text-neutral-400">
          <ImageIcon size={10} />
        </span>
        <VisionArt kind={v.art} />
      </div>
      <div className="flex flex-1 flex-col gap-2 px-1.5 pt-3 pb-1.5">
        <h3 className="text-[11.5px] font-semibold text-neutral-950">{v.title}</h3>
        <p className="line-clamp-3 text-[9px] leading-relaxed text-neutral-500">{v.text}</p>
        <div className="mt-auto flex items-center justify-between border-t border-neutral-200 pt-2.5 text-[9px] text-neutral-500">
          <span className="flex items-center gap-1.5">
            {v.status === 'Planned' ? <CircleDashed size={11} /> : <Timer size={11} />}
            {v.status}
          </span>
          <span>{v.when}</span>
        </div>
      </div>
    </article>
  );
}

export function HomeView() {
  const [filter, setFilter] = useState(FILTERS[0]);
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white font-[family-name:var(--font-home),ui-monospace,monospace] text-neutral-950" data-testid="home">
      <HomeSidebar />
      <main className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto px-7 py-5 max-md:px-4 [&>*]:shrink-0">
        <header className="flex items-center justify-between">
          <button type="button" className="flex h-8 items-center gap-1.5 rounded-lg bg-neutral-100 px-3 text-[11.5px] text-neutral-500">
            <ChevronLeft size={13} /> Goals
          </button>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Notifications" className="grid size-8 place-items-center rounded-lg border border-neutral-200 text-neutral-700">
              <Bell size={15} />
            </button>
            <button type="button" className="flex h-8 items-center gap-1.5 rounded-lg bg-neutral-950 px-3 text-[11.5px] text-white">
              <SquarePen size={13} /> New
            </button>
            <button type="button" aria-label="Menu" className="grid size-8 place-items-center rounded-lg border border-neutral-200 text-neutral-700">
              <TextAlignEnd size={15} />
            </button>
          </div>
        </header>

        <Hero />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-xl border border-neutral-200 bg-neutral-100 p-1" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={f === filter}
                onClick={() => setFilter(f)}
                className={'h-8 rounded-lg px-6 text-[11.5px] ' + (f === filter ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-600')}
                data-testid="home-filter"
              >
                {f}
              </button>
            ))}
          </div>
          <button type="button" className="flex h-10 items-center gap-2 rounded-xl border border-neutral-200 px-3 text-[12px] text-neutral-800">
            <Calendar size={14} /> Q3 2026 <ChevronDown size={13} className="text-neutral-400" />
          </button>
        </div>

        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-5 max-lg:grid-cols-1">
          <div className="flex min-w-0 flex-col gap-4">
            <SectionTitle icon={<History size={16} />}>Active Targets</SectionTitle>
            <TargetCards />
            <SectionTitle icon={<Eye size={16} />}>Vision Board</SectionTitle>
            <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-1">
              {VISION.map((v) => (
                <VisionCard key={v.title} v={v} />
              ))}
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <SectionTitle icon={<HeartHandshake size={16} />}>Life Pillars</SectionTitle>
            <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-3">
              <ul className="flex flex-col rounded-xl border border-neutral-200 bg-neutral-50 px-3">
                {PILLARS.map((p, k) => (
                  <li key={p.name} className={'flex items-center gap-3 py-2.5 ' + (k ? 'border-t border-neutral-200' : '')} data-testid="home-pillar">
                    <span className="grid size-8 place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-600">{ICON[p.icon]}</span>
                    <span className="flex flex-1 flex-col">
                      <span className="text-[11.5px] font-semibold text-neutral-950">{p.name}</span>
                      <span className="text-[9px] text-neutral-500">{p.sub}</span>
                    </span>
                    <span className="rounded border border-neutral-200 bg-white px-1.5 text-[8.5px] text-neutral-400">{p.grade}</span>
                  </li>
                ))}
              </ul>
              <h2 className="text-[13px] font-semibold text-neutral-950">Quick Stats</h2>
              <div className="grid grid-cols-2 gap-2.5">
                {STATS.map((s) => (
                  <div key={s.label} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3" data-testid="home-stat">
                    <span className="grid size-8 place-items-center rounded-lg border border-neutral-200 text-neutral-600">{ICON[s.icon]}</span>
                    <span className="flex flex-col">
                      <span className="text-[12px] font-semibold text-neutral-950">{s.value}</span>
                      <span className="text-[9px] text-neutral-500">{s.label}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
