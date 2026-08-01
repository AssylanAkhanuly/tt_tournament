/* Набор шрифтов для примерки макетов. Переключается в тулбаре Storybook
   («Шрифт») — декоратор подменяет токен `--font`, а на нём сидят все экраны
   (`gen/frame.css`, `gen/desktop.css`, `tokens.css`).

   Отбор: только гарнитуры с кириллицей — макеты русскоязычные. Загрузка —
   Google Fonts в `.storybook/preview-head.html`; без интернета остаётся
   системный шрифт. */

export type FontId =
  | 'system'
  | 'inter'
  | 'manrope'
  | 'onest'
  | 'golos'
  | 'plex'
  | 'rubik'
  | 'roboto'
  | 'noto';

export type FontOption = {
  id: FontId;
  /** подпись в тулбаре и в специмене */
  label: string;
  /** значение токена --font */
  stack: string;
  /** чем гарнитура отличается — для страницы «Шрифты» */
  note: string;
};

const FALLBACK = '-apple-system, "Segoe UI", Roboto, Arial, sans-serif';

export const FONTS: FontOption[] = [
  {
    id: 'system',
    label: 'Системный',
    stack: FALLBACK,
    note: 'Как сейчас в токенах: шрифт ОС, ничего не грузится.',
  },
  {
    id: 'inter',
    label: 'Inter',
    stack: `Inter, ${FALLBACK}`,
    note: 'Нейтральный интерфейсный стандарт, крупный очковый размер, хорошо читается мелким.',
  },
  {
    id: 'manrope',
    label: 'Manrope',
    stack: `Manrope, ${FALLBACK}`,
    note: 'Геометричный, чуть характернее Inter; заголовки выглядят современно.',
  },
  {
    id: 'onest',
    label: 'Onest',
    stack: `Onest, ${FALLBACK}`,
    note: 'Кириллица «родная» (делался под русский), спокойный и плотный.',
  },
  {
    id: 'golos',
    label: 'Golos Text',
    stack: `"Golos Text", ${FALLBACK}`,
    note: 'Российская гарнитура, гротеск с широкими формами — хорош в таблицах.',
  },
  {
    id: 'plex',
    label: 'IBM Plex Sans',
    stack: `"IBM Plex Sans", ${FALLBACK}`,
    note: 'Строгий «инженерный» тон, отличные цифры для счёта и рейтинга.',
  },
  {
    id: 'rubik',
    label: 'Rubik',
    stack: `Rubik, ${FALLBACK}`,
    note: 'Скруглённый, дружелюбный — ближе к спортивно-массовому продукту.',
  },
  {
    id: 'roboto',
    label: 'Roboto',
    stack: `Roboto, ${FALLBACK}`,
    note: 'Дефолт Android; полезен как проверка «как будет на телефоне».',
  },
  {
    id: 'noto',
    label: 'Noto Sans',
    stack: `"Noto Sans", ${FALLBACK}`,
    note: 'Максимально широкое покрытие языков (кириллица + казахские буквы).',
  },
];

export const DEFAULT_FONT: FontId = 'system';

export const fontStack = (id: unknown): string =>
  FONTS.find((f) => f.id === id)?.stack ?? FALLBACK;
