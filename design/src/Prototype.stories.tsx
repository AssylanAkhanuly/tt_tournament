import type { Meta, StoryObj } from '@storybook/react';
import { FedPrototype, OrgPhonePrototype, OrgPrototype } from './prototype';

/* Живые прототипы ролей: по сайдбару (на телефоне — по таб-бару) можно ходить
   между разделами, как в настоящем приложении. Экраны те же, что в статичных
   флоу-бордах рядом. */
const meta: Meta = {
  title: 'Веб/Прототип',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type S = StoryObj;

export const ГлавныйСудья: S = { name: 'Главный судья · десктоп', render: () => <OrgPrototype /> };
export const ГлавныйСудьяАльбом: S = {
  name: 'Главный судья · планшет-альбом',
  render: () => <OrgPrototype variant="land" />,
  parameters: { layout: 'centered' },
};
export const ГлавныйСудьяТелефон: S = {
  name: 'Главный судья · телефон',
  render: () => <OrgPhonePrototype />,
  parameters: { layout: 'centered' },
};
export const Федерация: S = { name: 'Федерация · десктоп', render: () => <FedPrototype /> };
export const ФедерацияАльбом: S = {
  name: 'Федерация · планшет-альбом',
  render: () => <FedPrototype variant="land" />,
  parameters: { layout: 'centered' },
};
