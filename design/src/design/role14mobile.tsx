/* Э14.1 · мобильный экран — три варианта облика.

   Прежний мобильный макет забраковали целиком, и по делу: белая карточка на
   бледном сине-сером градиенте, всё одного веса, единственное цветное пятно —
   зелёная пятёрка, а между блоками волосяные линии. Это не облик, а вёрстка.

   По пайплайну проекта экран сначала проектируется вариантами, поэтому здесь
   три разных решения одного и того же экрана. Содержание у всех одно и то же и
   задано флоу (Э14.1): матчи дня каруселью, показатели, ближайшие турниры,
   последние результаты. Отличается язык:

     А · Тёмное табло — экран зала: тёмная плоскость, свет только там, где
         число; так выглядят табло и трансляции, и так же выглядит наше
         приложение в тёмной теме.
     Б · Цветной блок — вызов занимает верх сплошным цветом ФНТ, всё остальное
         белым списком: цвет вместо рамок.
     В · Крупная типографика — ни карточек, ни линеек: иерархию держит одна
         шкала кегля, как в спортивной афише.

   Фотографий нет ни в одном — решение «фона-картинки нет» от 22.08.2026
   держится. Хром браузера и шапка сайта у всех трёх одинаковые, чтобы
   сравнивать облик, а не оболочку. */

import { useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import {
  ArrowLeft, ArrowRight, Bell, CalendarDays, LayoutDashboard, MoreHorizontal, Play, Plus,
  Share, Sparkles, Timer, User,
} from 'lucide-react';
import { Frame } from '../PlayerApp';
import { MiniTabBar } from '../respShell';
import { Brand } from '../ui';
import { applyTheme } from '../theme/themes';
import { ME, RESULTS } from './role14home';
import { DAY, TOURS, type Match } from './role14heroswiper';
import 'swiper/css';
import 'swiper/css/pagination';
import './role14mobile.css';

/* Локальная тема на кусок страницы: тёмный вариант надо показать рядом со
   светлыми, а тулбар Storybook красит всё превью разом. `applyTheme` умеет
   красить любой элемент, `ui-theme` заставляет семантические токены
   пересчитаться от подменённых семян. */
function ThemeBox({ theme, children }: { theme: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (ref.current) applyTheme(theme, ref.current);
  }, [theme]);
  return (
    <div className="ui-theme" ref={ref}>
      {children}
    </div>
  );
}

const NAV: [ReactNode, string][] = [
  [<LayoutDashboard size={19} />, 'Главная'],
  [<CalendarDays size={19} />, 'Календарь'],
  [<Timer size={19} />, 'Мой турнир'],
  [<User size={19} />, 'Профиль'],
];

/* Оболочка одна на все три.

   Хром браузера нарисован с натуры (снимок мобильного браузера от федерации):
   тёмная панель сверху, адрес по центру пилюлей, слева круглая кнопка со
   значком, справа «поделиться»; снизу — тёмная панель браузера: назад, вперёд,
   новая вкладка, счётчик вкладок, меню. Системный статус-бар при таком хроме
   тоже тёмный, с белым временем.

   Считать по макету теперь можно честно: сверху уходит статус-бар и панель
   адреса, снизу — панель браузера, и только между ними живёт страница со своей
   шапкой и своей навигацией. */
function Chrome({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="mbb-top">
        <span className="mbb-round">
          <Sparkles size={15} />
          <i />
        </span>
        <span className="mbb-pill">fnt.kz</span>
        <Share size={17} />
      </div>

      <div className="mb-site">
        <Brand size="sm" sub="Спортсмен" />
        <div className="mb-site-r">
          <button type="button" className="iconbtn dot" aria-label="Уведомления">
            <Bell size={16} />
          </button>
          <img src={ME.av} alt="" />
        </div>
      </div>

      {children}

      {/* Нижняя панель браузера — поверх навигации сайта: она принадлежит
          браузеру, а не странице, и страница уезжает под неё. */}
      <div className="mbb-bottom">
        <ArrowLeft size={20} />
        <ArrowRight size={20} className="off" />
        <span className="mbb-plus">
          <Plus size={18} />
        </span>
        <span className="mbb-tabs">6</span>
        <MoreHorizontal size={20} />
      </div>
    </>
  );
}

/* Карусель матчей дня — общая для всех вариантов, вид карточки задаёт вариант. */
function Deck({ id, card }: { id: string; card: (m: Match) => ReactNode }) {
  return (
    <>
      <Swiper
        modules={[Pagination]}
        slidesPerView={1}
        speed={420}
        pagination={{ el: `.${id}`, clickable: true, bulletClass: 'mb-dot', bulletActiveClass: 'on' }}
      >
        {DAY.map((m) => (
          <SwiperSlide key={m.round}>{card(m)}</SwiperSlide>
        ))}
      </Swiper>
      <div className={'mb-dots ' + id} />
    </>
  );
}

/* ═══ А · Тёмное табло ══════════════════════════════════════════════
   Экран зала. Тёмная плоскость, свет только там, где число: номер стола
   светится акцентом, всё остальное уходит в тишину. Показатели — три числа
   без плашек, матчи — строки. Так выглядит табло на площадке и так же
   выглядит наше приложение в тёмной теме, то есть язык у нас уже есть. */
function CardDark(m: Match) {
  const quiet = m.state === 'later';
  return (
    <div className={'mbd-card' + (quiet ? ' quiet' : '')} data-to="Э14.5">
      <div className="mbd-top">
        <span className="mbd-state">
          <span className="mbd-dot" />
          {m.pill}
        </span>
        <span className="mbd-time o14-disp">{m.time}</span>
      </div>
      <div className="mbd-num o14-disp">{m.table}</div>
      <div className="mbd-k">стол</div>
      <div className="mbd-foe o14-disp">{m.foe ?? 'соперник после жеребьёвки'}</div>
      <div className="mbd-round">{m.round}</div>
      <button type="button" className="mbd-go" data-to="Э14.5">
        <Play size={15} /> {m.action}
      </button>
    </div>
  );
}

export function MobileDark() {
  return (
    <ThemeBox theme="fnt">
      <div className="mb-wrap mbd">
        <Frame>
          <Chrome>
            <div className="mb-body">
              <div className="mb-title">
                <div className="nm o14-disp">Ким Георгий</div>
                <div className="sub">Астана · СКА · КМС</div>
              </div>

              <div className="mb-eyebrow">Сегодня · 3 матча</div>
              <Deck id="mbd-dots" card={CardDark} />

              <div className="mbd-rail">
                <div>
                  <b className="o14-disp">2456</b>
                  <span>рейтинг</span>
                </div>
                <div>
                  <b className="o14-disp">7</b>
                  <span>в РК</span>
                </div>
                <div>
                  <b className="o14-disp up">+24</b>
                  <span>за турнир</span>
                </div>
              </div>

              <div className="mb-eyebrow">Последние результаты</div>
              <div className="mbd-list">
                {RESULTS.map((r) => (
                  <div className="mbd-row" key={r.nm} data-to="Э14.6">
                    <span className="nm">{r.nm}</span>
                    <span className={'sc o14-disp ' + (r.win ? 'w' : 'l')}>{r.sc}</span>
                  </div>
                ))}
              </div>
            </div>
          </Chrome>
          <MiniTabBar items={NAV} active="Главная" />
        </Frame>
      </div>
    </ThemeBox>
  );
}

/* ═══ Б · Цветной блок ══════════════════════════════════════════════
   Вызов занимает верх экрана сплошным цветом знака ФНТ, и это единственное
   цветное место: ниже белый список без рамок. Цвет вместо линеек — граница
   между «что сейчас» и «что вообще» проходит по краю заливки. */
function CardColor(m: Match) {
  const quiet = m.state === 'later';
  return (
    <div className={'mbc-card' + (quiet ? ' quiet' : '')} data-to="Э14.5">
      <div className="mbc-top">
        <span className="mbc-state">{m.pill}</span>
        <span className="mbc-time o14-disp">{m.time}</span>
      </div>
      <div className="mbc-num">
        <b className="o14-disp">{m.table}</b>
        <span>стол</span>
      </div>
      <div className="mbc-foe o14-disp">{m.foe ?? 'соперник после жеребьёвки'}</div>
      <div className="mbc-round">{m.round}</div>
      <button type="button" className="mbc-go" data-to="Э14.5">
        {m.action}
      </button>
    </div>
  );
}

export function MobileColor() {
  return (
    <div className="mb-wrap mbc">
      <Frame>
        <Chrome>
          <div className="mb-body">
            <Deck id="mbc-dots" card={CardColor} />

            <div className="mbc-rail">
              <div>
                <b className="o14-disp">2456</b>
                <span>рейтинг</span>
              </div>
              <div>
                <b className="o14-disp">7</b>
                <span>место в РК</span>
              </div>
              <div>
                <b className="o14-disp up">+24</b>
                <span>за турнир</span>
              </div>
            </div>

            <div className="mb-eyebrow">Ближайшие турниры</div>
            <div className="mbc-list">
              {TOURS.map((t) => (
                <div className="mbc-row" key={t.nm} data-to="Э14.2">
                  <div className="tx">
                    <div className="nm">{t.nm}</div>
                    <div className="ss">{t.sub}</div>
                  </div>
                  <span className={'mbc-tag' + (t.on ? ' on' : '')}>{t.on ? 'ПОДАНА' : 'РЕГИОН'}</span>
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

/* ═══ В · Крупная типографика ═══════════════════════════════════════
   Ни карточек, ни линеек: иерархию держит одна шкала кегля. Номер стола в
   треть экрана, фамилия соперника вторым размером, всё служебное — восьмым.
   Язык спортивной афиши: смотреть не на что, кроме собственно сообщения. */
function CardType(m: Match) {
  const quiet = m.state === 'later';
  return (
    <div className={'mbt-card' + (quiet ? ' quiet' : '')} data-to="Э14.5">
      <div className="mbt-state">{m.pill}</div>
      <div className="mbt-num o14-disp">{m.table}</div>
      <div className="mbt-meta">
        стол · {m.time} · {m.round}
      </div>
      <div className="mbt-foe o14-disp">{m.foe ?? 'соперник после жеребьёвки'}</div>
      <button type="button" className="mbt-go" data-to="Э14.5">
        {m.action} →
      </button>
    </div>
  );
}

export function MobileType() {
  return (
    <div className="mb-wrap mbt">
      <Frame>
        <Chrome>
          <div className="mb-body">
            <Deck id="mbt-dots" card={CardType} />

            <div className="mbt-rail">
              <div>
                <b className="o14-disp">2456</b>
                <span>рейтинг</span>
              </div>
              <div>
                <b className="o14-disp">7</b>
                <span>место</span>
              </div>
              <div>
                <b className="o14-disp up">+24</b>
                <span>турнир</span>
              </div>
            </div>

            <div className="mbt-sec">Результаты</div>
            {RESULTS.map((r) => (
              <div className="mbt-row" key={r.nm} data-to="Э14.6">
                <span className="nm o14-disp">{r.nm}</span>
                <span className={'sc o14-disp ' + (r.win ? 'w' : 'l')}>{r.sc}</span>
              </div>
            ))}
          </div>
        </Chrome>
        <MiniTabBar items={NAV} active="Главная" />
      </Frame>
    </div>
  );
}
