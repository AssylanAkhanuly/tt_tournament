/* Роль 2 · Экономист / бухгалтер — макеты по флоу.
   Экраны Э2.1–Э2.4 (см. `flows/02-ekonomist.md` и карту роли).

   Главное про роль: обычно бухгалтер не участвует — спортсмен платит картой, и
   строка становится «оплачен» по подтверждению банка (TZ §9.2). Экраны нужны
   для сверки и исключений, поэтому отметка вручную и снятие отметки требуют
   основания и живут отдельными диалогами. */

import { Banknote, Download, FileWarning, RefreshCw, Undo2 } from 'lucide-react';
import {
  A, ActionBar, Alert, Arrow, AW, Board, Chips, Empty, Field, Form, Ghost, Hint, Modal, Off, P,
  Panel, RoleScreen, Row, Rows, Screen, Shot, States,
} from './shell';
import type { DeskVariant } from '../deskShell';
import type { ScreenMap } from './shell';
import { R02 } from './roles';
import { Login0_1 } from './role00';

type Fee = { av: string; nm: string; sub: string; st: string; cls: 'live' | 'wait' | 'bad'; when: string };

const FEES: Fee[] = [
  { av: A(32), nm: 'Смагулов Алан', sub: 'Алматы · «Алатау» · 2004', st: 'ОПЛАЧЕН', cls: 'live', when: '14.01 · картой' },
  { av: A(44), nm: 'Ким Георгий', sub: 'Астана · СКА · 2003', st: 'ОПЛАЧЕН', cls: 'live', when: '09.01 · картой' },
  { av: A(22), nm: 'Жумабеков Расул', sub: 'Караганда · «Шахтёр» · 2007', st: 'НЕ ОПЛАЧЕН', cls: 'wait', when: '—' },
  { av: AW(21), nm: 'Тлеуова Аружан', sub: 'Шымкент · «Достык» · 2009', st: 'НЕ ОПЛАЧЕН', cls: 'wait', when: '—' },
  { av: A(56), nm: 'Гладун Игорь', sub: 'Тараз · 2001', st: 'ПРОСРОЧЕН', cls: 'bad', when: 'срок вышел 31.03' },
  { av: A(13), nm: 'Пак Сергей', sub: 'Павлодар · «Иртыш» · 2005', st: 'ОПЛАЧЕН', cls: 'live', when: '22.02 · вручную' },
];

/** Ход сбора взносов: сколько собрано, кто платит сам, что ждёт сверки. */
const KPI = [
  { v: '412 / 526', k: 'Оплатили взнос', tone: 'g' as const },
  { v: '₸ 4,12 млн', k: 'Собрано · 78%', tone: 'b' as const },
  { v: '96', k: 'Не оплачено' },
  { v: '18', k: 'Просрочено' },
];

/* ── Э2.1 · Взносы за сезон ────────────────────────────────────── */

export function Fees2_1({ variant }: { variant?: DeskVariant }) {
  return (
    <RoleScreen
      variant={variant}
      role={R02}
      nav="Взносы"
      title="Взносы за сезон"
      sub="2026 год · ₸ 10 000"
    >
      <Chips items={KPI} />

      <div className="dactionbar">
        <div className="mkattn">
          <span className="mkattn-h">Ждут сверки</span>
          <span className="mkattn-i" data-to="Э2.2">
            <b>7</b> платежей без подтверждения банка
          </span>
        </div>
        <Ghost>
          <Download size={14} /> Выгрузить список
        </Ghost>
      </div>

      <ActionBar count="526 спортсменов · регион Алматы · 2026" />
      <Rows>
        {FEES.map((f) => (
          <Row
            key={f.nm}
            to="Э2.2"
            av={f.av}
            nm={f.nm}
            sub={f.sub}
            val={f.when}
            pill={{ t: f.st, cls: f.cls }}
            action={f.cls === 'live' ? undefined : 'Отметить вручную'}
          />
        ))}
      </Rows>
    </RoleScreen>
  );
}

const Fees2_1States = () => (
  <States>
    <Shot
      tone="info"
      title="Начало года — все «не оплачен»"
      text="Массовое состояние, а не ошибка: показываем подсказку о сроке уплаты."
    >
      <Chips
        items={[
          { v: '0 / 526', k: 'Оплатили взнос' },
          { v: '₸ 0', k: 'Собрано' },
        ]}
      />
      <Rows>
        <Row av={A(32)} nm="Смагулов Алан" sub="Алматы · «Алатау»" pill={{ t: 'НЕ ОПЛАЧЕН', cls: 'wait' }} />
        <Row av={A(44)} nm="Ким Георгий" sub="Астана · СКА" pill={{ t: 'НЕ ОПЛАЧЕН', cls: 'wait' }} />
      </Rows>
      <Alert>Срок уплаты — до 31 марта. После него состояние становится «просрочен».</Alert>
    </Shot>

    <Shot
      tone="success"
      title="Обычный ход — бухгалтер не участвует"
      text="Спортсмен платит картой сам, строка становится «оплачен» по подтверждению банка (§9.2)."
    >
      <Rows>
        <Row
          av={A(44)}
          nm="Ким Георгий"
          sub="оплатил картой сам · Halyk ePay"
          val="09.01, 21:14"
          pill={{ t: 'ОПЛАЧЕН', cls: 'live' }}
        />
      </Rows>
      <Empty title="Отметок вручную за неделю нет" text="Экран нужен для сверки и исключений." />
    </Shot>
  </States>
);

/* ── Э2.2 · Карточка взноса ────────────────────────────────────── */

export function Fee2_2() {
  return (
    <RoleScreen role={R02} nav="Взносы" title="Карточка взноса" sub="Пак Сергей · Павлодар · «Иртыш»">
      <div className="mkcols">
        <Panel title="Взнос за 2026 год" extra={<P t="ОПЛАЧЕН ВРУЧНУЮ" cls="live" />}>
          <Form>
            <Field label="Год" value="2026" />
            <Field label="Сумма" value="₸ 10 000" />
            <Field label="Дата оплаты" value="22.02.2026" />
            <Field label="Как оплачен" value="отметка вручную · Сериков Н." />
            <Field label="Основание" value="квитанция № 4471 от 22.02.2026" wide />
            <div className="dfield wide">
              <div className="k">Приложенный документ</div>
              <div className="dval" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileWarning size={15} /> ⚠ не решено, храним ли платёжку
              </div>
            </div>
          </Form>
          <div className="dactionbar" style={{ marginTop: 12 }}>
            <div className="dcount">Состояние видят спортсмен и его тренер</div>
            <button className="dpickbtn">
              <Undo2 size={14} /> Снять отметку
            </button>
          </div>
        </Panel>

        <Panel title="История по взносу">
          <Rows>
            <Row nm="Отметил оплату вручную" sub="Сериков Н. · 22.02.2026, 10:42 · квитанция № 4471" pill={{ t: 'ОПЛАЧЕН', cls: 'live' }} />
            <Row nm="Взнос выставлен" sub="система · 01.01.2026" pill={{ t: 'НЕ ОПЛАЧЕН', cls: 'wait' }} />
          </Rows>
        </Panel>
      </div>
    </RoleScreen>
  );
}

const Fee2_2States = () => (
  <States>
    <Shot
      tone="success"
      title="Оплачено картой"
      text="Кнопок отметки нет, показан номер платежа: подтверждённый банком платёж снять нельзя."
    >
      <Form>
        <Field label="Как оплачен" value="картой · Halyk ePay" />
        <Field label="Платёж в банке" value="4172-8830" />
      </Form>
      <Alert tone="success">Подтверждение банка пришло 14.01.2026, 10:42 — состояние выставила система.</Alert>
    </Shot>

    <Shot
      tone="warning"
      title="Документ не приложен"
      text="Зона документа остаётся заглушкой, пока не решено, храним ли платёжку."
    >
      <Empty title="Платёжка не приложена" text="⚠ Решение о хранении документов не принято." />
    </Shot>
  </States>
);

/* ── Э2.3 · Отметка оплаты вручную ─────────────────────────────── */

export function Mark2_3() {
  return (
    <RoleScreen role={R02} nav="Взносы" title="Карточка взноса" sub="Жумабеков Расул · Караганда · «Шахтёр»">
      <Panel title="Взнос за 2026 год" extra={<P t="НЕ ОПЛАЧЕН" cls="wait" />}>
        <Form>
          <Field label="Год" value="2026" />
          <Field label="Сумма" value="₸ 10 000" />
        </Form>
      </Panel>

      <Modal
        title="Отметить оплату вручную"
        sub="Жумабеков Расул · взнос 2026 · ₸ 10 000"
        foot={
          <>
            <div className="dcount">Отметка уйдёт в журнал с автором и временем</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Ghost>Закрыть</Ghost>
              <button className="dsubmit" style={{ padding: '11px 16px' }}>
                <Banknote size={15} /> Отметить оплачен
              </button>
            </div>
          </>
        }
      >
        <div className="dseg2">
          <span className="on">Квитанция</span>
          <span>Перевод на счёт федерации</span>
          <span>Оплата на месте</span>
        </div>
        <Form>
          <Field label="Основание ✳" value="квитанция № 4471" />
          <Field label="Дата платежа" value="22.02.2026" />
        </Form>
        <Alert>
          Обычно спортсмен платит картой и строка становится «оплачен» сама. Ручная отметка —
          исключение: платёж пришёл мимо системы.
        </Alert>
      </Modal>
    </RoleScreen>
  );
}

const Mark2_3States = () => (
  <States>
    <Shot tone="danger" title="Основание не заполнено" text="Кнопка неактивна, с пояснением.">
      <div className="dfield">
        <div className="k">Основание</div>
        <div className="dval" style={{ color: 'var(--c-danger)' }}>— не заполнено</div>
      </div>
      <Off>Отметить оплачен</Off>
    </Shot>

    <Shot
      tone="info"
      title="Платёж уже подтверждён банком"
      text="Отметка не нужна: диалог не открывается, в карточке показан номер платежа."
    >
      <Rows>
        <Row nm="Halyk ePay · платёж 4172-8830" sub="подтверждение банка 14.01.2026" pill={{ t: 'ОПЛАЧЕН', cls: 'live' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э2.4 · Снятие отметки ─────────────────────────────────────── */

export function Unmark2_4() {
  return (
    <RoleScreen role={R02} nav="Взносы" title="Карточка взноса" sub="Пак Сергей · Павлодар · «Иртыш»">
      <Panel title="Взнос за 2026 год" extra={<P t="ОПЛАЧЕН ВРУЧНУЮ" cls="live" />}>
        <Form>
          <Field label="Как оплачен" value="отметка вручную · Сериков Н." />
          <Field label="Основание" value="квитанция № 4471" />
        </Form>
      </Panel>

      <Modal
        title="Снять отметку об оплате"
        sub="Пак Сергей · взнос 2026 · отметил Сериков Н., 22.02.2026"
        foot={
          <>
            <div className="dcount">Причина уйдёт в журнал и в историю по взносу</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Ghost>Закрыть</Ghost>
              <button className="dsubmit" style={{ padding: '11px 16px' }}>
                <Undo2 size={15} /> Снять отметку
              </button>
            </div>
          </>
        }
      >
        <Form>
          <Field label="Причина ✳" value="квитанция не подтвердилась в банке" wide />
        </Form>
        <Alert>
          После снятия заявки спортсмена на турниры с флагом взноса перестанут проходить (§9.2).
        </Alert>
      </Modal>
    </RoleScreen>
  );
}

const Unmark2_4States = () => (
  <States>
    <Shot
      tone="info"
      title="Платёж подтверждён банком"
      text="Снять нельзя: кнопки нет, показан номер платежа."
    >
      <Rows>
        <Row nm="Halyk ePay · платёж 4172-8830" sub="подтверждение банка 14.01.2026" pill={{ t: 'ОПЛАЧЕН', cls: 'live' }} />
      </Rows>
      <Alert tone="success">Снимается только ручная отметка — банковский платёж не трогаем.</Alert>
    </Shot>

    <Shot tone="danger" title="Причина не заполнена" text="«Снять отметку» неактивна.">
      <div className="dfield">
        <div className="k">Причина</div>
        <div className="dval" style={{ color: 'var(--c-danger)' }}>— не заполнена</div>
      </div>
      <Off>Снять отметку</Off>
    </Shot>
  </States>
);

/* ── Сверка с банком: то же на планшете ────────────────────────── */

export const Fees2_1Tablet = () => <Fees2_1 variant="land" />;

/* ── Экраны роли ───────────────────────────────────────────────── */

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу. */
export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход',
    view: () => <Login0_1 />,
    next: 'первый экран роли',
  },
  'Э2.1': {
    cap: 'Взносы за сезон',
    view: () => (
      <>
        <Fees2_1 />
        <Fees2_1States />
      </>
    ),
    next: 'строка спортсмена',
  },
  'Э2.2': {
    cap: 'Карточка взноса',
    view: () => (
      <>
        <Fee2_2 />
        <Fee2_2States />
      </>
    ),
    next: '«Отметить оплату вручную»',
  },
  'Э2.3': {
    cap: 'Отметка оплаты вручную',
    view: () => (
      <>
        <Mark2_3 />
        <Mark2_3States />
      </>
    ),
    next: '«Снять отметку»',
  },
  'Э2.4': {
    cap: 'Снятие отметки',
    view: () => (
      <>
        <Unmark2_4 />
        <Unmark2_4States />
      </>
    ),
  },
};

export function Role02Board() {
  return <Board role={R02} screens={SCREENS} />;
}
