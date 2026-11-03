'use client';

/* Разделы председателя ГСК (выпуски, апелляции, журнал, калибровка): гостя и
   чужую роль уводим на вход с возвратом сюда. Это место экрана в кабинете, а
   не граница прав — права проверяет сервер на каждой ручке. */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSession } from '@/entities/session';

/** Вошёл ли председатель; пока сессия грузится — `false`, экран ждёт. */
export function useChairmanOnly(path: string): boolean {
  const router = useRouter();
  const { loading, isGskChairman } = useSession();
  useEffect(() => {
    if (!loading && !isGskChairman) router.replace('/login?next=' + encodeURIComponent(path));
  }, [loading, isGskChairman, path, router]);
  return !loading && isGskChairman;
}
