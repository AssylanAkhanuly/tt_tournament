/* 16 · Дисциплинарный комитет — макеты по флоу. Экраны Э16.1–Э16.4
   (см. `flows/16-disciplinarnyy-komitet.md`).

   Комитет — орган, а не роль: человек входит в него поверх своей роли. Поэтому
   в файле две оболочки — спортсмена (Э16.1, он подаёт протест) и комитета
   (Э16.2–Э16.4, он его разбирает). Маршрут начинается у спортсмена намеренно:
   без формы подачи очередь дел неоткуда взять. */

import { useState } from 'react';
import { Bookmark, FileText, History, Scroll, Send } from 'lucide-react';
import {
  A, ActionBar, Alert, Board, Chips, Empty, Field, Form, Hint, P, Panel, RoleScreen, Row, Rows,
  Shot, States,
} from './shell';
import type { ScreenMap } from './shell';
import { R14, RDISC } from './roles';

/* ── дела ───────────────────────────────────────────────────────── */

type Case = {
  id: string;
  who: string;
  av: string;
  match: string;
  tour: string;
  at: string;
  st: 'подан' | 'на рассмотрении' | 'решение принято';
  by?: string;
};

const CASES: Case[] = [
  { id: 'Д-118', who: 'Ким Георгий', av: A(44), match: '1/8 · Ким Г. — Токаев М. · стол 4', tour: 'Чемпионат Казахстана 2026', at: '13.03, 19:20', st: 'подан' },
  { id: 'Д-117', who: 'Мұрат Ерлан', av: A(93), match: '1/16 · Гладун И. — Мұрат Е. · стол 2', tour: 'Чемпионат Казахстана 2026', at: '13.03, 15:04', st: 'на рассмотрении', by: 'Мукашев Б.' },
  { id: 'Д-116', who: 'Тлеуова Аружан', av: A(21), match: '1/16 · Тлеуова А. — Абаева Д. · стол 11', tour: 'Чемпионат Казахстана 2026', at: '12.03, 20:41', st: 'решение принято', by: 'Мукашев Б.' },
  { id: 'Д-113', who: 'Байжанов Асхат', av: A(85), match: 'группа B · Байжанов А. — Досжан М. · стол 6', tour: 'Кубок Казахстана 2026', at: '22.02, 18:02', st: 'решение принято', by: 'Ахметов К.' },
];

const ST_CLS: Record<Case['st'], 'wait' | 'reg' | 'live'> = {
  'подан': 'wait',
  'на рассмотрении': 'reg',
  'решение принято': 'live',
};

/* ── Э16.1 · Протест спортсмена ─────────────────────────────────── */

/* Экран роли 14: протест подаёт сам спортсмен. Материалы к нему прикладываются
   системой — собирать их спортсмену не нужно и нельзя: он их не хранит. */
export function Protest16_1() {
  return (
    <RoleScreen
      role={R14}
      nav="Мой турнир"
      title="Протест по матчу"
      sub="Чемпионат Казахстана 2026 · 1/8 финала · 13 марта"
    >
      <div className="mkcols">
        <Panel title="На что жалоба" extra={<span className="pill wait" style={{ margin: 0 }}>ЧЕРНОВИК</span>}>
          <Form>
            <Field label="Матч" value="1/8 финала · Ким Г. — Токаев М." />
            <Field label="Стол и судья" value="Стол 4 · судья Оралбай Е." />
            <Field label="Итоговый счёт" value="4 : 2 (11–9, 9–11, 11–7, 8–11, 11–6, 11–4)" />
            <Field label="Подан" value="13.03.2026, 19:20 · Ким Георгий" />
            {/* Два поля, а не одно: комитет разбирает первое, а решает по
                второму — в одном абзаце они слипаются. */}
            <div className="dfield wide">
              <div className="k">Что произошло</div>
              <div className="dval" style={{ fontWeight: 500, lineHeight: 1.55, color: 'var(--c-muted)' }}>
                В пятой партии счёт был исправлен после подтверждения партии; судья не объяснил
                основание. В шестой партии вынесена жёлтая карточка без предупреждения.
              </div>
            </div>
            <div className="dfield wide">
              <div className="k">Что прошу</div>
              <div className="dval" style={{ fontWeight: 500, lineHeight: 1.55, color: 'var(--c-muted)' }}>
                Проверить правку счёта и обоснованность карточки.
              </div>
            </div>
          </Form>
          <div className="dactionbar" style={{ marginTop: 12 }}>
            <div className="dcount">⚠ Срок подачи протеста федерация не назвала — вопрос 15.4</div>
            <button className="dsubmit" data-to="Э16.2">
              <Send size={15} /> Подать протест
            </button>
          </div>
        </Panel>

        {/* Материалы не собираются спортсменом: система прикладывает их сама.
            Это же закрывает половину замечания федерации — «чтобы все нарушения
            и карты фиксировались». */}
        <Panel title="Материалы" extra={<span className="pill reg" style={{ margin: 0 }}>ПРИЛОЖЕНЫ СИСТЕМОЙ</span>}>
          <Rows>
            <Row nm="Протокол матча" sub="счёт по партиям, судья, время · подтверждён 15:58" pill={{ t: 'ЕСТЬ', cls: 'live' }} />
            <Row nm="История событий матча" sub="розыгрыши, тайм-ауты, смены сторон, отмены (TZ §6.5)" pill={{ t: 'ЕСТЬ', cls: 'live' }} />
            <Row nm="Жёлтая карточка · Токаев М." sub="15:46 · вынес судья стола Оралбай Е." pill={{ t: 'ЕСТЬ', cls: 'live' }} />
            <Row nm="Правка счёта после подтверждения" sub="партия 3: было 11 : 7 → стало 7 : 11 · исправил главный судья" pill={{ t: 'ЕСТЬ', cls: 'live' }} />
          </Rows>
          <div style={{ marginTop: 12 }}>
            <Hint>
              Собирать материалы спортсмену не нужно и нельзя: он их не хранит, а система хранит.
              Комитет получает их вместе с протестом и ничего не запрашивает у судьи.
            </Hint>
          </div>
        </Panel>
      </div>
    </RoleScreen>
  );
}

const Protest16_1States = () => (
  <States>
    <Shot
      tone="info"
      title="Протест по этому матчу уже подан ✳"
      text="Второй по тому же матчу не подаётся — открывается поданный."
    >
      <Rows>
        <Row nm="Д-118 · 1/8 · Ким Г. — Токаев М." sub="подан 13.03, 19:20 · состояние «подан»" pill={{ t: 'УЖЕ ПОДАН', cls: 'wait' }} action="Открыть" />
      </Rows>
    </Shot>

    <Shot tone="danger" title="Срок подачи истёк ⚠" text="Правило есть, числа нет — вопрос 15.4.">
      <Rows>
        <Row nm="Срок подачи протеста" sub="федерация не назвала, сколько дней даётся после матча" pill={{ t: 'ВОПРОС 15.4', cls: 'bad' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э16.2 · Протесты ───────────────────────────────────────────── */

export function Cases16_2() {
  const [pick, setPick] = useState<string | null>(null);
  return (
    <RoleScreen
      role={RDISC}
      nav="Протесты"
      title="Протесты"
      sub="Сезон 2026 · дела по всем соревнованиям"
    >
      <Chips
        items={[
          { v: '1', k: 'Подан — ждёт, кто возьмёт', tone: 'a' },
          { v: '1', k: 'На рассмотрении', tone: 'b' },
          { v: '2', k: 'Решение принято', tone: 'g' },
          { v: '9', k: 'Карточек за сезон' },
        ]}
      />

      <ActionBar count={pick ? `Выбрано дело ${pick}` : 'Новые сверху: у протеста есть срок ⚠ 15.4'}>
        <button className="dpickbtn" data-to="Э16.4">
          <History size={14} /> Дисциплинарная история
        </button>
        {pick ? (
          <button className="dsubmit" style={{ padding: '10px 14px' }} data-to="Э16.3">
            <Scroll size={15} /> Взять в работу
          </button>
        ) : (
          <span className="dpickbtn" style={{ opacity: .5 }}>
            <Scroll size={15} /> Взять в работу
          </span>
        )}
      </ActionBar>

      <Panel title="Очередь дел" extra={<span className="dcount">кто подал · по какому матчу · состояние</span>}>
        <Rows>
          {CASES.map((c) => (
            <Row
              key={c.id}
              av={c.av}
              to="Э16.3"
              nm={`${c.id} · ${c.who}`}
              sub={`${c.match} · ${c.tour} · подан ${c.at}${c.by ? ` · ведёт ${c.by}` : ''}`}
              pill={{ t: c.st.toUpperCase(), cls: ST_CLS[c.st] }}
              on={pick === c.id}
              onSelect={() => setPick(pick === c.id ? null : c.id)}
            />
          ))}
        </Rows>
      </Panel>
    </RoleScreen>
  );
}

const Cases16_2States = () => (
  <States>
    <Shot tone="info" title="Протестов нет ✳" text="Пустое состояние, а не пустой список.">
      <Empty title="Протестов нет" text="Дела появляются, когда спортсмен подаёт протест по матчу." />
    </Shot>

    <Shot tone="danger" title="Дело просрочено ⚠" text="Срок рассмотрения федерация не назвала — вопрос 15.4.">
      <Rows>
        <Row nm="Д-117 · на рассмотрении 6 дней" sub="сколько дней даётся комитету — не определено" pill={{ t: 'ВОПРОС 15.4', cls: 'bad' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э16.3 · Дело ───────────────────────────────────────────────── */

export function Case16_3() {
  return (
    <RoleScreen
      role={RDISC}
      nav="Протесты"
      title="Дело Д-118"
      sub="Ким Георгий · 1/8 финала · Чемпионат Казахстана 2026"
      back={{ label: 'Протесты', to: 'Э16.2' }}
    >
      <div className="mkcols">
        <Panel title="Протест" extra={<span className="pill reg" style={{ margin: 0 }}>НА РАССМОТРЕНИИ</span>}>
          <Form>
            <Field label="Подал" value="Ким Георгий · 13.03.2026, 19:20" />
            <Field label="Матч" value="1/8 · Ким Г. — Токаев М. · стол 4" />
            <div className="dfield wide">
              <div className="k">Что произошло</div>
              <div className="dval" style={{ fontWeight: 500, lineHeight: 1.55, color: 'var(--c-muted)' }}>
                Счёт исправлен после подтверждения партии без объяснения основания; жёлтая карточка
                вынесена без предупреждения.
              </div>
            </div>
            <div className="dfield wide">
              <div className="k">Что просит</div>
              <div className="dval" style={{ fontWeight: 500, lineHeight: 1.55, color: 'var(--c-muted)' }}>
                Проверить правку счёта и обоснованность карточки.
              </div>
            </div>
          </Form>

          {/* Санкции не перечислены: федерация их не назвала. Пока решение —
              свободная формулировка и фиксация, а не выбор из списка. */}
          <div style={{ marginTop: 12 }}>
            <Alert tone="warning">
              ⚠ Перечень санкций не определён (вопрос 15.4): решение фиксируется текстом, система
              по нему ничего не пересчитывает — ни допуск, ни рейтинг судьи.
            </Alert>
          </div>
          <div className="dactionbar" style={{ marginTop: 12 }}>
            <button className="dpickbtn">
              <FileText size={14} /> Запросить пояснение
            </button>
            <button className="dsubmit">
              <Send size={15} /> Принять решение
            </button>
          </div>
        </Panel>

        <Panel title="Материалы и участники" extra={<span className="dcount">приехали вместе с результатом</span>}>
          <div className="qsec">Материалы дела</div>
          <Rows>
            <Row nm="Протокол матча" sub="4 : 2 · подтверждён судьёй стола 15:58" pill={{ t: 'В ДЕЛЕ', cls: 'live' }} />
            <Row nm="История событий" sub="розыгрыши, тайм-ауты, карточки, правки (TZ §6.5)" pill={{ t: 'В ДЕЛЕ', cls: 'live' }} />
            <Row nm="Жёлтая карточка · Токаев М." sub="15:46 · судья стола Оралбай Е." pill={{ t: 'В ДЕЛЕ', cls: 'live' }} />
          </Rows>
          <div className="qsec">Участники дела</div>
          <Rows>
            <Row to="Э16.4" nm="Ким Георгий · заявитель" sub="дисциплинарная история" pill={{ t: 'СПОРТСМЕН', cls: 'reg' }} />
            <Row to="Э16.4" nm="Токаев Марат · соперник" sub="дисциплинарная история" pill={{ t: 'СПОРТСМЕН', cls: 'reg' }} />
            <Row to="Э16.4" nm="Оралбай Ержан · судья стола" sub="карточки и правки по его столам" pill={{ t: 'СУДЬЯ', cls: 'wait' }} />
            <Row to="Э16.4" nm="Оспанов Талгат · главный судья" sub="кто исправлял счёт" pill={{ t: 'СУДЬЯ', cls: 'wait' }} />
          </Rows>
        </Panel>
      </div>
    </RoleScreen>
  );
}

const Case16_3States = () => (
  <States>
    <Shot tone="info" title="Решение принято — только чтение ✳" text="Дальше дело не правится.">
      <Rows>
        <Row nm="Д-116 · решение принято 13.03" sub="решение ушло заявителю уведомлением" pill={{ t: 'ЗАКРЫТО', cls: 'live' }} />
      </Rows>
    </Shot>

    <Shot
      tone="danger"
      title="Может ли комитет отменить результат матча ⚠"
      text="Федерация не сказала — вопрос 15.4."
      wide
    >
      <Rows>
        <Row nm="Результат матча" sub="отменяет ли его комитет или решение касается только дисциплины" pill={{ t: 'ВОПРОС 15.4', cls: 'bad' }} />
        <Row nm="Санкции и допуск" sub="какие возможны и влияют ли на допуск к следующим стартам" pill={{ t: 'ВОПРОС 15.4', cls: 'bad' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э16.4 · Дисциплинарная история ─────────────────────────────── */

type Ev = { at: string; nm: string; sub: string; st: string; cls: 'bad' | 'wait' | 'live' | 'reg' };

const HIST: Ev[] = [
  { at: '13.03', nm: 'Жёлтая карточка · Токаев Марат', sub: 'стол 4 · 1/8 финала · вынес судья Оралбай Е.', st: 'КАРТОЧКА', cls: 'wait' },
  { at: '13.03', nm: 'Решение комитета по делу Д-116', sub: 'Тлеуова А. · протест по снятию с матча', st: 'РЕШЕНИЕ', cls: 'live' },
  { at: '12.03', nm: 'Снятие по травме · Тлеуова Аружан', sub: 'стол 11 · подтверждено врачом соревнований', st: 'СНЯТИЕ', cls: 'reg' },
  { at: '12.03', nm: 'Техническое поражение · Гладун Игорь', sub: 'неявка на матч 1/16 · стол 2', st: 'НЕЯВКА', cls: 'bad' },
  { at: '22.02', nm: 'Красная карточка · Байжанов Асхат', sub: 'Кубок РК · группа B · стол 6', st: 'КАРТОЧКА', cls: 'bad' },
];

export function History16_4() {
  return (
    <RoleScreen
      role={RDISC}
      nav="История"
      title="Дисциплинарная история"
      sub="Сезон 2026 · карточки, снятия, технические поражения, решения"
    >
      <ActionBar count="Собирается автоматически: карточки приходят с табло судьи (TZ §6.5)">
        <button className="dpickbtn" data-to="Э16.2">
          <Scroll size={14} /> Протесты
        </button>
      </ActionBar>

      <Panel title="Лента нарушений" extra={<span className="dcount">заводить запись руками нельзя</span>}>
        <Rows>
          {HIST.map((e) => (
            <div className="drow" key={e.at + e.nm} style={{ cursor: 'default' }}>
              <div className="rank" style={{ width: 46 }}>{e.at}</div>
              <div className="who">
                <div className="nm">{e.nm}</div>
                <div className="rl">{e.sub}</div>
              </div>
              <P t={e.st} cls={e.cls} />
            </div>
          ))}
        </Rows>
        {/* Запись без события на столе — это уже не история, а мнение. */}
        <div style={{ marginTop: 12 }}>
          <Hint>
            Комитет ленту не заполняет: карточки и снятия приходят с табло судьи вместе с
            результатом матча (TZ §6.5). Запись без события на столе — это уже не история, а мнение.
          </Hint>
        </div>
      </Panel>
    </RoleScreen>
  );
}

const History16_4States = () => (
  <States>
    <Shot tone="info" title="Нарушений нет ✳" text="Так и написано, а не пустая лента.">
      <Empty title="Нарушений нет" text="Карточки и снятия появляются здесь сами, когда судья выносит их на столе." />
    </Shot>

    <Shot
      tone="danger"
      title="Влияют ли карточки на допуск и на рейтинг ⚠"
      text="Вопрос 15.4: до ответа система только фиксирует и ничего не пересчитывает."
    >
      <Rows>
        <Row nm="Допуск к следующим стартам" sub="закрывает ли красная карточка следующий турнир" pill={{ t: 'ВОПРОС 15.4', cls: 'bad' }} />
        <Row nm="Рейтинг судьи" sub="влияет ли решение комитета на баллы (TZ §7.2)" pill={{ t: 'ВОПРОС 15.4', cls: 'bad' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── борд ───────────────────────────────────────────────────────── */

export const SCREENS: ScreenMap = {
  'Э16.1': {
    cap: 'Протест спортсмена',
    view: () => (<><Protest16_1 /><Protest16_1States /></>),
    next: 'дело уходит в комитет',
  },
  'Э16.2': {
    cap: 'Протесты',
    view: () => (<><Cases16_2 /><Cases16_2States /></>),
    next: 'взять в работу',
  },
  'Э16.3': {
    cap: 'Дело',
    view: () => (<><Case16_3 /><Case16_3States /></>),
    next: 'история участника',
  },
  'Э16.4': {
    cap: 'Дисциплинарная история',
    view: () => (<><History16_4 /><History16_4States /></>),
  },
};

export function Role16Board() {
  return <Board role={RDISC} screens={SCREENS} />;
}
