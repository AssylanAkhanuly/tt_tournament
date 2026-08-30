/* Справочник HeroUI 3 · группа 05 «Наложения»: всё, что открывается поверх
   страницы — окна, подтверждения, шторки, поповеры, подсказки, меню и тосты.
   Каждый оверлей открыт в своей истории и без кликов (defaultOpen): скриншот
   истории показывает сам компонент, а два портала разом — кашу. Составное API —
   строго по типам пакета: без цепочки Backdrop → Container → Dialog модалка
   не рендерится вовсе — именно на этом сломался прошлый справочник. */

import { useEffect } from 'react';
import {
  AlertDialog,
  Avatar,
  Button,
  Checkbox,
  Code,
  Drawer,
  Dropdown,
  Header,
  Label,
  Menu,
  MenuItem,
  MenuSection,
  Modal,
  Popover,
  Separator,
  Toast,
  Tooltip,
  alertDialogVariants,
  buttonVariants,
  drawerVariants,
  menuItemVariants,
  modalVariants,
  toastVariants,
} from '@heroui/react';
import { CalendarClock, ChevronDown, Pencil, UserX } from 'lucide-react';
import { CITIES, PLAYERS, Row, Section, Shell, TOURNAMENTS, values } from './HeroKit';

export default {
  title: 'UI-кит/HeroUI/05 · Наложения',
  parameters: { layout: 'fullscreen' },
};

/* Оверлей в матрицу «свойство × значение» не разложить — открытым держим один.
   Но перечень значений всё равно читаем из объекта вариантов пакета, чтобы
   справочник не разошёлся с библиотекой. */
const Vals = ({ prop, vals }: { prop: string; vals: string[] }) => (
  <div className="flex flex-wrap items-center gap-2">
    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
      {prop}
    </span>
    {vals.map((v) => (
      <Code key={v}>{v}</Code>
    ))}
  </div>
);

/* ── Modal: карточка матча ──────────────────────────────────────── */

/* Счёт по партиям — как на табло: победная цифра тёмная, проигранная серая. */
const GAMES: ReadonlyArray<readonly [number, number]> = [
  [11, 8],
  [9, 11],
  [11, 6],
  [11, 7],
];

const PlayerSide = ({ p, right }: { p: (typeof PLAYERS)[number]; right?: boolean }) => (
  <div className={`flex items-center gap-3 ${right ? 'flex-row-reverse text-right' : ''}`}>
    <Avatar size="lg">
      <Avatar.Image src={p.av} alt="" />
    </Avatar>
    <div>
      <div className="text-sm font-semibold">{p.nm}</div>
      <div className="text-xs text-neutral-500">
        {p.city} · {p.rank} · {p.rating}
      </div>
    </div>
  </div>
);

export const ModalCard = {
  name: 'Modal · карточка матча',
  render: () => (
    <Shell>
      <Section
        name="Modal"
        note="Модальное окно. Обязательная цепочка Backdrop → Container → Dialog — без неё не рендерится ничего. 3 подложки × 6 размеров × 2 режима прокрутки; placement на Container."
      >
        <Vals prop="variant · Backdrop" vals={values(modalVariants, 'variant')} />
        <Vals prop="size · Container" vals={values(modalVariants, 'size')} />
        <Vals prop="scroll · Container" vals={values(modalVariants, 'scroll')} />

        <Modal defaultOpen>
          <Modal.Trigger>
            <Button variant="outline">Карточка матча</Button>
          </Modal.Trigger>
          <Modal.Backdrop variant="opaque">
            <Modal.Container size="md" scroll="inside">
              <Modal.Dialog>
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>Матч №14 · 1/4 финала</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <div className="flex flex-col gap-4">
                    <div className="text-xs text-neutral-500">{TOURNAMENTS[0]} · мужчины, одиночный</div>
                    <div className="flex items-center justify-between gap-4">
                      <PlayerSide p={PLAYERS[0]} />
                      <div className="text-2xl font-bold tabular-nums">3:1</div>
                      <PlayerSide p={PLAYERS[1]} right />
                    </div>
                    <div className="flex gap-2">
                      {GAMES.map(([a, b], i) => (
                        <div
                          key={i}
                          className="flex w-10 flex-col items-center border border-neutral-200 py-1 tabular-nums"
                        >
                          <span className={a > b ? 'text-sm font-semibold' : 'text-sm text-neutral-400'}>{a}</span>
                          <span className={b > a ? 'text-sm font-semibold' : 'text-sm text-neutral-400'}>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Modal.Body>
                <Modal.Footer>
                  {/* slot="close" — механика RAC Dialog: кнопка закрывает окно сама */}
                  <Button slot="close" variant="primary">
                    Готово
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      </Section>
    </Shell>
  ),
};

/* ── AlertDialog: опасное действие ──────────────────────────────── */
export const AlertConfirm = {
  name: 'AlertDialog · опасное действие',
  render: () => (
    <Shell>
      <Section
        name="AlertDialog"
        note="Подтверждение необратимого. В отличие от Modal кликом мимо не закрывается — только кнопками. 5 статусов иконки, 5 размеров, 3 подложки."
      >
        {/* Icon — обычный div со статусной раскраской, живёт и вне диалога:
            единственная часть оверлея, которую можно разложить в матрицу */}
        <Row
          prop="status · Icon"
          vals={values(alertDialogVariants, 'status')}
          render={(v) => <AlertDialog.Icon status={v as never} />}
        />
        <Vals prop="size · Container" vals={values(alertDialogVariants, 'size')} />
        <Vals prop="variant · Backdrop" vals={values(alertDialogVariants, 'variant')} />

        <AlertDialog defaultOpen>
          <AlertDialog.Trigger>
            <Button variant="danger-soft">Сняться с турнира</Button>
          </AlertDialog.Trigger>
          <AlertDialog.Backdrop>
            <AlertDialog.Container size="md">
              <AlertDialog.Dialog>
                <AlertDialog.Header>
                  <AlertDialog.Icon status="danger" />
                  <AlertDialog.Heading>Сняться с турнира?</AlertDialog.Heading>
                </AlertDialog.Header>
                <AlertDialog.Body>
                  {PLAYERS[0].nm} будет снят с «{TOURNAMENTS[0]}». Заявка аннулируется,
                  место в сетке займёт запасной. Вернуться можно только новой заявкой.
                </AlertDialog.Body>
                <AlertDialog.Footer>
                  <Button slot="close" variant="ghost">
                    Остаться
                  </Button>
                  <Button slot="close" variant="danger">
                    Сняться
                  </Button>
                </AlertDialog.Footer>
              </AlertDialog.Dialog>
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>
      </Section>
    </Shell>
  ),
};

/* ── Drawer: боковая панель фильтров ────────────────────────────── */

/* Флажок фильтра — полная анатомия тройки, как в группе «Выбор»: Content →
   Control → Indicator + Label. Монолитный <Checkbox>текст</Checkbox> не
   рендерит ни квадратика, ни галочки — остаётся голый текст. */
const FilterCheck = ({ label, on }: { label: string; on?: boolean }) => (
  <Checkbox defaultSelected={on}>
    <Checkbox.Content>
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
      <Label>{label}</Label>
    </Checkbox.Content>
  </Checkbox>
);

export const DrawerFilters = {
  name: 'Drawer · панель фильтров',
  render: () => (
    <Shell>
      <Section
        name="Drawer"
        note="Выдвижная панель. Цепочка Backdrop → Content → Dialog; placement — на Content (по умолчанию bottom). 4 стороны × 3 подложки. Trigger — настоящий <button>: свою Button внутрь класть нельзя, одеваем классом buttonVariants."
      >
        <Vals prop="placement · Content" vals={values(drawerVariants, 'placement')} />
        <Vals prop="variant · Backdrop" vals={values(drawerVariants, 'variant')} />

        <Drawer defaultOpen>
          {/* Триггер одет объектом вариантов пакета: buttonVariants возвращает
              строку классов кнопки («button button--outline») */}
          <Drawer.Trigger className={buttonVariants({ variant: 'outline' })}>
            Фильтры
          </Drawer.Trigger>
          <Drawer.Backdrop>
            <Drawer.Content placement="right">
              <Drawer.Dialog>
                <Drawer.CloseTrigger />
                <Drawer.Header>
                  <Drawer.Heading>Фильтры турниров</Drawer.Heading>
                </Drawer.Header>
                <Drawer.Body>
                  <div className="flex flex-col gap-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Город
                    </div>
                    {CITIES.slice(0, 4).map((c, i) => (
                      <FilterCheck key={c} label={c} on={i < 2} />
                    ))}
                    <Separator />
                    <FilterCheck label="Идёт приём заявок" on />
                    <FilterCheck label="Есть парный разряд" />
                  </div>
                </Drawer.Body>
                <Drawer.Footer>
                  <Button variant="ghost">Сбросить</Button>
                  <Button slot="close" variant="primary">
                    Показать турниры
                  </Button>
                </Drawer.Footer>
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>
      </Section>
    </Shell>
  ),
};

/* ── Drawer: нижняя шторка с ручкой ─────────────────────────────── */
export const DrawerSheet = {
  name: 'Drawer · нижняя шторка',
  render: () => (
    <Shell>
      <Section
        name="Drawer (bottom)"
        note="Нижняя шторка — placement по умолчанию. Handle (полоска-ручка) уместен только здесь: у боковых панелей жеста «потянуть» нет."
      >
        <Drawer defaultOpen>
          <Drawer.Trigger className={buttonVariants({ variant: 'outline' })}>
            О турнире
          </Drawer.Trigger>
          <Drawer.Backdrop variant="blur">
            <Drawer.Content placement="bottom">
              <Drawer.Dialog>
                <Drawer.Handle />
                <Drawer.Header>
                  <Drawer.Heading>{TOURNAMENTS[0]}</Drawer.Heading>
                </Drawer.Header>
                <Drawer.Body>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Город</span>
                      <span>{CITIES[0]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Даты</span>
                      <span>12–14 сентября 2026</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Заявки</span>
                      <span>открыты до 5 сентября</span>
                    </div>
                  </div>
                </Drawer.Body>
                <Drawer.Footer>
                  <Button slot="close" variant="primary">
                    Заявиться
                  </Button>
                </Drawer.Footer>
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>
      </Section>
    </Shell>
  ),
};

/* ── Popover: состав пары ───────────────────────────────────────── */
export const PopoverPair = {
  name: 'Popover · состав пары',
  render: () => (
    <Shell>
      <Section
        name="Popover"
        note="Всплывающая карточка у триггера. Наборов вариантов нет — только позиционирование (placement, offset на Content). Внутри Content обязателен Dialog, Arrow — перед ним."
      >
        <Popover defaultOpen>
          <Popover.Trigger>
            <Button variant="outline">Пара №2</Button>
          </Popover.Trigger>
          <Popover.Content placement="bottom start">
            <Popover.Arrow />
            <Popover.Dialog>
              <Popover.Heading>Пара №2 · парный разряд</Popover.Heading>
              <div className="mt-2 flex flex-col gap-2">
                {[PLAYERS[1], PLAYERS[2]].map((p) => (
                  <div className="flex items-center gap-2" key={p.nm}>
                    <Avatar size="sm">
                      <Avatar.Image src={p.av} alt="" />
                    </Avatar>
                    <span className="text-sm font-medium">{p.short}</span>
                    <span className="text-xs text-neutral-500">
                      {p.city} · {p.rating}
                    </span>
                  </div>
                ))}
              </div>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      </Section>
    </Shell>
  ),
};

/* ── Tooltip: подсказка к числу ─────────────────────────────────── */
export const TooltipRating = {
  name: 'Tooltip · подсказка',
  render: () => (
    <Shell>
      <Section
        name="Tooltip"
        note="Подсказка к фокусируемому элементу — только текст, без интерактива (для него Popover). Наборов вариантов нет; placement и showArrow — на Content."
      >
        {/* Отступ сверху — тултип с placement=top должен уместиться в кадр */}
        <div className="pt-14">
          <Tooltip defaultOpen delay={0}>
            <Tooltip.Trigger>
              <Button variant="ghost">
                {PLAYERS[0].short} · {PLAYERS[0].rating}
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content placement="top" showArrow>
              Рейтинг на 1 августа
            </Tooltip.Content>
          </Tooltip>
        </div>
      </Section>
    </Shell>
  ),
};

/* ── Dropdown: меню действий судьи ──────────────────────────────── */
export const DropdownActions = {
  name: 'Dropdown · меню действий',
  render: () => (
    <Shell>
      <Section
        name="Dropdown"
        note="Выпадающее меню целиком: Trigger + Popover → Menu → Item. Trigger — настоящий <button>, одеваем классом buttonVariants. aria-label на Menu обязателен; у Item есть variant danger — красит подпись в Label."
      >
        <Dropdown defaultOpen>
          {/* Класс кнопки — из объекта вариантов пакета. Утилита inline-flex
              обязательна: собственный .dropdown__trigger стоит в слое ПОЗЖЕ
              .button и перебивает его display на inline-block — шеврон падал
              на вторую строку; утилиты вне слоёв и возвращают флекс. */}
          <Dropdown.Trigger className={`${buttonVariants({ variant: 'outline' })} inline-flex`}>
            Действия судьи <ChevronDown size={16} />
          </Dropdown.Trigger>
          <Dropdown.Popover placement="bottom start">
            <Dropdown.Menu aria-label="Действия судьи с матчем">
              <Dropdown.Section>
                <Header>Матч №14 · стол 3</Header>
                <Dropdown.Item id="score" textValue="Изменить счёт">
                  <Pencil size={16} /> Изменить счёт
                </Dropdown.Item>
                <Dropdown.Item id="move" textValue="Перенести матч">
                  <CalendarClock size={16} /> Перенести матч
                </Dropdown.Item>
              </Dropdown.Section>
              <Dropdown.Section>
                <Header>Игрок</Header>
                {/* danger красит [data-slot=label] и индикатор: подпись — в Label,
                    иначе пункт в покое неотличим от обычного */}
                <Dropdown.Item id="remove" variant="danger" textValue="Снять игрока">
                  <UserX size={16} /> <Label>Снять игрока</Label>
                </Dropdown.Item>
              </Dropdown.Section>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </Section>
    </Shell>
  ),
};

/* ── Menu, MenuItem, MenuSection: список без поповера ───────────── */
export const Menus = {
  name: 'Menu, MenuItem, MenuSection',
  render: () => (
    <Shell>
      <Section
        name="Menu"
        note="Список меню сам по себе, без триггера и поповера (выпадающее целиком — это Dropdown). Портала нет, потому показывается статично. aria-label обязателен."
      >
        <Menu
          aria-label="Сортировка таблицы рейтинга"
          className="w-64"
          defaultSelectedKeys={['rating']}
          selectionMode="single"
        >
          <MenuItem id="rating" textValue="По рейтингу">
            <MenuItem.Indicator type="checkmark" />
            По рейтингу
          </MenuItem>
          <MenuItem id="alphabet" textValue="По алфавиту">
            <MenuItem.Indicator type="checkmark" />
            По алфавиту
          </MenuItem>
          <MenuItem id="city" textValue="По городу">
            <MenuItem.Indicator type="checkmark" />
            По городу
          </MenuItem>
        </Menu>
      </Section>

      <Section
        name="MenuItem"
        note="Пункт меню — живёт только внутри Menu. 2 варианта окраски: danger красит подпись и индикатор, но целится в слот label — текст пункта оборачиваем в Label, голый текст окраски не получает. Indicator показывается сам, когда пункт выбран."
      >
        <Row
          prop="variant"
          vals={values(menuItemVariants, 'variant')}
          render={(v) => (
            <Menu aria-label={`Пункт меню — ${v}`} className="w-44">
              <MenuItem id={v} textValue={v} variant={v as never}>
                <Label>{v === 'danger' ? 'Снять игрока' : 'Открыть матч'}</Label>
              </MenuItem>
            </Menu>
          )}
        />
        <Row
          prop="Indicator · type"
          vals={['checkmark', 'dot']}
          render={(v) => (
            <Menu
              aria-label={`Индикатор — ${v}`}
              className="w-44"
              defaultSelectedKeys={['on']}
              selectionMode="single"
            >
              <MenuItem id="on" textValue="Выбранный">
                <MenuItem.Indicator type={v as never} />
                Выбранный
              </MenuItem>
              <MenuItem id="off" textValue="Обычный">
                <MenuItem.Indicator type={v as never} />
                Обычный
              </MenuItem>
            </Menu>
          )}
        />
      </Section>

      <Section
        name="MenuSection"
        note="Группа пунктов с заголовком. Заголовок — компонент Header из пакета: RAC-коллекция ждёт именно его, свой div меткой не станет."
      >
        <Menu aria-label="Разделы кабинета секретаря" className="w-64">
          <MenuSection>
            <Header>Турниры</Header>
            <MenuItem id="new">Новый турнир</MenuItem>
            <MenuItem id="archive">Архив</MenuItem>
          </MenuSection>
          <MenuSection>
            <Header>Судьи</Header>
            <MenuItem id="assign">Назначения</MenuItem>
            <MenuItem id="categories">Категории</MenuItem>
          </MenuSection>
        </Menu>
      </Section>
    </Shell>
  ),
};

/* ── Toast: уведомления ─────────────────────────────────────────── */

/* Тосты живут только в очереди: без смонтированного Toast.Provider вызов
   toast() ничего не покажет. Развёрнутого состояния у региона нет (ни пропа,
   ни жеста): задние тосты всегда сложены за передним со сдвигом в несколько
   пикселей, читается только верхний. Потому держим один содержательный тост —
   timeout: 0 оставляет его на экране, cleanup чистит очередь для StrictMode;
   остальные варианты добавляются кнопкой и встают в ту же стопку. */
const ToastsDemo = () => {
  useEffect(() => {
    const t = Toast.toast;
    t.success('Заявка принята', {
      description: `${TOURNAMENTS[0]} — ${PLAYERS[0].nm}`,
      actionProps: { children: 'К заявке' },
      timeout: 0,
    });
    return () => t.clear();
  }, []);
  return (
    <>
      <Toast.Provider placement="bottom end" />
      <Button
        onPress={() => Toast.toast.warning('На 3-й тур не хватает двух судей')}
      >
        Показать ещё тост
      </Button>
    </>
  );
};

export const Toasts = {
  name: 'Toast · уведомления',
  render: () => (
    <Shell>
      <Section
        name="Toast"
        note="Уведомления. Вариант выбирается не пропом, а функцией: toast.success/warning/danger/info (info → accent). Провайдер обязателен, 6 позиций региона. Несколько тостов регион всегда складывает стопкой за передним — развернуть её нельзя, поэтому показан один."
      >
        <Vals prop="placement · Provider" vals={values(toastVariants, 'placement')} />
        <Vals prop="variant · функция toast.*" vals={values(toastVariants, 'variant')} />
        <ToastsDemo />
      </Section>
    </Shell>
  ),
};
