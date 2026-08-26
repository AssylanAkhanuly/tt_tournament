/* Э14.3 · Заявка — «как в Kaspi при подаче» (26.08.2026), десктоп и телефон.

   Замечание федерации: левый сайдбар оставить, направление верное, но собрать
   организованнее — примерно как в Kaspi, когда что-то подаёшь; и показать
   заодно телефон.

   Разбор языка подачи (одна колонка, карточки с заголовками, нумерация шагов,
   строка ключ → значение, итог и одна большая кнопка внизу) — в
   role14kaspi.css рядом со стилями.

   Содержание — из flows/14-sportsmen.md, то же, что во всех прошлых заходах.
   Сайдбар и шапка берутся из штатной оболочки `RoleScreen`: их и просили не
   трогать. На телефоне — штатная рамка роли с её таб-баром. */

import { ArrowRight, Check, ChevronRight, Minus } from 'lucide-react';
import { RoleScreen } from '../mockups/shell';
import { R14 } from '../mockups/roles';
import { Frame } from '../PlayerApp';
import { MiniTabBar } from '../respShell';
import { Chrome, NAV } from './role14mobile';
import type { DeskVariant } from '../deskShell';
import './role14kaspi.css';

const FIELDS: { k: string; v: string; quiet?: boolean }[] = [
  { k: 'Разряд', v: 'Одиночный' },
  { k: 'Возрастная группа', v: 'Взрослые' },
  { k: 'Парный разряд ✳', v: 'партнёр не выбран', quiet: true },
];

const TERMS = [
  { nm: 'Годовой взнос федерации', ss: 'оплачен 14.01.2026', ok: true },
  { nm: 'Удостоверение личности', ss: 'приложено при регистрации', ok: true },
  { nm: 'Медицинский допуск', ss: 'действует до 30.11.2026', ok: true },
  { nm: 'Ценз по рейтингу', ss: 'у этого турнира не требуется', ok: false },
];

const TOUR: [string, string][] = [
  ['Где', 'Алматы, ЦСКА · ул. Абая 48'],
  ['Когда', '12–14 сентября 2026'],
  ['Формат', 'группы, затем плей-офф'],
];

/* ── Карточки: один и тот же порядок на десктопе и телефоне ─────── */

/** Куда подаёте — сводкой, а не таблицей из пяти строк.
    Первый заход расписал турнир построчно («Название», «Где», «Когда»,
    «Формат») и карточка заняла половину экрана, оттеснив то, ради чего сюда
    пришли. В языке подачи такой блок — короткая сводка: название заголовком,
    остальное одной строкой под ним, и только два факта, которые могут
    изменить решение, — срок приёма и сколько осталось мест. */
const CardTour = () => (
  <section className="ks-card">
    <div className="ks-top">
      <div className="nm o14-disp">Кубок Алматы 2026</div>
      <div className="ss">{TOUR.map(([, v]) => v).join(' · ')}</div>
    </div>
    <div className="ks-till">
      <span className="v">Приём до 05.09</span>
      <span className="k">осталось 3 дня</span>
    </div>
    <div className="ks-fill">
      <div className="row">
        <span className="n">96 из 128 уже заявились</span>
        <span className="k">приём закроется раньше, если наберётся сетка</span>
      </div>
      <div className="bar">
        <i style={{ width: '75%' }} />
      </div>
    </div>
  </section>
);

/** 2 · Что подаёте. Единственная карточка, которую человек заполняет. */
const CardWhat = () => (
  <section className="ks-card">
    <div className="ks-cap">
      <i>1</i>
      Что подаёте
      <span className="sp" />
      <span className="note">шаг 1 из 2</span>
    </div>
    {FIELDS.map((f) => (
      <div className="ks-row tap" key={f.k}>
        <span className="k">{f.k}</span>
        <span className={'v' + (f.quiet ? ' quiet' : '')}>{f.v}</span>
        <ChevronRight size={17} className="ch" />
      </div>
    ))}
  </section>
);

/** 3 · Допуск. Проверяет система — человеку тут делать нечего, но видеть надо. */
const CardTerms = () => (
  <section className="ks-card">
    <div className="ks-cap">
      <i>2</i>
      Допуск
      <span className="sp" />
      <span className="note">проверено системой</span>
    </div>
    {TERMS.map((t) => (
      <div className={'ks-t' + (t.ok ? '' : ' off')} key={t.nm}>
        <span className="ic">{t.ok ? <Check size={13} /> : <Minus size={13} />}</span>
        <span className="tx">
          <span className="nm">{t.nm}</span>
          <span className="ss">{t.ss}</span>
        </span>
      </div>
    ))}
  </section>
);

/** Сводка перед действием: что именно уходит судье. */
const Summary = () => (
  <div className="ks-sum">
    <div className="l">
      <span className="k">Турнир</span>
      <span className="v">Кубок Алматы 2026</span>
    </div>
    <div className="l">
      <span className="k">Разряд</span>
      <span className="v">Одиночный · взрослые</span>
    </div>
    <div className="l">
      <span className="k">Заявитель</span>
      <span className="v">Ким Георгий · рейтинг 2456</span>
    </div>
  </div>
);

const NOTE =
  'Решение принимает главный судья турнира — оно придёт уведомлением. Пока приём открыт, заявку можно отозвать.';

/* ═══ Десктоп ═════════════════════════════════════════════════════ */
export function ApplyKaspiDesk({ variant }: { variant?: DeskVariant } = {}) {
  return (
    <RoleScreen variant={variant} role={R14} nav="Календарь" title="Заявка" sub="—">
      <div className="ks o14-nohead">
        <div className="ks-col">
          <button type="button" className="ks-back" data-to="Э14.2">
            <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Календарь сезона
          </button>
          <div className="ks-h o14-disp">Заявка на турнир</div>
          <div className="ks-mt">Проверьте, что подаёте, и отправьте главному судье</div>

          <CardTour />
          <CardWhat />
          <CardTerms />

          <section className="ks-card">
            <Summary />
            <div className="ks-go">
              <button type="button" className="ks-btn" data-to="Э14.4">
                Подать заявку <ArrowRight size={18} />
              </button>
              <div className="ks-note">{NOTE}</div>
            </div>
          </section>
        </div>
      </div>
    </RoleScreen>
  );
}

/* ═══ Телефон ═════════════════════════════════════════════════════
   Тот же порядок карточек — подача читается одинаково на обоих устройствах.
   Отличий два: колонка во всю ширину и кнопка, прилипшая над таб-баром. */
export function ApplyKaspiMobile() {
  return (
    <div className="mb-wrap ksm">
      <Frame>
        <Chrome>
          <div className="mb-body">
            <div className="ks">
              <div className="ks-col">
                <button type="button" className="ks-back" data-to="Э14.2">
                  <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Календарь
                </button>
                <div className="ks-h o14-disp">Заявка на турнир</div>
                <div className="ks-mt">Проверьте, что подаёте, и отправьте судье</div>

                <CardTour />
                <CardWhat />
                <CardTerms />

                <section className="ks-card">
                  <Summary />
                </section>

                {/* Место под прилипшую кнопку: без него последняя карточка
                    прячется под ней. */}
                <div className="ks-body-pad" />
              </div>
            </div>
          </div>

          <div className="ksm-dock">
            <button type="button" className="ks-btn" data-to="Э14.4">
              Подать заявку <ArrowRight size={18} />
            </button>
            <div className="ks-note">Решение придёт уведомлением</div>
          </div>
        </Chrome>
        <MiniTabBar items={NAV} active="Календарь" />
      </Frame>
    </div>
  );
}
