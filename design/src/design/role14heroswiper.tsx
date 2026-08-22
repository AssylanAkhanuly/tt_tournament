/* Э14.1 · герой А как карусель — «через Swiper».

   У референса (бегущая строка матчей worldtabletennis.com) карточки не стоят
   по одной: это карусель со стрелками по краям, и матчи в ней листаются. Мы
   перенесли карточку, но не сам приём — а он у WTT и есть главный: одна
   карточка не вмещает турнир, поэтому её листают.

   Что листать у нас. У спортсмена в один день бывает не один матч: одиночный
   разряд, парный, микст — все три идут в один день на разных столах и в разное
   время (TZ §5, разряды турнира). Прежний герой показывал ровно один матч и
   молчал об остальных: человек узнавал о паре, когда его звали к столу.

   Карточка слайда — та же `.ohw-*`, что в переносе WTT: карусель меняет не
   вид карточки, а то, сколько их помещается в блок.

   Swiper 14, модули Navigation и Pagination. Стрелки нарисованы своими
   кнопками (у Swiper свои — с их собственной формой и цветом, а у нас углы
   прямые и цвет только токенами). */

import { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperClass } from 'swiper';
import { Check, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './role14heroref.css';
import './role14heroswiper.css';

type Match = {
  /** Разряд и круг — первая строка карточки, как у референса. */
  round: string;
  hall: string;
  table: string;
  state: 'called' | 'live' | 'soon' | 'later';
  /** Подпись состояния в пилюле. */
  pill: string;
  time: string;
  timeKey: string;
  action: string;
  me: { org: string; last: string; first: string };
  foe: { org: string; last: string; first: string } | null;
  /** Счёт по геймам — только у идущего матча. */
  games?: [number, number][];
  sets?: [number, number];
  /** Что в правой колонке, когда счёта ещё нет. */
  meRight?: string;
  foeRight?: string;
};

/* Один турнирный день спортсмена: три разряда, три стола, три времени.
   Данные выдуманные, но правдоподобные — как и везде в макетах роли. */
const DAY: Match[] = [
  {
    round: '1/8 финала · одиночный разряд',
    hall: 'Дворец спорта «Балуан Шолак»',
    table: 'Стол 5',
    state: 'called',
    pill: 'ВАС ВЫЗВАЛИ',
    time: '14:20',
    timeKey: 'начало',
    action: 'Открыть матч',
    me: { org: 'Астана · СКА', last: 'КИМ', first: 'Георгий' },
    foe: { org: 'Шымкент · посев 13', last: 'ЖУМАБЕКОВ', first: 'Расул' },
    meRight: '2456',
    foeRight: '2312',
  },
  {
    round: '1/4 финала · парный разряд',
    hall: 'Дворец спорта «Балуан Шолак»',
    table: 'Стол 3',
    state: 'soon',
    pill: 'ВЫ СЛЕДУЮЩИЕ',
    time: '16:40',
    timeKey: 'ориентировочно',
    action: 'Открыть матч',
    me: { org: 'Астана · СКА', last: 'КИМ', first: 'Г. / Оралбек Д.' },
    foe: { org: 'Караганда · посев 4', last: 'СМАГУЛОВ', first: 'Е. / Тлеуберди А.' },
    meRight: '2456',
    foeRight: '2390',
  },
  {
    round: 'Группа B · микст',
    hall: 'Дворец спорта «Балуан Шолак»',
    table: 'Стол 7',
    state: 'later',
    pill: 'СЕГОДНЯ ПОЗЖЕ',
    time: '18:10',
    timeKey: 'по расписанию',
    action: 'Мой турнир',
    me: { org: 'Астана · СКА', last: 'КИМ', first: 'Г. / Абаева Д.' },
    foe: null,
    meRight: '2456',
  },
];

function MatchCard({ m }: { m: Match }) {
  const live = m.state === 'live';
  return (
    <div className={'ohw ohw--slide' + (live ? ' ohw--live' : '') + (m.state === 'later' ? ' ohw--quiet' : '')} data-to="Э14.5">
      <div className="ohw-card">
        <div className="ohw-head">
          <div className="ohw-round">{m.round}</div>
          <span className={'ohw-pill' + (live ? ' live' : '') + (m.state === 'later' ? ' quiet' : '')}>
            <span className="ohw-dot" />
            {m.pill}
          </span>
        </div>

        <div className="ohw-place">
          Кубок Алматы 2026 <span className="ohw-bar" /> {m.hall} <span className="ohw-bar" /> {m.table}
        </div>

        <div className="ohw-rows">
          <div className={'ohw-row' + (m.state !== 'later' ? ' lead' : '')}>
            <span className="ohw-tick">
              {m.state === 'called' || live ? <Check size={15} strokeWidth={3} /> : null}
            </span>
            <span className="ohw-org">{m.me.org}</span>
            <span className="ohw-nm">
              <b>{m.me.last}</b> {m.me.first}
            </span>
            <span className="ohw-sets o14-disp quiet">{m.meRight}</span>
            <span className="ohw-games" />
          </div>

          {/* Соперник известен не всегда: в группе микста пары сводят после
              жеребьёвки разряда. Строка остаётся — уезжает только содержимое,
              иначе карточки в карусели прыгали бы по высоте. */}
          <div className="ohw-row">
            <span className="ohw-tick" />
            {m.foe ? (
              <>
                <span className="ohw-org">{m.foe.org}</span>
                <span className="ohw-nm">
                  <b>{m.foe.last}</b> {m.foe.first}
                </span>
                <span className="ohw-sets o14-disp quiet">{m.foeRight}</span>
                <span className="ohw-games" />
              </>
            ) : (
              <>
                <span className="ohw-org" />
                <span className="ohw-nm ohw-tbd">соперник определится после жеребьёвки</span>
                <span className="ohw-sets o14-disp quiet" />
                <span className="ohw-games" />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="ohw-tail">
        <div className="ohw-time o14-disp">{m.time}</div>
        <div className="ohw-time-k">{m.timeKey}</div>
        <button type="button" className={'ohw-go' + (m.state === 'later' ? ' quiet' : '')} data-to="Э14.5">
          <Play size={15} /> {m.action}
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
        <span className="o14-eyebrow">Мои матчи сегодня · 3</span>
        <div className="ohs-nav">
          <button type="button" className="ohs-arrow" ref={prev} aria-label="Предыдущий матч">
            <ChevronLeft size={17} />
          </button>
          <button type="button" className="ohs-arrow" ref={next} aria-label="Следующий матч">
            <ChevronRight size={17} />
          </button>
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
            <MatchCard m={m} />
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="ohs-dots" />
    </div>
  );
}
