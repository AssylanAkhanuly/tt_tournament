/* Справочник HeroUI 3 · группа «Данные и навигация».

   Здесь всё, что показывает и структурирует данные: таблица, вкладки,
   раскрывашки, пагинация, крошки, прокрутка с тенями, пустое состояние
   и типографика. Структура частей — строго по типам пакета 3.2.4. */

import {
  Accordion,
  Avatar,
  Breadcrumbs,
  Disclosure,
  DisclosureGroup,
  EmptyState,
  Header,
  Pagination,
  ScrollShadow,
  Table,
  Tabs,
  Typography,
  accordionVariants,
  paginationVariants,
  scrollShadowVariants,
  tableVariants,
  tabsVariants,
  typographyVariants,
} from '@heroui/react';
import { BarChart3, CalendarX, Slash, Swords, Table2, Users } from 'lucide-react';
import { PLAYERS, TOURNAMENTS, Row, Section, Shell, values } from './HeroKit';

export default {
  title: 'UI-кит/HeroUI/06 · Данные и навигация',
  parameters: { layout: 'fullscreen' },
};

/* ── Доменные заготовки ─────────────────────────────────────────────
   Группа B — четверо из общего словаря игроков; очки по правилам
   настольного тенниса: победа 2, поражение 1. */
const GROUP_B = [
  { p: PLAYERS[0], games: 3, wins: 3, losses: 0, sets: '9:2', pts: 6 },
  { p: PLAYERS[1], games: 3, wins: 2, losses: 1, sets: '7:4', pts: 5 },
  { p: PLAYERS[2], games: 3, wins: 1, losses: 2, sets: '5:7', pts: 4 },
  { p: PLAYERS[3], games: 3, wins: 0, losses: 3, sets: '1:9', pts: 3 },
];
const S = PLAYERS.map((p) => p.short);
const MATCHES = [
  `Тур 1 · ${S[0]} — ${S[1]}`,
  `Тур 1 · ${S[2]} — ${S[3]}`,
  `Тур 1 · ${S[4]} — ${S[5]}`,
  `Тур 2 · ${S[0]} — ${S[2]}`,
  `Тур 2 · ${S[1]} — ${S[4]}`,
  `Тур 2 · ${S[3]} — ${S[5]}`,
  `Тур 3 · ${S[0]} — ${S[3]}`,
  `Тур 3 · ${S[1]} — ${S[5]}`,
  `Тур 3 · ${S[2]} — ${S[4]}`,
];

/* Таблица группы B: повторяется в двух вариантах оформления, поэтому
   вынесена в компонент. aria-label обязан стоять на Content — это он
   настоящая таблица React Aria, корень лишь div-обёртка. Ширина w-md
   (28rem): шесть колонок в w-96 не помещались — «Очки» уезжали под скролл. */
const GroupTable = ({ variant }: { variant?: 'primary' | 'secondary' }) => (
  <Table variant={variant} className="w-md">
    <Table.ScrollContainer>
      <Table.Content aria-label={`Группа B, вариант ${variant ?? 'primary'}`}>
        <Table.Header>
          <Table.Column isRowHeader>Игрок</Table.Column>
          <Table.Column>И</Table.Column>
          <Table.Column>В</Table.Column>
          <Table.Column>П</Table.Column>
          <Table.Column>Партии</Table.Column>
          <Table.Column>Очки</Table.Column>
        </Table.Header>
        <Table.Body>
          {GROUP_B.map((r) => (
            <Table.Row id={r.p.nm} key={r.p.nm}>
              <Table.Cell>
                <span className="flex items-center gap-2">
                  <Avatar size="sm">
                    <Avatar.Image src={r.p.av} alt="" />
                  </Avatar>
                  {r.p.short}
                </span>
              </Table.Cell>
              <Table.Cell>{r.games}</Table.Cell>
              <Table.Cell>{r.wins}</Table.Cell>
              <Table.Cell>{r.losses}</Table.Cell>
              <Table.Cell>{r.sets}</Table.Cell>
              <Table.Cell>{r.pts}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Content>
    </Table.ScrollContainer>
  </Table>
);

/* ── Таблица ────────────────────────────────────────────────────── */
export const Tables = {
  name: 'Таблица',
  render: () => (
    <Shell>
      <Section
        name="Table"
        note="Два варианта оформления. Content — настоящая таблица React Aria, Header и Body обязательны; ScrollContainer спасает широкие таблицы."
      >
        <Row
          prop="variant"
          vals={values(tableVariants, 'variant')}
          render={(v) => <GroupTable variant={v as never} />}
        />
        {/* Сортировка контролируемая: сама библиотека ничего не сортирует —
            SortableColumnHeader лишь рисует стрелку по sortDirection из
            render-prop колонки. Данные сортируем на своей стороне. */}
        <Row
          prop="сортировка"
          vals={['по рейтингу, по убыванию']}
          render={() => (
            <Table className="w-96">
              <Table.ScrollContainer>
                <Table.Content
                  aria-label="Участники по рейтингу"
                  sortDescriptor={{ column: 'rating', direction: 'descending' }}
                  onSortChange={() => {}}
                >
                  <Table.Header>
                    <Table.Column id="nm" isRowHeader>
                      Игрок
                    </Table.Column>
                    <Table.Column id="rank">Разряд</Table.Column>
                    <Table.Column id="rating" allowsSorting>
                      {({ sortDirection }) => (
                        <Table.SortableColumnHeader sortDirection={sortDirection}>
                          Рейтинг
                        </Table.SortableColumnHeader>
                      )}
                    </Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {[...PLAYERS]
                      .sort((a, b) => b.rating - a.rating)
                      .map((p) => (
                        <Table.Row id={p.nm} key={p.nm}>
                          <Table.Cell>{p.nm}</Table.Cell>
                          <Table.Cell>{p.rank}</Table.Cell>
                          <Table.Cell>{p.rating}</Table.Cell>
                        </Table.Row>
                      ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
              <Table.Footer>Рейтинг на 30.08.2026</Table.Footer>
            </Table>
          )}
        />
        {/* renderEmptyState — штатное место для EmptyState в коллекциях. */}
        <Row
          prop="пустое тело"
          vals={['renderEmptyState']}
          render={() => (
            <Table className="w-96">
              <Table.ScrollContainer>
                <Table.Content aria-label="Матчи стола 3">
                  <Table.Header>
                    <Table.Column isRowHeader>Время</Table.Column>
                    <Table.Column>Стол</Table.Column>
                    <Table.Column>Пара</Table.Column>
                  </Table.Header>
                  <Table.Body renderEmptyState={() => <EmptyState>Матчей пока нет.</EmptyState>}>
                    {[]}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* Полный блок вкладок: Indicator кладётся внутрь КАЖДОГО таба — это он
   подсвечивает выбранный и перелетает при переключении. Ширина w-lg
   (32rem): в w-96 четыре таба не влезали — «Статистика» пряталась под
   стрелку прокрутки. Таб — flex-контейнер, пробел между иконкой и
   текстом схлопывается, поэтому отступ задаёт gap-1.5. */
const MatchTabs = ({
  variant,
  orientation,
}: {
  variant?: 'primary' | 'secondary';
  orientation?: 'horizontal' | 'vertical';
}) => (
  <Tabs variant={variant} orientation={orientation} defaultSelectedKey="match" className="w-lg">
    <Tabs.ListContainer>
      <Tabs.List aria-label="Разделы матча">
        <Tabs.Tab id="match" className="gap-1.5">
          <Swords size={16} /> Матч
          <Tabs.Indicator />
        </Tabs.Tab>
        <Tabs.Tab id="lineups" className="gap-1.5">
          <Users size={16} /> Составы
          <Tabs.Indicator />
        </Tabs.Tab>
        <Tabs.Tab id="group" className="gap-1.5">
          <Table2 size={16} /> Группа
          <Tabs.Indicator />
        </Tabs.Tab>
        <Tabs.Tab id="stats" className="gap-1.5">
          <BarChart3 size={16} /> Статистика
          <Tabs.Indicator />
        </Tabs.Tab>
      </Tabs.List>
    </Tabs.ListContainer>
    <Tabs.Panel id="match">
      {S[0]} — {S[1]} · 3:1 (11:8, 9:11, 11:6, 11:4)
    </Tabs.Panel>
    <Tabs.Panel id="lineups">Одиночный разряд, группа B, стол 3.</Tabs.Panel>
    <Tabs.Panel id="group">Группа B: четыре игрока, круговая система.</Tabs.Panel>
    <Tabs.Panel id="stats">Выигранных партий — 9, подряд — 3.</Tabs.Panel>
  </Tabs>
);

/* ── Вкладки ────────────────────────────────────────────────────── */
export const TabsNav = {
  name: 'Вкладки',
  render: () => (
    <Shell>
      <Section
        name="Tabs"
        note="Два варианта: primary — сегмент-пилюля, secondary — подчёркивание. Ориентация — свойство корня из React Aria."
      >
        <Row
          prop="variant"
          vals={values(tabsVariants, 'variant')}
          render={(v) => <MatchTabs variant={v as never} />}
        />
        <Row
          prop="orientation"
          vals={['horizontal', 'vertical']}
          render={(v) => <MatchTabs orientation={v as never} />}
        />
      </Section>
    </Shell>
  ),
};

/* Пункт регламента: полная анатомия — Heading → Trigger (+Indicator),
   Panel → Body. Без Panel контент не появится, без Trigger нечем открыть. */
const RuleItem = ({ id, title, body }: { id: string; title: string; body: string }) => (
  <Accordion.Item id={id}>
    <Accordion.Heading>
      <Accordion.Trigger>
        {title}
        <Accordion.Indicator />
      </Accordion.Trigger>
    </Accordion.Heading>
    <Accordion.Panel>
      <Accordion.Body>{body}</Accordion.Body>
    </Accordion.Panel>
  </Accordion.Item>
);

/* У Disclosure (в отличие от Accordion) триггер в CSS пакета — лишь
   inline-block: правило flex там написано для класса .accordion__heading,
   а слот заголовка называется disclosure__heading, и оно не срабатывает.
   Без flex-контекста ms-auto индикатора не работает — шеврон падал под
   текст. Рядную раскладку задаём классом на Trigger. */
const TRIGGER_ROW = 'flex w-full items-center justify-between gap-2';

const RULES = [
  { id: 'fee', title: 'Взносы', body: 'Стартовый взнос оплачивается до жеребьёвки; при снятии с турнира взнос не возвращается.' },
  { id: 'entry', title: 'Допуск', body: 'Допускаются спортсмены с действующей лицензией ФНТ РК и медицинским допуском.' },
  { id: 'dress', title: 'Форма одежды', body: 'Игровая форма не белого цвета (мяч белый); на форме — фамилия и регион.' },
];

/* ── Аккордеон и раскрывашки ────────────────────────────────────── */
export const Accordions = {
  name: 'Аккордеон и раскрывашки',
  render: () => (
    <Shell>
      <Section
        name="Accordion"
        note="Группа раскрывашек с разделителями. Вариант surface — собственная подложка bg-surface: в светлой теме она белая и на белой странице сливается с фоном, поэтому оба варианта стоят на серой подложке. Первый пункт открыт через defaultExpandedKeys — скриншоту не нужен клик."
      >
        <Row
          prop="variant"
          vals={values(accordionVariants, 'variant')}
          render={(v) => (
            <div className="bg-neutral-100 p-4">
              <Accordion variant={v as never} defaultExpandedKeys={['fee']} className="w-80">
                {RULES.map((r) => (
                  <RuleItem key={r.id} {...r} />
                ))}
              </Accordion>
            </div>
          )}
        />
        {/* hideSeparator живёт на корне, но срабатывает через
            data-hide-separator на каждом item (так устроен accordion.css
            пакета). Разница — тонкие линии в 1px между пунктами: слева
            они есть, справа нет; на уменьшенном скриншоте легко пропасть. */}
        <Row
          prop="hideSeparator"
          vals={['false', 'true']}
          render={(v) => (
            <Accordion hideSeparator={v === 'true'} defaultExpandedKeys={['entry']} className="w-80">
              {RULES.map((r) => (
                <RuleItem key={r.id} {...r} />
              ))}
            </Accordion>
          )}
        />
      </Section>

      <Section
        name="Disclosure"
        note="Одиночная раскрывашка без группы и разделителей; вариантов оформления нет. Рядную раскладку триггера задаём классом: пакетный CSS даёт ему лишь inline-block."
      >
        <Row
          prop="состояния"
          vals={['закрыта', 'открыта (defaultExpanded)']}
          render={(v) => (
            <Disclosure defaultExpanded={v !== 'закрыта'} className="w-80">
              <Disclosure.Heading>
                <Disclosure.Trigger className={TRIGGER_ROW}>
                  Подробнее о взносе
                  <Disclosure.Indicator />
                </Disclosure.Trigger>
              </Disclosure.Heading>
              <Disclosure.Content>
                <Disclosure.Body>Взнос оплачивается до жеребьёвки в кассе федерации.</Disclosure.Body>
              </Disclosure.Content>
            </Disclosure>
          )}
        />
      </Section>

      <Section
        name="DisclosureGroup"
        note="Координатор нескольких Disclosure: без allowsMultipleExpanded ведёт себя как аккордеон. Здесь открыты обе — это и отличает его."
      >
        <Row
          prop="allowsMultipleExpanded"
          vals={['две открыты сразу']}
          render={() => (
            <DisclosureGroup allowsMultipleExpanded defaultExpandedKeys={['fee', 'draw']} className="w-80">
              <Disclosure id="fee">
                <Disclosure.Heading>
                  <Disclosure.Trigger className={TRIGGER_ROW}>
                    Взнос
                    <Disclosure.Indicator />
                  </Disclosure.Trigger>
                </Disclosure.Heading>
                <Disclosure.Content>
                  <Disclosure.Body>Оплата до жеребьёвки.</Disclosure.Body>
                </Disclosure.Content>
              </Disclosure>
              <Disclosure id="draw">
                <Disclosure.Heading>
                  <Disclosure.Trigger className={TRIGGER_ROW}>
                    Жеребьёвка
                    <Disclosure.Indicator />
                  </Disclosure.Trigger>
                </Disclosure.Heading>
                <Disclosure.Content>
                  <Disclosure.Body>Проводится за день до старта, публично.</Disclosure.Body>
                </Disclosure.Content>
              </Disclosure>
            </DisclosureGroup>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* Пагинация в тройке — чистая разметка: номера страниц и обработчики
   пишутся самостоятельно, единственный state-проп — isActive. */
const Pager = ({ size }: { size?: 'sm' | 'md' | 'lg' }) => (
  <Pagination size={size} aria-label="Страницы списка турниров">
    <Pagination.Content>
      <Pagination.Item>
        <Pagination.Previous aria-label="Предыдущая страница">
          <Pagination.PreviousIcon />
        </Pagination.Previous>
      </Pagination.Item>
      <Pagination.Item>
        <Pagination.Link isActive>1</Pagination.Link>
      </Pagination.Item>
      <Pagination.Item>
        <Pagination.Link>2</Pagination.Link>
      </Pagination.Item>
      <Pagination.Item>
        <Pagination.Link>3</Pagination.Link>
      </Pagination.Item>
      <Pagination.Item>
        <Pagination.Ellipsis />
      </Pagination.Item>
      <Pagination.Item>
        <Pagination.Link>12</Pagination.Link>
      </Pagination.Item>
      <Pagination.Item>
        <Pagination.Next aria-label="Следующая страница">
          <Pagination.NextIcon />
        </Pagination.Next>
      </Pagination.Item>
    </Pagination.Content>
  </Pagination>
);

/* ── Пагинация и крошки ─────────────────────────────────────────── */
export const PagesNav = {
  name: 'Пагинация и крошки',
  render: () => (
    <Shell>
      <Section
        name="Pagination"
        note="Три размера. В отличие от версии 2 нет total/page/onChange: это композиция, состояние страниц ведёт вызывающий код."
      >
        <Row
          prop="size"
          vals={values(paginationVariants, 'size')}
          render={(v) => <Pager size={v as never} />}
        />
        <Row
          prop="со сводкой"
          vals={['Summary']}
          render={() => (
            <Pagination aria-label="Страницы списка турниров со сводкой">
              <Pagination.Summary>1–10 из 34 турниров</Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Link isActive>1</Pagination.Link>
                </Pagination.Item>
                <Pagination.Item>
                  <Pagination.Link>2</Pagination.Link>
                </Pagination.Item>
                <Pagination.Item>
                  <Pagination.Link>3</Pagination.Link>
                </Pagination.Item>
                <Pagination.Item>
                  <Pagination.Link>4</Pagination.Link>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          )}
        />
      </Section>

      <Section
        name="Breadcrumbs"
        note="Item сам рендерит ссылку — href идёт прямо на него; последний без href считается текущей страницей, разделитель после него не ставится."
      >
        <Row
          prop="separator"
          vals={['шеврон (по умолчанию)', 'свой разделитель']}
          render={(v) => (
            <Breadcrumbs separator={v === 'свой разделитель' ? <Slash size={16} /> : undefined}>
              <Breadcrumbs.Item href="#">Турниры</Breadcrumbs.Item>
              <Breadcrumbs.Item href="#">{TOURNAMENTS[0]}</Breadcrumbs.Item>
              <Breadcrumbs.Item>Группа B</Breadcrumbs.Item>
            </Breadcrumbs>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Прокрутка и пустое состояние ───────────────────────────────── */
export const Scrolling = {
  name: 'Прокрутка и пустое состояние',
  render: () => (
    <Shell>
      <Section
        name="ScrollShadow"
        note="Скролл-контейнер с градиентными тенями у непрокрученных краёв; контейнеру нужен ограниченный размер, иначе скроллить нечего."
      >
        <Row
          prop="orientation"
          vals={values(scrollShadowVariants, 'orientation')}
          render={(v) =>
            v === 'horizontal' ? (
              <ScrollShadow orientation="horizontal" className="w-72">
                <div className="flex w-max gap-2">
                  {PLAYERS.map((p) => (
                    <span
                      key={p.nm}
                      className="whitespace-nowrap border border-neutral-200 px-3 py-2 text-sm"
                    >
                      {p.short} · {p.rating}
                    </span>
                  ))}
                </div>
              </ScrollShadow>
            ) : (
              <ScrollShadow className="h-40 w-72">
                <ul className="flex flex-col gap-2 text-sm">
                  {MATCHES.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </ScrollShadow>
            )
          }
        />
      </Section>

      <Section
        name="EmptyState"
        note="Презентационный контейнер без вариантов; штатное место — renderEmptyState коллекций (показан в истории «Таблица»)."
      >
        <Row
          prop="сам по себе"
          vals={['по умолчанию']}
          render={() => (
            <EmptyState>
              <span className="flex items-center gap-2">
                <CalendarX size={16} /> Матчей пока нет.
              </span>
            </EmptyState>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Типографика ────────────────────────────────────────────────── */
export const Text = {
  name: 'Типографика',
  render: () => (
    <Shell>
      <Section
        name="Typography"
        note="Десять типов текста плюс насыщенность, цвет и выравнивание — всё из typographyVariants пакета."
      >
        <Row
          prop="type"
          vals={values(typographyVariants, 'type')}
          render={(v) => <Typography type={v as never}>{TOURNAMENTS[0]}</Typography>}
        />
        <Row
          prop="weight"
          vals={values(typographyVariants, 'weight')}
          render={(v) => (
            <Typography weight={v as never}>
              {PLAYERS[1].nm} — {PLAYERS[1].rating}
            </Typography>
          )}
        />
        <Row
          prop="color"
          vals={values(typographyVariants, 'color')}
          render={(v) => <Typography color={v as never}>Регистрация до 5 сентября</Typography>}
        />
        {/* Text из React Aria — строчный элемент: без block выравнивание не видно. */}
        <Row
          prop="align"
          vals={values(typographyVariants, 'align')}
          render={(v) => (
            <Typography align={v as never} className="block w-40 border border-neutral-200 px-1">
              {PLAYERS[0].short}
            </Typography>
          )}
        />
        <Row
          prop="truncate"
          vals={['false', 'true']}
          render={(v) => (
            <Typography truncate={v === 'true'} className="block w-40">
              {TOURNAMENTS[1]} среди мужчин и женщин
            </Typography>
          )}
        />
      </Section>

      <Section
        name="Шорткаты"
        note="Heading, Paragraph и Code — те же варианты с зашитым type; страница турнира собирается ими."
      >
        <div className="flex w-96 flex-col gap-2">
          <Typography.Heading level={2}>{TOURNAMENTS[0]}</Typography.Heading>
          <Typography.Paragraph color="muted">
            Отборочный турнир федерации, 64 участника, круговая система в группах.
          </Typography.Paragraph>
          <Typography.Paragraph size="sm">
            Экран заявки в флоу спортсмена — <Typography.Code>Э14.7</Typography.Code>.
          </Typography.Paragraph>
          <Typography type="body-sm" weight="semibold">
            Регистрация до 5 сентября
          </Typography>
        </div>
        <Row
          prop="Heading · level"
          vals={['1', '2', '3', '4', '5', '6']}
          render={(v) => (
            <Typography.Heading level={Number(v) as never}>Ур. {v}</Typography.Heading>
          )}
        />
      </Section>

      <Section
        name="Header"
        note="Не шапка страницы, а заголовок секции списка (Menu, ListBox): мелкий приглушённый подзаголовок группы."
      >
        <div className="flex w-56 flex-col gap-1 border border-neutral-200 p-2">
          <Header>Судейская коллегия</Header>
          <span className="text-sm">Главный судья</span>
          <span className="text-sm">Заместитель главного судьи</span>
          <Header>Секретариат</Header>
          <span className="text-sm">Главный секретарь</span>
        </div>
      </Section>
    </Shell>
  ),
};
