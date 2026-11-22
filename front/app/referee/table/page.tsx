/* Кабинет судьи: «Мой стол» ✳ (22.11.2026, flows/09 Э9.2). */

import type { Metadata } from 'next';
import { RefereeTableView } from '@/views/referee';

export const metadata: Metadata = { title: 'Мой стол — ФНТ РК' };

export default function Page() {
  return <RefereeTableView />;
}
