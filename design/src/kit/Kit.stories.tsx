/* UI-кит присланного спортивного приложения ✳ (30.08.2026).

   Отдельный раздел, а не подраздел «Дизайн-системы»: кит собирается с нуля и
   со старой библиотекой ФНТ не смешивается. У него своё поле, свои скругления
   и своя палитра (`--k-*`).

   Переключатель темы к киту отношения не имеет: его цвета не семантические
   `--c-*`, а свои `--k-*`. Кит светлый — референс тёмный, но продукт
   светлый. */

import { Button, GroupMatch, GroupTable, IconButton, KitCanvas, LiveHeader, MatchCard, Tabs } from './Kit';
import { Search } from 'lucide-react';
import { A, AW } from '../fedCommon';

export default {
  title: 'UI-кит/Компоненты',
  parameters: { layout: 'fullscreen' },
};

/* ── Значок идущего матча ────────────────────────────────────────
   Две формы из референса: заголовок раздела со счётчиком и язычок на верхней
   грани карточки. Показаны вместе, потому что в референсе они и работают
   вместе: строка «идут матчи» над списком, язычок — на каждом идущем. */
export const Live = {
  name: 'Идущий матч · значок',
  render: () => (
    <KitCanvas>
      <p className="k-note">
        Значок эфира в двух формах. <b>Заголовок</b> со счётчиком стоит над списком,{' '}
        <b>язычок</b> — трапецией в верху идущей карточки; у неидущей в том же
        месте стоит <b>дата</b>. Точка пульсирует: на
        статичной картинке «идёт сейчас» иначе не отличить от «шёл вчера». При
        включённом «уменьшить движение» кольцо замирает.
      </p>

      <LiveHeader count={14} />

      <div style={{ display: 'grid', gap: 22 }}>
        <MatchCard
          live
          tour="Кубок Алматы 2026 · 1/8 финала"
          home={{ nm: 'Ким Г.', av: A(44) }}
          away={{ nm: 'Оспанов Р.', av: A(12) }}
          score="1 : 2"
          note="3-я партия · стол 5"
        />
        <MatchCard
          live
          tour="Чемпионат Республики · 1/4 финала"
          home={{ nm: 'Ли С.', av: A(23) }}
          away={{ nm: 'Ахметов Д.', av: A(31) }}
          score="2 : 2"
          note="5-я партия · стол 1"
        />
        {/* Не идёт — язычка нет, а в верхнем слоте дата: у сыгранного матча
            вопрос первый «когда», и снизу её приходилось искать. */}
        <MatchCard
          tour="Кубок Астаны 2026 · группа B"
          home={{ nm: 'Тлеу А.', av: A(52) }}
          away={{ nm: 'Ким А.', av: A(64) }}
          score="3 : 0"
          when="26 марта · завершён"
        />
        {/* Предстоящий — та же карточка: дата сверху, счёта ещё нет. */}
        <MatchCard
          tour="Первенство РК · 1/16 финала"
          home={{ nm: 'Ким Г.', av: A(44) }}
          away={{ nm: 'Тлеу А.', av: A(52) }}
          score="—"
          when="Завтра, 17:00"
        />
      </div>
    </KitCanvas>
  ),
};

/* ── Кнопки ──────────────────────────────────────────────────────
   Четыре вида из присланного кита. Различает их только заливка: ни теней, ни
   градиентов, ни разрядки в подписи. */
export const Buttons = {
  name: 'Кнопки',
  render: () => (
    <KitCanvas>
      <p className="k-note">
        Четыре вида: <b>синяя</b> — главное действие, одно на экран;{' '}
        <b>серая</b> — равноправное рядом с ним; <b>контурная</b> — то, от чего можно
        отказаться; <b>текстовая</b> — третьестепенное. Ниже — компактный размер и
        недоступное состояние.
      </p>

      <div style={{ display: 'grid', gap: 10 }}>
        <Button variant="grey" block>Кнопка</Button>
        <Button variant="primary" block>Кнопка</Button>
        <Button variant="ghost" block>Кнопка</Button>
        <Button variant="outline" block>Кнопка</Button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
        <Button size="sm">Текст</Button>
        <Button size="sm" variant="outline">Текст</Button>
        <IconButton label="Поиск">
          <Search size={18} />
        </IconButton>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <Button disabled>Недоступна</Button>
        <Button variant="outline" disabled>Недоступна</Button>
      </div>

      {/* Пара «главное + отказ» — как «Deposit / Withdraw» в ките. */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
        <Button variant="primary">Оплатить</Button>
        <Button variant="outline">Отмена</Button>
      </div>
    </KitCanvas>
  ),
};

/* ── Вкладки и группа ────────────────────────────────────────────
   Из второго присланного референса («Match Info»): вкладки с подчёркиванием,
   таблица группы и матчи группы карточками. */
const GROUP = [
  { nm: 'Ким Георгий', av: A(44), p: 3, w: 3, l: 0, sets: [9, 2] as [number, number], pts: 6 },
  { nm: 'Оспанов Р.', av: A(12), p: 3, w: 2, l: 1, sets: [7, 5] as [number, number], pts: 5 },
  { nm: 'Ли Сергей', av: A(23), p: 3, w: 1, l: 2, sets: [4, 7] as [number, number], pts: 4 },
  { nm: 'Ким Асель', av: AW(28), p: 3, w: 0, l: 3, sets: [1, 9] as [number, number], pts: 3 },
];

export const GroupsAndTabs = {
  name: 'Вкладки и группа',
  render: () => (
    <KitCanvas>
      <p className="k-note">
        <b>Вкладки</b> различает только подчёркивание — ни заливки, ни рамки. На
        цветной шапке оно жёлтое: синее на синем не видно. <b>Таблица группы</b> —
        подпись плашкой, шапка колонок, строки с фото; ничьих в настольном теннисе
        нет, поэтому вместо них партии. <b>Матчи группы</b> — карточки со счётом
        плашкой посередине.
      </p>

      <Tabs items={['Матч', 'Составы', 'Группа', 'Статистика']} active="Группа" variant="header" />
      <div style={{ height: 14 }} />
      <Tabs items={['Матч', 'Составы', 'Группа', 'Статистика']} active="Группа" />

      <div style={{ marginTop: 18 }}>
        <GroupTable title="Группа B" rows={GROUP} />
      </div>

      <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
        <GroupMatch
          group="Группа B"
          home={{ nm: 'Ким Г.', av: A(44) }}
          away={{ nm: 'Ким А.', av: AW(28) }}
          score="3 : 0"
        />
        <GroupMatch
          group="Группа B"
          home={{ nm: 'Оспанов Р.', av: A(12) }}
          away={{ nm: 'Ли С.', av: A(23) }}
          score="3 : 1"
        />
      </div>
    </KitCanvas>
  ),
};
