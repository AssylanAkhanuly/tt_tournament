/* Набор шрифтов для примерки макетов. Переключается в тулбаре Storybook
   («Шрифт») — декоратор подменяет токен `--font`, а на нём сидит вся вёрстка
   экранов (`gen/frame.css`, `gen/desktop.css`, `tokens.css`).

   Отбор — только гарнитуры, у которых есть кириллица **и казахские буквы**
   (ә ғ қ ң ө ұ ү һ і): у нас имена вроде «Оспанова Әсем». Проверялось по
   unicode-range в ответе Google Fonts, поэтому в списке нет, например, Bebas
   Neue и Anton (нет кириллицы) и Jost (кириллица есть, казахских букв нет).

   Отдельная группа — «Под знак ФНТ»: надпись TTFRK на логотипе набрана тяжёлым
   узким гротеском (плоские окончания, щелевидные просветы, прямая отлётная нога
   у R). Ближайшие аналоги этого класса — Anton, Archivo Black, Barlow Condensed,
   Saira Condensed — кириллицы не имеют вовсе, поэтому в группе только те узкие
   тяжёлые, что тянут казахский. См. brand/fnt/README.md.

   Начертания просим одним набором `400;500;600;700;800` — Google отдаёт то, что
   есть, и не падает: у PT Sans и Play реально только 400/700, остальные веса
   браузер дорисует сам (для примерки это нормально).

   Список — единственный источник: ссылка на Google Fonts собирается отсюда
   (`GOOGLE_FONTS_URL`), поэтому добавить гарнитуру = добавить строчку сюда. */

export type FontId =
  | 'system'
  | 'inter' | 'onest' | 'golos' | 'commissioner' | 'geologica' | 'manrope'
  | 'madefor' | 'plex' | 'rubik' | 'nunito' | 'ptsans' | 'fira' | 'ubuntu'
  | 'montserrat' | 'roboto' | 'noto'
  | 'firaxcond' | 'firacond' | 'ptnarrow' | 'cuprum' | 'alumni' | 'ubuntucond'
  | 'yanone' | 'tektur'
  | 'oswald' | 'robotocond' | 'unbounded' | 'exo2' | 'play'
  | 'ptserif' | 'lora' | 'sourceserif'
  | 'jetbrains';

/** Раздел в тулбаре и в специмене */
export type FontGroup =
  | 'Системный' | 'Гротески' | 'Под знак ФНТ' | 'Дисплейные' | 'Серифные' | 'Моноширинные';

export type FontOption = {
  id: FontId;
  /** подпись в тулбаре и в специмене */
  label: string;
  group: FontGroup;
  /** имя семейства для Google Fonts; пусто — грузить не надо */
  family: string;
  /** чем гарнитура отличается — для страницы «Шрифты» */
  note: string;
};

/* `system-ui` первым — обязательно: в списке есть Roboto, его @font-face
   загружается всегда, и без `system-ui` вариант «Системный» на десктопе без
   установленного Roboto подхватывал бы веб-Roboto и врал. На Android
   `system-ui` — тот же Roboto, поведение не меняется. */
const FALLBACK = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

export const FONTS: FontOption[] = [
  { id: 'system', label: 'Системный', group: 'Системный', family: '',
    note: 'Как сейчас в токенах: шрифт ОС, ничего не грузится. На Windows Segoe UI, на Mac — SF.' },

  // — интерфейсные гротески: основной кандидат на рабочий шрифт платформы —
  { id: 'inter', label: 'Inter', group: 'Гротески', family: 'Inter',
    note: 'Нейтральный интерфейсный стандарт, крупный очковый размер, хорошо читается мелким.' },
  { id: 'onest', label: 'Onest', group: 'Гротески', family: 'Onest',
    note: 'Кириллица «родная» (рисовался под русский), спокойный и плотный.' },
  { id: 'golos', label: 'Golos Text', group: 'Гротески', family: 'Golos Text',
    note: 'Российская гарнитура, широкие формы — хорош в таблицах и списках.' },
  { id: 'commissioner', label: 'Commissioner', group: 'Гротески', family: 'Commissioner',
    note: 'Кириллица от кириллического же дизайнера, чуть гуманистичнее Inter.' },
  { id: 'geologica', label: 'Geologica', group: 'Гротески', family: 'Geologica',
    note: 'Современный гротеск с плотным ритмом; цифры заметно «инженерные».' },
  { id: 'manrope', label: 'Manrope', group: 'Гротески', family: 'Manrope',
    note: 'Геометричный, характернее Inter; заголовки выглядят современно.' },
  { id: 'madefor', label: 'Wix Madefor Text', group: 'Гротески', family: 'Wix Madefor Text',
    note: 'Сделан под интерфейсы: крупные внутрибуквенные просветы, ровный мелкий текст.' },
  { id: 'plex', label: 'IBM Plex Sans', group: 'Гротески', family: 'IBM Plex Sans',
    note: 'Строгий «инженерный» тон, отличные цифры для счёта и рейтинга.' },
  { id: 'rubik', label: 'Rubik', group: 'Гротески', family: 'Rubik',
    note: 'Скруглённый, дружелюбный — ближе к спортивно-массовому продукту.' },
  { id: 'nunito', label: 'Nunito Sans', group: 'Гротески', family: 'Nunito Sans',
    note: 'Мягкий и округлый, но без инфантильности; хорош для мобильного приложения.' },
  { id: 'ptsans', label: 'PT Sans', group: 'Гротески', family: 'PT Sans',
    note: 'Классика госпроектов на кириллице; узнаваемо-нейтрально, только 400/700.' },
  { id: 'fira', label: 'Fira Sans', group: 'Гротески', family: 'Fira Sans',
    note: 'Гуманистичный, слегка суженный — экономит место в длинных ФИО.' },
  { id: 'ubuntu', label: 'Ubuntu Sans', group: 'Гротески', family: 'Ubuntu Sans',
    note: 'Характерные формы, чуть «технологичный» вид; кириллица крепкая.' },
  { id: 'montserrat', label: 'Montserrat', group: 'Гротески', family: 'Montserrat',
    note: 'Широкий геометрический; заголовки нарядные, мелкий текст расползается.' },
  { id: 'roboto', label: 'Roboto', group: 'Гротески', family: 'Roboto',
    note: 'Дефолт Android; полезен как проверка «как это будет на телефоне».' },
  { id: 'noto', label: 'Noto Sans', group: 'Гротески', family: 'Noto Sans',
    note: 'Максимально широкое покрытие языков — запасной вариант без сюрпризов.' },

  /* — под знак ФНТ: узкие тяжёлые гротески, родня надписи TTFRK на логотипе.
       Сравнивать удобно на странице «Шрифты» — там знак стоит рядом. — */
  { id: 'firaxcond', label: 'Fira Sans Extra Condensed', group: 'Под знак ФНТ', family: 'Fira Sans Extra Condensed',
    note: 'Ближе всех к TTFRK по пропорциям: сильно сужен, на 800 плотность как у знака.' },
  { id: 'firacond', label: 'Fira Sans Condensed', group: 'Под знак ФНТ', family: 'Fira Sans Condensed',
    note: 'То же, но чуть шире — читаемее в подзаголовках, ещё держит характер знака.' },
  { id: 'ptnarrow', label: 'PT Sans Narrow', group: 'Под знак ФНТ', family: 'PT Sans Narrow',
    note: 'Узкий госстиль, парный к PT Sans из гротесков; только 400/700.' },
  { id: 'cuprum', label: 'Cuprum', group: 'Под знак ФНТ', family: 'Cuprum',
    note: 'Спортивный узкий гротеск, привычен по российским соревнованиям.' },
  { id: 'alumni', label: 'Alumni Sans', group: 'Под знак ФНТ', family: 'Alumni Sans',
    note: 'Очень узкий «атлетический», как на майках и табло; для мелкого текста не годится.' },
  { id: 'ubuntucond', label: 'Ubuntu Condensed', group: 'Под знак ФНТ', family: 'Ubuntu Condensed',
    note: 'Узкий с характерными срезами; одно начертание 400, жирный синтезируется.' },
  { id: 'yanone', label: 'Yanone Kaffeesatz', group: 'Под знак ФНТ', family: 'Yanone Kaffeesatz',
    note: 'Узкий с заметным характером — заголовочный, в интерфейсе будет спорить со знаком.' },

  // — дисплейные: заголовки, табло, афиши турниров —
  { id: 'tektur', label: 'Tektur', group: 'Дисплейные', family: 'Tektur',
    note: 'Техно-дисплейный с рублеными углами; кириллица и казахский на месте.' },
  { id: 'oswald', label: 'Oswald', group: 'Дисплейные', family: 'Oswald',
    note: 'Узкий гротеск афишного типа — спортивные заголовки и табло; для текста не годится.' },
  { id: 'robotocond', label: 'Roboto Condensed', group: 'Дисплейные', family: 'Roboto Condensed',
    note: 'Сжатый — влезает много в узкие колонки турнирной сетки.' },
  { id: 'unbounded', label: 'Unbounded', group: 'Дисплейные', family: 'Unbounded',
    note: 'Яркий дисплейный, сильный характер; уместен только в крупных заголовках.' },
  { id: 'exo2', label: 'Exo 2', group: 'Дисплейные', family: 'Exo 2',
    note: 'Техно-спортивная манера, часто берут для киберспорта и соревнований.' },
  { id: 'play', label: 'Play', group: 'Дисплейные', family: 'Play',
    note: 'Сжатый техничный гротеск, читается как «спортивная трансляция», только 400/700.' },

  // — серифные: новости, положения, документы —
  { id: 'ptserif', label: 'PT Serif', group: 'Серифные', family: 'PT Serif',
    note: 'Парный к PT Sans; для новостей и текстов положений.' },
  { id: 'lora', label: 'Lora', group: 'Серифные', family: 'Lora',
    note: 'Контрастная антиква, «редакционный» тон — длинные новости.' },
  { id: 'sourceserif', label: 'Source Serif 4', group: 'Серифные', family: 'Source Serif 4',
    note: 'Спокойная антиква с хорошим экранным рендерингом.' },

  // — моноширинный: как выглядят счёт и рейтинг на табличных цифрах —
  { id: 'jetbrains', label: 'JetBrains Mono', group: 'Моноширинные', family: 'JetBrains Mono',
    note: 'Проверка «а если цифры моноширинные»: счёт и рейтинг встают идеальной колонкой.' },
];

export const DEFAULT_FONT: FontId = 'system';

export const FONT_GROUPS: FontGroup[] = [
  'Системный', 'Гротески', 'Под знак ФНТ', 'Дисплейные', 'Серифные', 'Моноширинные',
];

/** значение токена --font для гарнитуры */
export const stackOf = (f: FontOption): string =>
  f.family ? `"${f.family}", ${FALLBACK}` : FALLBACK;

export const fontStack = (id: unknown): string => {
  const f = FONTS.find((x) => x.id === id);
  return f ? stackOf(f) : FALLBACK;
};

const WEIGHTS = 'wght@400;500;600;700;800';

/** Одна ссылка на все гарнитуры списка — собирается из FONTS, чтобы не разъезжалось. */
export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?' +
  FONTS.filter((f) => f.family)
    .map((f) => `family=${encodeURIComponent(`${f.family}:${WEIGHTS}`).replace(/%20/g, '+')}`)
    .join('&') +
  '&display=swap';

/** Вешает <link> с гарнитурами один раз на документ превью. */
export function ensureFontsLoaded(doc: Document = document): void {
  const ID = 'ttfrk-google-fonts';
  if (doc.getElementById(ID)) return;
  for (const href of ['https://fonts.googleapis.com', 'https://fonts.gstatic.com']) {
    const pre = doc.createElement('link');
    pre.rel = 'preconnect';
    pre.href = href;
    if (href.includes('gstatic')) pre.crossOrigin = '';
    doc.head.appendChild(pre);
  }
  const link = doc.createElement('link');
  link.id = ID;
  link.rel = 'stylesheet';
  link.href = GOOGLE_FONTS_URL;
  doc.head.appendChild(link);
}
