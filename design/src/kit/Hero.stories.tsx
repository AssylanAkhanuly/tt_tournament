/* Базовые компоненты — HeroUI ✳ (30.08.2026).

   Решение: базовый набор не рисуем сами, а берём готовый из HeroUI
   (`@heroui/react`). Он построен на Tailwind, поэтому Tailwind стал основным
   слоем стилей — граница «что Tailwind, что нативный CSS» записана в
   корневом `CLAUDE.md`.

   Что важно знать про это подключение:

   • Версия 2.x, а не 3.x: тройка требует React 19, в `design/` — React 18.
     Обновление React здесь тянет за собой Storybook и `front/`, и делать его
     заодно нельзя.
   • Preflight Tailwind не подключён: его глобальный сброс снёс бы вёрстку
     двухсот файлов, написанных до Tailwind. Вместо него — локальный сброс в
     `tailwind.src.css`, действующий только внутри `.hero-scope`.
   • CSS собирается отдельным шагом (`npm run kit:css`), а не плагином Vite:
     под Storybook 8 (Vite 5.4) плагин CSS не трогал, и компоненты приезжали
     без стилей. Сборка вызывается из `storybook` и `build`.
   • Компоненты HeroUI красятся своей темой, а не токенами `--c-*`/`--k-*`.
     Значит, проверка `lint:colors` их не покрывает: она следит за нашим CSS.
     Если кит должен встать в фирменные цвета ФНТ — это отдельная настройка
     темы HeroUI, и её надо делать осознанно.

   Здесь — витрина базового набора, чтобы было видно, что именно приехало. */

import {
  Accordion,
  AccordionItem,
  Autocomplete,
  AutocompleteItem,
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Chip,
  DatePicker,
  Divider,
  HeroUIProvider,
  Input,
  Pagination,
  Progress,
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  Slider,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  Textarea,
  Tooltip,
  User,
} from '@heroui/react';
import { A, AW } from '../fedCommon';
import './tailwind.css'; // собран из tailwind.src.css: npm run kit:css

export default {
  title: 'UI-кит/HeroUI',
  parameters: { layout: 'fullscreen' },
};

/** Обёртка витрины: провайдер HeroUI обязателен — без него часть компонентов
    (модалки, выпадающие списки, подсказки) не находит контекст. */
const Shell = ({ children }: { children: React.ReactNode }) => (
  <HeroUIProvider>
    {/* `hero-scope` включает локальный сброс браузерных стилей: preflight
        Tailwind выключен глобально, а HeroUI на него рассчитывает. */}
    <div className="hero-scope min-h-screen bg-white p-7 text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">{children}</div>
    </div>
  </HeroUIProvider>
);

const Block = ({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-3">
    <div>
      <h3 className="text-base font-semibold">{title}</h3>
      {note && <p className="mt-1 text-sm text-default-500">{note}</p>}
    </div>
    <div className="flex flex-wrap items-center gap-3">{children}</div>
  </section>
);

/* ── Действия ───────────────────────────────────────────────────── */
export const Actions = {
  name: 'Действия · кнопки, чипы',
  render: () => (
    <Shell>
      <Block
        title="Кнопки"
        note="Пять видов заливки и четыре цвета. Наш кит из этого набора использует solid и bordered."
      >
        <Button color="primary">Заявиться</Button>
        <Button color="primary" variant="bordered">Отмена</Button>
        <Button color="primary" variant="light">Подробнее</Button>
        <Button color="primary" variant="flat">Фильтры</Button>
        <Button color="danger">Снять заявку</Button>
        <Button color="success">Подтвердить</Button>
        <Button isDisabled>Недоступно</Button>
        <Button isLoading color="primary">Отправляем</Button>
      </Block>

      <Block title="Размеры и форма">
        <Button size="sm" color="primary">Мелкая</Button>
        <Button size="md" color="primary">Обычная</Button>
        <Button size="lg" color="primary">Крупная</Button>
        <Button radius="full" color="primary">Пилюлей</Button>
        <Button isIconOnly color="primary" aria-label="Поиск">
          🔍
        </Button>
      </Block>

      <Block title="Чипы" note="Состояния заявки и матча — то, для чего у нас были свои пилюли.">
        <Chip color="success" variant="flat">Заявка принята</Chip>
        <Chip color="warning" variant="flat">Ждём подтверждения</Chip>
        <Chip color="danger" variant="flat">Оплата не прошла</Chip>
        <Chip color="primary" variant="flat">Идёт</Chip>
        <Chip variant="bordered">Завершён</Chip>
        <Chip color="primary" onClose={() => {}}>Астана</Chip>
      </Block>
    </Shell>
  ),
};

/* ── Поля ───────────────────────────────────────────────────────── */
export const Fields = {
  name: 'Поля ввода',
  render: () => (
    <Shell>
      <Block title="Текстовые поля" note="Три вида подложки: bordered, faded, flat.">
        <Input label="Фамилия и имя" placeholder="Ким Георгий" className="max-w-xs" />
        <Input
          label="Телефон"
          placeholder="+7 705 118 44 03"
          variant="bordered"
          className="max-w-xs"
        />
        <Input
          label="Почта"
          defaultValue="g.kim@mail.kz"
          variant="faded"
          className="max-w-xs"
          description="Сюда приходят уведомления"
        />
        <Input
          label="ИИН"
          isInvalid
          errorMessage="Двенадцать цифр"
          defaultValue="0406"
          className="max-w-xs"
        />
      </Block>

      <Block title="Список и подсказка">
        <Select label="Разряд" className="max-w-xs">
          <SelectItem key="single">Одиночный</SelectItem>
          <SelectItem key="double">Парный</SelectItem>
          <SelectItem key="mixed">Микст</SelectItem>
        </Select>
        <Autocomplete label="Клуб" className="max-w-xs">
          <AutocompleteItem key="ska">СКА · Астана</AutocompleteItem>
          <AutocompleteItem key="alatau">Алатау · Алматы</AutocompleteItem>
          <AutocompleteItem key="otan">Отан · Шымкент</AutocompleteItem>
        </Autocomplete>
        <DatePicker label="Дата рождения" className="max-w-xs" />
      </Block>

      <Block title="Многострочное и выбор">
        <Textarea label="Комментарий к заявке" className="max-w-md" />
        <div className="flex flex-col gap-2">
          <Checkbox defaultSelected>Согласен с положением</Checkbox>
          <Switch defaultSelected>Уведомления</Switch>
          <RadioGroup label="Язык" orientation="horizontal" defaultValue="ru">
            <Radio value="ru">Русский</Radio>
            <Radio value="kk">Қазақша</Radio>
            <Radio value="en">English</Radio>
          </RadioGroup>
        </div>
        <Slider label="Рейтинг соперника" defaultValue={[2000, 2500]} maxValue={3000} className="max-w-md" />
      </Block>
    </Shell>
  ),
};

/* ── Показ данных ───────────────────────────────────────────────── */
export const Data = {
  name: 'Данные · таблица, карточки, люди',
  render: () => (
    <Shell>
      <Block title="Таблица" note="Группа турнира: то же, что мы рисовали руками.">
        <Table aria-label="Группа B" className="max-w-2xl">
          <TableHeader>
            <TableColumn>ИГРОК</TableColumn>
            <TableColumn>И</TableColumn>
            <TableColumn>В</TableColumn>
            <TableColumn>П</TableColumn>
            <TableColumn>ОЧКИ</TableColumn>
          </TableHeader>
          <TableBody>
            <TableRow key="1">
              <TableCell>Ким Георгий</TableCell>
              <TableCell>3</TableCell>
              <TableCell>3</TableCell>
              <TableCell>0</TableCell>
              <TableCell>6</TableCell>
            </TableRow>
            <TableRow key="2">
              <TableCell>Оспанов Р.</TableCell>
              <TableCell>3</TableCell>
              <TableCell>2</TableCell>
              <TableCell>1</TableCell>
              <TableCell>5</TableCell>
            </TableRow>
            <TableRow key="3">
              <TableCell>Ли Сергей</TableCell>
              <TableCell>3</TableCell>
              <TableCell>1</TableCell>
              <TableCell>2</TableCell>
              <TableCell>4</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Block>

      <Block title="Карточка">
        <Card className="max-w-sm">
          <CardHeader className="flex-col items-start gap-1">
            <p className="text-sm text-default-500">Кубок Алматы 2026</p>
            <h4 className="text-lg font-semibold">1/8 финала</h4>
          </CardHeader>
          <Divider />
          <CardBody className="gap-3">
            <User
              name="Ким Георгий"
              description="СКА · Астана · рейтинг 2456"
              avatarProps={{ src: A(44) }}
            />
            <Progress label="Партии" value={40} color="primary" showValueLabel />
          </CardBody>
        </Card>
      </Block>

      <Block title="Люди и значки">
        <AvatarGroup isBordered max={3}>
          <Avatar src={A(44)} />
          <Avatar src={A(12)} />
          <Avatar src={A(23)} />
          <Avatar src={AW(28)} />
        </AvatarGroup>
        <Badge content="14" color="danger">
          <Avatar src={A(31)} radius="md" />
        </Badge>
        <Tooltip content="Рейтинг пересчитан после турнира">
          <Button variant="bordered">Подсказка</Button>
        </Tooltip>
      </Block>
    </Shell>
  ),
};

/* ── Навигация ──────────────────────────────────────────────────── */
export const Navigation = {
  name: 'Навигация · вкладки, гармошка, страницы',
  render: () => (
    <Shell>
      <Block title="Вкладки" note="Три вида: solid, underlined, bordered.">
        <Tabs aria-label="Разделы матча" color="primary">
          <Tab key="match" title="Матч" />
          <Tab key="players" title="Участники" />
          <Tab key="group" title="Группа" />
          <Tab key="bracket" title="Сетка" />
        </Tabs>
      </Block>

      <Block title="Вкладки подчёркиванием">
        <Tabs aria-label="Разделы матча" variant="underlined" color="primary">
          <Tab key="match" title="Матч" />
          <Tab key="players" title="Участники" />
          <Tab key="group" title="Группа" />
        </Tabs>
      </Block>

      <Block title="Гармошка">
        <Accordion className="max-w-xl">
          <AccordionItem key="1" aria-label="Условия допуска" title="Условия допуска">
            Годовой взнос оплачен, медицинский допуск действует, удостоверение приложено.
          </AccordionItem>
          <AccordionItem key="2" aria-label="Как подать заявку" title="Как подать заявку">
            Заявка уходит главному судье турнира — решение придёт уведомлением.
          </AccordionItem>
        </Accordion>
      </Block>

      <Block title="Страницы">
        <Pagination total={8} initialPage={1} color="primary" />
      </Block>
    </Shell>
  ),
};
