/* Главная по образцу ✳ (21.11.2026, решение владельца продукта: «точная копия
   образца, потом заменяем по частям»). Моноширинная гарнитура образца —
   только для этой страницы, переменной `--font-home`. */

import { JetBrains_Mono } from 'next/font/google';

const mono = JetBrains_Mono({ subsets: ['latin', 'cyrillic'], variable: '--font-home', display: 'swap' });

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <div className={mono.variable}>{children}</div>;
}
