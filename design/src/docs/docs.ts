/* Документы проекта, читаемые прямо в Storybook.

   Зачем: документы лежат в корне репозитория, и чтобы их прочитать, нужен доступ
   к git и редактор markdown. Федерация и не-разработчики в команде смотрят
   Storybook — пусть требования, роли и открытые вопросы будут там же, где
   макеты, а не в соседней вкладке GitHub.

   Читаем `?raw` — то есть ТОТ ЖЕ файл, а не копию. Копия неизбежно разъехалась
   бы с оригиналом, а так правка в TZ.md сразу видна на странице. Vite отдаёт
   файлы вне корня проекта, это уже настроено ради `../front/src` и `../brand`. */

import tz from '../../../TZ.md?raw';
import roles from '../../../ROLES.md?raw';
import questions from '../../../QUESTIONS.md?raw';
import architecture from '../../../ARCHITECTURE.md?raw';
import engine from '../../../ENGINE.md?raw';
import testing from '../../../TESTING.md?raw';
import userflow from '../../../USERFLOW.md?raw';
import designReadme from '../../README.md?raw';
import references from '../../REFERENCES.md?raw';
import brandFnt from '../../../brand/fnt/README.md?raw';

export type Doc = {
  /** Имя истории в разделе «Документы» */
  name: string;
  /** Путь к файлу в репозитории — показываем над текстом */
  path: string;
  /** Зачем этот документ, одной строкой */
  hint: string;
  text: string;
};

export const DOCS: Doc[] = [
  {
    name: 'ТЗ',
    path: 'TZ.md',
    hint: 'Требования: как должно работать. Числа и правила бизнес-логики — здесь, а не «см. документ».',
    text: tz,
  },
  {
    name: 'Роли',
    path: 'ROLES.md',
    hint: 'Сводка прав всех четырнадцати ролей: кто что может и чего не может.',
    text: roles,
  },
  {
    name: 'Открытые вопросы',
    path: 'QUESTIONS.md',
    hint: 'Что ещё не решено федерацией. Решили — вопрос уходит отсюда в ТЗ и схемы.',
    text: questions,
  },
  {
    name: 'Архитектура',
    path: 'ARCHITECTURE.md',
    hint: 'Системный дизайн: почему так, а не иначе. Технический документ.',
    text: architecture,
  },
  {
    name: 'Движок турниров',
    path: 'ENGINE.md',
    hint: 'Контракт и поведение своего движка: сетки, посев, ход турнира.',
    text: engine,
  },
  {
    name: 'Пользовательские флоу',
    path: 'USERFLOW.md',
    hint: 'Сценарии сквозь роли: как турнир проходит от заявки до протокола.',
    text: userflow,
  },
  {
    name: 'Тестирование',
    path: 'TESTING.md',
    hint: 'Подход к проверке: TDD на движке и рейтинге, e2e на вебе и мобилке.',
    text: testing,
  },
  {
    name: 'Дизайн-система',
    path: 'design/README.md',
    hint: 'Как устроен этот Storybook: разделы, токены, темы, примитивы, проверки.',
    text: designReadme,
  },
  {
    name: 'Референсы',
    path: 'design/REFERENCES.md',
    hint: 'На чём стоит локап бренда. Живая версия — соседний раздел «Дизайн-система → Референсы».',
    text: references,
  },
  {
    name: 'Логотип ФНТ',
    path: 'brand/fnt/README.md',
    hint: 'Знак федерации: что за файлы, чем отличаются и как получен вектор.',
    text: brandFnt,
  },
];
