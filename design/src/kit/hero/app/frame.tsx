/* Каркасы устройств нового слоя макетов (HeroUI) ✳ (30.08.2026).

   Экраны ролей перерисовываются на HeroUI, и рамка устройства у них своя, а не
   `.laptop`/`.frame` макетного слоя: старые рамки собраны на токенах тёмного
   референса, новый слой — светлый и живёт в `hero-scope` (см. tailwind.src.css:
   внутри скоупа действует локальный сброс, а глобальный сброс frame.css
   наоборот НЕ действует — на этом держатся отступы HeroUI).

   Каждая рамка задаёт `position: relative`: диалоги нового слоя (InlineDialog)
   рисуются абсолютным слоем ВНУТРИ рамки, а не порталом в body — на борде
   стоит полтора десятка экранов разом, и портал одного накрыл бы все. */

import type { CSSProperties, ReactNode } from 'react';
import '../../tailwind.css'; // собран из tailwind.src.css: npm run kit:css

/** Гарнитура нового слоя: Inter грузится глобально (src/fonts.ts). */
const FONT: CSSProperties = {
  fontFamily: "'Inter', -apple-system, 'Segoe UI', system-ui, sans-serif",
};

/** Обёртка-скоуп: светлая тема HeroUI + локальный сброс. Каждая рамка сидит в
    своей обёртке, потому что колонка борда не даёт общего родителя. */
export const ScreenScope = ({ children }: { children: ReactNode }) => (
  <div className="hero-scope inline-block text-neutral-900" data-theme="light" style={FONT}>
    {children}
  </div>
);

/** Ноутбук: веб-продукт. Те же 1200×760, что у прежнего слоя, — колонки борда
    и масштаб карты флоу рассчитаны на эту ширину. */
export const Laptop = ({ children }: { children: ReactNode }) => (
  <ScreenScope>
    <div className="relative flex h-[760px] w-[1200px] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
      {children}
    </div>
  </ScreenScope>
);

/* Планшетного корпуса в наборе нет ✳ (31.08.2026): в системе два формата —
   десктоп и телефон. Планшет убран по решению владельца продукта, и это
   сходится с комментарием самой федерации (09.2026): планшетов у неё нет —
   именно поэтому у судьи есть режим ввода «по партиям» (TZ §6.1). */

/** Телефон: приложение спортсмена (TZ §10). */
export const Phone = ({ children }: { children: ReactNode }) => (
  <ScreenScope>
    <div className="rounded-[2.8rem] bg-neutral-900 p-2.5 shadow-xl">
      <div className="relative flex h-[840px] w-[392px] flex-col overflow-hidden rounded-[2.2rem] bg-white">
        {/* Статусбар: без него кадр не читается как телефон. */}
        <div className="flex items-center justify-between px-7 pb-1 pt-3 text-[13px] font-semibold">
          <span>9:41</span>
          <span className="flex items-center gap-1 text-[10px] tracking-tight text-neutral-500">
            LTE <span className="inline-block h-2.5 w-4 rounded-[3px] border border-neutral-400 px-px">
              <span className="block h-full w-3/4 rounded-[1px] bg-neutral-500" />
            </span>
          </span>
        </div>
        {children}
        <div className="pb-2 pt-1">
          <div className="mx-auto h-1 w-32 rounded-full bg-neutral-300" />
        </div>
      </div>
    </div>
  </ScreenScope>
);
