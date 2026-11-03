/* Журнал изменений (п. 20, 21.6, 22.2) ✳ (восстановлен 03.11.2026): все строки
   истории всех спортсменов, новые первыми, с автором. Только председателю ГСК. */

import { n, request, toEntry } from './http';
import type { RatingJournalPage } from './types';

export type JournalQuery = { kind?: string; q?: string; page?: number; pageSize?: number };

export async function fetchJournal(query: JournalQuery = {}): Promise<RatingJournalPage> {
  const params = new URLSearchParams();
  if (query.kind) params.set('kind', query.kind);
  if (query.q) params.set('q', query.q);
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('page_size', String(query.pageSize));
  const raw = await request<Record<string, unknown>>('/journal/?' + params.toString());
  return {
    count: n(raw.count),
    page: n(raw.page),
    pageSize: n(raw.page_size),
    results: (raw.results as Record<string, unknown>[]).map((r) => ({
      ...toEntry(r),
      athleteId: String(r.athlete_id ?? ''),
      athleteName: String(r.athlete_name ?? ''),
      createdByName: (r.created_by_name as string) ?? null,
    })),
  };
}
