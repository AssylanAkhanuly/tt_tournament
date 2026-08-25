/* Роль 14 · Спортсмен — макеты по флоу. Экраны Э14.1–Э14.7
   (см. `flows/14-sportsmen.md` и карту роли).

   Сейчас проектируем **веб**: у спортсмена те же семь экранов, что были
   нарисованы телефоном, но десктопом — как у остальных ролей. Мобильное
   приложение (TZ §10) остаётся на потом, его экраны лежат рядом в
   `role14app.tsx` и показываются историей «Приложение · позже».

   Роль — единственная, кто заявляется сам, и единственная, кто платит взнос
   картой. Счёт своего матча спортсмен не вводит: его ведёт судья стола. */

import { Fragment, useState, type ReactNode } from 'react';
import {
  ArrowUpDown, BarChart3, Check, ChevronRight, CreditCard, Download, Lock, Newspaper, Pencil,
  Receipt, Send, Trophy, X,
} from 'lucide-react';
import {
  A, ActionBar, Alert, Also, Arrow, Board, Chips, Empty, Field, Form, Ghost, Hint, Input, Modal,
  Off, P, Pager, Panel, Queue, RoleScreen, Row, Rows, Screen, Search, Shot, States, Tabs,
} from './shell';
import { ChartBox, soft, token } from './chart';
import { BracketFlow } from '@/widgets/bracket/BracketFlow';
import { DeskFrame, type DeskVariant } from '../deskShell';
import { ME_ID, MY_GROUP, OTHER_GROUPS, myBracket, playoffBracket } from './myBracket';
import type { ScreenMap } from './shell';
import { R14 } from './roles';
import { HomeG2Desk } from '../design/role14deskg2';
import { CalendarDesk } from '../design/role14deskcal';
import { Login0_1, SignUp0_5, SignUp0_5States } from './role00';
import '../design/role14deskheads.css';
import '../design/role14deskbody.css';

/* Спортсмен макета — Ким Георгий (тот же, что в реестрах ролей 2 и 12). */
const ME = A(44);

/* Новости федерации — те же материалы, что публикует администратор (Э1.8), и
   те же, что на публичном сайте: своей редакции у спортсмена нет.

   Поля взяты те, что реально приходят из админки федерации: рубрика, дата
   публикации, автор, обложка с подписью, лид, время чтения. Придумывать в
   макете «лайки» и «комментарии» нельзя — их в системе нет. */
const NEWS = [
  {
    nm: 'Календарь сезона 2026 опубликован',
    sub: 'Восемь главных стартов, четыре тура Евразийской лиги и двадцать открытых республиканских турниров.',
    at: '15 апреля',
    tag: 'КАЛЕНДАРЬ',
    by: 'Пресс-служба ФНТ РК',
    read: '3 мин',
  },
  {
    nm: 'Годовой взнос: срок до 31 марта',
    sub: 'Без оплаты заявки на турниры, где взнос обязателен, не проходят.',
    at: '2 марта',
    tag: 'ВЗНОСЫ',
    by: 'Исполком',
    read: '2 мин',
  },
  {
    nm: 'Положение о рейтинге: что изменилось',
    sub: 'Коэффициенты турниров и правило пересчёта после главных стартов.',
    at: '19 февраля',
    tag: 'РЕЙТИНГ',
    by: 'Судейская коллегия',
    read: '5 мин',
  },
  {
    nm: 'Итоги Кубка Казахстана 2026',
    sub: 'Результаты, призёры и разбор финала: Смагулов — Ким 4:2.',
    at: '24 февраля',
    tag: 'РЕЗУЛЬТАТЫ',
    by: 'Пресс-служба ФНТ РК',
    read: '4 мин',
  },
];

/* ── Э14.1 · Главная ───────────────────────────────────────────── */

/* Экран нарисован вариантами и выбран федерацией: `дизайн: вариант Г-2,
   23.08.2026` (flows/14-sportsmen.md). Прежний макет — панели «Сейчас играю» и
   «Ближайший турнир» на общей оболочке — заменён облике Г-2: тёмно-синее поле
   с лентой орнамента, белый лист в три колонки, действие на границе планов.
   Разбор и сам компонент — в `src/design/role14deskg2.tsx`, варианты и полка
   сравнения остались в разделе «Дизайн».

   Заодно ушла «вызвали к столу»: вызова как события в системе нет (решение от
   22.08.2026) — в поле стоит текущий турнир. */
export function Home14_1({ variant }: { variant?: DeskVariant }) {
  return <HomeG2Desk variant={variant} />;
}

const Home14_1States = () => (
  <States>
    <Shot tone="info" title="Ближайшего турнира нет" text="Вместо карточки турнира — подводка к календарю.">
      <Empty title="Заявок нет" text="Ближайшие открытые ОРТ — в календаре." />
    </Shot>

    <Shot tone="info" title="Турнир идёт" text="Появляется блок «Сейчас играю»: соперник, стол, время.">
      <Rows>
        <Row av={A(22)} nm="Стол 5 · сейчас" sub="соперник Жумабеков Р. · 1/8 финала" pill={{ t: 'ИДЁТ', cls: 'live' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э14.2 · Календарь ─────────────────────────────────────────── */

/* Экран нарисован заново и выбран федерацией: `дизайн: календарь в языке
   Google, 25.08.2026` (flows/14-sportsmen.md). Прежний макет — две вкладки
   («Куда могу заявиться» и «Мои турниры») со списком строк — заменён сеткой
   месяца: у турнира главное «когда», а список строк отвечал на «что», и
   ответить «свободен ли я в эти выходные» по нему было нельзя.

   Вкладок больше нет: то, что они разделяли, стало переключателями слева —
   мои турниры, открытые приёмы, старты, куда заявляет регион или клуб. Разбор
   и сам компонент — в `src/design/role14deskcal.tsx`. */
export function Calendar14_2({ variant }: { variant?: DeskVariant }) {
  return <CalendarDesk variant={variant} />;
}

const Calendar14_2States = () => (
  <States>
    <Shot tone="info" title="Приём не открыт / закрыт" text="Кнопка заменена сроком.">
      <Rows>
        <Row nm="ОРТ «Шымкент Open»" sub="приём откроется 20.04" pill={{ t: 'ЖДЁМ', cls: 'done' }} />
      </Rows>
    </Shot>

    <Shot tone="warning" title="Взнос не оплачен, а турнир его требует" text="Кнопка с предупреждением — ⚠ 6.1.">
      <Rows>
        <Row nm="Кубок Алматы 2026" sub="нужен годовой взнос федерации" pill={{ t: 'ВЗНОС НЕ ОПЛАЧЕН', cls: 'wait' }} />
      </Rows>
      <Alert>Заявку подать можно, но допуск может не пройти — решение федерации не получено.</Alert>
    </Shot>

    <Shot
      tone="info"
      title="Открытых приёмов нет ✳"
      text="Пустой список с подсказкой, когда откроется ближайший."
      wide
    >
      <Empty
        title="Сейчас заявиться некуда"
        text="Ближайший открытый приём — ОРТ «Шымкент Open», с 20 апреля. Турниры, куда вас заявляют регион или клуб, в месяце остаются: их видно серым, переключатель — слева."
      />
    </Shot>
  </States>
);

/* ── Э14.3 · Заявка на ОРТ ─────────────────────────────────────── */

/* Условия допуска: их проверяет система, а не человек. `need: false` — условие
   у этого турнира не выставлено (ценз по рейтингу): это не «провалено» и не
   «пройдено», поэтому кружок серый. */
const TERMS14_3 = [
  { nm: 'Годовой взнос федерации', ss: 'оплачен 14.01.2026', need: true },
  { nm: 'Удостоверение личности', ss: 'приложено при регистрации', need: true },
  { nm: 'Медицинский допуск', ss: 'действует до 30.11.2026', need: true },
  { nm: 'Ценз по рейтингу', ss: 'у этого турнира не требуется', need: false },
];

/* Шапка экрана — своя (разбор в role14deskheads.css): бланк начинается не со
   слова «Заявка», а с того, на какой турнир и до какого числа принимают. Срок
   приёма стоит справа отдельно — это единственное, что здесь может кончиться,
   и по нему решают «подавать сейчас или подумать». */
export function Apply14_3() {
  return (
    <RoleScreen role={R14} nav="Календарь" title="Заявка на турнир" sub="Кубок Алматы 2026 · ОРТ">
      <div className="o14-nohead">
      <div className="dh">
        <div className="dh-l">
          <button type="button" className="dh-back" data-to="Э14.2">
            <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} /> Календарь сезона
          </button>
          <div className="dh-t o14-disp">Кубок Алматы 2026</div>
          <div className="dh-sub">
            ОРТ · Алматы · 12–14 сентября · разряды: <b>одиночный, парный, микст</b>
          </div>
        </div>
        <div className="dh-r">
          <div className="dh-till">
            <div className="v o14-disp">до 05.09</div>
            <div className="k">приём заявок</div>
          </div>
        </div>
      </div>

      {/* Бланк: слева то, что человек заполняет, справа — что система про него
          уже знает. Поля строками, а не в серых коробках: в форме читают
          значения, а подписи только помогают их найти. Условия допуска —
          галочки: у проверки ответ «прошло», а не «состояние». */}
      <div className="mkcols">
        <div>
          <div className="db-sec">
            Заявка<span>разряды — какие открыты у этого турнира</span>
          </div>
          <div className="db-sheet">
            <div className="db-f">
              <span className="k">Разряд</span>
              <span className="v">Одиночный</span>
              <ChevronRight size={17} />
            </div>
            <div className="db-f">
              <span className="k">Возрастная группа</span>
              <span className="v">Взрослые</span>
              <ChevronRight size={17} />
            </div>
            <div className="db-f">
              <span className="k">Парный разряд ✳</span>
              <span className="v quiet">партнёр не выбран</span>
              <ChevronRight size={17} />
            </div>
            <div className="db-act">
              <span className="note">Решение принимает главный судья турнира</span>
              <button className="dsubmit" style={{ padding: '11px 16px' }} data-to="Э14.4">
                <Send size={15} /> Подать заявку
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="db-sec">
            Условия допуска<span>проверено системой</span>
          </div>
          <div className="db-sheet">
            {TERMS14_3.map((t) => (
              <div className={'db-t' + (t.need ? '' : ' off')} key={t.nm}>
                <span className="ic">{t.need ? <Check size={13} /> : <X size={13} />}</span>
                <span className="tx">
                  <span className="nm">{t.nm}</span>
                  <span className="ss">{t.ss}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </RoleScreen>
  );
}

const Apply14_3States = () => (
  <States>
    <Shot
      tone="warning"
      title="Пара — подтверждение вторым игроком"
      text="⚠ Не описано, как именно партнёр подтверждает пару; дальше не проектируем."
      wide
    >
      <Rows>
        <Row nm="Парный разряд · Пак С." sub="ждём подтверждения партнёра" pill={{ t: 'ВОПРОС', cls: 'bad' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э14.4 · Моя заявка ────────────────────────────────────────── */

/* Шаги заявки. `done` — уже случилось, `now` — то, чего ждём прямо сейчас. */
const STEPS14_4 = [
  { t: 'Заявка подана', ss: 'вами, через календарь сезона', at: '02.09, 19:40', done: true },
  { t: 'Решение главного судьи', ss: 'придёт уведомлением', at: 'ждём', now: true },
  { t: 'Жеребьёвка', ss: 'после закрытия приёма', at: '05.09' },
  { t: 'Вызов на стол', ss: 'в день игры, уведомлением', at: '12.09' },
];

/* Шапка своя: на этот экран приходят с одним вопросом — «что с моей заявкой».
   Поэтому состояние набрано крупно и с точкой своего цвета, а название турнира
   ушло в подстрочник: какой это турнир, человек помнит, он его и выбирал.
   Отзыв заявки стоит справа в шапке — пока приём открыт, это единственное
   действие экрана, и внизу панели его искали. */
export function MyApp14_4() {
  return (
    <RoleScreen role={R14} nav="Календарь" title="Моя заявка" sub="Кубок Алматы 2026 · подана 02.09">
      <div className="o14-nohead">
      <div className="dh">
        <div className="dh-l">
          <button type="button" className="dh-back" data-to="Э14.2">
            <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} /> Календарь сезона
          </button>
          <div className="dh-state o14-disp">
            <i />
            На рассмотрении
          </div>
          <div className="dh-sub">
            Кубок Алматы 2026 · подана <b>02.09.2026, 19:40</b> · решение принимает главный судья
          </div>
        </div>
        <div className="dh-r">
          <Ghost>Отозвать заявку</Ghost>
        </div>
      </div>

      {/* Хроника вместо двух панелей «Состояние» и «Что дальше». У шагов
          заявки есть порядок и есть место, где мы сейчас, — список из
          обведённых строк с плашками «ЖДЁМ / ПОТОМ» этого не показывал, а
          плашка «ПОТОМ» вообще ничего не сообщала. */}
      <div className="mkcols">
        <div>
          <div className="db-sec">
            Что уже было и что дальше<span>даты появляются, когда шаг случится</span>
          </div>
          <div className="db-sheet db-line">
            {STEPS14_4.map((s) => (
              <div className={'db-step' + (s.done ? ' done' : '') + (s.now ? ' now' : '')} key={s.t}>
                <span className="dot" />
                <span>
                  <span className="nm">{s.t}</span>
                  <span className="ss">{s.ss}</span>
                </span>
                <span className="at">{s.at}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="db-sec">Заявка</div>
          <div className="db-sheet">
            <div className="db-data">
              <div className="db-d">
                <span className="k">Турнир</span>
                <span className="v">Кубок Алматы 2026 · ОРТ</span>
              </div>
              <div className="db-d">
                <span className="k">Разряд</span>
                <span className="v">Одиночный</span>
              </div>
              <div className="db-d">
                <span className="k">Возрастная группа</span>
                <span className="v">Взрослые</span>
              </div>
              <div className="db-d">
                <span className="k">Подана</span>
                <span className="v">02.09.2026, 19:40</span>
              </div>
            </div>
            <div className="db-act">
              <span className="note">Пока приём открыт, заявку можно отозвать — кнопка в шапке</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </RoleScreen>
  );
}

const MyApp14_4States = () => (
  <States>
    <Shot tone="danger" title="Заявка отклонена" text="Причина — текст судьи, видна сразу; пока приём открыт можно исправить и подать снова.">
      <Rows>
        <Row nm="ОРТ «Кубок Иртыша»" sub="«нет медицинского допуска»" pill={{ t: 'ОТКЛОНЕНА', cls: 'bad' }} />
      </Rows>
      <button className="dsubmit" style={{ padding: '11px 16px' }}>Исправить и подать снова</button>
    </Shot>

    <Shot tone="success" title="Заявка принята" text="Дальше — вызов на стол уведомлением, экран матча (Э14.5).">
      <Rows>
        <Row nm="Кубок Алматы 2026" sub="принята 03.09 · ждите жеребьёвку" pill={{ t: 'ПРИНЯТА', cls: 'live' }} to="Э14.5" />
      </Rows>
    </Shot>
  </States>
);

/* ── Э14.5 · Мой турнир и мой матч ─────────────────────────────── */

/* Экран турнира — три вкладки: свой матч, участники и сетка. Сетке нужен весь
   экран (её и на фронте так смотрят), поэтому это отдельная вкладка, а не
   панель в углу: рядом с ней ничего не помещается. */
const TABS14_5 = ['Мой матч', 'Участники', 'Сетка'];

/* Участники турнира: посев, рейтинг, регион и клуб. Список большой (128 на
   главном старте), поэтому это таблица с поиском, сортировкой и страницами по
   30 — глазами в такой список не ищут. Себя и своего соперника человек должен
   находить сразу, поэтому их строки помечены. */
export type Ply14 = { s: number; nm: string; city: string; club: string; r: number; me?: boolean; foe?: boolean };

const SURNAMES = [
  'Смагулов', 'Ким', 'Токаев', 'Жумабеков', 'Пак', 'Гладун', 'Оспанов', 'Байжанов',
  'Абиш', 'Сериков', 'Цой', 'Ли', 'Мурат', 'Асан', 'Бекзат', 'Кайрат',
  'Нурлан', 'Тлеу', 'Садык', 'Жанибек', 'Алтай', 'Ерасыл', 'Мади', 'Арман',
];
const FIRSTS = ['Алан', 'Георгий', 'Марат', 'Расул', 'Сергей', 'Игорь', 'Тимур', 'Ерасыл', 'Данияр', 'Асхат'];
const CITIES: [string, string][] = [
  ['Астана', 'СКА'], ['Алматы', '«Алатау»'], ['Шымкент', '«Жетісу»'], ['Караганда', '«Шахтёр»'],
  ['Павлодар', '«Иртыш»'], ['Актобе', '«Актобе»'], ['Тараз', 'без клуба'], ['Костанай', '«Тобол»'],
];

/** 128 участников: посев по рейтингу, рейтинг убывает от первого номера.
    Фамилия и имя не повторяются парами — иначе в списке появляется второй
    «Ким Георгий», и непонятно, кто из них ты.

    Экспортируется: состав участников у всех ролей один и тот же, и клуб (Э13.9)
    строит из него свой срез — участников по клубам. Второй такой же список для
    другой роли — это два состава одного турнира, которые разъедутся. */
export const PLAYERS: Ply14[] = Array.from({ length: 128 }, (_, i) => {
  const [city, club] = CITIES[i % CITIES.length];
  /* Имя не идёт следом за фамилией ровным шагом: иначе двадцать четыре строки
     подряд оказывались «… Алан», а следующие двадцать четыре — «… Георгий», и
     список читался как сгенерированный. Пара «фамилия + имя» при этом всё
     равно не повторяется — шаг подобран так, что цикл длиннее списка. */
  const nm = `${SURNAMES[i % SURNAMES.length]} ${FIRSTS[(i * 7 + Math.floor(i / SURNAMES.length)) % FIRSTS.length]}`;
  return { s: i + 1, nm, city, club, r: 2612 - i * 7 - (i % 5) };
});
PLAYERS[1] = { ...PLAYERS[1], nm: 'Ким Георгий', city: 'Астана', club: 'СКА', r: 2456, me: true };
PLAYERS[3] = { ...PLAYERS[3], nm: 'Жумабеков Расул', city: 'Алматы', club: '«Алатау»', r: 2312, foe: true };

const PER_PAGE = 30;
/** Колонки таблицы участников: по каким сортируют. */
const COLS14: { k: 's' | 'nm' | 'club' | 'r'; t: string; num?: boolean }[] = [
  { k: 's', t: '№ посева', num: true },
  { k: 'nm', t: 'Участник' },
  { k: 'club', t: 'Регион и клуб' },
  { k: 'r', t: 'Рейтинг', num: true },
];

/** Вкладка «Мой матч»: с кем играю сейчас и как шёл по сетке. */
/* Мой путь по сетке — хроника, а не список: у кругов есть порядок, и важно, в
   каком из них мы сейчас. Плашка «ПОТОМ» у будущего круга ничего не сообщала. */
const PATH14_5 = [
  { t: '1/16 финала', ss: 'Оралбек Диас', at: '4 : 1', done: true },
  { t: '1/8 финала', ss: 'Жумабеков Расул · идёт', at: '2 : 1', now: true },
  { t: '1/4 финала', ss: 'соперник определится после 1/8', at: '—' },
];

const MyMatch14_5 = () => (
  <div className="mkcols">
    <div>
      <div className="db-sec">
        Мой матч<span>счёт ведёт судья стола — вводить и подтверждать его не нужно</span>
      </div>
      {/* Счёт набран как на табло: крупные числа друг напротив друга, а не
          колонка «val» в списке строк. Именно в этой форме счёт читают в зале
          и в протоколе. */}
      <div className="db-sheet">
        <div className="db-row">
          <img
            src={ME}
            alt=""
            style={{ width: 40, height: 40, borderRadius: 'var(--r-round)', objectFit: 'cover', flex: 'none' }}
          />
          <span className="tx">
            <span className="nm">Ким Георгий</span>
            <span className="ss">рейтинг 2456 · вы</span>
          </span>
          <span className="d o14-disp" style={{ fontSize: 34 }}>2</span>
        </div>
        <div className="db-row">
          <img
            src={A(22)}
            alt=""
            style={{ width: 40, height: 40, borderRadius: 'var(--r-round)', objectFit: 'cover', flex: 'none' }}
          />
          <span className="tx">
            <span className="nm">Жумабеков Расул</span>
            <span className="ss">рейтинг 2312 · Шымкент, «Жетісу»</span>
          </span>
          <span className="d o14-disp" style={{ fontSize: 34 }}>1</span>
        </div>
        <div className="db-act">
          <span className="note">Стол 5 · 1/8 финала · одиночный разряд</span>
          <P t="ИДЁТ" cls="live" />
        </div>
      </div>
    </div>

    <div>
      <div className="db-sec">Мой путь по сетке</div>
      <div className="db-sheet db-line">
        {PATH14_5.map((s) => (
          <div className={'db-step' + (s.done ? ' done' : '') + (s.now ? ' now' : '')} key={s.t}>
            <span className="dot" />
            <span>
              <span className="nm">{s.t}</span>
              <span className="ss">{s.ss}</span>
            </span>
            <span className="at">{s.at}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/** Вкладка «Участники»: таблица состава — поиск, сортировка, страницы по 30.

    Списком строк это не работает: на главном старте 128 участников, и человек
    ищет в нём либо себя, либо конкретного соперника. Поэтому поиск по фамилии,
    сортировка по любому столбцу и страницы — как в реестрах федерации. */
export function Players14_5({
  mark,
  list = PLAYERS,
}: {
  mark?: (p: Ply14) => { t: string; cls: string } | undefined;
  /** Чей состав показываем. По умолчанию — общий список участников; у турнира
      федерации (Э1.3) он свой: там принято 96 заявок из 128, и таблица должна
      показывать принятых, а не всех подавшихся. */
  list?: Ply14[];
} = {}) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ k: (typeof COLS14)[number]['k']; up: boolean }>({ k: 's', up: true });
  const [page, setPage] = useState(0);

  /* Кого подсвечивать строкой: спортсмену — себя и соперника, клубу — своих
     (Э13.9). Таблица одна: список участников у всех один и тот же, разный
     только срез «мои». */
  const hit = (p: Ply14) => (mark ? Boolean(mark(p)) : Boolean(p.me));

  const found = list.filter((p) => {
    const t = q.trim().toLowerCase();
    return !t || p.nm.toLowerCase().includes(t) || p.club.toLowerCase().includes(t) || p.city.toLowerCase().includes(t);
  });
  const rows = [...found].sort((a, b) => {
    const k = sort.k;
    const v = k === 'nm' || k === 'club' ? String(a[k]).localeCompare(String(b[k]), 'ru') : Number(a[k]) - Number(b[k]);
    return sort.up ? v : -v;
  });
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const cur = Math.min(page, pages - 1);
  const shown = rows.slice(cur * PER_PAGE, cur * PER_PAGE + PER_PAGE);

  /* Панели вокруг таблицы нет: заголовок «Участники» повторял бы подпись
     вкладки, а счётчик и без него стоит в строке поиска. */
  return (
    <>
      <div className="dactionbar">
        <Search
          value={q}
          placeholder="Фамилия, клуб или регион"
          onChange={(v) => { setQ(v); setPage(0); }}
          wide
        />
        <span className="dcount">
          {rows.length === list.length ? `${list.length} участников` : `найдено ${rows.length} из ${list.length}`}
        </span>
      </div>

      <div className="mktable">
        <div className="mktable-h">
          {COLS14.map((c) => (
            <button
              key={c.k}
              type="button"
              className={(c.num ? 'num' : '') + (sort.k === c.k ? ' on' : '')}
              onClick={() => setSort({ k: c.k, up: sort.k === c.k ? !sort.up : true })}
            >
              {c.t}
              {sort.k === c.k && <ArrowUpDown size={11} />}
            </button>
          ))}
          <span />
        </div>
        <div className="mktable-b">
          {shown.map((p) => (
            <div className={'mktable-r' + (hit(p) ? ' me' : '')} key={p.s}>
              <span className="num">{p.s}</span>
              <span className="nm">{p.nm}</span>
              <span>{p.city} · {p.club}</span>
              <span className="num">{p.r}</span>
              <span>
                {mark ? (
                  (() => { const m = mark(p); return m ? <P t={m.t} cls={m.cls} /> : null; })()
                ) : (
                  <>
                    {p.me && <P t="ВЫ" cls="reg" />}
                    {p.foe && <P t="ВАШ СОПЕРНИК" cls="live" />}
                  </>
                )}
              </span>
            </div>
          ))}
          {shown.length === 0 && (
            <div className="dcount" style={{ padding: '14px 12px' }}>
              По запросу «{q}» никого нет — проверьте написание фамилии.
            </div>
          )}
        </div>
      </div>

      <div className="dactionbar" style={{ marginTop: 10 }}>
        <span className="dcount">
          {rows.length ? `${cur * PER_PAGE + 1}–${cur * PER_PAGE + shown.length} из ${rows.length}` : '0 из 0'}
        </span>
        <Pager page={cur} pages={pages} onPick={setPage} />
      </div>
    </>
  );
}

/** Вкладка «Кто приехал»: участники, собранные по клубам или по регионам.

    Отвечает на вопрос, который возникает раньше сетки: кто вообще приехал. По
    таблице участников это не читается — 128 фамилий подряд, клуб и регион в
    третьей колонке, и «сколько привёз СКА» приходится считать глазами.

    Один компонент на две роли, разный только срез: клуб смотрит по клубам
    (Э13.9), старший тренер региона — по регионам (Э12.5). Свой стоит первым и
    раскрыт, и внутри у него не просто фамилии, а `ours` — те же люди со своим
    состоянием, что на соседней вкладке «Наши»: один срез, показанный в двух
    местах, обязан совпадать. У чужих состояния нет: важно, кого они привезли, а
    как идут их игры — видно в сетке. */
export function Squads14_5({
  by,
  our,
  ours,
  title,
}: {
  /** По чему собираем: клуб или регион участника. */
  by: 'club' | 'city';
  /** Свой клуб или регион — он первым и раскрытым. */
  our: string;
  /** Чем раскрывается свой: готовые строки со состоянием. */
  ours: { key: string; av?: string; nm: string; sub: string; pill?: { t: string; cls: 'live' | 'wait' | 'bad' | 'reg' | 'done' } }[];
  title: string;
}) {
  const [open, setOpen] = useState<string | null>(our);

  const groups = Object.values(
    PLAYERS.reduce<Record<string, { nm: string; note: string; men: Ply14[] }>>((acc, p) => {
      const k = p[by];
      (acc[k] ??= { nm: k, note: by === 'club' ? p.city : p.club, men: [] }).men.push(p);
      return acc;
    }, {}),
  ).sort((a, b) => (a.nm === our ? -1 : b.nm === our ? 1 : b.men.length - a.men.length));

  return (
    <Panel
      title={`${title} · ${groups.length}`}
      extra={<span className="dcount">строка раскрывает участников</span>}
    >
      <div className="drows">
        {groups.map((g) => {
          const mine = g.nm === our;
          const on = g.nm === open;
          const n = mine ? ours.length : g.men.length;
          /* Лучший посев — единственное число, которое здесь честно: результаты
             ведёт судья, и до конца турнира их нет вовсе. */
          const best = Math.min(...g.men.map((m) => m.s));
          const pick = () => setOpen(on ? null : g.nm);
          return (
            <Fragment key={g.nm}>
              <Row
                nm={g.nm === 'без клуба' ? 'Без клуба' : g.nm}
                sub={mine ? 'наши на этом турнире' : `лучший посев ${best}`}
                val={`${n} участников`}
                pill={mine ? { t: by === 'club' ? 'НАШ КЛУБ' : 'НАШ РЕГИОН', cls: 'reg' } : undefined}
                on={on}
                onSelect={pick}
                action={on ? 'Свернуть' : 'Показать'}
                onAction={pick}
              />
              {on && (
                <div className="mknest">
                  {mine
                    ? ours.map((o) => (
                        <Row key={o.key} av={o.av} nm={o.nm} sub={o.sub} pill={o.pill} />
                      ))
                    : g.men.slice(0, 4).map((m) => (
                        <Row key={m.s} nm={`${m.s} · ${m.nm}`} sub={`рейтинг ${m.r}`} />
                      ))}
                  {!mine && (
                    <div className="dcount">
                      Показаны 4 из {g.men.length} · весь состав — на вкладке «Участники»
                    </div>
                  )}
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </Panel>
  );
}

/** Вкладка «Сетка»: сетку рисует тот же компонент, что и на фронте — не
    картинка и не свои прямоугольники, а настоящий холст по общей модели
    сетки. Ни заголовка, ни подписей: сетка занимает экран целиком, а что это
    за турнир — написано в шапке экрана. */
const Bracket14_5 = () => (
  <div className="mkbracket mkbracket-fill">
    {/* Холст светлый и мои матчи подсвечены — то же решение, что принято для
        телефона 25.08.2026. Тёмный холст посреди светлого экрана читался
        чужой врезкой, а без подсветки на 128 участников свой путь искали
        глазами. `minePlayerId` красит мои пары и гасит остальные. */}
    <BracketFlow bracket={myBracket} minZoom={0.15} fitPadding={0.06} tone="light" minePlayerId={ME_ID} />
  </div>
);

/** Вкладка «Группы» — только у формата «групповой этап с плей-офф» (TZ §5.1).
    Спортсмену тут важно одно: выхожу я из группы или нет, поэтому место и
    «выходит / не выходит» стоят в строке, а не считаются в уме. */
const Groups14_5 = () => (
  <div className="mkcols">
    <Panel title="Моя группа · A" extra={<P t="ВЫХОДЯТ ДВОЕ" cls="reg" />}>
      <Rows>
        {MY_GROUP.map((g) => (
          <Row
            key={g.nm}
            av={g.me ? ME : undefined}
            nm={`${g.place} · ${g.nm}`}
            sub={`${g.wl} по матчам · партии ${g.sets}`}
            val={g.me ? 'вы' : undefined}
            pill={g.out ? { t: 'В ПЛЕЙ-ОФФ', cls: 'live' } : { t: 'ВЫБЫЛ', cls: 'done' }}
          />
        ))}
      </Rows>
      <div className="dcount" style={{ marginTop: 10 }}>
        Группа сыграна · дальше — плей-офф на соседней вкладке
      </div>
    </Panel>

    <Panel title="Остальные группы · 8">
      <Rows>
        {OTHER_GROUPS.map((g) => (
          <Row key={g.nm} nm={g.nm} sub={g.sub} val={g.out} />
        ))}
      </Rows>
    </Panel>
  </div>
);

/** Плей-офф после групп: сетка короче, и в неё попадают вышедшие из групп. */
const Playoff14_5 = () => (
  <div className="mkbracket mkbracket-fill">
    <BracketFlow bracket={playoffBracket} minZoom={0.15} fitPadding={0.06} tone="light" minePlayerId={ME_ID} />
  </div>
);

/** Экран турнира. `tab` — с какой вкладки открыт: переключатель рабочий, и
    борд показывает те же вкладки открытыми, чтобы их было видно без кликов.
    `groups` — формат с групповым этапом: добавляется вкладка «Группы», а
    «Сетка» показывает плей-офф из вышедших. */
export function Match14_5({ tab, groups }: { tab?: string; groups?: boolean }) {
  return (
    <RoleScreen
      role={R14}
      nav="Мой турнир"
      title="Кубок Алматы 2026"
      sub={groups ? 'Группы и плей-офф · группа A · стол 5' : '1/8 финала · стол 5'}
    >
      <Tabs
        active={tab}
        items={[
          { t: TABS14_5[0], view: <MyMatch14_5 /> },
          { t: TABS14_5[1], view: <Players14_5 /> },
          ...(groups ? [{ t: 'Группы', view: <Groups14_5 /> }] : []),
          { t: TABS14_5[2], view: groups ? <Playoff14_5 /> : <Bracket14_5 /> },
        ]}
      />
    </RoleScreen>
  );
}

const Match14_5States = () => (
  <States>
    <Shot tone="danger" title="Счёт своего матча спортсмен не вводит" text="Счёт ведёт судья на столе; спортсмен его не вводит и не подтверждает.">
      <Rows>
        <Row nm="Счёт матча" sub="ведёт судья стола" pill={{ t: 'ТОЛЬКО СМОТРИМ', cls: 'done' }} />
      </Rows>
    </Shot>

    <Shot tone="success" title="Вас вызвали" text="«Подойдите к столу N» — после вызова главным судьёй.">
      <Rows>
        <Row nm="Подойдите к столу 5" sub="вызвал главный судья · сейчас" pill={{ t: 'ВЫЗОВ', cls: 'live' }} />
      </Rows>
    </Shot>

    <Shot
      tone="info"
      title="Турнир завершён"
      text="Тот же экран открывается строкой турнира из аналитики: сетка на чтение, мои матчи, дельта рейтинга."
      wide
    >
      <Rows>
        <Row nm="1/16 финала" sub="Оралбек Д. · 4:1" val="+11" pill={{ t: 'ПОБЕДА', cls: 'live' }} />
        <Row nm="1/8 финала" sub="Жумабеков Р. · 2:4" val="−3" pill={{ t: 'ПОРАЖЕНИЕ', cls: 'bad' }} />
        <Row nm="Итог турнира" sub="1/8 финала · рейтинг пересчитан 15.09" val="+8" pill={{ t: 'ЗАВЕРШЁН', cls: 'done' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э14.6 · Аналитика ─────────────────────────────────────────── */

/** Турнир, который спортсмен сыграл: где закончил, что получил в рейтинг и с
    каким рейтингом ушёл. История — не украшение экрана, а его основа: вопрос
    «как у меня идёт сезон» без неё отвечается одним числом «+24», из которого
    ничего не следует.

    `r` — рейтинг **после** турнира: из него и строится кривая. */
type Played = {
  nm: string;
  cat: string;
  d: string;
  /** Где закончил: стадия или место. */
  stage: string;
  w: number;
  l: number;
  /** Дельта рейтинга за турнир. */
  dr: number;
  r: number;
};

const PLAYED: Played[] = [
  { nm: 'Открытие сезона 2026', cat: 'ОРТ · Астана', d: '19.01', stage: '1/4 финала', w: 3, l: 1, dr: 22, r: 2410 },
  { nm: 'Чемпионат Казахстана 2026', cat: 'Главный старт · Астана', d: '20.05', stage: '1/8 финала', w: 2, l: 1, dr: -6, r: 2404 },
  { nm: 'Кубок Сарыарки 2026', cat: 'ОРТ · Караганда', d: '14.06', stage: 'полуфинал', w: 4, l: 1, dr: 18, r: 2422 },
  { nm: 'Евразийская лига, 2-й тур', cat: 'Лига · Алматы', d: '11.07', stage: 'команда 3-я', w: 2, l: 2, dr: 4, r: 2426 },
  { nm: 'Первенство РК до 23 лет', cat: 'Главный старт · Шымкент', d: '02.08', stage: '1/16 финала', w: 1, l: 1, dr: -12, r: 2414 },
  { nm: 'Кубок Алматы 2026', cat: 'ОРТ · Алматы', d: '14.09', stage: '1/8 финала', w: 2, l: 1, dr: 8, r: 2422 },
  { nm: 'ОРТ «Кубок Иртыша»', cat: 'ОРТ · Павлодар', d: '26.10', stage: 'финал', w: 5, l: 1, dr: 34, r: 2456 },
];

/** Личная встреча с одним соперником: сколько играли, кто сколько взял, что
    было в последний раз. Спортсмен приходит сюда перед матчем — вопрос у него
    один: «я с ним справляюсь?».

    Данные сходятся с историей турниров: сумма встреч по соперникам равна числу
    сыгранных матчей сезона. */
type Foe = {
  av: string;
  nm: string;
  club: string;
  /** Рейтинг соперника — по нему видно, вровень играем или нет. */
  r: number;
  w: number;
  l: number;
  /** Партии: выиграно — проиграно. */
  sets: [number, number];
  last: string;
  lastWin: boolean;
};

const FOES: Foe[] = [
  { av: A(32), nm: 'Смагулов Алан', club: 'Алматы · «Алатау»', r: 2612, w: 1, l: 2, sets: [5, 9], last: 'Кубок Иртыша, финал · 1:4', lastWin: false },
  { av: A(22), nm: 'Жумабеков Расул', club: 'Алматы · «Алатау»', r: 2312, w: 4, l: 1, sets: [17, 8], last: 'Кубок Алматы, 1/8 · 4:2', lastWin: true },
  { av: A(51), nm: 'Токаев Марат', club: 'Шымкент · «Жетісу»', r: 2596, w: 3, l: 2, sets: [15, 12], last: 'Первенство до 23, 1/16 · 2:4', lastWin: false },
  { av: A(13), nm: 'Пак Сергей', club: 'Павлодар · «Иртыш»', r: 2580, w: 3, l: 1, sets: [13, 8], last: 'Кубок Сарыарки, 1/2 · 4:1', lastWin: true },
  { av: A(19), nm: 'Цой Виктор', club: 'Караганда · «Шахтёр»', r: 2542, w: 4, l: 0, sets: [16, 5], last: 'Открытие сезона, 1/4 · 4:0', lastWin: true },
  { av: A(60), nm: 'Сериков Нурлан', club: 'Астана · СКА', r: 2545, w: 4, l: 2, sets: [18, 13], last: 'Лига, 2-й тур · 2:3', lastWin: false },
];

/* Сходимость: 19 побед и 8 поражений — это и сумма по соперникам, и сумма по
   турнирам выше, и те самые 27 матчей сезона в подзаголовке экрана. Числа на
   одном экране, которые не сходятся между собой, читаются как ошибка данных. */

/** Кривая рейтинга по сыгранным турнирам. Линия, а не столбики: рейтинг —
    непрерывная величина, и вопрос к ней «куда идёт», а не «сколько за раз».
    Дельта каждого турнира читается рядом, в истории. */
const RatingChart = () => (
  <ChartBox
    height={210}
    label="Динамика рейтинга по турнирам сезона"
    make={(el) => ({
      type: 'line',
      data: {
        labels: PLAYED.map((t) => t.d),
        datasets: [
          {
            label: 'Рейтинг',
            data: PLAYED.map((t) => t.r),
            borderColor: token('--c-accent', el),
            backgroundColor: soft('--c-accent', 18, el),
            pointBackgroundColor: PLAYED.map((t) =>
              t.dr >= 0 ? token('--c-success', el) : token('--c-danger', el),
            ),
            pointBorderColor: token('--c-panel', el),
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 2,
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              /* В подсказке — сам турнир и его дельта: по одной дате человек
                 не вспомнит, что было 11 июля. */
              title: (i) => PLAYED[i[0].dataIndex].nm,
              label: (i) => {
                const t = PLAYED[i.dataIndex];
                return `${t.r} · ${t.dr >= 0 ? '+' : ''}${t.dr} · ${t.stage}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: soft('--c-glass-line', 60, el) },
            ticks: { color: token('--c-dim', el), font: { size: 11 } },
          },
          y: {
            grid: { color: soft('--c-glass-line', 60, el) },
            ticks: { color: token('--c-dim', el), font: { size: 11 } },
          },
        },
      },
    })}
  />
);

/** Личные встречи столбиками: победы и поражения по каждому сопернику в одной
    полосе. Горизонтально — потому что подписи это фамилии, а не даты: вертикаль
    их обрезала бы или ставила боком. */
const FoesChart = () => (
  <ChartBox
    height={230}
    label="Личные встречи: победы и поражения по каждому сопернику"
    make={(el) => ({
      type: 'bar',
      data: {
        labels: FOES.map((f) => f.nm.split(' ')[0]),
        datasets: [
          {
            label: 'Победы',
            data: FOES.map((f) => f.w),
            backgroundColor: token('--c-success', el),
            borderWidth: 0,
          },
          {
            label: 'Поражения',
            data: FOES.map((f) => f.l),
            backgroundColor: soft('--c-danger', 70, el),
            borderWidth: 0,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: token('--c-muted', el), boxWidth: 10, font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              afterBody: (i) => {
                const f = FOES[i[0].dataIndex];
                return `партии ${f.sets[0]}:${f.sets[1]} · последняя — ${f.last}`;
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { color: soft('--c-glass-line', 60, el) },
            ticks: { color: token('--c-dim', el), stepSize: 1, font: { size: 11 } },
          },
          y: {
            stacked: true,
            grid: { display: false },
            ticks: { color: token('--c-muted', el), font: { size: 11 } },
          },
        },
      },
    })}
  />
);

/** История турниров: где играл, чем кончил и что это дало рейтингу.

    Строка открывает тот же экран, что и по ходу игры (Э14.5), но завершённый:
    сетка с моим путём, мои матчи и из чего сложилась дельта. Отдельного экрана
    «прошлый турнир» не заводим. */
const HISTORY_COLS = ['Турнир', 'Дата', 'Где закончил', 'В–П', 'Рейтинг'];

const History14_6 = () => (
  <div className="mktable mkplayed">
    <div className="mktable-h">
      {HISTORY_COLS.map((c) => (
        <span key={c}>{c}</span>
      ))}
      <span />
    </div>
    <div className="mktable-b">
      {[...PLAYED].reverse().map((t) => (
        <div className="mktable-r" key={t.nm} data-to="Э14.5">
          <span className="nm">
            {t.nm}
            <em>{t.cat}</em>
          </span>
          <span>{t.d}</span>
          <span>{t.stage}</span>
          <span className="num">{t.w}–{t.l}</span>
          <span className="num">
            <b className={t.dr >= 0 ? 'up' : 'down'}>{t.dr >= 0 ? '+' : ''}{t.dr}</b>
            <i>{t.r}</i>
          </span>
          <span className="go">
            <ChevronRight size={15} />
          </span>
        </div>
      ))}
    </div>
  </div>
);

/** Личные встречи таблицей под графиком: график отвечает «с кем как», таблица —
    «что именно было». Одно без другого не работает: по столбикам не узнать
    счёта последней встречи, а по таблице из шести строк не увидеть баланса. */
const Foes14_6 = () => (
  <>
    {FOES.map((f) => (
      <div className="db-row" key={f.nm}>
        <img
          src={f.av}
          alt=""
          style={{ width: 34, height: 34, borderRadius: 'var(--r-round)', objectFit: 'cover', flex: 'none' }}
        />
        <span className="tx">
          <span className="nm">{f.nm}</span>
          <span className="ss">
            {f.club} · рейтинг {f.r} · партии {f.sets[0]}:{f.sets[1]} · последняя {f.last}
          </span>
        </span>
        {/* Баланс встреч — единственное цветное в строке: он и есть ответ. */}
        <span className={'d ' + (f.w > f.l ? 'up' : f.w === f.l ? '' : 'dn')}>
          {f.w}–{f.l}
        </span>
      </div>
    ))}
  </>
);

/* Шапка своя: за аналитикой приходят с вопросом «сколько у меня сейчас», и
   ответ — число, а не слово «Аналитика». Поэтому рейтинг набран дисплейной
   гарнитурой в 68 px, рядом прирост за сезон и место в стране, справа — три
   числа сезона. Прежняя полка из четырёх плиток убрана: она повторяла ровно
   эти же числа строкой ниже. */
export function Stats14_6() {
  return (
    <RoleScreen role={R14} nav="Аналитика" title="Аналитика" sub="Сезон 2026 · 7 турниров · 27 матчей">
      <div className="o14-nohead">
      <div className="dh">
        <div className="dh-l">
          <div className="o14-eyebrow">Мой рейтинг · сезон 2026</div>
          <div className="dh-rating" style={{ marginTop: 8 }}>
            <span className="v o14-disp">2456</span>
            <span className="d o14-disp">+68</span>
            <span className="p">за сезон · 7-е место в РК</span>
          </div>
        </div>
        <div className="dh-r">
          <div className="dh-nums">
            <div>
              <div className="v o14-disp">70%</div>
              <div className="k">побед</div>
            </div>
            <div>
              <div className="v o14-disp">7</div>
              <div className="k">турниров</div>
            </div>
            <div>
              <div className="v o14-disp">27</div>
              <div className="k">матчей</div>
            </div>
          </div>
        </div>
      </div>

      {/* Блоки идут сверху вниз, а не в две колонки ✳: у каждого своя ширина
          по смыслу — кривой рейтинга нужна длинная ось времени, полосам личных
          встреч нужны читаемые фамилии, истории турниров — колонки. В двух
          колонках всё это ужималось вдвое, и график становился картинкой, по
          которой ничего не прочитать. Экран длинный, зато каждый блок отвечает
          на свой вопрос целиком. */}
      <div className="db-stack">
        <div>
          <div className="db-sec">
            Динамика рейтинга<span>зелёная точка — турнир в плюс, красная — в минус · 2388 → 2456</span>
          </div>
          <div className="db-sheet" style={{ padding: 'var(--s-4) var(--s-5)' }}>
            <RatingChart />
          </div>
        </div>

        <div>
          <div className="db-sec">
            История турниров<span>строка открывает мою сетку и матчи того турнира</span>
          </div>
          <div className="db-sheet">
            <History14_6 />
          </div>
        </div>

        <div>
          <div className="db-sec">
            Личные встречи<span>соперник появляется после первой сыгранной с ним встречи</span>
          </div>
          <div className="db-sheet" style={{ padding: 'var(--s-4) var(--s-5)' }}>
            <FoesChart />
          </div>
          <div className="db-sheet" style={{ marginTop: 'var(--s-3)' }}>
            <Foes14_6 />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'var(--s-5)' }}>
        <Hint>
          ⚠ Расширенная аналитика — платная (§10): что в неё входит и как оплачивается, решения
          федерации нет. Всё, что выше, — базовая: она не платная.
        </Hint>
      </div>
      </div>
    </RoleScreen>
  );
}

const Stats14_6States = () => (
  <States>
    <Shot
      tone="info"
      title="Сезон только начался"
      text="Один турнир — кривой ещё нет, есть точка: график появляется со второго турнира."
      wide
    >
      <Rows>
        <Row nm="Открытие сезона 2026" sub="ОРТ · Астана · 19.01 · 1/4 финала" val="+22" pill={{ t: 'ЕДИНСТВЕННЫЙ', cls: 'reg' }} />
      </Rows>
      <Alert>Личных встреч тоже пока нет: соперник появляется в списке после первой сыгранной с ним встречи.</Alert>
    </Shot>

    <Shot
      tone="warning"
      title="Расширенная аналитика — заглушка"
      text="Состав расширенной аналитики и её оплата не зафиксированы; до решения не проектируем."
    >
      <Empty title="Расширенная аналитика" text="⚠ Что в неё входит и платная ли она — решения федерации нет." />
    </Shot>
  </States>
);

/* ── Э14.7 · Мой профиль ───────────────────────────────────────── */

/** Один профиль вместо двух: сквозной «свой профиль» (контакты, язык, пароль) и
    спортивная карточка со взносом — это один экран, и человек ходил между ними
    зря. У спортсмена сюда же попадают по имени и фото в шапке. */
/* Шапка своя: профиль — это карточка человека, поэтому фото, фамилия и разряд
   стоят шапкой, а не строкой внутри панели, где они были одного кегля с полем
   «Дата рождения». Справа — взнос: сумма и срок. Он вынесен наверх потому, что
   это единственное, из-за чего заявку могут не пропустить, а раньше он лежал
   во второй колонке ниже сгиба. */
export function Profile14_7() {
  return (
    <RoleScreen role={R14} nav="Профиль" title="Мой профиль" sub="Ким Георгий · 2003 · Астана · СКА">
      <div className="o14-nohead">
      <div className="dh">
        <div className="dh-l">
          <div className="dh-who">
            <img src={ME} alt="" />
            <div>
              <div className="dh-t o14-disp">Ким Георгий</div>
              <div className="dh-sub">
                мастер спорта · рейтинг <b>2456</b> · 7-е место в РК · Астана · СКА
              </div>
            </div>
          </div>
        </div>
        <div className="dh-r">
          <div className="dh-fee">
            <div>
              <div className="v o14-disp">₸ 10 000</div>
              <div className="k">взнос 2026 · до 31 марта</div>
            </div>
            <button className="dsubmit" data-to="Э14.8" style={{ padding: '11px 16px' }}>
              <CreditCard size={15} /> Оплатить картой
            </button>
          </div>
        </div>
      </div>

      {/* Полоса чисел первой: рейтинг, место и год — то, чем спортсмен себя
          называет. Дальше данные парами (на чтение; правка — Э14.9), справа
          взнос и переходы. Панелей с полосами заголовков нет: экран и так
          лист, а рамка вокруг рамки ничего не отделяет. */}
      <div className="db-sheet db-rail" style={{ marginBottom: 'var(--s-6)' }}>
        <div>
          <b className="o14-disp">2456</b>
          <span>рейтинг</span>
        </div>
        <div>
          <b className="o14-disp">7</b>
          <span>место в РК</span>
        </div>
        <div>
          <b className="o14-disp">27</b>
          <span>матчей за сезон</span>
        </div>
        <div>
          <b className="o14-disp">2003</b>
          <span>год рождения</span>
        </div>
      </div>

      <div className="mkcols">
        <div>
          <div className="db-sec">
            Данные<span>меняются на отдельном экране</span>
          </div>
          <div className="db-sheet">
            <div className="db-data">
              {[
                ['Дата рождения', '14.06.2003'],
                ['Разряд', 'мастер спорта'],
                ['Регион', 'Астана'],
                ['Тренер', 'Гладун Игорь'],
                ['Телефон', '+7 705 118 44 03'],
                ['Почта', 'g.kim@mail.kz'],
                ['Клуб', 'СКА · Астана'],
                ['Принадлежность к клубу', 'подтвердил клуб «СКА», 12.01.2026'],
              ].map(([k, v]) => (
                <div className="db-d" key={k}>
                  <span className="k">{k}</span>
                  <span className="v">{v}</span>
                </div>
              ))}
            </div>
            <div className="db-act">
              <span className="note">Клуб и регион меняются только по приглашению</span>
              <button className="dpickbtn" data-to="Э14.9">
                <Pencil size={14} /> Изменить данные
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="db-sec">Взнос и доступ</div>
          <div className="db-sheet">
            <div className="db-row" data-to="Э14.12">
              <span className="tx">
                <span className="nm">Годовой взнос 2026</span>
                <span className="ss">срок до 31 марта · не оплачен</span>
              </span>
              <span className="amt o14-disp">₸ 10 000</span>
              <Receipt size={16} className="ch" />
            </div>
            <div className="db-row" data-to="Э14.12">
              <span className="tx">
                <span className="nm">История платежей</span>
                <span className="ss">взносы за все сезоны и квитанции</span>
              </span>
              <ChevronRight size={17} className="ch" />
            </div>
            <div className="db-row">
              <span className="tx">
                <span className="nm">Пароль</span>
                <span className="ss">изменён 02.02.2026</span>
              </span>
              <button className="dpickbtn">Сменить</button>
            </div>
            <div className="db-row">
              <span className="tx">
                <span className="nm">Язык интерфейса</span>
                <span className="ss">письма и уведомления приходят на нём же</span>
              </span>
              <span className="amt">Русский</span>
            </div>
          </div>
          <div style={{ marginTop: 'var(--s-3)' }}>
            <Alert>
              Оплата идёт на платёжной странице Халык Банка — кнопка в шапке экрана. Состояние
              поставится само, по подтверждению банка: держать вкладку открытой не нужно.
            </Alert>
          </div>
        </div>
      </div>
      </div>
    </RoleScreen>
  );
}

const Profile14_7States = () => (
  <States>
    <Shot tone="success" title="Оплачено" text="Состояние меняется само, по подтверждению банка, и видно также тренеру.">
      <Rows>
        <Row nm="Взнос 2026" sub="оплачен картой 14.01" pill={{ t: 'ОПЛАЧЕН', cls: 'live' }} />
      </Rows>
    </Shot>

    <Shot tone="info" title="Ждём подтверждения банка" text="«Платёж обрабатывается»: вкладку держать не нужно.">
      <Rows>
        <Row nm="Платёж отправлен" sub="Halyk ePay · обрабатывается" pill={{ t: 'ЖДЁМ', cls: 'wait' }} />
      </Rows>
    </Shot>

    <Shot tone="danger" title="Оплата не прошла" text="Причина от банка и кнопка повторить.">
      <Rows>
        <Row nm="Платёж отклонён" sub="банк: недостаточно средств" pill={{ t: 'НЕ ПРОШЛА', cls: 'bad' }} action="Повторить" />
      </Rows>
    </Shot>

    <Shot tone="info" title="Клуб зовёт к себе" text="Приглашение ждёт ответа: до принятия в профиле прежний клуб.">
      <Rows>
        <Row nm="СКА · Астана" sub="клуб «Алатау» · Алматы пригласил 14.02" pill={{ t: 'ЖДЁТ ВАС', cls: 'wait' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э14.13 · Новости федерации ────────────────────────────────── */

/** Обычный новостной портал: лента карточек с обложкой, темой и датой.

    Материалы редактирует федерация в своей админке (Э1.8 и редактор Э1.14) —
    сюда они приходят готовыми, поэтому у спортсмена экран только на чтение.
    Читают из системы: человек уже вошёл, и выгонять его на публичный сайт ради
    объявления о сроке взноса незачем.

    Фильтра по темам нет: спортсмен читает новости лентой сверху вниз, а не
    ищет в них по рубрике — тема и так стоит на каждой карточке. */

/** Карточка ленты: вся целиком — переход в материал (Э14.14). Поля те же, что
    приходят из админки: рубрика, дата, заголовок, лид, автор и время чтения. */
const NewsCard = ({ n, wide }: { n: (typeof NEWS)[number]; wide?: boolean }) => (
  <article className={'mknews-card' + (wide ? ' wide' : '')} data-to="Э14.14">
    {/* Обложка — слоями, как у главного материала, а не серая плашка «место
        под картинку»: на светлой теме такая плашка выглядела дырой в ленте. */}
    <div className="db-cover">
      <span className="tag">{n.tag}</span>
    </div>
    <div className="mknews-body">
      <h3>{n.nm}</h3>
      <p>{n.sub}</p>
      <div className="mknews-meta">
        <span>{n.at} 2026</span>
        <i />
        <span>{n.by}</span>
        <i />
        <span>{n.read}</span>
      </div>
    </div>
  </article>
);

/* Шапка своя — точнее, её нет вовсе: у новостной ленты шапка это и есть
   главный материал. Строка «Новости / Объявления федерации» над ним ничего не
   добавляла (пункт меню слева уже подсвечен), зато отодвигала обложку вниз.
   Поэтому первый материал идёт полосой во всю ширину, с заголовком поверх
   обложки, а остальные — сеткой под ним. */
export function News14_13() {
  return (
    <RoleScreen role={R14} nav="Новости" title="Новости" sub="Объявления федерации, положения и итоги турниров">
      <div className="mknews o14-nohead">
        <article className="dh-lead" data-to="Э14.14">
          <div className="in">
            <span className="tag">{NEWS[0].tag}</span>
            <h3 className="o14-disp">{NEWS[0].nm}</h3>
            <p>{NEWS[0].sub}</p>
            <div className="meta">
              {NEWS[0].at} 2026 · {NEWS[0].by} · {NEWS[0].read}
            </div>
          </div>
        </article>

        <div className="mknews-grid">
          {NEWS.slice(1).map((n) => (
            <NewsCard key={n.nm} n={n} />
          ))}
        </div>
        <button type="button" className="mknews-more">Показать ещё</button>
      </div>
    </RoleScreen>
  );
}

/* ── Э14.14 · Новость ──────────────────────────────────────────── */

/** Что происходит после клика по карточке: открывается сам материал. Лента
    остаётся за спиной — возврат стоит над заголовком, а не «назад в браузере».
    Внизу — соседние материалы: прочитал одно, читают следующее. */
export function Article14_14() {
  return (
    <RoleScreen
      role={R14}
      nav="Новости"
      title="Календарь сезона 2026 опубликован"
      sub="Рубрика «Календарь» · опубликовано 15 апреля 2026"
      back={{ label: 'Все новости', to: 'Э14.13' }}
    >
      {/* Шапка своя: заголовок стоит поверх обложки, а не над ней. Раньше
          заголовок печатался трижды — в шапке оболочки, в подзаголовке и над
          текстом; теперь один раз и там, где у материала титул. */}
      <div className="o14-nohead">
      <article className="dh-lead read">
        <div className="in">
          <span className="tag">КАЛЕНДАРЬ</span>
          <h3 className="o14-disp">Календарь сезона 2026 опубликован</h3>
          <div className="meta">15 апреля 2026 · Пресс-служба ФНТ РК · 3 мин чтения</div>
        </div>
      </article>
      <figcaption className="mknews-cap">Фото: пресс-служба ФНТ РК, Кубок Казахстана 2026</figcaption>

      <article className="mknews-read">
        <p className="lead">
          В сезоне 2026 года — восемь главных стартов, четыре тура Евразийской лиги и двадцать
          открытых республиканских турниров.
        </p>
        <p>
          Приём заявок на ОРТ открывается за месяц до старта: заявляется спортсмен сам. На главные
          старты состав подаёт старший тренер региона, в Евразийскую лигу команду заявляет клуб —
          у этих турниров кнопки «заявиться» в календаре нет.
        </p>
        <h3>Что изменилось для спортсменов</h3>
        <ul>
          <li>Приём заявок на ОРТ — за месяц до старта, а не за две недели.</li>
          <li>Возрастные первенства собираются по правилу «год рождения и моложе».</li>
          <li>Годовой взнос за 2026 год оплачивается до 31 марта.</li>
        </ul>
        <p>
          Без оплаченного взноса заявки на турниры, где он обязателен, не проходят — оплатить можно
          картой в своём профиле.
        </p>

        {/* Новость почти всегда про что-то, что в системе есть: календарь,
            турнир, взнос. Ссылка ведёт туда — иначе человек ищет руками. */}
        <div className="db-sheet" style={{ margin: 'var(--s-5) 0' }}>
          <div className="db-row" data-to="Э14.2">
            <span className="tx">
              <span className="nm">Календарь сезона</span>
              <span className="ss">все старты с датами, городами и сроками приёма</span>
            </span>
            <ChevronRight size={17} className="ch" />
          </div>
          <div className="db-row" data-to="Э14.7">
            <span className="tx">
              <span className="nm">Годовой взнос 2026</span>
              <span className="ss">оплатить картой до 31 марта</span>
            </span>
            <ChevronRight size={17} className="ch" />
          </div>
        </div>

        <div className="mknews-tags">
          <span>календарь 2026</span>
          <span>ОРТ</span>
          <span>Евразийская лига</span>
          <span>взносы</span>
        </div>
      </article>

      <div className="qsec">Читайте дальше</div>
      <div className="mknews-grid">
        {NEWS.slice(1).map((n) => (
          <NewsCard key={n.nm} n={n} />
        ))}
      </div>
      </div>
    </RoleScreen>
  );
}

const Article14_14States = () => (
  <States>
    <Shot tone="info" title="Материал на трёх языках ✳" text="Читается на языке интерфейса; нет перевода — показываем русский с пометкой.">
      <Rows>
        <Row nm="Положение о рейтинге" sub="есть RU · KZ · перевода на EN нет" pill={{ t: 'RU · KZ', cls: 'reg' }} />
      </Rows>
    </Shot>

    <Shot tone="warning" title="Обложки у материала нет" text="Редакция не приложила картинку — материал читается без неё.">
      <Rows>
        <Row nm="Изменения в положении о соревнованиях" sub="12 марта · без обложки" pill={{ t: 'ПОЛОЖЕНИЕ', cls: 'reg' }} />
      </Rows>
    </Shot>

    <Shot tone="danger" title="Новость сняли с публикации ✳" text="Ссылку прислали, а материала уже нет.">
      <Empty title="Материал недоступен" text="Новость снята с публикации. Вернитесь к ленте — остальные на месте." />
    </Shot>
  </States>
);

const News14_13States = () => (
  <States>
    <Shot tone="info" title="Новостей нет" text="Федерация ничего не публиковала — лента пустая, а не сломанная.">
      <Empty title="Пока новостей нет" text="Здесь появятся объявления федерации, положения и итоги турниров." />
    </Shot>

    <Shot tone="warning" title="Обложки у материала нет" text="Редакция не приложила картинку — карточка живёт без неё.">
      <Rows>
        <Row nm="Изменения в положении о соревнованиях" sub="12 марта · без обложки" pill={{ t: 'ПОЛОЖЕНИЕ', cls: 'reg' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э14.10 · Оплата прошла · Э14.11 · Оплата не прошла ────────── */

/** Страница возврата: банк отправил человека обратно к нам, и первое, что он
    должен увидеть, — прошёл платёж или нет. Ответ стоит один посреди экрана, а
    не строкой в панели: из банка возвращаются с этим вопросом и ни с каким
    другим. Под ним — то, ради чего платили, и одна кнопка «что дальше». */
const Result14 = ({
  ok,
  title,
  lead,
  facts,
  action,
  note,
}: {
  ok: boolean;
  title: string;
  lead: string;
  facts: [string, string][];
  action: { t: string; to: string; icon: ReactNode };
  note: string;
}) => (
  /* Шапки у экрана нет вовсе (`o14-nohead`): «Оплата взноса» над «Оплата
     прошла» — это один и тот же ответ, напечатанный дважды, причём мелким
     сверху и крупным снизу. Из банка возвращаются с одним вопросом, и на
     экране должен стоять один ответ. */
  <RoleScreen role={R14} nav="Профиль" title="Оплата взноса" sub="Годовой взнос 2026 · Ким Георгий">
    <div className={'mkresult o14-nohead' + (ok ? ' ok' : ' bad')}>
      <span className="mkresult-ic">{ok ? <Check size={30} /> : <X size={30} />}</span>
      <div className="mkresult-t">{title}</div>
      <div className="mkresult-s">{lead}</div>

      <div className="mkresult-facts">
        {facts.map(([k, v]) => (
          <div key={k}>
            <span>{k}</span>
            <b>{v}</b>
          </div>
        ))}
      </div>

      <button className="dsubmit mkresult-btn" data-to={action.to}>
        {action.icon} {action.t}
      </button>
      <button type="button" className="mkresult-quiet" data-to="Э14.7">В профиль</button>
      <div className="mkresult-note">{note}</div>
    </div>
  </RoleScreen>
);

export function Paid14_10() {
  return (
    <Result14
      ok
      title="Оплата прошла"
      lead="Годовой взнос 2026 оплачен — заявки на турниры со взносом теперь проходят."
      facts={[
        ['Сумма', '₸ 10 000'],
        ['Номер заказа', '100416'],
        ['Когда', '14.01.2026, 10:42'],
        ['Карта', '•••• 1234 · Halyk ePay'],
        ['Взнос действует', 'до 31.03.2027'],
      ]}
      action={{ t: 'К турнирам', to: 'Э14.2', icon: <Trophy size={15} /> }}
      note="Квитанцию присылает банк на почту. Отметка об оплате видна тренеру и в реестре — ставить её вручную никому не нужно."
    />
  );
}

const Paid14_10States = () => (
  <States>
    <Shot tone="info" title="Банк ещё подтверждает" text="Возврат пришёл раньше подтверждения — редко, но бывает.">
      <Rows>
        <Row nm="Платёж отправлен" sub="Halyk ePay · обрабатывается" pill={{ t: 'ЖДЁМ', cls: 'wait' }} />
      </Rows>
      <Alert>Страница сама обновится: держать её открытой не нужно.</Alert>
    </Shot>

    <Shot tone="success" title="Взнос уже был оплачен" text="Повторный платёж не проходит: система его не создаёт.">
      <Rows>
        <Row nm="Взнос 2026" sub="оплачен 14.01, картой •••• 1234" pill={{ t: 'ОПЛАЧЕН', cls: 'live' }} />
      </Rows>
    </Shot>
  </States>
);

export function Declined14_11() {
  return (
    <Result14
      ok={false}
      title="Оплата не прошла"
      lead="Банк отклонил платёж: недостаточно средств на карте."
      facts={[
        ['Сумма', '₸ 10 000'],
        ['Номер заказа', '100416'],
        ['Когда', '14.01.2026, 10:44'],
        ['Деньги', 'не списаны'],
        ['Взнос', 'остался неоплаченным'],
      ]}
      action={{ t: 'Повторить оплату', to: 'Э14.8', icon: <CreditCard size={15} /> }}
      note="Причину пишет банк — мы её только показываем. Ни номера карты, ни кода из SMS у нас нет; можно повторить или заплатить другой картой."
    />
  );
}

/* ── Э14.12 · История платежей и квитанция ─────────────────────── */

/** Платежи спортсмена: за что и когда платил, чем закончилось.

    Взнос платят раз в год, но платёж бывает неудачным, повторным и возвращённым
    — и на вопрос «я же платил» отвечает не память, а эта страница. Квитанция
    лежит здесь же: банк присылает её на почту, а почту теряют. */
const PAYMENTS = [
  { nm: 'Годовой взнос 2026', at: '14.01.2026, 10:42', sum: '₸ 10 000', st: 'ОПЛАЧЕН', cls: 'live' as const, card: '•••• 1234', ok: true },
  { nm: 'Годовой взнос 2026 · попытка', at: '14.01.2026, 10:44', sum: '₸ 10 000', st: 'НЕ ПРОШЛА', cls: 'bad' as const, card: '•••• 7788', ok: false },
  { nm: 'Годовой взнос 2025', at: '09.02.2025, 18:05', sum: '₸ 8 000', st: 'ОПЛАЧЕН', cls: 'live' as const, card: '•••• 1234', ok: true },
  /* Оплата мимо системы: квитанции у строки нет — документ выдавала не она. */
  { nm: 'Годовой взнос 2024', at: '21.01.2024, 12:31', sum: '₸ 8 000', st: 'ОПЛАЧЕН', cls: 'live' as const, card: 'наличными · отметил экономист', ok: false },
];

export function History14_12() {
  return (
    <RoleScreen
      role={R14}
      nav="Профиль"
      title="История платежей"
      sub="Ким Георгий · взносы за все сезоны"
      back={{ label: 'Профиль', to: 'Э14.7' }}
    >
      {/* Шапка своя: на этот экран приходят с вопросом «я же платил» — и
          отвечает на него сумма, а не заголовок «История платежей». */}
      <div className="o14-nohead">
      <div className="dh">
        <div className="dh-l">
          <button type="button" className="dh-back" data-to="Э14.7">
            <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} /> Профиль
          </button>
          <div className="o14-eyebrow">Оплачено взносов за три сезона</div>
          <div className="dh-rating" style={{ marginTop: 8 }}>
            <span className="v o14-disp" style={{ fontSize: 48 }}>₸ 26 000</span>
            <span className="p">три платежа прошли, одна попытка не прошла</span>
          </div>
        </div>
        <div className="dh-r">
          <div className="dh-till">
            <div className="v o14-disp" style={{ color: 'var(--c-ink)' }}>14.01.2026</div>
            <div className="k">последний платёж</div>
          </div>
        </div>
      </div>

      <div className="mkcols">
        <div>
          <div className="db-sec">
            Платежи<span>неудачные попытки тоже видны: по ним понятно, что деньги не списаны</span>
          </div>
          <div className="db-sheet">
            {PAYMENTS.map((p) => (
              <div className="db-row" key={p.at}>
                <span className="tx">
                  <span className="nm">{p.nm}</span>
                  <span className="ss">{p.at} · {p.card}</span>
                </span>
                <span className="amt o14-disp">{p.sum}</span>
                <P t={p.st} cls={p.cls} />
                {p.ok && (
                  <button className="dpickbtn">
                    <Receipt size={13} /> Квитанция
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Квитанция — то, что человек несёт в бухгалтерию клуба или школы.
            Собираем её мы: у банка это письмо, а не документ федерации. Поэтому
            и набрана она бумагой — получатель, сумма строкой, реквизиты
            парами, — а не формой из серых коробок. */}
        <div>
          <div className="db-sec">
            Квитанция<span>годовой взнос 2026</span>
          </div>
          <div className="db-sheet db-doc">
            <div className="to">Получатель</div>
            <div className="org">ОЮЛ «Федерация настольного тенниса РК»</div>

            <div className="sum">
              <span className="k">Годовой взнос 2026 · Ким Георгий, 14.06.2003</span>
              <span className="v o14-disp">₸ 10 000</span>
            </div>

            <div className="pairs">
              {[
                ['Номер заказа', '100416'],
                ['Когда', '14.01.2026, 10:42'],
                ['Способ', 'карта •••• 1234'],
                ['Через', 'Halyk ePay'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="k">{k}</div>
                  <div className="v">{v}</div>
                </div>
              ))}
            </div>

            <div className="btns">
              <button className="dsubmit" style={{ padding: '11px 16px' }}>
                <Download size={15} /> Скачать PDF
              </button>
              <Ghost>Отправить на почту</Ghost>
            </div>
          </div>
        </div>
      </div>
      </div>
    </RoleScreen>
  );
}

const History14_12States = () => (
  <States>
    <Shot tone="info" title="Платежей ещё не было" text="Первый сезон: взнос не выставлялся или не оплачивался.">
      <Empty title="Платежей пока нет" text="Здесь появятся все взносы: когда, сколько и чем закончился платёж." />
    </Shot>

    <Shot tone="warning" title="Оплату отметил экономист" text="Платёж прошёл мимо системы — квитанции банка нет.">
      <Rows>
        <Row nm="Годовой взнос 2024" sub="наличными · отметил экономист, основание — квитанция № 4471" pill={{ t: 'ОПЛАЧЕН', cls: 'live' }} />
      </Rows>
      <Alert>Кнопки «квитанция» у такой строки нет: документ выдавала не система.</Alert>
    </Shot>

    <Shot tone="danger" title="Возврат платежа ✳" text="Экономист снял отметку — в истории это отдельная строка.">
      <Rows>
        <Row nm="Годовой взнос 2026 · возврат" sub="снял Сериков Н., причина: «оплатил дважды» · 16.01" pill={{ t: 'ВОЗВРАТ', cls: 'bad' }} />
      </Rows>
    </Shot>
  </States>
);

const Declined14_11States = () => (
  <States>
    <Shot tone="warning" title="Человек нажал «Отмена» у банка" text="Та же страница, причина другая — платёж не начинался.">
      <Rows>
        <Row nm="Оплата отменена" sub="возврат с платёжной страницы банка" pill={{ t: 'ОТМЕНЕНА', cls: 'done' }} />
      </Rows>
    </Shot>

    <Shot tone="danger" title="Банк не отвечает ✳" text="Состояние неизвестно: проверяем сами, деньги не теряются.">
      <Rows>
        <Row nm="Ответа от банка нет" sub="проверим состояние платежа и обновим сами" pill={{ t: 'ПРОВЕРЯЕМ', cls: 'wait' }} />
      </Rows>
      <Alert>
        Если деньги списались, взнос станет оплаченным без участия человека — по сверке с банком.
      </Alert>
    </Shot>
  </States>
);

/* ── Э14.9 · Изменение данных ──────────────────────────────────── */

/** Телефон и почта — свои: человек меняет их сам.

    Клуб и регион спортсмен не выбирает вообще (решение от 17.08.2026). Это не
    его утверждение о себе, а принадлежность к чужой организации: в клуб зовёт
    администратор клуба (Э13.2), в регион — старший тренер региона (Э12.6).
    Самозаявки «хочу в этот клуб» больше нет — иначе к любому клубу и любому
    региону приписался бы кто угодно, а разбирал бы это кто-то другой. */
export function Edit14_9() {
  return (
    <RoleScreen
      role={R14}
      nav="Профиль"
      title="Изменение данных"
      sub="Ким Георгий · телефон и почта"
      back={{ label: 'Профиль', to: 'Э14.7' }}
    >
      {/* Шапка своя и короткая: экран правит ровно две вещи, и написать это
          честно важнее, чем повторить слово «Профиль» третий раз подряд. */}
      <div className="o14-nohead">
      <div className="dh">
        <div className="dh-l">
          <button type="button" className="dh-back" data-to="Э14.7">
            <ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} /> Профиль
          </button>
          <div className="dh-t o14-disp">Телефон и почта</div>
          <div className="dh-sub">
            Всё остальное меняется не здесь: в клуб зовёт <b>администратор клуба</b>, в регион —
            <b> старший тренер</b>
          </div>
        </div>
      </div>

      {/* Поля на ввод подчёркнуты, поля на чтение — нет: одинаково нарисованное
          «значение» и «то, что вводят» врёт человеку. Раньше и те и другие
          лежали в серых коробках, и отличить их было нельзя. */}
      <div className="mkcols">
        <div>
          <div className="db-sec">
            Контакты<span>сохраняются сразу</span>
          </div>
          <div className="db-sheet">
            <div className="db-f edit">
              <span className="k">Телефон</span>
              <span className="v">+7 705 118 44 03</span>
              <Pencil size={15} />
            </div>
            <div className="db-f edit">
              <span className="k">Почта</span>
              <span className="v">g.kim@mail.kz</span>
              <Pencil size={15} />
            </div>
            <div className="db-act">
              <span className="note">На почту приходят решения судьи и уведомления о вызове</span>
              <button className="dsubmit" style={{ padding: '11px 16px' }} data-to="Э14.7">
                <Check size={15} /> Сохранить
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="db-sec">
            Клуб и регион<span>здесь не меняются</span>
          </div>
          <div className="db-sheet">
            <div className="db-data">
              <div className="db-d">
                <span className="k">Клуб</span>
                <span className="v">СКА · Астана · с 12.01.2026</span>
              </div>
              <div className="db-d">
                <span className="k">Регион</span>
                <span className="v">г. Астана</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 'var(--s-3)' }}>
            <Alert>
              В клуб зовёт его администратор, в регион — старший тренер. Придёт приглашение — оно
              появится уведомлением, и решение будет за вами: принять или нет.
            </Alert>
          </div>
        </div>
      </div>
      </div>
    </RoleScreen>
  );
}

const Edit14_9States = () => (
  <States>
    <Shot tone="info" title="Пришло приглашение в клуб" text="Решает спортсмен: приглашение можно принять или отклонить.">
      <Rows>
        <Row
          nm="Клуб «Алатау» · Алматы"
          sub="пригласил Досжан М., 14.02 · сейчас вы в СКА · Астана"
          pill={{ t: 'ЖДЁТ ВАС', cls: 'wait' }}
          action="Принять"
        />
      </Rows>
      <Alert>
        Пока не приняли, в профиле остаётся прежний клуб. Отказ ничего не меняет и клубу виден.
      </Alert>
    </Shot>

    <Shot tone="success" title="Приглашение принято" text="Новый клуб в профиле, прежний — в истории.">
      <Rows>
        <Row nm="«Алатау» · Алматы" sub="перешли 16.02" pill={{ t: 'МОЙ КЛУБ', cls: 'live' }} />
        <Row nm="СКА · Астана" sub="до 16.02.2026" pill={{ t: 'В ИСТОРИИ', cls: 'done' }} />
      </Rows>
    </Shot>

    <Shot tone="info" title="Клуба нет" text="Так бывает: спортсмен тренируется сам. Заявиться на ОРТ это не мешает.">
      <Rows>
        <Row nm="Без клуба" sub="в регионе г. Астана · пригласить может любой клуб" pill={{ t: 'БЕЗ КЛУБА', cls: 'reg' }} />
      </Rows>
    </Shot>

    <Shot
      tone="warning"
      title="⚠ 12.11 — прежний клуб"
      text="Нужно ли его согласие на уход и что с местом в заявках и составах — не решено."
      wide
    >
      <Alert>
        Рисуем только приглашение принимающим клубом. Уходит ли спортсмен из уже поданных заявок
        и составов команд прежнего клуба сразу или доигрывает сезон — вопрос к федерации.
      </Alert>
    </Shot>
  </States>
);

/* ── Экраны роли ───────────────────────────────────────────────── */

/* ── Э14.8 · Оплата взноса картой ──────────────────────────────── */

/** Страница банка: наша оболочка сюда не приходит — человек ушёл на ePay.
    Форму рисует банк, поэтому макет условный: важно, что происходит до и
    после, а не как выглядят поля карты. */
const BankPage = ({ children }: { children: ReactNode }) => (
  <DeskFrame>
    <div className="mkpub">
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--c-muted)' }}>
        <Lock size={14} /> epay.homebank.kz · защищённое соединение
      </span>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 12.5, color: 'var(--c-muted)' }}>Halyk Bank · ePay</span>
    </div>
    <div className="mkauth">
      <div className="mkauth-card">{children}</div>
    </div>
  </DeskFrame>
);

export function Pay14_8() {
  return (
    <BankPage>
      <div className="t">Оплата картой</div>
      <div className="s">Федерация настольного тенниса РК · годовой взнос 2026</div>

      <Rows>
        <Row nm="К оплате" sub="номер заказа 100416" val="₸ 10 000" />
      </Rows>

      <Form>
        <Input label="Номер карты" value="4400 43•• •••• 1234" wide />
        <Field label="Срок" value="09 / 28" />
        <Input label="CVC" value="•••" />
        <Input label="Держатель карты" value="GEORGIY KIM" wide />
      </Form>

      {/* Кнопка банка ведёт на нашу страницу возврата: успех — Э14.10,
          отказ и отмена — Э14.11. */}
      <button className="dsubmit" data-to="Э14.10">
        <CreditCard size={15} /> Оплатить ₸ 10 000
      </button>
      <div className="mkauth-row">
        <span style={{ fontSize: 12.5, color: 'var(--c-muted)' }}>
          Форму и 3-D Secure показывает банк — номер карты в систему федерации не попадает
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--c-accent)' }} data-to="Э14.11">
          Отмена
        </span>
      </div>
    </BankPage>
  );
}

const Pay14_8States = () => (
  <States>
    <Shot tone="info" title="3-D Secure" text="Поле кода от банка.">
      <Rows>
        <Row nm="Код из SMS банка" sub="отправлен на +7 705 •• •• 03" val="• • • •" pill={{ t: 'ЖДЁМ КОД', cls: 'wait' }} />
      </Rows>
      <Alert>Этот шаг тоже у банка: мы не видим ни кода, ни номера карты.</Alert>
    </Shot>

    <Shot tone="danger" title="Оплата отклонена" text="Причина от банка и «повторить».">
      <Rows>
        <Row nm="Платёж отклонён" sub="банк: недостаточно средств" pill={{ t: 'НЕ ПРОШЛА', cls: 'bad' }} action="Повторить" />
      </Rows>
    </Shot>

    <Shot
      tone="success"
      title="Человек закрыл вкладку ✳"
      text="Возврата не было, но взнос станет оплаченным по подтверждению банка."
      wide
    >
      <Rows>
        <Row nm="Взнос 2026" sub="подтверждение банка пришло на сервер · возврата в браузере не было" pill={{ t: 'ОПЛАЧЕН', cls: 'live' }} />
      </Rows>
      <Alert tone="success">
        Состояние ставит серверное сообщение банка, а не возврат в приложение — держать
        вкладку открытой не нужно.
      </Alert>
    </Shot>
  </States>
);


/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу. */
export const SCREENS: ScreenMap = {
  'Э0.1': { cap: 'Вход', view: () => <Login0_1 />, next: '«Зарегистрироваться»' },
  'Э0.5': {
    cap: 'Регистрация спортсмена',
    view: () => (
      <>
        <SignUp0_5 />
        <SignUp0_5States />
      </>
    ),
    next: 'зарегистрировался — своя Главная',
  },
  'Э14.1': {
    cap: 'Главная',
    view: () => (
      <>
        <Home14_1 />
        <Home14_1States />
      </>
    ),
    next: 'пункт «Календарь»',
  },
  'Э14.2': {
    cap: 'Календарь',
    view: () => (
      <>
        <Calendar14_2 />
        <Calendar14_2States />
      </>
    ),
    next: '«Заявиться» на ОРТ',
  },
  'Э14.3': {
    cap: 'Заявка на ОРТ',
    view: () => (
      <>
        <Apply14_3 />
        <Apply14_3States />
      </>
    ),
    next: '«Подать заявку»',
  },
  'Э14.4': {
    cap: 'Моя заявка',
    view: () => (
      <>
        <MyApp14_4 />
        <MyApp14_4States />
      </>
    ),
    next: 'заявка принята',
  },
  'Э14.5': {
    cap: 'Мой турнир и мой матч',
    /* Узел вкладки на карте открывает экран сразу на ней. «Группы» бывают не у
       каждого турнира, поэтому для них показываем турнир с групповым этапом —
       иначе вкладки, о которой спрашивают, на экране просто нет. */
    tabView: (tab) => <Match14_5 tab={tab} groups={tab === 'Группы'} />,
    view: () => (
      <>
        <Match14_5 />
        <Also cap="Вкладка «Участники» — весь состав турнира">
          <Match14_5 tab="Участники" />
        </Also>
        <Also cap="Вкладка «Сетка» — на весь экран, тот же компонент, что на фронте">
          <Match14_5 tab="Сетка" />
        </Also>
        <Also cap="Формат «группы + плей-офф»: появляется вкладка «Группы», а «Сетка» — это плей-офф">
          <Match14_5 tab="Группы" groups />
        </Also>
        <Match14_5States />
      </>
    ),
    next: 'пункт «Аналитика»',
  },
  'Э14.6': {
    cap: 'Аналитика',
    view: () => (
      <>
        <Stats14_6 />
        <Stats14_6States />
      </>
    ),
    next: 'пункт «Профиль»',
  },
  'Э14.7': {
    cap: 'Мой профиль',
    view: () => (
      <>
        <Profile14_7 />
        <Profile14_7States />
      </>
    ),
    next: '«Оплатить картой»',
  },
  'Э14.8': {
    cap: 'Оплата взноса картой',
    view: () => (
      <>
        <Pay14_8 />
        <Pay14_8States />
      </>
    ),
    next: 'банк вернул человека к нам',
  },
  'Э14.10': {
    cap: 'Взнос оплачен',
    view: () => (
      <>
        <Paid14_10 />
        <Paid14_10States />
      </>
    ),
  },
  'Э14.11': {
    cap: 'Оплата не прошла',
    view: () => (
      <>
        <Declined14_11 />
        <Declined14_11States />
      </>
    ),
  },
  'Э14.13': {
    cap: 'Новости',
    view: () => (
      <>
        <News14_13 />
        <News14_13States />
      </>
    ),
    next: 'карточка новости',
  },
  'Э14.14': {
    cap: 'Новость',
    view: () => (
      <>
        <Article14_14 />
        <Article14_14States />
      </>
    ),
  },
  'Э14.12': {
    cap: 'История платежей и квитанция',
    view: () => (
      <>
        <History14_12 />
        <History14_12States />
      </>
    ),
  },
  'Э14.9': {
    cap: 'Изменение данных',
    view: () => (
      <>
        <Edit14_9 />
        <Edit14_9States />
      </>
    ),
  },
};

export function Role14Board() {
  return <Board role={R14} screens={SCREENS} />;
}
