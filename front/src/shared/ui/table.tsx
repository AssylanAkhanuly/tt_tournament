'use client';

/* Общие части таблиц приложения ✳ (28.10.2026): значок сортировки и страницы.
   Таблицы одного вида — рейтинг-лист, турниры — берут их отсюда, чтобы не
   разъехаться. HeroUI + Tailwind. */

import { Pagination } from '@heroui/react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';

/** Направление сортировки колонки: нет, по возрастанию, по убыванию. */
export function SortIcon({ dir }: { dir: false | 'asc' | 'desc' }) {
  return dir === 'asc' ? (
    <ArrowUp size={12} className="shrink-0 text-blue-600" />
  ) : dir === 'desc' ? (
    <ArrowDown size={12} className="shrink-0 text-blue-600" />
  ) : (
    <ChevronsUpDown size={12} className="shrink-0 text-neutral-300" />
  );
}

/** Окно номеров: первая, последняя и соседи текущей, между ними «…». */
function window(page: number, pages: number): (number | '…')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i);
  const from = Math.max(1, Math.min(page - 1, pages - 4));
  const to = Math.min(pages - 2, Math.max(page + 1, 3));
  const out: (number | '…')[] = [0];
  if (from > 1) out.push('…');
  for (let i = from; i <= to; i++) out.push(i);
  if (to < pages - 2) out.push('…');
  out.push(pages - 1);
  return out;
}

/** Страницы таблицы — по центру под ней, «назад/вперёд» значками.
 *  `page` с нуля. Одна страница — ничего не рисуем. */
export function TablePagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <div className="flex shrink-0 justify-center border-t border-neutral-200 px-6 py-2">
      {/* У HeroUI пагинация растянута на всю ширину и прижата влево — сужаем. */}
      <Pagination aria-label="Страницы" data-testid="pagination" className="w-auto justify-center">
        <Pagination.Content className="self-center">
          <Pagination.Item>
            <Pagination.Previous aria-label="Предыдущая страница" isDisabled={page === 0} onPress={() => onPage(page - 1)}>
              <Pagination.PreviousIcon />
            </Pagination.Previous>
          </Pagination.Item>
          {window(page, pages).map((n, i) =>
            n === '…' ? (
              <Pagination.Item key={'gap' + i}>
                <Pagination.Ellipsis />
              </Pagination.Item>
            ) : (
              <Pagination.Item key={n}>
                <Pagination.Link isActive={n === page} onPress={() => onPage(n)}>
                  {n + 1}
                </Pagination.Link>
              </Pagination.Item>
            ),
          )}
          <Pagination.Item>
            <Pagination.Next aria-label="Следующая страница" isDisabled={page >= pages - 1} onPress={() => onPage(page + 1)}>
              <Pagination.NextIcon />
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
      </Pagination>
    </div>
  );
}
