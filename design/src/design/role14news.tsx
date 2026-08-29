/* Э14.13 «Новости» и Э14.14 «Новость» в языке присланного референса
   (29.08.2026).

   Референс — спортивное новостное приложение. Что из него взято:

     лента     — крупная карточка первого материала, ниже сетка карточек с
                 обложкой, чипом темы и датой, ещё ниже строки с миниатюрой;
     материал  — возврат над заголовком, крупный заголовок, строка «дата ·
                 автор · сколько читать», обложка во всю ширину, текст
                 абзацами с жирными врезками, плавающая пилюля внизу.

   Что НЕ взято и почему:

     — лента чипов-фильтров по видам спорта. По Э14.13 решение уже принято:
       «фильтра по темам на экране нет — спортсмен читает ленту сверху вниз, а
       не ищет в ней по рубрике; тема стоит на каждой карточке». Молча вернуть
       фильтр значит отменить это решение мимо федерации;
     — карточка идущего матча в шапке ленты: у спортсмена для этого есть
       «Мой турнир» (Э14.5) и главная, дублировать их в новостях незачем;
     — пилюля с лайками, комментариями и закладками. Их в системе нет:
       материалы ведёт федерация, спортсмен читает. Форма пилюли сохранена, но
       внутри неё — **ссылка по делу**, которую Э14.14 и требует: новость почти
       всегда про то, что в системе есть, и ссылка ведёт туда.

   Обложек у федерации пока нет ни одной: в макете вместо них фотографии людей
   из общего набора. Настоящие кладёт редакция через Э1.14.

   Цвет и радиусы — те же токены, что у профиля и аналитики (`--d-*`,
   `--r-d-*`), чтобы роль читалась одной системой. */

import { ArrowLeft, ArrowRight, CalendarDays, ChevronRight } from 'lucide-react';
import { RoleScreen } from '../mockups/shell';
import { R14 } from '../mockups/roles';
import type { DeskVariant } from '../deskShell';
import { A, AW } from '../fedCommon';
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
    cover: A(64),
  },
  {
    tag: 'Взносы',
    nm: 'Годовой взнос: срок до 31 марта',
    ss: 'Без оплаты заявки на турниры, где взнос обязателен, не проходят.',
    at: '2 марта',
    by: 'Исполком',
    cover: A(12),
  },
  {
    tag: 'Сборная',
    nm: 'Состав на чемпионат Азии объявлен',
    ss: 'Двенадцать спортсменов, сбор в Астане с 4 июня.',
    at: '28 февраля',
    by: 'Тренерский совет',
    cover: AW(28),
  },
  {
    tag: 'Рейтинг',
    nm: 'Рейтинг пересчитан после Кубка Алматы',
    ss: 'Изменения коснулись первой полусотни; таблица обновлена в тот же день.',
    at: '20 февраля',
    by: 'Пресс-служба ФНТ РК',
    cover: A(31),
  },
  {
    tag: 'Документы',
    nm: 'Положение о судействе: новая редакция',
    ss: 'Уточнены допуск судей и порядок назначения на главные старты.',
    at: '11 февраля',
    by: 'Судейская коллегия',
    cover: A(52),
  },
];

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

/** Крупная карточка первого материала: главное за неделю не должно теряться
    среди одинаковых плиток (требование Э14.13). */
const Lead = ({ n }: { n: Item }) => (
  <article className="nw-lead" data-to="Э14.14">
    <img src={n.cover} alt="" />
    <div className="tx">
      <Tag t={n.tag} />
      <h2 className="o14-disp">{n.nm}</h2>
      <p>{n.ss}</p>
      <div className="at">
        {n.at} · {n.by}
      </div>
    </div>
  </article>
);

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
        <h1 className="nw-h1 o14-disp">Новости федерации</h1>

        <Lead n={lead} />

        <div className="nw-sec">Ещё материалы</div>
        <div className="nw-grid">
          {rest.slice(0, 3).map((n) => (
            <CardItem n={n} key={n.nm} />
          ))}
        </div>

        <div className="nw-sec">Раньше</div>
        <div className="nw-rows">
          {rest.slice(3).map((n) => (
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
      <h1 className="nw-h1 o14-disp">Новости</h1>
      <Lead n={lead} />
      <div className="nw-sec">Ещё материалы</div>
      <div className="nw-rows">
        {rest.map((n) => (
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
