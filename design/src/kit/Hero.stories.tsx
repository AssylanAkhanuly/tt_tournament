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
  Alert,
  BreadcrumbItem,
  Breadcrumbs,
  ButtonGroup,
  Calendar,
  CheckboxGroup,
  CircularProgress,
  Code,
  DateRangePicker,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Image,
  InputOtp,
  Kbd,
  Link,
  Listbox,
  ListboxItem,
  NumberInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RangeCalendar,
  ScrollShadow,
  Skeleton,
  Snippet,
  Spinner,
  TimeInput,
  Autocomplete,
  AutocompleteItem,
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  Chip,
  DateInput,
  DatePicker,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Form,
  HeroUIProvider,
  Input,
  Menu,
  MenuItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Pagination,
  Progress,
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  Spacer,
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
    (модалки, выпадающие списки, подсказки) не находит контекст.

    `locale="ru-RU"` обязателен тоже: по умолчанию HeroUI берёт локаль браузера,
    и календарь приходит английским с датой в порядке «месяц/день/год». Для
    федерации это прямая ошибка: 06.14 и 14.06 читаются по-разному. */
const Shell = ({ children }: { children: React.ReactNode }) => (
  <HeroUIProvider locale="ru-RU">
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

/* ── Обратная связь и наложения ─────────────────────────────────── */
export const Feedback = {
  name: 'Обратная связь · сообщения, ожидание',
  render: () => (
    <Shell>
      <Block title="Сообщения" note="Четыре тона: тот же набор, что у наших Notice.">
        <div className="flex w-full flex-col gap-3">
          <Alert color="success" title="Заявка принята" description="Решение главного судьи — 14 апреля." />
          <Alert color="warning" title="Взнос не оплачен" description="Без него заявка на ОРТ не пройдёт." />
          <Alert color="danger" title="Оплата не прошла" description="Банк: недостаточно средств." />
          <Alert color="primary" title="Рейтинг пересчитан" description="+8 после Кубка Алматы." />
        </div>
      </Block>

      <Block title="Ожидание">
        <Spinner label="Загружаем" />
        <CircularProgress value={70} showValueLabel aria-label="Готовность" />
        <Progress value={40} className="max-w-xs" aria-label="Партии" />
        <div className="flex w-52 flex-col gap-2">
          <Skeleton className="h-3 w-4/5 rounded-lg" />
          <Skeleton className="h-3 w-full rounded-lg" />
          <Skeleton className="h-3 w-2/3 rounded-lg" />
        </div>
      </Block>

      <Block title="Наложения" note="Открываются по нажатию — на статичном снимке видны только кнопки.">
        <Popover placement="bottom">
          <PopoverTrigger>
            <Button variant="bordered">Всплывающее окно</Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="px-1 py-2 text-sm">Взнос за 2026 год: ₸ 10 000, срок до 31 марта.</div>
          </PopoverContent>
        </Popover>

        <Dropdown>
          <DropdownTrigger>
            <Button variant="bordered">Меню</Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Действия с заявкой">
            <DropdownItem key="open">Открыть заявку</DropdownItem>
            <DropdownItem key="pay">Оплатить взнос</DropdownItem>
            <DropdownItem key="drop" className="text-danger" color="danger">
              Снять заявку
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>

        <Tooltip content="Рейтинг пересчитан после турнира">
          <Button variant="light">Подсказка</Button>
        </Tooltip>
      </Block>
    </Shell>
  ),
};

/* ── Даты ───────────────────────────────────────────────────────── */
export const Dates = {
  name: 'Даты · календарь, период, время',
  render: () => (
    <Shell>
      <Block
        title="Календарь"
        note="Локаль ru-RU: неделя начинается с понедельника, месяцы и дни по-русски. По умолчанию HeroUI берёт локаль браузера и показывает месяц/день/год — для федерации это прямая ошибка."
      >
        <Calendar aria-label="Дата турнира" />
        <RangeCalendar aria-label="Даты турнира" />
      </Block>

      <Block title="Поля дат">
        <DatePicker label="Дата рождения" className="max-w-xs" />
        <DateRangePicker label="Сроки турнира" className="max-w-sm" />
        <TimeInput label="Начало матча" className="max-w-xs" />
      </Block>
    </Shell>
  ),
};

/* ── Остальное ──────────────────────────────────────────────────── */
export const Misc = {
  name: 'Остальное · навигация, списки, мелочи',
  render: () => (
    <Shell>
      <Block title="Хлебные крошки и ссылки">
        <Breadcrumbs>
          <BreadcrumbItem>Календарь</BreadcrumbItem>
          <BreadcrumbItem>Кубок Алматы 2026</BreadcrumbItem>
          <BreadcrumbItem>Моя заявка</BreadcrumbItem>
        </Breadcrumbs>
        <Link href="#">Положение о соревнованиях</Link>
      </Block>

      <Block title="Группа кнопок и списки">
        <ButtonGroup>
          <Button>Все</Button>
          <Button color="primary">Идут</Button>
          <Button>Завершены</Button>
        </ButtonGroup>
        <Listbox aria-label="Соперники" className="max-w-xs rounded-medium border border-default-200">
          <ListboxItem key="1">Оспанов Р.</ListboxItem>
          <ListboxItem key="2">Ли Сергей</ListboxItem>
          <ListboxItem key="3">Ахметов Д.</ListboxItem>
        </Listbox>
      </Block>

      <Block title="Числа, код, клавиши">
        <NumberInput label="Партий до победы" defaultValue={3} className="max-w-40" />
        <InputOtp length={4} />
        <Code>Э14.7</Code>
        <Kbd keys={['command']}>K</Kbd>
        <Snippet symbol="">fnt.kz/tournaments/2026</Snippet>
      </Block>

      <Block title="Изображение и прокрутка">
        <Image src={A(44)} width={120} alt="Ким Георгий" className="rounded-large" />
        <ScrollShadow className="h-28 max-w-xs text-sm">
          <p className="pr-3">
            Календарь сезона 2026 собран целиком: восемь главных стартов, четыре тура Евразийской
            лиги и двадцать открытых республиканских турниров. У каждого турнира указаны город,
            зал, разряды и срок приёма заявок. Заявки на открытые турниры подаются самостоятельно.
          </p>
        </ScrollShadow>
      </Block>

      <Block title="Группа флажков">
        <CheckboxGroup label="Разряды" orientation="horizontal" defaultValue={['single']}>
          <Checkbox value="single">Одиночный</Checkbox>
          <Checkbox value="double">Парный</Checkbox>
          <Checkbox value="mixed">Микст</Checkbox>
        </CheckboxGroup>
      </Block>
    </Shell>
  ),
};

/* ── Наложения ──────────────────────────────────────────────────────
   Модалка и боковая панель показаны ОТКРЫТЫМИ и по отдельной истории на
   каждую: в общей витрине они закрыли бы собой всё остальное, а закрытыми от
   них видно только кнопку. Анимация выключена — иначе снимок ловит их на
   полпути. */
export const ModalWindow = {
  name: 'Модальное окно',
  render: () => (
    <Shell>
      <Modal isOpen disableAnimation onOpenChange={() => {}}>
        <ModalContent>
          <ModalHeader>Снять заявку?</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">
              Заявка на Кубок Алматы 2026 будет отозвана. Подать её снова можно до 5 сентября,
              пока идёт приём.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light">Отмена</Button>
            <Button color="danger">Снять заявку</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Shell>
  ),
};

export const SideDrawer = {
  name: 'Боковая панель',
  render: () => (
    <Shell>
      <Drawer isOpen disableAnimation onOpenChange={() => {}}>
        <DrawerContent>
          <DrawerHeader>Фильтры календаря</DrawerHeader>
          <DrawerBody>
            <CheckboxGroup label="Разряды" defaultValue={['single']}>
              <Checkbox value="single">Одиночный</Checkbox>
              <Checkbox value="double">Парный</Checkbox>
              <Checkbox value="mixed">Микст</Checkbox>
            </CheckboxGroup>
            <Select label="Город" className="mt-4">
              <SelectItem key="ast">Астана</SelectItem>
              <SelectItem key="ala">Алматы</SelectItem>
              <SelectItem key="shy">Шымкент</SelectItem>
            </Select>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="light">Сбросить</Button>
            <Button color="primary">Показать</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Shell>
  ),
};

/* ── Каркас страницы ────────────────────────────────────────────── */
export const Frame = {
  name: 'Каркас · шапка, меню, форма',
  render: () => (
    <Shell>
      <Block title="Шапка сайта">
        <Navbar isBordered className="rounded-large">
          <NavbarBrand>
            <span className="font-semibold">ФНТ РК</span>
          </NavbarBrand>
          <NavbarContent justify="center">
            <NavbarItem>Календарь</NavbarItem>
            <NavbarItem isActive>Мой турнир</NavbarItem>
            <NavbarItem>Новости</NavbarItem>
          </NavbarContent>
          <NavbarContent justify="end">
            <NavbarItem>
              <Button color="primary" size="sm">Заявиться</Button>
            </NavbarItem>
          </NavbarContent>
        </Navbar>
      </Block>

      <Block title="Меню">
        <Menu aria-label="Действия" className="max-w-xs rounded-medium border border-default-200">
          <MenuItem key="open">Открыть заявку</MenuItem>
          <MenuItem key="pay">Оплатить взнос</MenuItem>
          <MenuItem key="hist">История платежей</MenuItem>
        </Menu>
      </Block>

      <Block title="Форма" note="Form собирает поля и берёт на себя проверку при отправке.">
        <Form className="w-full max-w-sm gap-3">
          <Input isRequired label="Фамилия и имя" name="name" />
          <DateInput label="Дата рождения" name="dob" />
          <Button type="submit" color="primary">Отправить</Button>
        </Form>
      </Block>

      <Block title="Карточка с подвалом и разделителями">
        <Card className="max-w-sm">
          <CardHeader>Кубок Алматы 2026</CardHeader>
          <Divider />
          <CardBody>
            <User name="Ким Георгий" description="СКА · Астана" avatarProps={{ src: A(44) }} />
            <Spacer y={2} />
            <p className="text-sm text-default-600">1/8 финала · стол 5</p>
          </CardBody>
          <Divider />
          <CardFooter>
            <Button size="sm" color="primary">Открыть матч</Button>
          </CardFooter>
        </Card>
      </Block>
    </Shell>
  ),
};
