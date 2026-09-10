/* Вход. Маршрут тонкий: композиция во `views`.

   `Suspense` обязателен: экран читает строку запроса (`?next=`), а без границы
   Next отказывается предрендерить страницу статически. */

import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LoginView } from '@/views/login';

export const metadata: Metadata = {
  title: 'Вход — ФНТ РК',
  description: 'Вход для председателя Главной судейской коллегии.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginView />
    </Suspense>
  );
}
