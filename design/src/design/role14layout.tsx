/* Э14.3 · Заявка — четыре разные РАСКЛАДКИ СТРАНИЦЫ (26.08.2026).

   Замечание федерации: «дело не в шрифте и не в цвете — я спросил про
   расположение, про layout, как он выглядит в целом».

   Оно справедливое, и предыдущие одиннадцать заходов были мимо: я менял
   начинку рабочей области, а рама страницы оставалась одна и та же — узкий
   сайдбар слева, шапка сверху, содержимое прижато к левой половине, справа и
   снизу пусто. Именно её и видно каждый раз.

   Здесь меняется рама. Начинка, палитра и шрифт у всех четырёх ОДИНАКОВЫЕ —
   сравнивать надо расположение:

     Л1 «Верхнее меню»  — сайдбара нет, разделы лентой в шапке, работа
                          колонкой по центру страницы.
     Л2 «Широкая левая» — левая колонка втрое шире и несёт контекст турнира,
                          рабочая область одна широкая.
     Л3 «Три колонки»   — навигация | работа | постоянная правая панель.
     Л4 «Фокус»         — интерфейс убран совсем: колонка по центру и выход.

   Разбор каждой — в role14layout.css. Содержание — flows/14-sportsmen.md. */

import {
  ArrowRight, BarChart3, CalendarDays, Check, ChevronRight, Home, Minus, Newspaper, Timer, User, X,
} from 'lucide-react';
import { DeskFrame, type DeskVariant } from '../deskShell';
import { Brand } from '../ui';
import { A } from '../fedCommon';
import './role14layout.css';

const NAV: [React.ReactNode, string][] = [
  [<Home size={16} key="h" />, 'Главная'],
  [<CalendarDays size={16} key="c" />, 'Календарь'],
  [<Timer size={16} key="t" />, 'Мой турнир'],
  [<BarChart3 size={16} key="b" />, 'Аналитика'],
  [<Newspaper size={16} key="n" />, 'Новости'],
  [<User size={16} key="u" />, 'Профиль'],
];

const FIELDS: [string, string, boolean][] = [
  ['Разряд', 'Одиночный', false],
  ['Возрастная группа', 'Взрослые', false],
  ['Парный разряд ✳', 'партнёр не выбран', true],
];

const TERMS = [
  { nm: 'Годовой взнос федерации', ss: 'оплачен 14.01.2026', ok: true },
  { nm: 'Удостоверение личности', ss: 'приложено при регистрации', ok: true },
  { nm: 'Медицинский допуск', ss: 'действует до 30.11.2026', ok: true },
  { nm: 'Ценз по рейтингу', ss: 'у этого турнира не требуется', ok: false },
];

const FACTS: [string, string][] = [
  ['Где', 'Алматы, ЦСКА'],
  ['Когда', '12–14 сентября'],
  ['Разряды', 'одиночный, парный, микст'],
  ['Формат', 'группы, затем плей-офф'],
  ['Заявились', '96 из 128'],
];

const NOTE = 'Заявка уходит главному судье турнира — решение придёт уведомлением.';

/* ── Куски начинки: одни и те же во всех четырёх рамах ───────────── */
const Fields = () => (
  <div className="lo-sheet">
    {FIELDS.map(([k, v, quiet]) => (
      <div className="lo-f" key={k}>
        <span className="k">{k}</span>
        <span className={'v' + (quiet ? ' quiet' : '')}>{v}</span>
        <ChevronRight size={17} />
      </div>
    ))}
  </div>
);

const Terms = () => (
  <div className="lo-sheet">
    {TERMS.map((t) => (
      <div className={'lo-t' + (t.ok ? '' : ' off')} key={t.nm}>
        <span className="ic">{t.ok ? <Check size={12} /> : <Minus size={12} />}</span>
        <span className="tx">
          <span className="nm">{t.nm}</span>
          <span className="ss">{t.ss}</span>
        </span>
      </div>
    ))}
  </div>
);

const Go = () => (
  <div className="lo-go">
    <span className="note">{NOTE}</span>
    <button type="button" className="lo-btn" data-to="Э14.4">
      Подать заявку <ArrowRight size={17} />
    </button>
  </div>
);

const Till = () => (
  <div className="lo-till">
    <div className="v o14-disp">до 05.09</div>
    <div className="k">приём заявок · осталось 3 дня</div>
  </div>
);

const Facts = () => (
  <>
    {FACTS.map(([k, v]) => (
      <div className="lo-fact" key={k}>
        <span className="k">{k}</span>
        <span className="v">{v}</span>
      </div>
    ))}
  </>
);

const Me = () => (
  <div className="lo-me">
    <img src={A(44)} alt="" />
    <div>
      <div className="nm">Ким Г.</div>
      <div className="rl">Спортсмен · рейтинг 2456</div>
    </div>
  </div>
);

/* ═══ Л1 · «Верхнее меню» ══════════════════════════════════════════ */
export function Layout1Top({ variant }: { variant?: DeskVariant } = {}) {
  return (
    <DeskFrame variant={variant}>
      <div className="lo">
        <div className="lo-top">
          <Brand size="sm" />
          <div className="lo-nav">
            {NAV.map(([ic, t]) => (
              <button type="button" className={t === 'Календарь' ? 'on' : ''} key={t}>
                {ic}
                {t}
              </button>
            ))}
          </div>
          <div className="sp" />
          <Me />
        </div>

        <div className="lo-body lo1-body">
          <div className="lo1-col">
            <div className="lo1-crumbs">
              Календарь сезона <ChevronRight size={13} /> <b>Кубок Алматы 2026</b>
            </div>
            <div className="lo-h o14-disp" style={{ marginTop: 10 }}>Кубок Алматы 2026</div>
            <div className="lo-mt">ОРТ · Алматы, ЦСКА · 12–14 сентября 2026</div>

            <div className="lo1-cols">
              <div>
                <div className="lo-sec">Прошу допустить к участию</div>
                <Fields />
                <div className="lo-sec" style={{ marginTop: 'var(--s-6)' }}>
                  Условия допуска · проверено системой
                </div>
                <Terms />
                <Go />
              </div>
              <aside className="lo-sheet">
                <Till />
                <Facts />
              </aside>
            </div>
          </div>
        </div>
      </div>
    </DeskFrame>
  );
}

/* ═══ Л2 · «Широкая левая» ═════════════════════════════════════════ */
export function Layout2Wide({ variant }: { variant?: DeskVariant } = {}) {
  return (
    <DeskFrame variant={variant}>
      <div className="lo">
        <div className="lo-top">
          <Brand size="sm" />
          <div className="sp" />
          <Me />
        </div>

        <div className="lo-body lo2-grid">
          <aside className="lo2-side">
            <div className="lo-nav">
              {NAV.map(([ic, t]) => (
                <button type="button" className={t === 'Календарь' ? 'on' : ''} key={t}>
                  {ic}
                  {t}
                </button>
              ))}
            </div>
            {/* Контекст турнира живёт в сайдбаре: он не меняется, пока человек
                заполняет, и в рабочей области ему делать нечего. */}
            <div className="lo2-ctx">
              <div className="cap">Заявка на турнир</div>
              <div className="nm o14-disp">Кубок Алматы 2026</div>
            </div>
            <div className="lo-sheet" style={{ border: 0 }}>
              <Till />
              <Facts />
            </div>
          </aside>

          <main className="lo2-main">
            <div className="lo-sec">Прошу допустить к участию</div>
            <Fields />
            <div className="lo-sec" style={{ marginTop: 'var(--s-6)' }}>
              Условия допуска · проверено системой
            </div>
            <div style={{ maxWidth: 880 }}>
              <Terms />
              <Go />
            </div>
          </main>
        </div>
      </div>
    </DeskFrame>
  );
}

/* ═══ Л3 · «Три колонки» ═══════════════════════════════════════════ */
export function Layout3Three({ variant }: { variant?: DeskVariant } = {}) {
  return (
    <DeskFrame variant={variant}>
      <div className="lo">
        <div className="lo-top">
          <Brand size="sm" />
          <div className="sp" />
          <Me />
        </div>

        <div className="lo-body lo3-grid">
          <aside className="lo3-side">
            <div className="lo-nav">
              {NAV.map(([ic, t]) => (
                <button type="button" className={t === 'Календарь' ? 'on' : ''} key={t}>
                  {ic}
                  {t}
                </button>
              ))}
            </div>
          </aside>

          <main className="lo3-main">
            <div className="lo-eyebrow">Заявка на турнир</div>
            <div className="lo-h o14-disp" style={{ marginTop: 8 }}>Кубок Алматы 2026</div>

            <div className="lo-sec" style={{ marginTop: 'var(--s-5)' }}>
              Прошу допустить к участию
            </div>
            <Fields />
            <div className="lo-sec" style={{ marginTop: 'var(--s-6)' }}>
              Условия допуска · проверено системой
            </div>
            <Terms />
            <Go />
          </main>

          {/* Правая панель постоянная: её не открывают и не закрывают. */}
          <aside className="lo3-insp">
            <div className="cap">Турнир</div>
            <div style={{ padding: 'var(--s-3) 0 0' }}>
              <Till />
              <Facts />
            </div>
          </aside>
        </div>
      </div>
    </DeskFrame>
  );
}

/* ═══ Л4 · «Фокус» ═════════════════════════════════════════════════ */
export function Layout4Focus({ variant }: { variant?: DeskVariant } = {}) {
  return (
    <DeskFrame variant={variant}>
      <div className="lo lo4">
        <div className="lo4-bar">
          <Brand size="sm" />
          <div className="sp" />
          <button type="button" className="lo4-x" data-to="Э14.2">
            <X size={14} /> Выйти без подачи
          </button>
        </div>

        <div className="lo-body lo4-body">
          <div className="lo4-col">
            <div className="lo4-step">
              Шаг 2 из 3
              <i className="on" />
              <i className="on" />
              <i />
            </div>

            <div className="lo-eyebrow">Заявка на турнир</div>
            <div className="lo-h o14-disp" style={{ marginTop: 8 }}>Кубок Алматы 2026</div>
            <div className="lo-mt">
              ОРТ · Алматы, ЦСКА · 12–14 сентября · приём заявок до 05.09
            </div>

            <div className="lo-sec" style={{ marginTop: 'var(--s-5)' }}>
              Прошу допустить к участию
            </div>
            <Fields />

            <div className="lo-sec" style={{ marginTop: 'var(--s-5)' }}>
              Условия допуска · проверено системой
            </div>
            <Terms />

            <Go />
          </div>
        </div>
      </div>
    </DeskFrame>
  );
}
