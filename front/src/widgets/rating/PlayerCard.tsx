'use client';

/* Карточка спортсмена. Устроена как карточка судьи (Э0.13): показатели сверху,
   паспортная часть строками «подпись — значение», ниже история — и её никто не
   заполняет руками, она собирается из турниров.

   История — таблица п. 20 Положения со слагаемыми изменения: п. 4.6 требует,
   чтобы каждое изменение было связано с конкретным матчем и объяснимо.

   Ссылок на пункты Положения на экране нет ✳ (10.09.2026, решение владельца
   продукта): подписи видов записей приходят с сервера вместе с «(п. …)» — их
   отрезает `plainLabel`, а происхождение старта не показывается вовсе. */

import { Avatar } from '@heroui/react';

import {
  coeff,
  num2,
  plainLabel,
  ruDate,
  signed2,
  type RatingCard,
  type RatingEntry,
} from '@/entities/rating';
import { EmptyBox, KV, Panel, Pill, Sheet, StatTiles } from '@/shared/kit/app';

const GRID = '82px minmax(0,1.5fr) minmax(0,1.3fr) 52px 62px 74px 66px 48px 44px 44px 44px';

/** Вид записи задаёт, как её читать: матч, штраф или служебная строка. */
const KIND_TONE: Record<RatingEntry['kind'], string> = {
  match: 'text-neutral-500',
  start: 'text-blue-700',
  prize: 'text-blue-700',
  no_show: 'text-red-600',
  correction: 'text-amber-700',
  void: 'text-red-600',
};

export function PlayerCard({ card }: { card: RatingCard }) {
  const { profile: p, history, place, of } = card;
  const доля = p.matchesPlayed ? Math.round((p.wins / p.matchesPlayed) * 100) : null;

  return (
    <>
      <StatTiles
        items={[
          { v: num2(p.value), k: 'Текущий рейтинг' },
          { v: '№' + place, k: 'Место в листе из ' + of },
          { v: String(p.matchesPlayed), k: 'Рейтинговых матчей' },
          {
            v: доля === null ? '—' : доля + ' %',
            k: 'Доля побед · ' + p.wins + ' из ' + p.matchesPlayed,
          },
        ]}
      />

      <Panel>
        {/* Шапка начинается с фото — как строка листа. */}
        <div className="mb-3 flex items-center gap-3 border-b border-neutral-100 pb-3">
          <Avatar size="lg">
            <Avatar.Fallback>{p.name.slice(0, 1)}</Avatar.Fallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <h3 className="text-[13.5px] font-semibold">{p.name}</h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              {[p.region, p.ageCategory].filter(Boolean).join(' · ') || 'регион не указан'}
            </p>
          </div>
          <Pill
            t={p.statusLabel}
            color={p.status === 'active' ? 'success' : p.status === 'inactive' ? 'warning' : 'default'}
          />
        </div>

        <KV
          items={[
            ['Стартовое значение', num2(p.startValue)],
            ...(p.ittfPosition ? ([['Позиция в ITTF на момент входа', String(p.ittfPosition)]] as [string, string][]) : []),
            ['Последний рейтинговый матч', ruDate(p.lastMatchAt) || 'матчей ещё не было'],
            ['Побед и поражений', p.wins + ' / ' + p.losses],
            ...(p.noShows ? ([['Подтверждённых неявок', String(p.noShows)]] as [string, string][]) : []),
          ]}
        />
      </Panel>

      <Panel title={'История изменения рейтинга · ' + history.length + ' записей'} flush>
        {history.length ? (
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <Sheet
                flush
                grid={GRID}
                cols={[
                  'Дата',
                  'Турнир или основание',
                  'Соперник',
                  'Счёт',
                  <span key="b" className="block text-right">До</span>,
                  <span key="d" className="block text-right">Изменение</span>,
                  <span key="a" className="block text-right">После</span>,
                  <span key="e" className="block text-right">E</span>,
                  <span key="k" className="block text-right">K</span>,
                  <span key="c" className="block text-right">C</span>,
                  <span key="p" className="block text-right">P</span>,
                ]}
              >
                {history.map((h) => (
                  <div
                    key={h.id}
                    data-row
                    data-testid="card-history-row"
                    className={
                      'grid w-full items-center gap-3 px-4 py-2 text-left text-[12.5px] tabular-nums ' +
                      (h.isReverted ? 'opacity-50 line-through' : '')
                    }
                    style={{ gridTemplateColumns: GRID }}
                  >
                    <span className="text-neutral-500">{ruDate(h.occurredAt)}</span>
                    <span className="min-w-0 truncate">
                      {h.tournamentName ?? <span className={KIND_TONE[h.kind]}>{plainLabel(h.kindLabel)}</span>}
                      {/* У стартовой строки основание — служебное происхождение
                          старта; основание неявки и исправления пишет человек. */}
                      {h.reason && h.kind !== 'start' && (
                        <span className="block truncate text-[11px] text-neutral-400">{h.reason}</span>
                      )}
                    </span>
                    <span className="min-w-0 truncate text-neutral-600">{h.opponentName ?? '—'}</span>
                    <span className={h.won ? 'text-green-700' : 'text-neutral-500'}>{h.score || '—'}</span>
                    <span className="text-right text-neutral-500">{num2(h.before)}</span>
                    <span
                      className={
                        'text-right font-semibold ' +
                        (h.delta > 0 ? 'text-green-700' : h.delta < 0 ? 'text-red-600' : 'text-neutral-400')
                      }
                    >
                      {signed2(h.delta)}
                      {h.capped && <span title="Обрезано потолком п. 12.1"> ⛔</span>}
                      {h.transition && <span title="Переходный период п. 11.2"> ●</span>}
                    </span>
                    <span className="text-right font-semibold">{num2(h.after)}</span>
                    <span className="text-right text-neutral-500">{coeff(h.expected)}</span>
                    <span className="text-right text-neutral-500">{coeff(h.k)}</span>
                    <span className="text-right text-neutral-500">{coeff(h.c)}</span>
                    <span className="text-right text-neutral-500">{coeff(h.p)}</span>
                  </div>
                ))}
              </Sheet>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <EmptyBox title="История пуста" text="Рейтинговых матчей у спортсмена ещё не было." />
          </div>
        )}
      </Panel>
    </>
  );
}
