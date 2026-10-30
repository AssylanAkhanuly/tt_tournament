/** «Коновалов Сергей Геннадьевич» → «Коновалов С. Г.» ✳ (30.10.2026, решение
 *  владельца продукта): в матчах фамилия целиком, имя и отчество — инициалами.
 *  Одно слово остаётся как есть. */
export function shortName(full: string): string {
  const [family, ...rest] = full.trim().split(/\s+/);
  if (!family) return '';
  const initials = rest.filter(Boolean).map((w) => w[0].toUpperCase() + '.');
  return [family, ...initials].join(' ');
}
