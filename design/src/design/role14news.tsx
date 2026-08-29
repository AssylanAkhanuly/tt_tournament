/* Э14.13 «Новости» и Э14.14 «Новость» в языке присланного референса
   (29.08.2026).

   Референс — спортивное новостное приложение. Что из него взято:

     лента     — крупная карточка первого материала, ниже сетка карточек с
                 обложкой, чипом темы и датой, ещё ниже строки с миниатюрой;
     материал  — возврат над заголовком, крупный заголовок, строка «дата ·
                 автор · сколько читать», обложка во всю ширину, текст
                 абзацами с жирными врезками, плавающая пилюля внизу.

   С 29.08.2026 копия сделана ПОЛНОЙ — по прямой просьбе. Поэтому вернулись
   две вещи, которых в первой версии не было:

     — **фильтры**: лента чипов по темам и полоса круглых обложек турниров.
       Это отменяет прежнее решение по Э14.13 «фильтра по темам на экране нет»
       (спортсмен читает ленту сверху вниз). Отмена записана в
       `flows/14-sportsmen.md`, чтобы решение не разъехалось молча;
     — **карусели**: карточка идущего матча с точками-перелистыванием в шапке и
       «Главное» горизонтальной лентой карточек. Матч в шапке дублирует «Мой
       турнир» (Э14.5) — цена, принятая осознанно ради полноты копии.

   Что по-прежнему НЕ взято:

     — пилюля с лайками, комментариями и закладками. Их в системе нет:
       материалы ведёт федерация, спортсмен читает. Форма пилюли сохранена, но
       внутри неё — **ссылка по делу**, которую Э14.14 и требует: новость почти
       всегда про то, что в системе есть, и ссылка ведёт туда.

   Обложек у федерации пока нет ни одной. В макете стоят настоящие фотографии
   настольного тенниса с Wikimedia Commons — предметные и залы, БЕЗ узнаваемых
   людей: фото названного спортсмена под выдуманную новость ставить нельзя.
   Источники и лицензии — `src/assets/news/CREDITS.md`. Настоящие обложки
   кладёт редакция через Э1.14.

   Цвета — палитра самого референса (`--n-*` в tokens.css), а не системная:
   активный чип почти чёрный, карточка идущего матча синяя с белой подписью,
   тема материала — оранжевая пилюля. Это осознанное отступление от системного
   правила «подпись на акценте тёмная», записанное в flows/14-sportsmen.md.

   Цвет и радиусы — те же токены, что у профиля и аналитики (`--d-*`,
   `--r-d-*`), чтобы роль читалась одной системой. */

import { ArrowLeft, ArrowRight, CalendarDays, ChevronRight, Search } from 'lucide-react';
import { RoleScreen } from '../mockups/shell';
import { R14 } from '../mockups/roles';
import type { DeskVariant } from '../deskShell';
import { A } from '../fedCommon';
import coverBats from '../assets/news/bats-net.jpg';
import coverNet from '../assets/news/net.jpg';
import coverTop from '../assets/news/racquet-top.jpg';
import coverSide from '../assets/news/racquet-net.jpg';
import coverBalls from '../assets/news/balls.jpg';
import { Frame } from '../PlayerApp';
import { MiniTabBar } from '../respShell';
import { Chrome, NAV } from './role14mobile';
import './role14news.css';

type Item = {
  tag: string;
  nm: string;
  ss: string;
  at: string;
  by: string;
  cover: string;
};

/** Лента. Содержание — то же, что в прежнем макете новостей: тема, заголовок,
    лид, дата и кто опубликовал. */
const FEED: Item[] = [
  {
    tag: 'Календарь',
    nm: 'Календарь сезона 2026 опубликован',
    ss: 'Восемь главных стартов, четыре тура Евразийской лиги и двадцать открытых республиканских турниров.',
    at: '15 апреля',
    by: 'Пресс-служба ФНТ РК',
    cover: coverTop,
  },
  {
    tag: 'Взносы',
    nm: 'Годовой взнос: срок до 31 марта',
    ss: 'Без оплаты заявки на турниры, где взнос обязателен, не проходят.',
    at: '2 марта',
    by: 'Исполком',
    cover: coverBalls,
  },
  {
    tag: 'Сборная',
    nm: 'Состав на чемпионат Азии объявлен',
    ss: 'Двенадцать спортсменов, сбор в Астане с 4 июня.',
    at: '28 февраля',
    by: 'Тренерский совет',
    cover: coverBats,
  },
  {
    tag: 'Рейтинг',
    nm: 'Рейтинг пересчитан после Кубка Алматы',
    ss: 'Изменения коснулись первой полусотни; таблица обновлена в тот же день.',
    at: '20 февраля',
    by: 'Пресс-служба ФНТ РК',
    cover: coverNet,
  },
  {
    tag: 'Документы',
    nm: 'Положение о судействе: новая редакция',
    ss: 'Уточнены допуск судей и порядок назначения на главные старты.',
    at: '11 февраля',
    by: 'Судейская коллегия',
    cover: coverSide,
  },
];

/** Чипы-фильтры по темам — как «Football / Basketball» в референсе. */
const TOPICS = ['Все', 'Календарь', 'Взносы', 'Сборная', 'Рейтинг', 'Документы'];

/** Полоса круглых обложек — в референсе это лиги и клубы, у нас турниры
    сезона: новость почти всегда про турнир, и это второй способ отфильтровать
    ленту. */
const TOURS: { nm: string; av: string }[] = [
  { nm: 'Кубок Алматы', av: coverTop },
  { nm: 'Чемпионат РК', av: coverBalls },
  { nm: 'Евразийская лига', av: coverBats },
  { nm: 'Первенство РК', av: coverNet },
  { nm: 'Кубок Астаны', av: coverSide },
];

/** Идущий матч в шапке ленты — «Live» референса. Карусель: матчей может идти
    несколько, точки под карточкой перелистывают их. */
const LIVE = {
  tour: 'Кубок Алматы 2026',
  stage: '1/8 финала',
  me: { nm: 'Ким Г.', club: 'СКА · Астана', av: A(44) },
  rival: { nm: 'Оспанов Р.', club: 'Шахтёр · Караганда', av: A(12) },
  score: '1:2',
  at: '3-я партия',
};

/** Текст материала: абзацы с жирной врезкой в начале — приём референса. */
const BODY: [string, string][] = [
  [
    'Что опубликовано.',
    'Календарь сезона 2026 собран целиком: восемь главных стартов, четыре тура Евразийской лиги и двадцать открытых республиканских турниров. У каждого турнира указаны город, зал, разряды и срок приёма заявок.',
  ],
  [
    'Что меняется для спортсмена.',
    'Заявки на открытые республиканские турниры подаются самостоятельно — прямо из календаря. На главные старты по-прежнему заявляет старший тренер региона, в Лигу — клуб.',
  ],
  [
    'На что обратить внимание.',
    'Сроки приёма заявок у весенних турниров короче обычного: от объявления до закрытия — десять дней. Годовой взнос при этом должен быть оплачен, иначе заявка не пройдёт.',
  ],
];

/* ── Куски, общие для десктопа и телефона ───────────────────────── */

const Tag = ({ t }: { t: string }) => <span className="nw-tag">{t}</span>;

const CardItem = ({ n }: { n: Item }) => (
  <article className="nw-card" data-to="Э14.14">
    <img src={n.cover} alt="" />
    <div className="tx">
      <div className="cap">
        <Tag t={n.tag} />
        <span className="at">{n.at}</span>
      </div>
      <h3>{n.nm}</h3>
      <p>{n.ss}</p>
    </div>
  </article>
);

/** Строка с миниатюрой — как «Highlights» в референсе. */
const RowItem = ({ n }: { n: Item }) => (
  <article className="nw-row" data-to="Э14.14">
    <img src={n.cover} alt="" />
    <span className="tx">
      <span className="nm">{n.nm}</span>
      <span className="ss">
        {n.tag} · {n.at} · {n.by}
      </span>
    </span>
    <ChevronRight size={17} className="ch" />
  </article>
);

/** Строка поиска и фото — верх ленты в референсе. */
const TopBar = () => (
  <div className="nw-top">
    <span className="nw-search">
      <Search size={16} />
      Поиск по новостям
    </span>
    <img src={A(44)} alt="" />
  </div>
);

const Topics = () => (
  <div className="nw-chips">
    {TOPICS.map((t, i) => (
      <button type="button" className={'nw-chip' + (i === 0 ? ' on' : '')} key={t}>
        {t}
      </button>
    ))}
  </div>
);

const Tours = () => (
  <div className="nw-tours">
    {TOURS.map((t) => (
      <button type="button" className="nw-tour" key={t.nm}>
        <span className="ring">
          <img src={t.av} alt="" />
        </span>
        <span className="nm">{t.nm}</span>
      </button>
    ))}
  </div>
);

/** Карточка идущего матча — «Live» референса: залитая акцентом, соперники по
    краям, счёт посередине. Под ней точки: матчей может идти несколько. */
const Live = () => (
  <>
    <div className="nw-live" data-to="Э14.5">
      <div className="cap">
        <span className="dot" /> Идёт
        <b>{LIVE.tour}</b>
        <span className="wk">{LIVE.stage}</span>
      </div>
      <div className="mid">
        <span className="side">
          <img src={LIVE.me.av} alt="" />
          <span className="nm">{LIVE.me.nm}</span>
        </span>
        <span className="sc">
          <b className="o14-disp">{LIVE.score}</b>
          <span className="at">{LIVE.at}</span>
        </span>
        <span className="side">
          <img src={LIVE.rival.av} alt="" />
          <span className="nm">{LIVE.rival.nm}</span>
        </span>
      </div>
    </div>
    <div className="nw-dots">
      <i className="on" />
      <i />
      <i />
    </div>
  </>
);

/** Заголовок раздела со ссылкой «Показать все» — как «See More». */
const SecMore = ({ cap }: { cap: string }) => (
  <div className="nw-sec">
    {cap}
    <a className="more">Показать все</a>
  </div>
);

const More = () => (
  <button type="button" className="nw-more">
    Показать ещё
  </button>
);

/* ═══ Э14.13 · Новости — десктоп ═══════════════════════════════════ */
export function News({ variant }: { variant?: DeskVariant } = {}) {
  const [lead, ...rest] = FEED;
  return (
    <RoleScreen variant={variant} role={R14} nav="Новости" title="Новости">
      <div className="nw o14-nohead">
        <TopBar />
        <Topics />
        <Tours />
        <Live />

        <SecMore cap="Главное" />
        {/* Карусель: карточки лентой с горизонтальной прокруткой, как
            «Trending Now» в референсе. */}
        <div className="nw-carousel">
          <CardItem n={lead} key={lead.nm} />
          {rest.slice(0, 3).map((n) => (
            <CardItem n={n} key={n.nm} />
          ))}
        </div>

        <SecMore cap="Ещё материалы" />
        <div className="nw-rows">
          {rest.slice(1).map((n) => (
            <RowItem n={n} key={n.nm} />
          ))}
        </div>

        <More />
      </div>
    </RoleScreen>
  );
}

/* ═══ Э14.14 · Новость — десктоп ═══════════════════════════════════ */
export function Article({ variant }: { variant?: DeskVariant } = {}) {
  const n = FEED[0];
  return (
    <RoleScreen variant={variant} role={R14} nav="Новости" title="Новость">
      <div className="nw nw-art o14-nohead">
        <button type="button" className="nw-back" data-to="Э14.13">
          <ArrowLeft size={15} /> Новости
        </button>

        <article className="nw-read">
          <Tag t={n.tag} />
          <h1 className="o14-disp">{n.nm}</h1>
          <div className="meta">
            {n.at} 2026 · {n.by} · 3 мин чтения
          </div>

          <img className="hero" src={n.cover} alt="" />

          {BODY.map(([lead, text]) => (
            <p key={lead}>
              <b>{lead}</b> {text}
            </p>
          ))}
        </article>

        {/* Пилюля из референса, но внутри — ссылка по делу: новость почти
            всегда про то, что в системе есть (Э14.14). */}
        <div className="nw-pill" data-to="Э14.2">
          <CalendarDays size={17} />
          <span>Открыть календарь сезона</span>
          <ArrowRight size={16} />
        </div>

        <div className="nw-sec">Читайте дальше</div>
        <div className="nw-grid">
          {FEED.slice(1, 4).map((x) => (
            <CardItem n={x} key={x.nm} />
          ))}
        </div>
      </div>
    </RoleScreen>
  );
}

/* ═══ Телефон ══════════════════════════════════════════════════════ */
function Phone({ cls, children }: { cls: string; children: React.ReactNode }) {
  return (
    <div className={'mb-wrap m5 nw nwm ' + cls}>
      <Frame>
        <Chrome bare>
          <div className="mb-body m5-body">{children}</div>
        </Chrome>
        <MiniTabBar items={NAV} active="Главная" />
      </Frame>
    </div>
  );
}

export function NewsPhone() {
  const [lead, ...rest] = FEED;
  return (
    <Phone cls="nwm-feed">
      <TopBar />
      <Topics />
      <Tours />
      <Live />

      <SecMore cap="Главное" />
      <div className="nw-carousel">
        <CardItem n={lead} key={lead.nm} />
        {rest.slice(0, 3).map((n) => (
          <CardItem n={n} key={n.nm} />
        ))}
      </div>

      <SecMore cap="Ещё материалы" />
      <div className="nw-rows">
        {rest.slice(1).map((n) => (
          <RowItem n={n} key={n.nm} />
        ))}
      </div>
      <More />
    </Phone>
  );
}

export function ArticlePhone() {
  const n = FEED[0];
  return (
    <Phone cls="nwm-art">
      <button type="button" className="nw-back" data-to="Э14.13">
        <ArrowLeft size={14} /> Новости
      </button>

      <article className="nw-read">
        <Tag t={n.tag} />
        <h1 className="o14-disp">{n.nm}</h1>
        <div className="meta">
          {n.at} 2026 · {n.by} · 3 мин
        </div>
        <img className="hero" src={n.cover} alt="" />
        {BODY.map(([lead, text]) => (
          <p key={lead}>
            <b>{lead}</b> {text}
          </p>
        ))}
      </article>

      <div className="nw-pill" data-to="Э14.2">
        <CalendarDays size={16} />
        <span>Открыть календарь</span>
        <ArrowRight size={15} />
      </div>
    </Phone>
  );
}
