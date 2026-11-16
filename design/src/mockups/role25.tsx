/* Роль 25 · Юрист — макеты по флоу. Источник — `flows/25-yurist.md`.

   Роль заведена решением владельца продукта 16.11.2026: документы людей
   системы — проверка, сроки действия, шаблоны.

   Что макеты обязаны передать:
   1. очередь идёт по сроку ожидания, и видно, откуда документ пришёл (запрос
      роли, регистрация судьи, врача, организации);
   2. «Документ в порядке» не выдаёт роль — запрос уходит администратору
      Федерации; «Вернуть» — только с причиной;
   3. у договоров и приказов есть срок, и истёкший виден раньше, чем о нём
      спросят. */

import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, FileText, Upload, X } from 'lucide-react';
import { Button } from '@heroui/react';
import {
  ActionBar,
  DataTable,
  KV,
  Panel,
  Pill,
  Row,
  Rows,
  SearchInput,
  Segmented,
  StatTiles,
  WebApp,
} from '@/shared/kit/app';
import { R25 } from './roles';
import { Board, States, Shot, type ScreenMap } from './shell';
import { Login0_1, LoginPhone0_1 } from './role00';

/* ── Э25.1 · Документы на проверке ───────────────────────────────── */

type Kind = 'Судьи' | 'Тренеры' | 'Врачи' | 'Организации';
type Doc = { who: string; role: string; doc: string; from: string; kind: Kind; at: string; wait: string; hot?: boolean };

const DOCS: Doc[] = [
  { who: 'Жаксылыкова Г.', role: 'Врач соревнований', doc: 'Договор № 41', from: 'регистрация врача', kind: 'Врачи', at: '11.11', wait: '5 дн.', hot: true },
  { who: 'Ким В.', role: 'Тренер', doc: 'Документ тренера', from: 'запрос роли', kind: 'Тренеры', at: '12.11', wait: '4 дн.', hot: true },
  { who: 'Нурланов Б.', role: 'Спортивный судья', doc: 'Удостоверение судьи', from: 'регистрация судьи', kind: 'Судьи', at: '14.11', wait: '2 дн.' },
  { who: 'Клуб «Алатау»', role: 'Организация', doc: 'Регистрационные документы', from: 'регистрация организации', kind: 'Организации', at: '15.11', wait: '1 дн.' },
  { who: 'Омаров К.', role: 'Член ГСК', doc: 'Договор № 17', from: 'запрос роли', kind: 'Судьи', at: '16.11', wait: 'сегодня' },
];

const TABS = ['Ждут', 'Судьи', 'Тренеры', 'Врачи', 'Организации', 'Все'];

function Queue25_1Body() {
  const [tab, setTab] = useState('Ждут');
  const [q, setQ] = useState('');
  const rows = DOCS.filter((d) => tab === 'Ждут' || tab === 'Все' || d.kind === tab).filter((d) =>
    d.who.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <Segmented items={TABS} value={tab} onPick={setTab} ariaLabel="Вид документов" />
        <SearchInput value={q} onChange={setQ} placeholder="ФИО или номер" />
      </div>
      <Panel flush>
        <DataTable
          cols={['Чей', 'Документ', 'Откуда', 'Подан', 'Ждёт']}
          grid="1.6fr 1.5fr 1.5fr 0.7fr 0.8fr"
          rows={rows.map((d) => ({
            key: d.who,
            to: 'Э25.2',
            cells: [
              `${d.who} · ${d.role}`,
              d.doc,
              d.from,
              d.at,
              <Pill key="w" t={d.wait} color={d.hot ? 'warning' : 'default'} />,
            ],
          }))}
        />
      </Panel>
    </>
  );
}

export const Queue25_1 = () => (
  <WebApp role={R25} nav="Документы" title="Документы на проверке">
    <Queue25_1Body />
  </WebApp>
);

const Queue25_1States = () => (
  <States>
    <Shot tone="success" title="Очередь пуста">
      <Panel>
        <div className="text-sm text-neutral-500">Документов на проверке нет</div>
      </Panel>
    </Shot>
  </States>
);

/* ── Э25.2 · Карточка документа ──────────────────────────────────── */

const REASONS = ['Нечитаемо', 'Не тот документ', 'Истёк срок', 'Нет подписи', 'Другое'];

function DocCardBody() {
  const [why, setWhy] = useState('');
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Договор № 41">
          <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-neutral-400">
            <FileText size={40} />
          </div>
        </Panel>
        <div className="flex flex-col gap-4">
          <Panel title="Документ">
            <KV
              items={[
                ['Вид', 'Договор врача соревнований'],
                ['Номер, дата', '№ 41 от 10.11.2026'],
                ['С кем', 'ФНТ РК'],
                ['Срок действия', 'до 31.12.2027'],
              ]}
            />
          </Panel>
          <Panel title="Чей">
            <KV items={[['ФИО', 'Жаксылыкова Г. Т.'], ['ИИН', '880412******'], ['Роль', 'Врач соревнований']]} />
          </Panel>
          <Panel title="История" flush>
            <Rows>
              <Row nm="Возвращён · нет подписи" sub="Касымова Л. · 08.11" />
            </Rows>
          </Panel>
        </div>
      </div>
      <Panel title="Вернуть на доработку">
        <Segmented items={REASONS} value={why} onPick={setWhy} ariaLabel="Причина" />
      </Panel>
      <ActionBar>
        <Button variant="outline" isIconOnly aria-label="Предыдущий">
          <ChevronLeft size={16} />
        </Button>
        <Button variant="outline" isIconOnly aria-label="Следующий">
          <ChevronRight size={16} />
        </Button>
        <Button variant="danger-soft" isDisabled={!why}>
          <X size={14} /> Вернуть
        </Button>
        <Button variant="primary">
          <Check size={14} /> Документ в порядке
        </Button>
      </ActionBar>
    </>
  );
}

export const Doc25_2 = () => (
  <WebApp role={R25} nav="Документы" title="Карточка документа" back={{ label: 'Документы', to: 'Э25.1' }}>
    <DocCardBody />
  </WebApp>
);

const Doc25_2States = () => (
  <States>
    <Shot tone="success" title="В порядке" text="Кто и когда.">
      <Rows>
        <Row nm="Договор № 41" sub="Касымова Л. · 16.11, 11:42 · запрос роли у администратора" pill={{ t: 'В ПОРЯДКЕ', cls: 'done' }} />
      </Rows>
    </Shot>
    <Shot tone="danger" title="Возвращён" text="Причина; ждёт новую версию.">
      <Rows>
        <Row nm="Документ тренера" sub="нечитаемо · 16.11" pill={{ t: 'ВОЗВРАЩЁН', cls: 'bad' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э25.3 · Сроки документов ────────────────────────────────────── */

const TERMS = [
  { who: 'Сагинтаев М.', doc: 'Приказ · старший тренер Карагандинской обл.', till: '30.11.2026', st: 'через 14 дн.', cls: 'wait' as const },
  { who: 'Омарова Ж.', doc: 'Договор члена ГСК № 9', till: '01.12.2026', st: 'через 15 дн.', cls: 'wait' as const },
  { who: 'Бекова А.', doc: 'Договор врача № 22', till: '01.11.2026', st: 'истёк', cls: 'bad' as const },
];

export const Terms25_3 = () => (
  <WebApp role={R25} nav="Сроки" title="Сроки документов">
    <StatTiles
      items={[
        { v: '2', k: 'Истекают в 30 дней', tone: 'a' },
        { v: '1', k: 'Истекли', tone: 'b' },
        { v: '64', k: 'Действующих со сроком' },
      ]}
    />
    <Panel flush>
      <DataTable
        cols={['Чей', 'Документ', 'Действует до', 'Срок']}
        grid="1.3fr 2.4fr 1fr 1fr"
        rows={TERMS.map((t) => ({
          key: t.who,
          to: 'Э25.2',
          cells: [
            t.who,
            t.doc,
            t.till,
            <Pill key="s" t={t.st} color={t.cls === 'bad' ? 'danger' : 'warning'} />,
          ],
        }))}
      />
    </Panel>
    <ActionBar>
      <Button variant="primary">Напомнить</Button>
    </ActionBar>
  </WebApp>
);

const Terms25_3States = () => (
  <States>
    <Shot tone="success" title="Ничего не истекает">
      <Panel>
        <div className="text-sm text-neutral-500">Истекающих документов нет</div>
      </Panel>
    </Shot>
  </States>
);

/* ── Э25.4 · Шаблоны документов ──────────────────────────────────── */

const TEMPLATES = [
  { nm: 'Договор врача соревнований', v: 'версия 2 · 10.11.2026' },
  { nm: 'Договор члена ГСК', v: 'версия 1 · 04.11.2026' },
  { nm: 'Согласие на обработку персональных данных', v: 'версия 1 · 04.11.2026' },
  { nm: 'Согласие родителя за несовершеннолетнего', v: 'версия 1 · 04.11.2026' },
];

export const Templates25_4 = () => (
  <WebApp role={R25} nav="Шаблоны" title="Шаблоны документов">
    <Panel flush>
      <Rows>
        {TEMPLATES.map((t) => (
          <Row key={t.nm} nm={t.nm} sub={`${t.v} · Касымова Л.`} />
        ))}
      </Rows>
    </Panel>
    <ActionBar>
      <Button variant="primary">
        <Upload size={14} /> Загрузить новую версию
      </Button>
    </ActionBar>
  </WebApp>
);

const Templates25_4States = () => (
  <States>
    <Shot tone="info" title="Версий несколько" text="Прежние на чтение.">
      <Rows>
        <Row nm="Договор врача соревнований · версия 1" sub="04.11.2026 · по ней подписано 6 договоров" pill={{ t: 'ПРЕЖНЯЯ', cls: 'done' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Карта экранов ───────────────────────────────────────────────── */

export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход',
    view: () => <Login0_1 />,
    alt: () => <LoginPhone0_1 />,
    next: 'первый экран роли',
  },
  'Э25.1': {
    cap: 'Документы на проверке',
    view: () => (
      <>
        <Queue25_1 />
        <Queue25_1States />
      </>
    ),
    next: 'строка документа',
  },
  'Э25.2': {
    cap: 'Карточка документа',
    view: () => (
      <>
        <Doc25_2 />
        <Doc25_2States />
      </>
    ),
    next: 'пункт меню «Сроки»',
  },
  'Э25.3': {
    cap: 'Сроки документов',
    view: () => (
      <>
        <Terms25_3 />
        <Terms25_3States />
      </>
    ),
    next: 'пункт меню «Шаблоны»',
  },
  'Э25.4': {
    cap: 'Шаблоны документов',
    view: () => (
      <>
        <Templates25_4 />
        <Templates25_4States />
      </>
    ),
  },
};

export function Role25Board() {
  return <Board role={R25} screens={SCREENS} />;
}
