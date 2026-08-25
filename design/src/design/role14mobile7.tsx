/* Э14.5 · Мой турнир — вкладки, которых не было на телефоне.

   «Мой матч» нарисован раньше (role14mobile3.tsx): красное поле эфира, счёт по
   партиям, соперник, мой путь. Остальные три вкладки экрана — участники,
   группы и сетка — на телефоне не существовали, а это ровно те места, где
   десктопные решения не переносятся: таблица в пять колонок и холст с сеткой
   на 393 px не живут.

   Что сделано вместо переноса:

     Участники — список, а не таблица: посев числом слева, фамилия и клуб
                 строкой, рейтинг справа. Я и мой соперник помечены и вынесены
                 наверх — из 128 человек мне важны двое.
     Группы    — моя группа таблицей на четыре строки (это влезает), остальные
                 группы свёрнуты до одной строки: кто вышел.
     Сетка     — НЕ холст. Сетка на телефоне читается только зумом, поэтому
                 показываем её как круги: переключатель кругов сверху, пары
                 круга списком, мой матч подсвечен. Ответ на «до кого я дошёл»
                 и «кто дальше» получается без единого жеста масштабирования.

   Контекст турнира — узкая тёмная строка, как на заявке (role14mobile5).
   Красное поле эфира остаётся только у вкладки «Мой матч»: там идёт игра. */

import { Search } from 'lucide-react';
import { Frame } from '../PlayerApp';
import { MiniTabBar } from '../respShell';
import { Chrome, NAV } from './role14mobile';
import { MY_GROUP, OTHER_GROUPS } from '../mockups/myBracket';
import './role14mobile5.css';
import './role14mobile7.css';

const TABS = ['Мой матч', 'Участники', 'Группы', 'Сетка'];

function Screen({ tab, children }: { tab: string; children: React.ReactNode }) {
  return (
    <div className="mb-wrap m5 m7">
      <Frame>
        <Chrome>
          <div className="mb-body m5-body">
            {/* Контекст: куда я попал. Две строки, без орнамента и градиента —
                это подпись экрана, а не витрина турнира. */}
            <div className="m5a-ctx">
              <span className="nm">Кубок Алматы 2026</span>
              <span className="ss">ОРТ · Алматы · 1/8 финала · стол 5</span>
            </div>

            {/* Вкладки листаются горизонтально: их четыре, и на 393 px они
                помещаются только впритык — прокрутка честнее, чем сжатый шрифт. */}
            <div className="m7-tabs">
              {TABS.map((t) => (
                <span key={t} className={t === tab ? 'on' : ''} data-to="Э14.5">
                  {t}
                </span>
              ))}
            </div>

            {children}
          </div>
        </Chrome>
        <MiniTabBar items={NAV} active="Мой турнир" />
      </Frame>
    </div>
  );
}

/* ═══ Участники ════════════════════════════════════════════════════
   Сто двадцать восемь человек, из которых мне важны двое: я и мой соперник.
   Поэтому они закреплены наверху отдельной группой, а дальше идёт общий
   список с посевом. Таблицы нет: на телефоне пять колонок превращаются в
   кашу, а нужны три вещи — номер посева, кто это и рейтинг. */
type Row = { n: number; nm: string; mt: string; r: number; me?: boolean };
const PINNED: Row[] = [
  { n: 2, nm: 'Ким Георгий', mt: 'Астана · СКА', r: 2456, me: true },
  { n: 4, nm: 'Жумабеков Расул', mt: 'Шымкент · «Жетісу»', r: 2312 },
];

const PLAYERS = [
  { n: 1, nm: 'Смагулов Алан', mt: 'Астана · СКА', r: 2612 },
  { n: 3, nm: 'Токаев Сергей', mt: 'Шымкент · «Жетісу»', r: 2596 },
  { n: 5, nm: 'Пак Данияр', mt: 'Павлодар · «Иртыш»', r: 2580 },
  { n: 6, nm: 'Гладун Игорь', mt: 'Актобе · «Актобе»', r: 2577 },
  { n: 7, nm: 'Оспанов Марат', mt: 'Тараз · без клуба', r: 2569 },
  { n: 8, nm: 'Байжанов Асхат', mt: 'Костанай · «Тобол»', r: 2561 },
];

export function MobPlayers() {
  return (
    <Screen tab="Участники">
      <div className="m7-search">
        <Search size={15} />
        <span>Фамилия, клуб или регион</span>
        <b>128</b>
      </div>

      <div className="m5-sec">Кто мне важен</div>
      <div className="m7-list">
        {PINNED.map((p) => (
          <div className={'m7-row' + (p.me ? ' me' : ' foe')} key={p.nm} data-to="Э14.6">
            <span className="n o14-disp">{p.n}</span>
            <span className="tx">
              <span className="nm">{p.nm}</span>
              <span className="ss">{p.mt}</span>
            </span>
            <span className="tag">{p.me ? 'ВЫ' : 'СОПЕРНИК'}</span>
            <span className="r o14-disp">{p.r}</span>
          </div>
        ))}
      </div>

      <div className="m5-sec">Все участники · по посеву</div>
      <div className="m7-list">
        {PLAYERS.map((p) => (
          <div className="m7-row" key={p.nm} data-to="Э14.6">
            <span className="n o14-disp">{p.n}</span>
            <span className="tx">
              <span className="nm">{p.nm}</span>
              <span className="ss">{p.mt}</span>
            </span>
            <span className="r o14-disp">{p.r}</span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ═══ Группы ═══════════════════════════════════════════════════════
   Формат «группы + плей-офф» (§5.1). Моя группа — единственная таблица,
   которая на телефоне уместна: четыре строки и три числа. Остальные группы
   свёрнуты до строки «кто вышел»: их читают, только чтобы понять, с кем
   играть дальше. */
export function MobGroups() {
  return (
    <Screen tab="Группы">
      <div className="m5-sec">Моя группа · A</div>
      <div className="m7-tbl">
        <div className="m7-th">
          <span className="p">М</span>
          <span className="nm">Участник</span>
          <span className="w">В–П</span>
          <span className="s">Партии</span>
        </div>
        {MY_GROUP.map((g) => (
          <div className={'m7-tr' + (g.me ? ' me' : '') + (g.out ? ' out' : '')} key={g.nm}>
            <span className="p o14-disp">{g.place}</span>
            <span className="nm">
              {g.nm}
              {g.out && <i>в плей-офф</i>}
            </span>
            <span className="w o14-disp">{g.wl}</span>
            <span className="s o14-disp">{g.sets}</span>
          </div>
        ))}
      </div>
      <div className="m7-note">Из группы выходят двое. Группа сыграна — дальше плей-офф.</div>

      <div className="m5-sec">Остальные группы</div>
      <div className="m7-list">
        {OTHER_GROUPS.map((g) => (
          <div className="m7-row" key={g.nm}>
            <span className="tx">
              <span className="nm">{g.nm}</span>
              <span className="ss">{g.sub}</span>
            </span>
            <span className="out">{g.out}</span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ═══ Сетка ════════════════════════════════════════════════════════
   Главное решение экрана: сетки как холста здесь НЕТ. На 393 px её читают
   только зумом и двумя пальцами, а вопросов к ней всего два — «до кого я
   дошёл» и «кто следующий». Поэтому сетка разложена по кругам: круг
   выбирается сверху, пары идут списком, мой матч подсвечен, пройденные круги
   помечены. Полную сетку можно открыть отдельно — она нужна редко и там
   уместен горизонтальный холст. */
const ROUNDS = ['1/32', '1/16', '1/8', '1/4', '1/2', 'финал'];

const PAIRS = [
  { a: 'Ким Георгий', b: 'Жумабеков Расул', sc: 'стол 5 · 14:20', now: true },
  { a: 'Смагулов Алан', b: 'Цой Артём', sc: '3 : 1', done: true },
  { a: 'Токаев Сергей', b: 'Абиш Нурлан', sc: '3 : 2', done: true },
  { a: 'Байжанов Асхат', b: 'Пак Сергей', sc: 'стол 2 · 14:20' },
  { a: 'Гладун Игорь', b: 'Мурат Кайрат', sc: 'стол 7 · 15:00' },
  { a: 'Оспанов Тимур', b: 'Асан Бекзат', sc: 'стол 9 · 15:00' },
];

export function MobBracket() {
  return (
    <Screen tab="Сетка">
      {/* Круги: горизонтальная лента, текущий подсвечен. Пройденные — с
          галочкой, будущие — тише. */}
      <div className="m7-rounds">
        {ROUNDS.map((r, i) => (
          <span key={r} className={r === '1/8' ? 'on' : i < 2 ? 'done' : ''}>
            {r}
          </span>
        ))}
      </div>

      <div className="m5-sec">1/8 финала · 8 пар</div>
      <div className="m7-pairs">
        {PAIRS.map((p) => (
          <div className={'m7-pair' + (p.now ? ' now' : '') + (p.done ? ' done' : '')} key={p.a}>
            <span className="side">{p.a}</span>
            <span className="side">{p.b}</span>
            <span className="sc">{p.sc}</span>
          </div>
        ))}
      </div>

      <div className="m7-note">
        Ваша пара подсвечена. Сетку целиком удобнее смотреть на компьютере — на телефоне она
        читается только по кругам.
      </div>
    </Screen>
  );
}
