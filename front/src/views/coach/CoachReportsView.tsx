'use client';

/* «Рапорты» старшего тренера региона ✳ (19.11.2026, NATIONAL.md; Э12.8 →
   Э11.4): рапорты на командирование на спортсменов своего региона по
   мероприятиям календаря подготовки сборной; свои рапорты, их состояние и
   история, доработка возвращённых. Тот же виджет, что у тренерского штаба. */

import { ReportsBoard } from '@/widgets/national';

import { CoachShell } from './CoachShell';

export function CoachReportsView() {
  return (
    <CoachShell active="Рапорты" bleed>
      <ReportsBoard canWrite />
    </CoachShell>
  );
}
