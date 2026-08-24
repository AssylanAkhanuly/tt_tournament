/* Роль 14 · остальные экраны — на телефоне, каждый со своим решением.

   ПОЧЕМУ ЗАНОВО. Первый заход раздал всем экранам роли одно и то же тёмное
   поле с лентой орнамента — то, что придумано для главной. С двух шагов
   маршрут превратился в одну страницу с разной начинкой: у календаря, формы
   заявки, аналитики и профиля разные задачи, а шапка у всех была одинаковая и
   занимала четверть экрана, ничего не сообщая.

   ЧТО ВМЕСТО. Общими остаются система, а не картинка: токены, прямые углы,
   шкала кеглей, правило цвета (зелёный — статус, акцент — действие, красный —
   эфир) и два плана «поле → лист» ТАМ, ГДЕ ПОЛЮ ЕСТЬ ЧТО СКАЗАТЬ. Тёмное поле
   с орнаментом остаётся за главной и за идущим матчем — там оно про
   принадлежность и про эфир. У остальных экранов шапка своя и работает:

     Э14.2 Календарь  — месяцы колонкой: у турнира главное «когда».
     Э14.3 Заявка     — бланк: узкая строка контекста, дальше поля и одно
                        действие, приколоченное к низу.
     Э14.4 Моя заявка — состояние крупно + хроника: что было и что дальше.
     Э14.6 Аналитика  — число: рейтинг сам себе заголовок, под ним кривая.
     Э14.7 Профиль    — карточка игрока: фото, разряд, взнос сроком.

   Содержание везде из flows/14-sportsmen.md. Рисуем на светлой теме. */

import { ArrowRight, Check, ChevronRight, CreditCard, Pencil } from 'lucide-react';
import { Frame } from '../PlayerApp';
import { MiniTabBar } from '../respShell';
import { A } from '../fedCommon';
import { Chrome, NAV } from './role14mobile';
import { RESULTS } from './role14home';
import './role14mobile5.css';

function Screen({ cls, active, children }: { cls: string; active: string; children: React.ReactNode }) {
  return (
    <div className={'mb-wrap m5 ' + cls}>
      <Frame>
        <Chrome>
          <div className="mb-body m5-body">{children}</div>
        </Chrome>
        <MiniTabBar items={NAV} active={active} />
      </Frame>
    </div>
  );
}

/* ═══ Э14.2 · Календарь — «месяцы» ═════════════════════════════════
   У турнира для спортсмена главное не название, а когда он и до какого числа
   принимают заявки. Поэтому список разрезан по месяцам, месяц стоит колонкой
   слева и держит взгляд при прокрутке, а срок приёма — единственное, что
   набрано цветом. Тёмного поля нет вовсе: экран — список, а не витрина. */
const MONTHS = [
  {
    m: 'сен',
    y: '2026',
    items: [
      { nm: 'Кубок Алматы 2026', mt: 'ОРТ · Алматы · 12–14', till: 'приём до 05.09', can: true },
      { nm: 'Чемпионат Республики', mt: 'Главный старт · Астана · 18–22', by: 'заявляет регион' },
      { nm: 'Кубок Астаны 2026', mt: 'ОРТ · Астана · 26–28', till: 'приём до 20.09', can: true },
    ],
  },
  {
    m: 'окт',
    y: '2026',
    items: [
      { nm: 'Осенний турнир Шымкента', mt: 'ОРТ · Шымкент · 10–11', till: 'приём до 03.10', can: true },
      { nm: 'Евразийская лига · 4-й тур', mt: 'Караганда · 24–26', by: 'заявляет клуб' },
    ],
  },
];

export function MobCalendar() {
  return (
    <Screen cls="m5c" active="Календарь">
      {/* Сегменты приколочены к верху: переключение между «куда могу» и «где
          уже заявлен» — единственное, что человек здесь настраивает. */}
      <div className="m5-seg">
        <span className="on">Куда могу заявиться</span>
        <span>Мои турниры</span>
      </div>

      {MONTHS.map((mo) => (
        <section className="m5c-month" key={mo.m}>
          <div className="m5c-mark">
            <span className="m o14-disp">{mo.m}</span>
            <span className="y">{mo.y}</span>
          </div>
          <div className="m5c-list">
            {mo.items.map((t) => (
              <div className="m5c-row" key={t.nm} data-to="Э14.3">
                <div className="tx">
                  <span className="nm">{t.nm}</span>
                  <span className="ss">{t.mt}</span>
                </div>
                {t.can ? (
                  <span className="till">{t.till}</span>
                ) : (
                  <span className="by">{t.by}</span>
                )}
                {t.can && <ChevronRight size={16} className="ch" />}
              </div>
            ))}
          </div>
        </section>
      ))}
    </Screen>
  );
}

/* ═══ Э14.3 · Заявка — «бланк» ═════════════════════════════════════
   Экран, где человек не смотрит, а заполняет. Контекст — одна узкая строка
   вверху, чтобы было видно, куда подаём, и не больше. Дальше поля крупными
   строками (палец, а не курсор), условия допуска — галочками, потому что это
   проверка, а не список. Действие приколочено к низу: на форме оно должно
   быть под большим пальцем, а не в конце прокрутки. */
const TERMS = [
  { nm: 'Годовой взнос федерации', ss: 'оплачен 14.01.2026', ok: true },
  { nm: 'Удостоверение личности', ss: 'приложено', ok: true },
  { nm: 'Медицинский допуск', ss: 'действует до 30.11.2026', ok: true },
  { nm: 'Ценз по рейтингу', ss: 'не требуется', ok: true },
];

export function MobApply() {
  return (
    <Screen cls="m5a" active="Календарь">
      <div className="m5a-ctx">
        <span className="nm">Кубок Алматы 2026</span>
        <span className="ss">ОРТ · Алматы · 12–14.09 · приём до 05.09</span>
      </div>

      <div className="m5-sec">Заявка</div>
      <div className="m5a-fields">
        <label className="m5a-f">
          <span className="k">Разряд</span>
          <span className="v">Одиночный</span>
          <ChevronRight size={16} />
        </label>
        <label className="m5a-f">
          <span className="k">Возрастная группа</span>
          <span className="v">Взрослые</span>
          <ChevronRight size={16} />
        </label>
        <label className="m5a-f">
          <span className="k">Парный разряд ✳</span>
          <span className="v quiet">партнёр не выбран</span>
          <ChevronRight size={16} />
        </label>
      </div>

      <div className="m5-sec">Условия допуска</div>
      <div className="m5a-terms">
        {TERMS.map((t) => (
          <div className="m5a-t" key={t.nm}>
            <span className="ic">
              <Check size={13} />
            </span>
            <span className="tx">
              <span className="nm">{t.nm}</span>
              <span className="ss">{t.ss}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Приколочено к низу над навигацией: одно действие на экран. */}
      <div className="m5-dock">
        <div className="note">Решение принимает главный судья турнира</div>
        <button type="button" className="m5-go" data-to="Э14.4">
          Подать заявку <ArrowRight size={17} />
        </button>
      </div>
    </Screen>
  );
}

/* ═══ Э14.4 · Моя заявка — «состояние и хроника» ═══════════════════
   Человек заходит сюда с одним вопросом: «ну что там». Ответ — первым экраном
   и целиком: состояние крупной плашкой, у которой цвет значит ровно то же,
   что везде. Под ней хроника: что уже случилось и что будет дальше, с датами.
   Отзыв заявки — второе действие, поэтому контурное и внизу. */
const STEPS = [
  { t: 'Заявка подана', d: '02.09, 19:40', done: true },
  { t: 'Решение главного судьи', d: 'придёт уведомлением', now: true },
  { t: 'Жеребьёвка', d: 'после закрытия приёма, 05.09' },
  { t: 'Вызов на стол', d: 'в день игры, уведомлением' },
];

export function MobMyApp() {
  return (
    <Screen cls="m5m" active="Календарь">
      <div className="m5m-state">
        <span className="k">Моя заявка</span>
        <span className="v o14-disp">На рассмотрении</span>
        <span className="s">Кубок Алматы 2026 · одиночный</span>
      </div>

      <div className="m5-sec">Что дальше</div>
      <div className="m5m-line">
        {STEPS.map((s) => (
          <div className={'m5m-step' + (s.done ? ' done' : '') + (s.now ? ' now' : '')} key={s.t}>
            <span className="dot" />
            <span className="tx">
              <span className="nm">{s.t}</span>
              <span className="ss">{s.d}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="m5-dock">
        <div className="note">Пока приём открыт, заявку можно отозвать</div>
        <button type="button" className="m5-go ghost">
          Отозвать заявку
        </button>
      </div>
    </Screen>
  );
}

/* ═══ Э14.6 · Аналитика — «число» ══════════════════════════════════
   Заголовка «Аналитика» здесь нет: заголовок — сам рейтинг. Под числом
   кривая сезона во всю ширину (рисуется, а не картинка), под кривой — сезон
   строками: каждый турнир и что он дал рейтингу. Дельта — единственное
   цветное на экране, и цвет тот же, что у счёта: зелёный выигрыш, красный
   проигрыш. */
const SEASON = [
  { nm: 'Кубок Алматы 2026', ss: '1/4 финала · 19.01', d: '+22', up: true },
  { nm: 'Открытый турнир Астаны', ss: 'финал · 20.05', d: '-6', up: false },
  { nm: 'Кубок Иртыша', ss: '1/2 финала · 14.06', d: '+18', up: true },
  { nm: 'Шымкент Open', ss: 'группа · 11.07', d: '+11', up: true },
];

/* Кривая: восемь точек сезона, нормированные в 100×34. Рисуем polyline,
   потому что это график, а не украшение: значения настоящие. */
const CURVE = [2388, 2404, 2412, 2426, 2418, 2432, 2441, 2456];

export function MobStats() {
  const min = Math.min(...CURVE);
  const max = Math.max(...CURVE);
  const pts = CURVE.map((v, i) => {
    const x = (i / (CURVE.length - 1)) * 100;
    const y = 32 - ((v - min) / (max - min)) * 28;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <Screen cls="m5s" active="Профиль">
      <div className="m5s-top">
        <div className="m5s-num o14-disp">2456</div>
        <div className="m5s-side">
          <span className="d">+68</span>
          <span className="k">за сезон</span>
        </div>
      </div>
      <div className="m5s-meta">рейтинг · 7 место в РК · 27 матчей, 70 % побед</div>

      <div className="m5s-chart">
        <svg className="m5s-curve" viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden>
          <polyline points={pts} fill="none" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="m5s-axis">
        <span>19.01</span>
        <span>26.10</span>
      </div>

      <div className="m5-sec">Сезон по турнирам</div>
      <div className="m5s-list">
        {SEASON.map((t) => (
          <div className="m5s-row" key={t.nm} data-to="Э14.5">
            <span className="tx">
              <span className="nm">{t.nm}</span>
              <span className="ss">{t.ss}</span>
            </span>
            <span className={'d ' + (t.up ? 'up' : 'dn')}>{t.d}</span>
          </div>
        ))}
      </div>

      <div className="m5-sec">Последние матчи</div>
      <div className="m5s-list">
        {RESULTS.slice(0, 2).map((r) => (
          <div className="m5s-row" key={r.nm} data-to="Э14.6">
            <span className="tx">
              <span className="nm">{r.nm}</span>
              <span className="ss">{r.sub}</span>
            </span>
            <span className={'d ' + (r.win ? 'up' : 'dn')}>{r.sc}</span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ═══ Э14.7 · Профиль — «карточка игрока» ══════════════════════════
   Единственный экран роли, где человек смотрит на себя, поэтому здесь и стоит
   фотография — та, что он приложил при регистрации. Взнос вынесен отдельной
   плашкой со сроком: он блокирует заявки (⚠ 6.1), и прятать его в список
   нельзя. Остальное — строки: данные на чтение, правка отдельным экраном. */
export function MobProfile() {
  return (
    <Screen cls="m5p" active="Профиль">
      <div className="m5p-head">
        <img className="ava" src={A(44)} alt="" />
        <div className="tx">
          <span className="nm o14-disp">Ким Георгий</span>
          <span className="ss">мастер спорта · Астана · клуб СКА</span>
        </div>
        <button type="button" className="edit" data-to="Э14.9">
          <Pencil size={15} />
        </button>
      </div>

      <div className="m5p-rail">
        <div>
          <b className="o14-disp">2456</b>
          <span>рейтинг</span>
        </div>
        <div>
          <b className="o14-disp">7</b>
          <span>место в РК</span>
        </div>
        <div>
          <b className="o14-disp">2003</b>
          <span>год рождения</span>
        </div>
      </div>

      {/* Взнос: своя плашка, потому что от него зависят заявки. */}
      <div className="m5p-fee">
        <div className="tx">
          <span className="k">Годовой взнос 2026</span>
          <span className="v o14-disp">₸ 10 000</span>
          <span className="s">срок до 31 марта</span>
        </div>
        <button type="button" className="pay" data-to="Э14.8">
          <CreditCard size={15} /> Оплатить
        </button>
      </div>

      <div className="m5-sec">Данные</div>
      <div className="m5p-list">
        {[
          ['Телефон', '+7 705 118 44 03'],
          ['Почта', 'g.kim@mail.kz'],
          ['Клуб', 'СКА · Астана'],
          ['Тренер', 'Гладун Игорь'],
        ].map(([k, v]) => (
          <div className="m5p-row" key={k}>
            <span className="k">{k}</span>
            <span className="v">{v}</span>
          </div>
        ))}
      </div>

      <div className="m5-sec">Ещё</div>
      <div className="m5p-list">
        <div className="m5p-row link" data-to="Э14.12">
          <span className="k">История платежей</span>
          <ChevronRight size={16} />
        </div>
        <div className="m5p-row link" data-to="Э14.9">
          <span className="k">Изменить данные</span>
          <ChevronRight size={16} />
        </div>
      </div>
    </Screen>
  );
}
