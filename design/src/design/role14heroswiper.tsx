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
import { Chrome, NAV } from './role14mobile';
import { ME, RESULTS } from './role14home';
import { DAY, TOURS, type Match } from './role14day';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './role14heroswiper.css';

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


/* Изначальная версия мобильного экрана — она и остаётся рабочей (решение от
   22.08.2026 после двенадцати нарисованных обликов). Две правки по итогам
   разбора:

   1. Точки карусели заменены полосками, как в историях: полоски показывают не
      только «сколько всего и где я», но и сколько ещё впереди, и стоят они
      сверху, где их и ищут глазами.
   2. Убрана лента показателей — место в РК, дельта за турнир, доля побед. На
      экране вызова эти числа не нужны: человек стоит в зале и идёт к столу, а
      разбор своих чисел живёт в аналитике (Э14.6).

   Оболочка — хром браузера, нарисованный с натуры, и шапка сайта; и то и
   другое общее с остальными макетами роли (`role14mobile.tsx`). */
export function HeroSwiperBrowser() {
  return (
    <div className="ocp-wrap ocp-wrap--web mb-wrap">
      <Frame>
        <Chrome>
          <div className="ocp-body">
            <div className="ocp-top">
              <div className="nm">Ким Георгий</div>
              <div className="rt o14-disp">2456</div>
            </div>

            {/* Полоски прогресса — над карточкой, как в историях. */}
            <div className="ocp-bars ocp-dots-web" />

            <div className="ocp-bleed">
              <Swiper
                modules={[Pagination]}
                slidesPerView={1}
                speed={420}
                pagination={{ el: '.ocp-dots-web', clickable: true, bulletClass: 'ocp-bar', bulletActiveClass: 'on' }}
              >
                {DAY.map((m) => (
                  <SwiperSlide key={m.round}>
                    <CardPhone m={m} />
                  </SwiperSlide>
                ))}
              </Swiper>
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
        </Chrome>
        <MiniTabBar items={NAV} active="Главная" />
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
