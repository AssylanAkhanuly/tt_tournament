import type { Meta, StoryObj } from '@storybook/react';
/* Компонент лежит в ReferenceBoard.tsx, а не References.tsx: на Windows он
   схлопывался бы с `references.ts` — данными. Как с FontSpecimen рядом. */
import { ReferenceBoard } from './ReferenceBoard';

/* На чём стоит локап ФНТ РК: 82 экрана из Mobbin, выводы и что из них внедрено.
   Сравнение «было / стало» здесь живое — рисуется тем же <Brand>, что и в
   макетах, поэтому не устареет вслед за компонентом. */
const meta: Meta<typeof ReferenceBoard> = {
  title: 'Дизайн-система/Референсы',
  component: ReferenceBoard,
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const Разбор: StoryObj<typeof ReferenceBoard> = {};
