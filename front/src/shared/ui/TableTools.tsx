'use client';

/* Отбор и действия над таблицей ✳ (03.11.2026, решение владельца продукта).

   На десктопе — как было: «Фильтры» (`FilterMenu`) рядом с поиском и меню «⋯»
   (`ActionMenu`) справа. На телефоне — один значок настроек (ghost) рядом с
   поиском, на нём число включённых отборов. Он открывает панель снизу, и она
   **вложенная**: сначала список — «Фильтры» (с выбранными значениями под
   подписью) и действия; пункт открывает свой вид внутри той же панели —
   группы отбора, форму, подробности выгрузки — со стрелкой «назад» в шапке.
   Действие без своего вида выполняется сразу и закрывает панель.

   Экран отдаёт сюда данные (группы и действия), а не готовые кнопки: что и
   как рисовать, решает ширина экрана. HeroUI + Tailwind. */

import { Button, Drawer } from '@heroui/react';
import { ArrowLeft, ChevronRight, MoreHorizontal, Settings2, SlidersHorizontal } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { FilterGroups, FilterMenu, useNarrow, type FilterGroup } from '@/shared/kit/app';
import { BottomSheet } from './BottomSheet';
import { ActionMenu, type MenuItem } from './MenuSheet';

/** Действие таблицы. `panel` — свой вид внутри панели на телефоне
    (`back` — вернуться к списку, `close` — закрыть панель); без него на
    телефоне действие выполняется сразу, как и на десктопе. */
export type TableAction = MenuItem & { panel?: (nav: { back: () => void; close: () => void }) => ReactNode };

const Row = ({
  icon,
  label,
  hint,
  testId,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  testId?: string;
  onPress: () => void;
}) => (
  <button
    type="button"
    data-testid={testId}
    onClick={onPress}
    className="flex w-full items-center gap-3 border-b border-neutral-100 px-6 py-3.5 text-left last:border-b-0"
  >
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">{icon}</span>
    <span className="min-w-0 flex-1 leading-tight">
      <span className="block text-[15px] text-neutral-800">{label}</span>
      {hint && <span className="mt-0.5 block truncate text-[12.5px] text-neutral-500">{hint}</span>}
    </span>
    <ChevronRight size={16} className="shrink-0 text-neutral-400" />
  </button>
);

export function TableTools({
  groups = [],
  actions = [],
  place,
}: {
  groups?: FilterGroup[];
  actions?: TableAction[];
  /** Что рисовать на десктопе: «Фильтры» (слот `filters`) или «⋯» (слот `actions`).
      На телефоне слот `actions` пуст, а `filters` — одна кнопка на всё. */
  place: 'filters' | 'actions';
}) {
  const narrow = useNarrow();
  const [open, setOpen] = useState(false);
  // Какой вид панели открыт: список, отбор или вид действия (по его id).
  const [view, setView] = useState<'root' | 'filters' | string>('root');

  if (!narrow) {
    if (place === 'filters') return groups.length ? <FilterMenu groups={groups} /> : null;
    return actions.length ? (
      <ActionMenu trigger={<MoreHorizontal size={18} />} ariaLabel="Ещё" title="Действия" items={actions} testId="rating-more" />
    ) : null;
  }
  if (place === 'actions' || (!groups.length && !actions.length)) return null;

  const on = groups.filter((g) => g.active !== g.items[0]);
  const back = () => setView('root');
  const close = () => setOpen(false);
  const action = actions.find((a) => a.id === view);
  const title = view === 'root' ? 'Настройки' : view === 'filters' ? 'Фильтры' : (action?.label ?? 'Настройки');

  return (
    <>
      <span className="relative shrink-0">
        <Button
          isIconOnly
          variant="ghost"
          aria-label="Настройки"
          className="rounded-xl"
          data-testid="table-tools-open"
          onPress={() => {
            setView('root');
            setOpen(true);
          }}
        >
          <Settings2 size={18} />
        </Button>
        {on.length > 0 && (
          <span className="pointer-events-none absolute -right-1 -top-1 rounded-full bg-blue-600 px-1.5 text-[11px] font-semibold text-white">
            {on.length}
          </span>
        )}
      </span>
      <BottomSheet
        isOpen={open}
        onOpenChange={setOpen}
        testId="table-tools"
        dataView={view}
        bodyClassName={view === 'root' ? 'px-0 pb-4' : 'px-6 pb-6'}
        header={
          <div className="flex items-center gap-2">
            {view !== 'root' && (
              <Button isIconOnly size="sm" variant="ghost" aria-label="Назад" className="-ml-2 rounded-xl" onPress={back} data-testid="table-tools-back">
                <ArrowLeft size={18} />
              </Button>
            )}
            <Drawer.Heading className="text-lg font-semibold">{title}</Drawer.Heading>
          </div>
        }
        footer={
          view === 'filters' ? (
            <>
              <Button
                variant="tertiary"
                className="flex-1 rounded-xl"
                isDisabled={on.length === 0}
                data-testid="filters-reset"
                onPress={() => groups.forEach((g) => g.onPick(g.items[0]))}
              >
                Сбросить
              </Button>
              <Button variant="primary" className="flex-1 rounded-xl" data-testid="filters-done" onPress={close}>
                Готово
              </Button>
            </>
          ) : undefined
        }
      >
        {view === 'root' && (
          <div data-testid="table-tools-menu">
            {groups.length > 0 && (
              <Row
                icon={<SlidersHorizontal size={18} />}
                label="Фильтры"
                hint={on.length ? on.map((g) => g.active).join(' · ') : 'Не выбраны'}
                testId="table-tools-filters"
                onPress={() => setView('filters')}
              />
            )}
            {actions.map((a) => (
              <Row
                key={a.id}
                icon={a.icon}
                label={a.label}
                testId={a.testId}
                onPress={() => {
                  if (a.panel) setView(a.id);
                  else {
                    close();
                    a.onAction();
                  }
                }}
              />
            ))}
          </div>
        )}
        {view === 'filters' && (
          <div className="flex flex-col gap-4" data-testid="filters-drawer">
            <FilterGroups groups={groups} />
          </div>
        )}
        {action?.panel && <div data-testid={'table-tools-panel-' + action.id}>{action.panel({ back, close })}</div>}
      </BottomSheet>
    </>
  );
}
