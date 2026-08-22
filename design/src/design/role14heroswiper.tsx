/* Э14.1 · герой А как карусель — «через Swiper», минималистичный.

   Приём взят у референса (бегущая строка матчей worldtabletennis.com): у них
   карточки не стоят по одной, их листают, потому что турнир в одну карточку не
   помещается. У спортсмена то же в меньшем масштабе — в турнирный день бывает
   одиночный разряд, парный и микст: разные столы, разное время.

   Первый заход был перегружен: в карточке стояли название турнира, зал, город
   и клуб обоих игроков, оба рейтинга, форма, личные встречи и подпись под
   временем. Здесь оставлено только то, без чего человек не дойдёт до стола:

     состояние · стол · круг · кто соперник · когда · одно действие.

   Что убрано и почему: название турнира — человек на турнире один, он знает,
   на каком; зал — тоже (⚠ находка из референса «место и стол одной строкой»
   минимализмом съедена, и если зал нужен, он вернётся строкой под столом);
   регион и клуб, рейтинги, форма и личные встречи — это разбор перед матчем,
   он живёт на Э14.6, а не в строке вызова.

   Мобильная версия — не та же карточка в узкой колонке, а своя раскладка:
   номер стола крупно, соперник под ним, действие во всю ширину, листание
   пальцем и точки вместо стрелок. */

import { useRef } from 'react';
import type { ReactNode } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperClass } from 'swiper';
import {
  Bell, CalendarDays, Check, ChevronLeft, ChevronRight, LayoutDashboard, Lock, Play,
  RotateCw, Timer, User,
} from 'lucide-react';
import { Frame, TabBar } from '../PlayerApp';
import { MiniTabBar } from '../respShell';
import { Brand } from '../ui';
import { ME, RESULTS } from './role14home';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './role14heroswiper.css';

type Match = {
  /** Круг и разряд — одной короткой строкой. */
  round: string;
  table: string;
  state: 'called' | 'soon' | 'later';
  pill: string;
  time: string;
  action: string;
  me: string;
  /** Соперника может ещё не быть: в группе микста пары сводят после жеребьёвки. */
  foe: string | null;
};

/* Турнирный день спортсмена: три разряда, три стола, три времени. Данные
   выдуманные, но правдоподобные — как и везде в макетах роли. */
const DAY: Match[] = [
  {
    round: '1/8 финала · одиночный',
    table: '5',
    state: 'called',
    pill: 'ВАС ВЫЗВАЛИ',
    time: '14:20',
    action: 'Открыть матч',
    me: 'Ким Георгий',
    foe: 'Жумабеков Расул',
  },
  {
    round: '1/4 финала · парный',
    table: '3',
    state: 'soon',
    pill: 'ВЫ СЛЕДУЮЩИЕ',
    time: '16:40',
    action: 'Открыть матч',
    me: 'Ким / Оралбек',
    foe: 'Смагулов / Тлеуберди',
  },
  {
    round: 'Группа B · микст',
    table: '7',
    state: 'later',
    pill: 'СЕГОДНЯ ПОЗЖЕ',
    time: '18:10',
    action: 'Мой турнир',
    me: 'Ким / Абаева',
    foe: null,
  },
];

/* ── Карточка для веба ──────────────────────────────────────────────
   Три строки: состояние и стол, я, соперник. Справа время и действие. */
function CardWeb({ m }: { m: Match }) {
  const quiet = m.state === 'later';
  return (
    <div className={'ocw' + (quiet ? ' quiet' : '')} data-to="Э14.5">
      <div className="ocw-l">
        <div className="ocw-head">
          <span className={'ocw-pill' + (quiet ? ' quiet' : '')}>
            <span className="ocw-dot" />
            {m.pill}
          </span>
          <span className="ocw-meta">
            Стол <b className="o14-disp">{m.table}</b>
            <span className="ocw-sep">·</span>
            {m.round}
          </span>
        </div>

        <div className="ocw-rows">
          <div className="ocw-row">
            <span className="ocw-tick">{m.state === 'called' && <Check size={14} strokeWidth={3} />}</span>
            <span className="ocw-nm o14-disp">{m.me}</span>
          </div>
          <div className="ocw-row">
            <span className="ocw-tick" />
            <span className={'ocw-nm o14-disp' + (m.foe ? '' : ' tbd')}>
              {m.foe ?? 'соперник после жеребьёвки'}
            </span>
          </div>
        </div>
      </div>

      <div className="ocw-act">
        <div className="ocw-time o14-disp">{m.time}</div>
        <button type="button" className={'ocw-go' + (quiet ? ' quiet' : '')} data-to="Э14.5">
          <Play size={14} /> {m.action}
        </button>
      </div>
    </div>
  );
}

export function HeroSwiper() {
  const prev = useRef<HTMLButtonElement>(null);
  const next = useRef<HTMLButtonElement>(null);

  return (
    <div className="ohs">
      <div className="ohs-head">
        <span className="o14-eyebrow">Сегодня · 3 матча</span>
        <div className="ohs-nav">
          <button type="button" className="ohs-arrow" ref={prev} aria-label="Предыдущий матч">
            <ChevronLeft size={16} />
          </button>
          <button type="button" className="ohs-arrow" ref={next} aria-label="Следующий матч">
            <ChevronRight size={16} />
          </button>
          <div className="ohs-dots" />
        </div>
      </div>

      <Swiper
        modules={[Navigation, Pagination]}
        slidesPerView={1}
        spaceBetween={16}
        speed={420}
        pagination={{ el: '.ohs-dots', clickable: true, bulletClass: 'ohs-dot', bulletActiveClass: 'on' }}
        onBeforeInit={(sw: SwiperClass) => {
          /* Стрелки свои: у штатных кнопок Swiper собственная форма, цвет и
             скруглённый угол — мимо токенов и правила «углы прямые». */
          if (typeof sw.params.navigation === 'object') {
            sw.params.navigation.prevEl = prev.current;
            sw.params.navigation.nextEl = next.current;
          }
        }}
      >
        {DAY.map((m) => (
          <SwiperSlide key={m.round}>
            <CardWeb m={m} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

/* ── Мобильная карточка ─────────────────────────────────────────────
   Не веб-карточка в узкой колонке: на телефоне человек стоит в зале, и первым
   должен читаться номер стола. Дальше соперник, время и одно действие во всю
   ширину — под палец, а не под курсор. */
function CardPhone({ m }: { m: Match }) {
  const quiet = m.state === 'later';
  return (
    <div className={'ocp' + (quiet ? ' quiet' : '')} data-to="Э14.5">
      <div className="ocp-head">
        <span className={'ocw-pill' + (quiet ? ' quiet' : '')}>
          <span className="ocw-dot" />
          {m.pill}
        </span>
        <span className="ocp-time o14-disp">{m.time}</span>
      </div>

      <div className="ocp-table">
        <b className="o14-disp">{m.table}</b>
        <span>стол</span>
      </div>

      <div className="ocp-foe o14-disp">{m.foe ?? 'соперник после жеребьёвки'}</div>
      <div className="ocp-round">{m.round}</div>

      <button type="button" className={'ocp-go' + (quiet ? ' quiet' : '')} data-to="Э14.5">
        <Play size={15} /> {m.action}
      </button>
    </div>
  );
}

/* Остальной экран приложения: то же содержание, что у главной в вебе
   (flows/14-sportsmen.md, Э14.1) — рейтинг, ближайшие турниры, последние
   результаты. Без него карусель висела в пустоте, и по картинке нельзя было
   судить ни о плотности экрана, ни о том, что уходит под сгиб. */
const TOURS = [
  { nm: 'Кубок Алматы 2026', sub: 'ОРТ · Алматы · 12–14 сентября', tag: 'ЗАЯВКА ПОДАНА', on: true },
  { nm: 'Чемпионат Республики', sub: 'Главный старт · Астана · 18–22 сентября', tag: 'ЗАЯВЛЯЕТ РЕГИОН', on: false },
];

/* Хром мобильного браузера: адресная строка сразу под системным статус-баром —
   так, как её показывает Chrome на Android. Нужна не для красоты: без неё по
   макету не видно, сколько высоты у экрана съедает сам браузер, а на телефоне
   это 44 px из 652 плюс шапка сайта. Нижней панели браузера здесь нет
   намеренно — у Chrome её нет, и она спорила бы с навигацией сайта. */
const BrowserBar = () => (
  <div className="ocb">
    <span className="ocb-url">
      <Lock size={11} />
      fnt.kz/me
    </span>
    <button type="button" className="ocb-btn" aria-label="Обновить">
      <RotateCw size={15} />
    </button>
    <span className="ocb-tabs">3</span>
  </div>
);

/* Шапка самого сайта: знак ФНТ, уведомления, я. Без неё фамилия на странице
   висела сама по себе — непонятно, чей это сайт и куда с него уходить. На
   телефоне она короче десктопной: знак, колокол, фото. */
const SiteHeader = () => (
  <div className="ocs">
    <Brand size="sm" sub="Спортсмен" />
    <div className="ocs-r">
      <button type="button" className="iconbtn dot" aria-label="Уведомления">
        <Bell size={16} />
      </button>
      <img src={ME.av} alt="" />
    </div>
  </div>
);

/* Веб-версия на телефоне: хром браузера, шапка сайта, страница, навигация
   роли внизу. Пункты — те же, что в сайдбаре десктопа (R14), только четыре
   главных: на телефоне шесть в строку не встают. */
const WEB_TABS: [ReactNode, string][] = [
  [<LayoutDashboard size={19} />, 'Главная'],
  [<CalendarDays size={19} />, 'Календарь'],
  [<Timer size={19} />, 'Мой турнир'],
  [<User size={19} />, 'Профиль'],
];

export function HeroSwiperBrowser() {
  return (
    <div className="ocp-wrap ocp-wrap--web">
      <Frame>
        <BrowserBar />
        <SiteHeader />
        <div className="ocp-body">
          <div className="ocp-top">
            <div className="nm">Ким Георгий</div>
            <div className="rt o14-disp">2456</div>
          </div>

          <div className="ocp-eyebrow">Сегодня · 3 матча</div>

          <div className="ocp-bleed">
            <Swiper
              modules={[Pagination]}
              slidesPerView={1}
              speed={420}
              pagination={{ el: '.ocp-dots-web', clickable: true, bulletClass: 'ohs-dot', bulletActiveClass: 'on' }}
            >
              {DAY.map((m) => (
                <SwiperSlide key={m.round}>
                  <CardPhone m={m} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          <div className="ocp-dots ocp-dots-web" />

          <div className="ocp-rail">
            <div>
              <b className="o14-disp">7</b>
              <span>место в РК</span>
            </div>
            <div>
              <b className="o14-disp up">+24</b>
              <span>за турнир</span>
            </div>
            <div>
              <b className="o14-disp">64 %</b>
              <span>побед</span>
            </div>
          </div>

          <div className="ocp-sec">
            <div className="ocp-eyebrow">Ближайшие турниры</div>
            {TOURS.map((t) => (
              <div className="ocp-item" key={t.nm} data-to="Э14.2">
                <div className="tx">
                  <div className="nm">{t.nm}</div>
                  <div className="ss">{t.sub}</div>
                </div>
                <span className={'ocp-tag' + (t.on ? ' on' : '')}>{t.tag}</span>
              </div>
            ))}
          </div>
        </div>
        <MiniTabBar items={WEB_TABS} active="Главная" />
      </Frame>
    </div>
  );
}

export function HeroSwiperPhone() {
  return (
    <div className="ocp-wrap">
      <Frame>
        <div className="ocp-body">
          <div className="ocp-top">
            <div className="nm">Ким Георгий</div>
            <div className="rt o14-disp">2456</div>
          </div>

          <div className="ocp-eyebrow">Сегодня · 3 матча</div>

          {/* Карусель во всю ширину экрана: на телефоне карточка с полями по
              бокам выглядит вставкой, а не главным на экране. Поля возвращаются
              внутрь карточки. На телефоне стрелок нет — листают пальцем, точки
              отвечают на «сколько их всего и где я». */}
          <div className="ocp-bleed">
            <Swiper
              modules={[Pagination]}
              slidesPerView={1}
              speed={420}
              pagination={{ el: '.ocp-dots', clickable: true, bulletClass: 'ohs-dot', bulletActiveClass: 'on' }}
            >
              {DAY.map((m) => (
                <SwiperSlide key={m.round}>
                  <CardPhone m={m} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          <div className="ocp-dots" />

          <div className="ocp-rail">
            <div>
              <b className="o14-disp">7</b>
              <span>место в РК</span>
            </div>
            <div>
              <b className="o14-disp up">+24</b>
              <span>за турнир</span>
            </div>
            <div>
              <b className="o14-disp">64 %</b>
              <span>побед</span>
            </div>
          </div>

          <div className="ocp-sec">
            <div className="ocp-eyebrow">Ближайшие турниры</div>
            {TOURS.map((t) => (
              <div className="ocp-item" key={t.nm} data-to="Э14.2">
                <div className="tx">
                  <div className="nm">{t.nm}</div>
                  <div className="ss">{t.sub}</div>
                </div>
                <span className={'ocp-tag' + (t.on ? ' on' : '')}>{t.tag}</span>
              </div>
            ))}
          </div>

          <div className="ocp-sec">
            <div className="ocp-eyebrow">Последние результаты</div>
            {RESULTS.map((r) => (
              <div className="ocp-item" key={r.nm} data-to="Э14.6">
                <div className="tx">
                  <div className="nm">{r.nm}</div>
                  <div className="ss">{r.sub}</div>
                </div>
                <span className={'ocp-sc o14-disp' + (r.win ? ' w' : ' l')}>{r.sc}</span>
              </div>
            ))}
          </div>
        </div>
        <TabBar active="home" />
      </Frame>
    </div>
  );
}
