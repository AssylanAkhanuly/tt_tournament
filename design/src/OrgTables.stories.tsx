import type { Meta, StoryObj } from '@storybook/react';
import { TablesScreen, TablesTablet, TablesMobile } from './OrgTables';

/* Веб → Главный судья · Столы: распределение матчей по столам. 4 раскладки. */
const meta: Meta = {
  title: 'Веб/Главный судья/Столы',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type S = StoryObj;

export const Десктоп: S = { render: () => <TablesScreen /> };
export const Таблет: S = { render: () => <TablesTablet />, parameters: { layout: 'centered' } };
export const ТаблетАльбом: S = { name: 'Таблет · альбом', render: () => <TablesScreen variant="land" />, parameters: { layout: 'centered' } };
export const Мобилка: S = { render: () => <TablesMobile />, parameters: { layout: 'centered' } };
