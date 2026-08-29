/* Э14.1 → Э14.5 · два состояния мобильного экрана, которых не хватало.

   Вопрос федерации был из двух частей.

   1. ЧТО ПРОИСХОДИТ ПО КНОПКЕ «ОТКРЫТЬ МАТЧ». Кнопка ничего не подтверждает и
      ничего не отправляет: это переход на Э14.5 «Мой турнир и мой матч».
      Спортсмен там только смотрит — счёт ведёт судья стола, спортсмен его не
      вводит и не подтверждает (flows/14-sportsmen.md, Э14.5). На телефоне
      экран нарисован в том же облике: поле знака сверху, лист снизу, вкладки
      «Мой матч · Участники · Группы · Сетка».

   2. ЧТО, ЕСЛИ НИКУДА НЕ ВЫЗЫВАЛИ. Тут два разных случая, и путать их нельзя:
      · турнир идёт, но прямо сейчас не вызвали — это слайды 2 и 3 карусели:
        «вы следующие» и «сегодня позже», голос тише, грань серая;
      · турнира нет вовсе, межсезонье — экран ниже. Вызывать некуда, и поле
        занимает то, ради чего человек зашёл: сколько дней до ближайшего старта
        и что с моей заявкой. Цвета у экрана свои не заводятся: поле то же синее,
        только приглушённое, кнопка та же зелёная — правило цвета роли записано
        в role14mobile.css.

   ⚠ По межсезонью решение не закрыто: есть второй нарисованный герой — «итог
   сезона» вместо отсчёта (см. открытый вопрос во flows). Здесь показан первый. */

import { ChevronRight } from 'lucide-react';
import { Frame } from '../PlayerApp';
import { MiniTabBar } from '../respShell';
import { Chrome, NAV } from './role14mobile';
import './role14mobile3.css';
import './role14mobile7.css';

function Screen({ cls, active = 'Главная', children }: { cls: string; active?: string; children: React.ReactNode }) {
  return (
    <div className={'mb-wrap mbr ' + cls}>
      <Frame>
        <Chrome>
          <div className="mb-body">{children}</div>
        </Chrome>
        <MiniTabBar items={NAV} active={active} />
      </Frame>
    </div>
  );
}
/* ── Э14.5 · куда ведёт «Открыть матч» ─────────────────────────────*/
const GAMES = [
  [11, 8],
  [9, 11],
  [11, 6],
  [7, 5],
];

/* Активный пункт навигации — «Мой турнир»: это уже не главная. */
export function MobileMatch() {
  return (
    <Screen cls="m3m" active="Мой турнир">
      {/* Вкладки стоят ПЕРВЫМИ и на всех четырёх экранах Э14.5 одинаково —
          сразу под шапкой сайта. Раньше на «Моём матче» они висели под красным
          полем, и при переключении вкладок строка прыгала на две сотни
          пикселей: человек целился в «Участники», а попадал в пустоту. */}
      <div className="m7-tabs">
        {['Мой матч', 'Участники', 'Группы', 'Сетка'].map((t) => (
          <span key={t} className={t === 'Мой матч' ? 'on' : ''} data-to="Э14.5">
            {t}
          </span>
        ))}
      </div>

      <div className="mbr-card m3m-card">
        <div className="mbr-band" />
        <div className="mbr-in">
          <div className="mbr-top">
            <span className="mbr-state m3m-live">Идёт матч · партия 4</span>
            <span className="mbr-time o14-disp">32′</span>
          </div>

          {/* Счёт по партиям крупно, по геймам — строкой, как у референса WTT.
              В строке счёта только фамилии: игроков двое, инициалы тут ничего не
              различают, а место занимают. */}
          <div className="m3m-score">
            <div className="m3m-side">
              <span className="nm">Ким</span>
              <span className="s o14-disp lead">2</span>
              <span className="g">
                {GAMES.map((g, i) => (
                  <i key={i}>{g[0]}</i>
                ))}
              </span>
            </div>
            <div className="m3m-side">
              <span className="nm">Жумабеков</span>
              <span className="s o14-disp">1</span>
              <span className="g">
                {GAMES.map((g, i) => (
                  <i key={i}>{g[1]}</i>
                ))}
              </span>
            </div>
          </div>

          {/* Общие сведения о турнире переехали сюда с чёрной полосы над
              вкладками (25.08.2026): она занимала 85 px и повторяла то, что
              человек знает и так. «Общая информация» — это и есть вкладка
              «Мой матч», место сведениям рядом со счётом. */}
          <div className="mbr-round">Кубок Алматы 2026 · ОРТ · Алматы</div>
          <div className="mbr-round">Стол 5 · 1/8 финала · одиночный разряд</div>
        </div>
      </div>

      <div className="mbr-sheet">
        {/* Спортсмен здесь только смотрит: счёт ведёт судья стола. */}
        <div className="m3m-note">Счёт ведёт судья стола — вводить и подтверждать ничего не нужно.</div>

        <div className="mbr-group">
        <div className="mbr-sec">Соперник</div>
        <div className="mbr-row" data-to="Э14.6">
          <span className="tx">
            <span className="nm">Жумабеков Расул</span>
            <span className="ss">рейтинг 2312 · Шымкент · посев 13</span>
          </span>
          <span className="m3m-h2h">3 : 2</span>
        </div>
        </div>

        <div className="mbr-group">
        <div className="mbr-sec">Мой путь</div>
        {[
          { r: '1/32', foe: 'Ахметов Т.', sc: '3:0', done: true },
          { r: '1/16', foe: 'Оралбек Д.', sc: '3:1', done: true },
          { r: '1/8', foe: 'Жумабеков Р.', sc: 'идёт', now: true },
        ].map((p) => (
          <div className={'m3m-path' + (p.now ? ' now' : '')} key={p.r}>
            <span className="r">{p.r}</span>
            <span className="nm">{p.foe}</span>
            <span className="sc">{p.sc}</span>
          </div>
        ))}

        <button type="button" className="m3m-full" data-to="Э14.5">
          Сетка турнира целиком <ChevronRight size={15} />
        </button>
        </div>
      </div>
    </Screen>
  );
}
