import type { Meta, StoryObj } from '@storybook/react';
import { RefereeDesktop } from './DesktopReferee';
import { RefereeMobile, RefereeTablet } from './RefereeResponsive';

/* Веб → Главный судья. Адаптив: одна панель живого ведения турнира в раскладках
   десктоп / планшет (портрет) / планшет-альбом / мобилка — правило design/README.md. */
const meta: Meta = {
  title: 'Веб/Главный судья/Обзор',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type S = StoryObj;

export const Десктоп: S = { render: () => <RefereeDesktop /> };
export const Таблет: S = { render: () => <RefereeTablet />, parameters: { layout: 'centered' } };
export const ТаблетАльбом: S = { name: 'Таблет · альбом', render: () => <RefereeDesktop variant="land" />, parameters: { layout: 'centered' } };
export const Мобилка: S = { render: () => <RefereeMobile />, parameters: { layout: 'centered' } };
