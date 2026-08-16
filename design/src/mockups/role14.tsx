/* Роль 14 · Спортсмен — макеты по флоу. Экраны Э14.1–Э14.7
   (см. `flows/14-sportsmen.md` и карту роли).

   Сейчас проектируем **веб**: у спортсмена те же семь экранов, что были
   нарисованы телефоном, но десктопом — как у остальных ролей. Мобильное
   приложение (TZ §10) остаётся на потом, его экраны лежат рядом в
   `role14app.tsx` и показываются историей «Приложение · позже».

   Роль — единственная, кто заявляется сам, и единственная, кто платит взнос
   картой. Счёт своего матча спортсмен не вводит: его ведёт судья стола. */

import type { ReactNode } from 'react';
import { BarChart3, CreditCard, Lock, Send } from 'lucide-react';
import {
  A, ActionBar, Alert, Arrow, Board, Chips, Empty, Field, Form, Ghost, Modal, Off, P, Panel, Queue,
  RoleScreen, Row, Rows, Screen, Shot, States,
} from './shell';
import { DeskFrame, type DeskVariant } from '../deskShell';
import type { ScreenMap } from './shell';
import { R14 } from './roles';
import { Login0_1, SignUp0_5, SignUp0_5States } from './role00';

/* Спортсмен макета — Ким Георгий (тот же, что в реестрах ролей 2 и 12). */
const ME = A(44);

/* ── Э14.1 · Главная ───────────────────────────────────────────── */

export function Home14_1({ variant }: { variant?: DeskVariant }) {
  return (
    <RoleScreen variant={variant} role={R14} nav="Главная" title="Ким Георгий" sub="Астана · СКА · КМС">
      <Chips
        items={[
          { v: '2456', k: 'Рейтинг', tone: 'b' },
          { v: '7', k: 'Место в РК' },
          { v: '+24', k: 'За турнир', tone: 'g' },
          { v: '128', k: 'Матчей сыграно' },
        ]}
      />
      <Queue items={[{ n: '1', t: 'заявка ждёт решения судьи', to: 'Э14.4' }]} />

      <div className="mkcols">
        <Panel title="Сейчас играю" extra={<P t="ВАС ВЫЗВАЛИ · СТОЛ 5" cls="live" />}>
          <Rows>
            <Row
              av={A(22)}
              nm="Жумабеков Расул"
              sub="1/8 финала · рейтинг 2312"
              val="14:20"
              pill={{ t: 'ПОДОЙДИТЕ К СТОЛУ', cls: 'live' }}
              to="Э14.5"
            />
          </Rows>
        </Panel>

        <Panel title="Ближайший турнир">
          <Rows>
            <Row
              nm="Кубок Алматы 2026"
              sub="ОРТ · Алматы · 12–14 сентября"
              pill={{ t: 'ЗАЯВКА ПОДАНА', cls: 'reg' }}
              to="Э14.4"
            />
            <Row nm="Чемпионат Республики Казахстан" sub="Главный старт · Астана · 18–22 сентября" pill={{ t: 'ЗАЯВЛЯЕТ РЕГИОН', cls: 'done' }} />
          </Rows>
        </Panel>
      </div>
    </RoleScreen>
  );
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

/** В календаре только то, куда спортсмен заявляется сам: открытые
    республиканские. Старты, куда состав подаёт регион или клуб, сюда не
    попадают — строка с неактивной кнопкой человеку ничего не даёт. */
const OPEN = [
  { nm: 'Кубок Алматы 2026', mt: 'Алматы · 12–14 сентября', till: 'приём до 05.09', fee: true },
  { nm: 'ОРТ «Кубок Иртыша»', mt: 'Павлодар · 25 апреля', till: 'приём до 18.04', fee: true },
  { nm: 'ОРТ «Шымкент Open»', mt: 'Шымкент · 9 мая', till: 'приём до 02.05', fee: false },
];

/** Вкладка «Мои турниры»: где я уже заявлен — в том числе не собой. */
const MINE = [
  { nm: 'Чемпионат Республики Казахстан', mt: 'Астана · 18–22 сентября', by: 'заявил старший тренер региона' },
  { nm: 'Евразийская лига · 3-й тур', mt: 'Шымкент · 16–18 мая', by: 'заявил клуб · команда «СКА», мужская 2 лига' },
];

export function Calendar14_2() {
  return (
    <RoleScreen role={R14} nav="Календарь" title="Календарь" sub="Открытые республиканские · сезон 2026">
      <div className="dactionbar">
        <div className="dseg2">
          <span className="on">Куда могу заявиться · 3</span>
          <span>Мои турниры · 3</span>
        </div>
        <div className="dcount">Главные старты и Лигу заявляют регион и клуб — они во вкладке «Мои турниры»</div>
      </div>

      <Rows>
        {OPEN.map((t) => (
          <div className="drow" key={t.nm}>
            <div className="who">
              <div className="nm">{t.nm}</div>
              <div className="rl">ОРТ · {t.mt} · {t.till}</div>
            </div>
            {t.fee && <P t="НУЖЕН ГОДОВОЙ ВЗНОС" cls="reg" />}
            <button className="dpickbtn" data-to="Э14.3">Заявиться</button>
          </div>
        ))}
      </Rows>

      <Panel title="Мои турниры" extra={<span className="dcount">заявлен, но заявку подавал не я</span>}>
        <Rows>
          {MINE.map((t) => (
            <Row key={t.nm} nm={t.nm} sub={`${t.mt} · ${t.by}`} pill={{ t: 'ЗАЯВЛЕН', cls: 'live' }} to="Э14.4" />
          ))}
        </Rows>
      </Panel>
    </RoleScreen>
  );
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
        text="Ближайший открытый приём — ОРТ «Шымкент Open», с 20 апреля. Турниры, куда вас заявляют регион или клуб, — во вкладке «Мои турниры»."
      />
    </Shot>
  </States>
);

/* ── Э14.3 · Заявка на ОРТ ─────────────────────────────────────── */

export function Apply14_3() {
  return (
    <RoleScreen role={R14} nav="Календарь" title="Заявка на турнир" sub="Кубок Алматы 2026 · ОРТ">
      <div className="mkcols">
        <Panel title="Заявка">
          <Form>
            <Field label="Разряд" value="Одиночный" />
            <Field label="Возрастная группа" value="Взрослые" />
            <Field label="Парный разряд ✳" value="партнёр не выбран" wide />
          </Form>
          <div className="dactionbar" style={{ marginTop: 12 }}>
            <div className="dcount">Решение принимает главный судья турнира</div>
            <button className="dsubmit" style={{ padding: '11px 16px' }}>
              <Send size={15} /> Подать заявку
            </button>
          </div>
        </Panel>

        <Panel title="Условия допуска (§4.2)">
          <Rows>
            <Row nm="Годовой взнос федерации" sub="оплачен 14.01.2026" pill={{ t: 'ПРОХОДИТ', cls: 'live' }} />
            <Row nm="Удостоверение личности" sub="приложено" pill={{ t: 'ПРОХОДИТ', cls: 'live' }} />
            <Row nm="Медицинский допуск" sub="действует до 30.11.2026" pill={{ t: 'ПРОХОДИТ', cls: 'live' }} />
            <Row nm="Ценз по рейтингу" sub="не требуется" pill={{ t: 'НЕ НУЖЕН', cls: 'done' }} />
          </Rows>
        </Panel>
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

export function MyApp14_4() {
  return (
    <RoleScreen role={R14} nav="Моя заявка" title="Моя заявка" sub="Кубок Алматы 2026 · подана 02.09">
      <div className="mkcols">
        <Panel title="Состояние" extra={<P t="НА РАССМОТРЕНИИ" cls="wait" />}>
          <Form>
            <Field label="Турнир" value="Кубок Алматы 2026 · ОРТ" wide />
            <Field label="Разряд" value="Одиночный" />
            <Field label="Подана" value="02.09.2026, 19:40" />
          </Form>
          <div className="dactionbar" style={{ marginTop: 12 }}>
            <div className="dcount">Пока приём открыт, заявку можно отозвать</div>
            <Ghost>Отозвать заявку</Ghost>
          </div>
        </Panel>

        <Panel title="Что дальше">
          <Rows>
            <Row nm="Решение судьи" sub="придёт уведомлением" pill={{ t: 'ЖДЁМ', cls: 'wait' }} />
            <Row nm="Жеребьёвка" sub="после закрытия приёма, 05.09" pill={{ t: 'ПОТОМ', cls: 'done' }} />
            <Row nm="Вызов на стол" sub="в день игры, уведомлением" pill={{ t: 'ПОТОМ', cls: 'done' }} />
          </Rows>
        </Panel>
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

export function Match14_5() {
  return (
    <RoleScreen role={R14} nav="Мой матч" title="Кубок Алматы 2026" sub="1/8 финала · стол 5">
      <div className="mkcols">
        <Panel title="Мой матч" extra={<P t="ИДЁТ" cls="live" />}>
          <Rows>
            <Row av={ME} nm="Ким Георгий" sub="рейтинг 2456" val="2" pill={{ t: 'ВЫ', cls: 'reg' }} />
            <Row av={A(22)} nm="Жумабеков Расул" sub="рейтинг 2312" val="1" />
          </Rows>
          <div className="dactionbar" style={{ marginTop: 12 }}>
            <div className="dcount">Счёт ведёт судья стола — вводить и подтверждать его не нужно</div>
            <P t="ТОЛЬКО СМОТРИМ" cls="done" />
          </div>
        </Panel>

        <Panel title="Мой путь по сетке">
          <Rows>
            <Row nm="1/16 финала" sub="Оралбек Д. · 4:1" pill={{ t: 'ПОБЕДА', cls: 'live' }} />
            <Row nm="1/8 финала" sub="Жумабеков Р. · идёт" pill={{ t: 'СЕЙЧАС', cls: 'reg' }} />
            <Row nm="1/4 финала" sub="соперник определится" pill={{ t: 'ПОТОМ', cls: 'done' }} />
          </Rows>
        </Panel>
      </div>
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
  </States>
);

/* ── Э14.6 · Аналитика ─────────────────────────────────────────── */

export function Stats14_6() {
  return (
    <RoleScreen role={R14} nav="Аналитика" title="Аналитика" sub="Сезон 2026 · 128 матчей">
      <Chips
        items={[
          { v: '2456', k: 'Рейтинг', tone: 'b' },
          { v: '+24', k: 'За сезон', tone: 'g' },
          { v: '68%', k: 'Побед' },
          { v: '7', k: 'Турниров сыграно' },
        ]}
      />
      <div className="mkcols">
        <Panel title="Рейтинг по турнирам (§7.1)">
          <Rows>
            <Row nm="Кубок Алматы 2026" sub="1/8 финала · 14.09" val="+8" pill={{ t: 'РЕЙТИНГОВЫЙ', cls: 'reg' }} />
            <Row nm="Открытие сезона 2026" sub="1/4 финала · 19.01" val="+22" pill={{ t: 'РЕЙТИНГОВЫЙ', cls: 'reg' }} />
            <Row nm="ОРТ «Кубок Иртыша» 2025" sub="финал · 26.10" val="+16" pill={{ t: 'РЕЙТИНГОВЫЙ', cls: 'reg' }} />
          </Rows>
        </Panel>

        <Panel title="Расширенная аналитика ⚠" extra={<BarChart3 size={15} />}>
          <Empty title="Пока не проектируем" text="⚠ Что в неё входит и платная ли она — решения федерации нет." />
        </Panel>
      </div>
    </RoleScreen>
  );
}

const Stats14_6States = () => (
  <States>
    <Shot
      tone="warning"
      title="Расширенная аналитика — заглушка"
      text="Состав расширенной аналитики и её оплата не зафиксированы; до решения не проектируем."
      wide
    >
      <Empty title="Расширенная аналитика" text="⚠ Что в неё входит и платная ли она — решения федерации нет." />
    </Shot>
  </States>
);

/* ── Э14.7 · Профиль и взнос ───────────────────────────────────── */

export function Profile14_7() {
  return (
    <RoleScreen role={R14} nav="Профиль" title="Профиль" sub="Ким Георгий · 2003 · Астана">
      <div className="mkcols">
        <Panel title="Профиль">
          <Form>
            <Field label="Год рождения" value="2003" />
            <Field label="Разряд" value="мастер спорта" />
            <Field label="Регион и клуб" value="Астана · СКА" />
            <Field label="Тренер" value="Гладун Игорь" />
            <Field label="Телефон" value="+7 705 118 44 03" />
            <Field label="Почта" value="g.kim@mail.kz" />
          </Form>
        </Panel>

        <Panel title="Годовой взнос 2026" extra={<P t="НЕ ОПЛАЧЕН" cls="wait" />}>
          <Form>
            <Field label="Сумма" value="₸ 10 000" />
            <Field label="Срок" value="до 31 марта" />
          </Form>
          <div style={{ marginTop: 12 }}>
            <button className="dsubmit" style={{ width: '100%' }} data-to="Э14.8">
              <CreditCard size={15} /> Оплатить картой
            </button>
          </div>
          <Alert>
            Оплата идёт на платёжной странице Халык Банка. Состояние поставится само, по
            подтверждению банка — держать вкладку открытой не нужно (§9.2).
          </Alert>
        </Panel>
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
        <Field label="Номер карты" value="4400 43•• •••• 1234" wide />
        <Field label="Срок" value="09 / 28" />
        <Field label="CVC" value="•••" />
        <Field label="Держатель карты" value="GEORGIY KIM" wide />
      </Form>

      <button className="dsubmit">
        <CreditCard size={15} /> Оплатить ₸ 10 000
      </button>
      <div className="mkauth-row">
        <span style={{ fontSize: 12.5, color: 'var(--c-muted)' }}>
          Форму и 3-D Secure показывает банк — номер карты в систему федерации не попадает
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--c-accent)' }} data-to="Э14.7">
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
        Состояние ставит серверное сообщение банка, а не возврат в приложение (§9.2) — держать
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
    view: () => (
      <>
        <Match14_5 />
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
    cap: 'Профиль и взнос',
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
  },
};

export function Role14Board() {
  return <Board role={R14} screens={SCREENS} />;
}
