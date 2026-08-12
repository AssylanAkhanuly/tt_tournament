/* Раздел «Документы»: требования, роли, архитектура и открытые вопросы прямо в
   Storybook — тем же текстом, что лежит в репозитории (`?raw`, не копия).

   Заголовок и имена историй Storybook читает статическим разбором файла, поэтому
   они строковые литералы, а не собраны из DOCS в цикле. Документ ищем по пути:
   по индексу было бы достаточно вставить один пункт в середину списка, чтобы всё
   разъехалось молча. */

import { DOCS } from './docs';
import { DocPage } from './DocPage';

const byPath = (path: string) => {
  const doc = DOCS.find((d) => d.path === path);
  if (!doc) throw new Error(`Документа ${path} нет в DOCS (src/docs/docs.ts)`);
  return doc;
};

const show = (path: string) => () => <DocPage doc={byPath(path)} />;

export default {
  title: 'Документы',
  parameters: { layout: 'fullscreen' },
};

export const Tz = { name: 'ТЗ — требования', render: show('TZ.md') };
export const Roles = { name: 'Роли и права', render: show('ROLES.md') };
export const Questions = { name: 'Открытые вопросы', render: show('QUESTIONS.md') };
export const Userflow = { name: 'Пользовательские флоу', render: show('USERFLOW.md') };
export const Engine = { name: 'Движок турниров', render: show('ENGINE.md') };
export const Architecture = { name: 'Архитектура', render: show('ARCHITECTURE.md') };
export const Testing = { name: 'Тестирование', render: show('TESTING.md') };
export const DesignSystem = { name: 'Дизайн-система', render: show('design/README.md') };
export const References = { name: 'Референсы', render: show('design/REFERENCES.md') };
export const Brand = { name: 'Логотип ФНТ', render: show('brand/fnt/README.md') };
