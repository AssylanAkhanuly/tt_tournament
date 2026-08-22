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

/* ── Доводка 4 · «Как у WTT» ────────────────────────────────────────
   Не мотив, а перенос карточки один в один: то же, что в бегущей строке
   worldtabletennis.com, с заменой только того, что у нас другое.

   Что перенесено буквально:
   · карточка СВЕТЛАЯ — белая с тёмным текстом, а не тёмная плашка. У WTT
     ткань чёрная, а карточки на ней белые; у нас тема и так светлая, поэтому
     герой перестаёт быть чёрной плитой посреди страницы;
   · порядок строк: круг → «место | стол» → два игрока;
   · плотность: строка игрока в 32 px, весь блок держится в высоте карточки
     референса, а не в 216 px прежнего героя;
   · фамилия ПРОПИСНЫМИ, имя обычным — так игрока и находят глазами в списке;
   · счёт по партиям крупно, по геймам — мелким рядом справа;
   · галочка у ведущего.

   Что заменено, потому что у нас другое: флаг страны → регион и клуб (турнир
   внутренний), оранжевый WTT → зелёный «идёт» и синий ФНТ, и добавлены две
   вещи, которых у зрительской карточки нет и быть не может, — состояние
   («вас вызвали») и действие («открыть матч»): их карточка показывает чужие
   матчи, наша — мой. */
export function HeroWtt({ live }: { live?: boolean }) {
  return (
    <div className={'ohw' + (live ? ' ohw--live' : '')} data-to="Э14.5">
      <div className="ohw-card">
        <div className="ohw-head">
          <div className="ohw-round">1/8 финала · одиночный разряд</div>
          <span className={'ohw-pill' + (live ? ' live' : '')}>
            <span className="ohw-dot" />
            {live ? 'ИДЁТ МАТЧ · ПАРТИЯ 4' : 'ВАС ВЫЗВАЛИ'}
          </span>
        </div>

        {/* «TT DOME HEYSE25 | Table 2» — место и стол одной строкой, через
            вертикаль, тем же мелким кеглем. */}
        <div className="ohw-place">
          Кубок Алматы 2026 <span className="ohw-bar" /> {HALL} <span className="ohw-bar" /> Стол 5
        </div>

        <div className="ohw-rows">
          <div className="ohw-row lead">
            <span className="ohw-tick">
              <Check size={15} strokeWidth={3} />
            </span>
            <span className="ohw-org">Астана · СКА</span>
            <span className="ohw-nm">
              <b>КИМ</b> Георгий
            </span>
            {live ? (
              <>
                <span className="ohw-sets o14-disp">2</span>
                <span className="ohw-games o14-disp">
                  {GAMES.map((g, i) => (
                    <i className={i === GAMES.length - 1 ? 'now' : ''} key={i}>{g[0]}</i>
                  ))}
                </span>
              </>
            ) : (
              <>
                <span className="ohw-sets o14-disp quiet">2456</span>
                <span className="ohw-games"><FormRow /></span>
              </>
            )}
          </div>

          <div className="ohw-row">
            <span className="ohw-tick" />
            <span className="ohw-org">Шымкент · посев 13</span>
            <span className="ohw-nm">
              <b>ЖУМАБЕКОВ</b> Расул
            </span>
            {live ? (
              <>
                <span className="ohw-sets o14-disp">1</span>
                <span className="ohw-games o14-disp">
                  {GAMES.map((g, i) => (
                    <i className={i === GAMES.length - 1 ? 'now' : ''} key={i}>{g[1]}</i>
                  ))}
                </span>
              </>
            ) : (
              <>
                <span className="ohw-sets o14-disp quiet">2312</span>
                <span className="ohw-games"><span className="ohw-h2h">личные 3 : 2</span></span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Хвост, которого у референса нет: их карточка показывает чужой матч и
          ничего не предлагает сделать, наша — мой, и с него идут к столу. */}
      <div className="ohw-tail">
        <div className="ohw-time o14-disp">{live ? '32′' : '14:20'}</div>
        <div className="ohw-time-k">{live ? 'идёт' : 'начало'}</div>
        <button type="button" className={'ohw-go' + (live ? ' live' : '')} data-to="Э14.5">
          <Play size={15} /> {live ? 'Смотреть счёт' : 'Открыть матч'}
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
