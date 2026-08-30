/* Дизайн-система: основа — HeroUI 3 ✳ (30.08.2026).

   ПОЧЕМУ ТРОЙКА, А НЕ ДВОЙКА. Сначала стояла 2.8: тройка требует React 19, а в
   `design/` был React 18. Обновили React — обошлось двумя ошибками типов (в
   React 19 убран глобальный неймспейс `JSX`), и встала 3.2.4. Дело не в номере
   версии: в двойке нет доброй половины того, что есть в документации — ни
   выбора цвета, ни ComboBox, ни Meter, ни TagGroup, ни Toolbar, ни Typography,
   а половина остального названа иначе (`Textarea` против `TextArea`,
   `Progress` против `ProgressBar`, `Divider` против `Separator`).

   У тройки составные компоненты: `Card.Header`, `Drawer.Trigger`,
   `Tabs.Panel`. Это не косметика — из-за неё витрина двойки не переносится
   правкой имён, её пришлось переписать.

   Набор разложен на два слоя, оба в разделе «UI-кит»:

     Основа     — этот файл: готовое из HeroUI;
     Турнирные  — `Kit.stories.tsx`: то, чего в библиотеках нет и быть не
                  может — значок идущего матча, карточка встречи, таблица
                  группы. Они рисуются нами и садятся на ту же поверхность.

   Локаль `ru-RU` обязательна: по умолчанию берётся локаль браузера, и
   календарь приходит английским с датой в порядке «месяц/день/год». Для
   федерации это прямая ошибка — 06.14 и 14.06 читаются по-разному.

   Preflight Tailwind не подключён (снёс бы вёрстку двухсот файлов, написанных
   до него) — вместо него локальный сброс внутри `.hero-scope`. CSS собирается
   `npm run kit:css`; подробности — в `design/README.md`. */

import type { ReactNode } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  ButtonGroup,
  Calendar,
  Card,
  Checkbox,
  CheckboxGroup,
  Chip,
  CloseButton,
  Code,
  DateField,
  DatePicker,
  Disclosure,
  Drawer,
  EmptyState,
  I18nProvider,
  Input,
  InputOTP,
  Label,
  Kbd,
  Link,
  ListBox,
  Menu,
  Meter,
  Modal,
  NumberField,
  Popover,
  ProgressBar,
  ProgressCircle,
  Radio,
  RadioGroup,
  RangeCalendar,
  ScrollShadow,
  SearchField,
  Separator,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Table,
  Tabs,
  Tag,
  TagGroup,
  TextArea,
  TextField,
  TimeField,
  ToggleButton,
  Tooltip,
} from '@heroui/react';
import { A } from '../fedCommon';
import coverBats from '../assets/news/bats-net.jpg';
import coverBalls from '../assets/news/balls.jpg';
import coverTop from '../assets/news/racquet-top.jpg';
import './tailwind.css'; // собран из tailwind.src.css: npm run kit:css

export default {
  title: 'UI-кит/Основа',
  parameters: { layout: 'fullscreen' },
};

/** Поверхность витрины. `hero-scope` включает локальный сброс браузерных
    стилей: preflight Tailwind выключен глобально, а HeroUI на него
    рассчитывает.

    НЕ экспортируется: Storybook считает историей каждый именованный экспорт
    файла, и служебные обёртки появлялись в дереве пустыми пунктами. */
const Shell = ({ children }: { children: ReactNode }) => (
  <I18nProvider locale="ru-RU">
    {/* `data-theme="light"` обязателен, и причина неочевидная: наш
        переключатель тем ставит `data-theme` на <html> (`applyTheme` в
        themes.ts), а HeroUI 3 использует ровно этот же атрибут для своей
        темы. При теме «Тёмная» библиотека молча уходила в тёмную: карточки
        приезжали тёмными на белой странице, а заголовки на них пропадали.
        Своим атрибутом на обёртке отвязываемся от тулбара — кит светлый. */}
    <div
      data-theme="light"
      className="hero-scope min-h-screen bg-white p-7 text-neutral-900"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-9">{children}</div>
    </div>
  </I18nProvider>
);

const Block = ({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) => (
  <section className="flex flex-col gap-3">
    <div>
      <h3 className="text-base font-semibold">{title}</h3>
      {note && <p className="mt-1 text-sm text-neutral-500">{note}</p>}
    </div>
    <div className="flex flex-wrap items-start gap-3">{children}</div>
  </section>
);

/* ── Действия ───────────────────────────────────────────────────── */
export const Actions = {
  name: 'Действия',
  render: () => (
    <Shell>
      <Block title="Кнопки">
        <Button>Заявиться</Button>
        <Button variant="outline">Отмена</Button>
        <Button variant="ghost">Подробнее</Button>
        <Button isDisabled>Недоступно</Button>
      </Block>

      <Block title="Группы и переключатели">
        {/* Разделители обязательны: без них три кнопки слипаются в одну
            пилюлю и читаются как «ВсеИдутЗавершены». */}
        <ButtonGroup>
          <Button variant="outline">Все</Button>
          <ButtonGroup.Separator />
          <Button variant="outline">Идут</Button>
          <ButtonGroup.Separator />
          <Button variant="outline">Завершены</Button>
        </ButtonGroup>
        <ToggleButton>Только мои</ToggleButton>
        <CloseButton />
      </Block>

      <Block title="Метки, ссылки, клавиши">
        <Chip>Заявка принята</Chip>
        <TagGroup aria-label="Города">
          <TagGroup.List>
            <Tag id="ast">Астана</Tag>
            <Tag id="ala">Алматы</Tag>
          </TagGroup.List>
        </TagGroup>
        <Link href="#">Положение о соревнованиях</Link>
        <Code>Э14.7</Code>
        <Kbd>K</Kbd>
      </Block>
    </Shell>
  ),
};

/* ── Поля ───────────────────────────────────────────────────────── */
export const Fields = {
  name: 'Поля ввода',
  render: () => (
    <Shell>
      <Block title="Текст, поиск, числа">
        {/* У тройки поля составные: подпись — отдельный `Label` внутри поля,
            а не пропс. Так подпись можно поставить куда угодно и связать с
            полем без ручного `htmlFor`. */}
        <TextField className="max-w-xs">
          <Label>Фамилия и имя</Label>
          <Input />
        </TextField>
        <SearchField className="max-w-xs">
          <Label>Поиск по игрокам</Label>
        </SearchField>
        <NumberField className="max-w-40" defaultValue={3}>
          <Label>Партий до победы</Label>
        </NumberField>
        <TextArea className="max-w-md">
          <Label>Комментарий к заявке</Label>
        </TextArea>
      </Block>

      <Block title="Флажки и переключатели">
        <Checkbox>Согласен с положением</Checkbox>
        <CheckboxGroup aria-label="Разряды">
          <Checkbox value="single">Одиночный</Checkbox>
          <Checkbox value="double">Парный</Checkbox>
        </CheckboxGroup>
        <Switch>Уведомления</Switch>
        <RadioGroup aria-label="Язык" defaultValue="ru">
          <Radio value="ru">Русский</Radio>
          <Radio value="kk">Қазақша</Radio>
        </RadioGroup>
      </Block>

      <Block title="Ползунок и код из SMS">
        <Slider className="max-w-sm" aria-label="Рейтинг" defaultValue={2400} maxValue={3000} />
        <InputOTP maxLength={4}>
          <InputOTP.Group>
            <InputOTP.Slot index={0} />
            <InputOTP.Slot index={1} />
            <InputOTP.Slot index={2} />
            <InputOTP.Slot index={3} />
          </InputOTP.Group>
        </InputOTP>
      </Block>
    </Shell>
  ),
};

/* ── Даты ───────────────────────────────────────────────────────── */
export const Dates = {
  name: 'Даты',
  render: () => (
    <Shell>
      <Block
        title="Календари"
        note="Локаль ru-RU: неделя с понедельника, месяцы по-русски, дата в порядке день.месяц.год."
      >
        <Calendar aria-label="Дата турнира" />
        <RangeCalendar aria-label="Сроки турнира" />
      </Block>

      <Block title="Поля дат и времени">
        <DatePicker className="max-w-xs" aria-label="Дата рождения" />
        <DateField className="max-w-xs" aria-label="Дата" />
        <TimeField className="max-w-xs" aria-label="Начало матча" />
      </Block>
    </Shell>
  ),
};

/* ── Данные ─────────────────────────────────────────────────────── */
export const Data = {
  name: 'Данные',
  render: () => (
    <Shell>
      <Block title="Таблица">
        <Table aria-label="Группа B" className="max-w-2xl">
          <Table.Header>
            <Table.Column isRowHeader>Игрок</Table.Column>
            <Table.Column>И</Table.Column>
            <Table.Column>В</Table.Column>
            <Table.Column>Очки</Table.Column>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>Ким Георгий</Table.Cell>
              <Table.Cell>3</Table.Cell>
              <Table.Cell>3</Table.Cell>
              <Table.Cell>6</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Оспанов Р.</Table.Cell>
              <Table.Cell>3</Table.Cell>
              <Table.Cell>2</Table.Cell>
              <Table.Cell>5</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Block>

      <Block title="Карточка">
        <Card className="max-w-sm">
          <Card.Header>
            <Card.Title>Кубок Алматы 2026</Card.Title>
            <Card.Description>1/8 финала · стол 5</Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="flex items-center gap-3">
              <Avatar>
                <Avatar.Image src={A(44)} alt="" />
              </Avatar>
              <span className="text-sm">Ким Георгий · СКА</span>
            </div>
          </Card.Content>
          <Card.Footer>
            <Button size="sm">Открыть матч</Button>
          </Card.Footer>
        </Card>
      </Block>

      <Block title="Показатели и заглушки">
        <Badge>14</Badge>
        <Meter aria-label="Заполнено" value={64} className="max-w-xs" />
        <ProgressBar aria-label="Партии" value={40} className="max-w-xs" />
        <ProgressCircle aria-label="Готовность" value={70} />
        <Spinner />
        <div className="flex w-52 flex-col gap-2">
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-full" />
        </div>
      </Block>

      <Block title="Списки, пусто, прокрутка">
        <ListBox aria-label="Соперники" className="max-w-xs">
          <ListBox.Item id="1">Оспанов Р.</ListBox.Item>
          <ListBox.Item id="2">Ли Сергей</ListBox.Item>
        </ListBox>
        <EmptyState className="max-w-xs">Заявок нет</EmptyState>
        <ScrollShadow className="h-24 max-w-xs text-sm">
          <p className="pr-3">
            Календарь сезона 2026 собран целиком: восемь главных стартов, четыре тура Евразийской
            лиги и двадцать открытых республиканских турниров.
          </p>
        </ScrollShadow>
        <Separator className="w-full" />
      </Block>
    </Shell>
  ),
};

/* ── Навигация ──────────────────────────────────────────────────── */
export const Navigation = {
  name: 'Навигация',
  render: () => (
    <Shell>
      <Block title="Вкладки">
        <Tabs className="w-full">
          <Tabs.List aria-label="Разделы матча">
            <Tabs.Tab id="match">Матч</Tabs.Tab>
            <Tabs.Tab id="players">Участники</Tabs.Tab>
            <Tabs.Tab id="group">Группа</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel id="match">Счёт по партиям и стол.</Tabs.Panel>
          <Tabs.Panel id="players">Список участников турнира.</Tabs.Panel>
          <Tabs.Panel id="group">Таблица группы.</Tabs.Panel>
        </Tabs>
      </Block>

      <Block title="Крошки и раскрывающийся блок">
        <Breadcrumbs>
          <Breadcrumbs.Item>Календарь</Breadcrumbs.Item>
          <Breadcrumbs.Item>Кубок Алматы 2026</Breadcrumbs.Item>
        </Breadcrumbs>
        <Disclosure className="max-w-xl">
          <Disclosure.Trigger>Условия допуска</Disclosure.Trigger>
          <Disclosure.Content>
            Взнос оплачен, медицинский допуск действует.
          </Disclosure.Content>
        </Disclosure>
      </Block>

      <Block title="Меню">
        <Menu aria-label="Действия" className="max-w-xs">
          <Menu.Item id="open">Открыть заявку</Menu.Item>
          <Menu.Item id="pay">Оплатить взнос</Menu.Item>
        </Menu>
      </Block>
    </Shell>
  ),
};

/* ── Сообщения и наложения ──────────────────────────────────────────
   Здесь же ответ на вопрос «где Drawer»: он тут, `Drawer.Trigger` открывает
   `Drawer.Content`. В витрине двойки он был отдельной историей, при переезде
   на тройку переехал сюда — у неё он составной и без триггера не показывается. */
export const Overlays = {
  name: 'Сообщения и наложения',
  render: () => (
    <Shell>
      <Block title="Сообщения">
        <div className="flex w-full flex-col gap-3">
          <Alert>
            <Alert.Title>Заявка принята</Alert.Title>
            <Alert.Description>Решение главного судьи — 14 апреля.</Alert.Description>
          </Alert>
          <Alert status="warning">
            <Alert.Title>Взнос не оплачен</Alert.Title>
            <Alert.Description>Без него заявка на ОРТ не пройдёт.</Alert.Description>
          </Alert>
          <Alert status="danger">
            <Alert.Title>Оплата не прошла</Alert.Title>
            <Alert.Description>Банк: недостаточно средств.</Alert.Description>
          </Alert>
        </div>
      </Block>

      <Block title="Наложения" note="Открываются по нажатию — на статичном снимке видны триггеры.">
        <Tooltip>
          <Tooltip.Trigger>
            <Button variant="outline">Подсказка</Button>
          </Tooltip.Trigger>
          <Tooltip.Content>Рейтинг пересчитан после турнира</Tooltip.Content>
        </Tooltip>

        <Popover>
          <Popover.Trigger>
            <Button variant="outline">Всплывающее окно</Button>
          </Popover.Trigger>
          <Popover.Content>Взнос 2026: ₸ 10 000, срок до 31 марта.</Popover.Content>
        </Popover>

        <Modal>
          <Modal.Trigger>
            <Button variant="outline">Модальное окно</Button>
          </Modal.Trigger>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Снять заявку?</Modal.Heading>
            </Modal.Header>
            <Modal.Body>Заявка на Кубок Алматы 2026 будет отозвана.</Modal.Body>
            <Modal.Footer>
              <Button variant="ghost">Отмена</Button>
              <Button>Снять</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal>

        <Drawer>
          <Drawer.Trigger>
            <Button variant="outline">Боковая панель</Button>
          </Drawer.Trigger>
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Heading>Фильтры календаря</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>
              <CheckboxGroup aria-label="Разряды">
                <Checkbox value="single">Одиночный</Checkbox>
                <Checkbox value="double">Парный</Checkbox>
              </CheckboxGroup>
            </Drawer.Body>
            <Drawer.Footer>
              <Button>Показать</Button>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer>
      </Block>
    </Shell>
  ),
};

/* ── Новости на HeroUI ──────────────────────────────────────────────
   Э14.13 и Э14.14, собранные не нашим CSS, а готовыми карточками библиотеки:
   видно, что меняется при переходе. Обложка и тема остаются, а рамка, тени и
   скругления теперь не наши, а её. */
const NEWS = [
  {
    tag: 'Календарь',
    nm: 'Календарь сезона 2026 опубликован',
    ss: 'Восемь главных стартов, четыре тура Евразийской лиги и двадцать открытых турниров.',
    at: '15 апреля · Пресс-служба ФНТ РК',
    cover: coverTop,
  },
  {
    tag: 'Взносы',
    nm: 'Годовой взнос: срок до 31 марта',
    ss: 'Без оплаты заявки на турниры, где взнос обязателен, не проходят.',
    at: '2 марта · Исполком',
    cover: coverBalls,
  },
  {
    tag: 'Сборная',
    nm: 'Состав на чемпионат Азии объявлен',
    ss: 'Двенадцать спортсменов, сбор в Астане с 4 июня.',
    at: '28 февраля · Тренерский совет',
    cover: coverBats,
  },
];

export const News = {
  name: 'Новости на HeroUI',
  render: () => (
    <Shell>
      <Block
        title="Лента новостей"
        note="Тот же материал, что в Э14.13, но карточка — библиотечная. Обложка, чип темы и дата остаются; форма карточки теперь её."
      >
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NEWS.map((n) => (
            <Card key={n.nm}>
              <img
                src={n.cover}
                alt=""
                className="h-36 w-full rounded-t-large object-cover"
                style={{ objectPosition: '50% 28%' }}
              />
              <Card.Header>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Chip>{n.tag}</Chip>
                </div>
                <Card.Title>{n.nm}</Card.Title>
                <Card.Description>{n.ss}</Card.Description>
              </Card.Header>
              <Card.Footer>
                <span className="text-xs text-neutral-500">{n.at}</span>
              </Card.Footer>
            </Card>
          ))}
        </div>
      </Block>

      <Block title="Материал" note="Э14.14: колонка в ширину чтения, ссылка по делу внизу.">
        <Card className="max-w-2xl">
          <img
            src={coverTop}
            alt=""
            className="h-56 w-full rounded-t-large object-cover"
            style={{ objectPosition: '50% 28%' }}
          />
          <Card.Header>
            <Chip>Календарь</Chip>
            <Card.Title>Календарь сезона 2026 опубликован</Card.Title>
            <Card.Description>15 апреля 2026 · Пресс-служба ФНТ РК · 3 мин</Card.Description>
          </Card.Header>
          <Card.Content>
            <p className="text-sm leading-relaxed text-neutral-600">
              <b className="text-neutral-900">Что опубликовано.</b> Календарь сезона 2026 собран
              целиком: восемь главных стартов, четыре тура Евразийской лиги и двадцать открытых
              республиканских турниров.
            </p>
          </Card.Content>
          <Card.Footer>
            <Button>Открыть календарь</Button>
          </Card.Footer>
        </Card>
      </Block>
    </Shell>
  ),
};
