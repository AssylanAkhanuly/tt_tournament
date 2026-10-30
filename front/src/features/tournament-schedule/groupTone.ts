/* Цвет группы ✳ (30.10.2026, решение владельца продукта): у группы один цвет во
   всех видах расписания — блок матча в «Дне», метка группы в «Матчах», шапка
   таблицы в «Группах», — чтобы глаз связывал их без подписи. Цвет — по порядку
   группы (A — первый); палитра повторяется после восьмой. Классы целиком, а не
   склейкой: Tailwind находит только написанные полностью. */

const TONES = [
  { block: 'border-blue-300 bg-blue-50 text-blue-900', chip: 'bg-blue-100 text-blue-800', bar: 'bg-blue-500', head: 'bg-blue-50' },
  { block: 'border-green-300 bg-green-50 text-green-900', chip: 'bg-green-100 text-green-800', bar: 'bg-green-500', head: 'bg-green-50' },
  { block: 'border-amber-300 bg-amber-50 text-amber-900', chip: 'bg-amber-100 text-amber-800', bar: 'bg-amber-500', head: 'bg-amber-50' },
  { block: 'border-violet-300 bg-violet-50 text-violet-900', chip: 'bg-violet-100 text-violet-800', bar: 'bg-violet-500', head: 'bg-violet-50' },
  { block: 'border-rose-300 bg-rose-50 text-rose-900', chip: 'bg-rose-100 text-rose-800', bar: 'bg-rose-500', head: 'bg-rose-50' },
  { block: 'border-cyan-300 bg-cyan-50 text-cyan-900', chip: 'bg-cyan-100 text-cyan-800', bar: 'bg-cyan-500', head: 'bg-cyan-50' },
  { block: 'border-lime-300 bg-lime-50 text-lime-900', chip: 'bg-lime-100 text-lime-800', bar: 'bg-lime-500', head: 'bg-lime-50' },
  { block: 'border-orange-300 bg-orange-50 text-orange-900', chip: 'bg-orange-100 text-orange-800', bar: 'bg-orange-500', head: 'bg-orange-50' },
] as const;

export type GroupTone = (typeof TONES)[number];

/** Цвет группы по её id — по месту в списке групп расписания. */
export function groupTone(groups: { id: number }[], groupId: number): GroupTone {
  return TONES[Math.max(0, groups.findIndex((g) => g.id === groupId)) % TONES.length];
}
