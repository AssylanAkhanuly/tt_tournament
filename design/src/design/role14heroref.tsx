/* Э14.1 · вариант А — герой, доведённый по референсу.

   Референс: бегущая строка матчей на worldtabletennis.com (снято живьём
   22.08.2026, `src/assets/refs/wtt-ticker.jpg`, разбор — «Дизайн-система →
   Референсы»). Это единственный найденный пример ровно нашего блока из мира
   настольного тенниса, и он делает четыре вещи, которых у нас не было:

   1. МЕСТО И СТОЛ ОДНОЙ СТРОКОЙ: «TT DOME HEYSE25 | Table 2». Наш герой звал
      к столу 5, не говоря, в каком зале этот стол стоит.
   2. ОБА ИГРОКА В ОДНОЙ КОЛОНКЕ, строка под строкой, фамилии выровнены. У нас
      соперник стоял карточкой справа, а меня в герое не было вовсе — хотя
      матч это всегда двое.
   3. ЛИДЕР ПОМЕЧЕН ГАЛОЧКОЙ, а не только цветом: работает на печати, при
      дальтонизме и в чёрно-белом протоколе.
   4. СЧЁТ ПО ГЕЙМАМ РЯДОМ СО СЧЁТОМ ПО ПАРТИЯМ: «3 · 11 11 9 12 11» в одну
      строку. Плотнее наших плиток и читается тем же движением глаза.

   Плюс общий урок по плотности: карточка WTT держит всё это в 410×130 px, а
   наш герой занимал 216 px по высоте во всю ширину экрана.

   Чего у референса НЕ берём: фотографию и видео (решение «фона-картинки нет»
   от 22.08.2026), флаги стран (у нас турнир внутренний — вместо флага регион)
   и оранжевый акцент WTT.

   Ниже три доводки одного и того же блока. Содержание везде одно, меняется
   плотность и то, что в блоке главное. */

import { Check, MapPin, Play } from 'lucide-react';
import { FOE, FORM, ME } from './role14home';
import './role14heroref.css';

/* Зал турнира ⚠ — в системе такого поля нет: у турнира есть город, места
   проведения нет. Если доводку выберут, поле придётся заводить. */
const HALL = 'Дворец спорта «Балуан Шолак»';

/* Счёт по геймам в строку — как у WTT. Ведёт судья стола. */
const GAMES = [
  [11, 8],
  [9, 11],
  [11, 6],
  [7, 5],
];

const FormRow = () => (
  <span className="ohr-form">
    {FORM.map((w, i) => (
      <i className={w ? 'w' : 'l'} key={i} />
    ))}
  </span>
);

/* Строка игрока: галочка лидера, фамилия, принадлежность, рейтинг. Ровно
   колонки референса, только вместо флага страны — регион и клуб. */
function PlayerRow({
  lead,
  name,
  sub,
  rating,
  right,
}: {
  lead?: boolean;
  name: string;
  sub: string;
  rating: number;
  right?: React.ReactNode;
}) {
  return (
    <div className={'ohr-row' + (lead ? ' lead' : '')}>
      <span className="ohr-tick">{lead && <Check size={14} strokeWidth={3} />}</span>
      <span className="ohr-nm o14-disp">{name}</span>
      <span className="ohr-sub">{sub}</span>
      <span className="ohr-rt o14-disp">{rating}</span>
      <span className="ohr-right">{right}</span>
    </div>
  );
}

/* ── Доводка 1 · «Строка матча» ─────────────────────────────────────
   Прямее всех по референсу: круг, зал | стол, две строки игроков. Высота
   вдвое меньше прежнего героя. */
export function HeroRef1() {
  return (
    <div className="ohr ohr--row1" data-to="Э14.5">
      <div className="ohr-l">
        <div className="ohr-eyebrow">
          <span className="ohr-dot" />
          ВАС ВЫЗВАЛИ
          <span className="ohr-sep">·</span>
          <span className="ohr-round">Кубок Алматы 2026 · 1/8 финала · одиночный разряд</span>
        </div>

        <div className="ohr-place">
          <MapPin size={13} />
          {HALL}
          <span className="ohr-bar" />
          <span className="ohr-table">
            СТОЛ <b className="o14-disp">5</b>
          </span>
        </div>

        <div className="ohr-rows">
          <PlayerRow lead name={ME.nm} sub="Астана · СКА · КМС" rating={2456} right={<FormRow />} />
          <PlayerRow
            name={FOE.nm}
            sub="Шымкент · посев 13"
            rating={2312}
            right={<span className="ohr-h2h">личные 3 : 2</span>}
          />
        </div>
      </div>

      <div className="ohr-act">
        <div className="ohr-time o14-disp">14:20</div>
        <div className="ohr-time-k">начало</div>
        <button type="button" className="ohr-go" data-to="Э14.5">
          <Play size={15} /> Открыть матч
        </button>
      </div>
    </div>
  );
}

/* ── Доводка 2 · «Табло со строками» ────────────────────────────────
   Наш крупный номер стола остаётся — он и есть отличие А, — но рядом с ним
   появляется зал, а соперник и я встают строками, как у референса. */
export function HeroRef2() {
  return (
    <div className="ohr ohr--board" data-to="Э14.5">
      <div className="ohr-big">
        <span className="ohr-big-n o14-disp">5</span>
        <span className="ohr-big-k">стол</span>
      </div>

      <div className="ohr-mid">
        <div className="ohr-eyebrow">
          <span className="ohr-dot" />
          ВАС ВЫЗВАЛИ
        </div>
        <div className="ohr-round strong">Кубок Алматы 2026 · 1/8 финала · одиночный разряд</div>
        <div className="ohr-place">
          <MapPin size={13} />
          {HALL}
        </div>
        <div className="ohr-rows">
          <PlayerRow lead name={ME.nm} sub="Астана · СКА" rating={2456} right={<FormRow />} />
          <PlayerRow
            name={FOE.nm}
            sub="Шымкент · посев 13"
            rating={2312}
            right={<span className="ohr-h2h">личные 3 : 2</span>}
          />
        </div>
      </div>

      <div className="ohr-act">
        <div className="ohr-time o14-disp">14:20</div>
        <div className="ohr-time-k">начало</div>
        <button type="button" className="ohr-go" data-to="Э14.5">
          <Play size={15} /> Открыть матч
        </button>
      </div>
    </div>
  );
}

/* ── Доводка 3 · «Матч идёт» ────────────────────────────────────────
   Та же строка в состоянии, ради которого счёт и заводят: счёт по партиям
   крупно, по геймам — рядом строкой чисел, как у референса, вместо наших
   плиток. */
export function HeroRef3() {
  return (
    <div className="ohr ohr--live" data-to="Э14.5">
      <div className="ohr-l">
        <div className="ohr-eyebrow live">
          <span className="ohr-dot" />
          ИДЁТ МАТЧ · ПАРТИЯ 4
          <span className="ohr-sep">·</span>
          <span className="ohr-round">Кубок Алматы 2026 · 1/8 финала</span>
        </div>

        <div className="ohr-place">
          <MapPin size={13} />
          {HALL}
          <span className="ohr-bar" />
          <span className="ohr-table">
            СТОЛ <b className="o14-disp">5</b>
          </span>
        </div>

        <div className="ohr-rows">
          <div className="ohr-row lead">
            <span className="ohr-tick">
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="ohr-nm o14-disp">{ME.nm}</span>
            <span className="ohr-sub">Астана · СКА</span>
            <span className="ohr-sets o14-disp">2</span>
            <span className="ohr-games o14-disp">
              {GAMES.map((g, i) => (
                <i className={i === GAMES.length - 1 ? 'now' : ''} key={i}>
                  {g[0]}
                </i>
              ))}
            </span>
          </div>
          <div className="ohr-row">
            <span className="ohr-tick" />
            <span className="ohr-nm o14-disp">{FOE.nm}</span>
            <span className="ohr-sub">Шымкент · посев 13</span>
            <span className="ohr-sets o14-disp">1</span>
            <span className="ohr-games o14-disp">
              {GAMES.map((g, i) => (
                <i className={i === GAMES.length - 1 ? 'now' : ''} key={i}>
                  {g[1]}
                </i>
              ))}
            </span>
          </div>
        </div>
      </div>

      <div className="ohr-act">
        <div className="ohr-time o14-disp">32′</div>
        <div className="ohr-time-k">идёт</div>
        <button type="button" className="ohr-go live" data-to="Э14.5">
          <Play size={15} /> Смотреть счёт
        </button>
      </div>
    </div>
  );
}
