/* Группа «Действия» справочника HeroUI 3: кнопки, группы кнопок, тумблеры,
   панель инструментов, ссылка, клавиши. Всё, чем пользователь «делает» —
   заявка на турнир, фильтры списка, инструменты судьи за столом.
   Структура частей — из типов пакета, наборы значений — из *Variants. */

import type { ReactNode } from 'react';
import {
  Button,
  ButtonGroup,
  CloseButton,
  Kbd,
  Link,
  Separator,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  buttonGroupVariants,
  buttonVariants,
  closeButtonVariants,
  kbdVariants,
  toggleButtonGroupVariants,
  toggleButtonVariants,
  toolbarVariants,
} from '@heroui/react';
import {
  ArrowLeftRight,
  ArrowUpRight,
  Download,
  Flag,
  Pencil,
  Plus,
  X,
} from 'lucide-react';
import { CITIES, PLAYERS, Row, Section, Shell, TOURNAMENTS, values } from './HeroKit';

export default {
  title: 'UI-кит/HeroUI/01 · Действия',
  parameters: { layout: 'fullscreen' },
};

/* ── Кнопка ─────────────────────────────────────────────────────── */
export const Buttons = {
  name: 'Кнопка',
  render: () => (
    <Shell>
      <Section
        name="Button"
        note="Семь видов заливки, три размера. Клик — onPress, недоступность — isDisabled; иконка кладётся ребёнком рядом с текстом, отдельного свойства нет."
      >
        <Row
          prop="variant"
          vals={values(buttonVariants, 'variant')}
          render={(v) => <Button variant={v as never}>Заявиться</Button>}
        />
        <Row
          prop="size"
          vals={values(buttonVariants, 'size')}
          render={(v) => (
            <Button size={v as never} variant="outline">
              <Download size={16} /> Скачать положение
            </Button>
          )}
        />
        <Row
          prop="состояния"
          vals={['обычная', 'недоступна']}
          render={(v) => (
            <Button variant="danger-soft" isDisabled={v === 'недоступна'}>
              <X size={16} /> Отменить заявку
            </Button>
          )}
        />
        {/* isIconOnly делает кнопку квадратной — подпись остаётся только для читалки. */}
        <Row
          prop="isIconOnly"
          vals={values(buttonVariants, 'size')}
          render={(v) => (
            <Button isIconOnly size={v as never} variant="ghost" aria-label="Правка счёта">
              <Pencil size={16} />
            </Button>
          )}
        />
        <Row
          prop="fullWidth"
          vals={['false', 'true']}
          render={(v) => (
            <div className="w-56">
              <Button fullWidth={v === 'true'}>
                <Plus size={16} /> Заявиться
              </Button>
            </div>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Группа кнопок ──────────────────────────────────────────────── */
export const Groups = {
  name: 'Группа кнопок',
  render: () => (
    <Shell>
      <Section
        name="ButtonGroup"
        note="Кнопки со слитыми углами; size и variant задаются один раз на группе и наследуются. Разделитель — ButtonGroup.Separator, ставится руками."
      >
        {/* Вертикальной группе нужна общая ширина: без fullWidth кнопки выходят
            разной ширины и средняя рвёт слитые углы, поэтому vertical живёт
            в обёртке фиксированной ширины с fullWidth у группы. */}
        <Row
          prop="orientation"
          vals={values(buttonGroupVariants, 'orientation')}
          render={(v) => (
            <div className={v === 'vertical' ? 'w-56' : undefined}>
              <ButtonGroup
                orientation={v as never}
                fullWidth={v === 'vertical'}
                variant="outline"
              >
                <Button>Заявиться</Button>
                <ButtonGroup.Separator />
                <Button>Скачать положение</Button>
                <ButtonGroup.Separator />
                <Button>Отменить</Button>
              </ButtonGroup>
            </div>
          )}
        />
        <Row
          prop="variant (наследуется кнопками)"
          vals={values(buttonVariants, 'variant')}
          render={(v) => (
            <ButtonGroup variant={v as never}>
              <Button>Заявиться</Button>
              <ButtonGroup.Separator />
              <Button>Отменить</Button>
            </ButtonGroup>
          )}
        />
        <Row
          prop="size (наследуется кнопками)"
          vals={values(buttonVariants, 'size')}
          render={(v) => (
            <ButtonGroup size={v as never} variant="secondary">
              <Button>Одиночный</Button>
              <ButtonGroup.Separator />
              <Button>Парный</Button>
            </ButtonGroup>
          )}
        />
        <Row
          prop={`fullWidth — действия по «${TOURNAMENTS[0]}»`}
          vals={['false', 'true']}
          render={(v) => (
            <div className="w-72">
              <ButtonGroup fullWidth={v === 'true'} variant="outline">
                <Button>
                  <Plus size={16} /> Заявиться
                </Button>
                <ButtonGroup.Separator />
                <Button>
                  <Download size={16} /> Положение
                </Button>
              </ButtonGroup>
            </div>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Тумблеры ───────────────────────────────────────────────────── */
export const Toggles = {
  name: 'Тумблер и группа тумблеров',
  render: () => (
    <Shell>
      <Section
        name="ToggleButton"
        note="Кнопка-состояние: два вида и три размера. Нажатость статично — defaultSelected."
      >
        <Row
          prop="variant"
          vals={values(toggleButtonVariants, 'variant')}
          render={(v) => (
            <ToggleButton variant={v as never} defaultSelected>
              Только мой город
            </ToggleButton>
          )}
        />
        <Row
          prop="size"
          vals={values(toggleButtonVariants, 'size')}
          render={(v) => <ToggleButton size={v as never}>Уведомлять</ToggleButton>}
        />
        <Row
          prop="состояния"
          vals={['отжат', 'нажат', 'недоступен']}
          render={(v) => (
            <ToggleButton defaultSelected={v === 'нажат'} isDisabled={v === 'недоступен'}>
              Парный разряд
            </ToggleButton>
          )}
        />
      </Section>

      <Section
        name="ToggleButtonGroup"
        note="Группа с выбором: selectionMode single/multiple, выбранное — defaultSelectedKeys по id кнопок. variant задаётся на каждой кнопке, size — на группе."
      >
        {/* Фильтр списка турниров: ровно один выбранный, пустого выбора не бывает. */}
        <Row
          prop="selectionMode='single' — фильтр списка"
          vals={['Все / Идут / Завершены']}
          render={() => (
            <ToggleButtonGroup
              selectionMode="single"
              defaultSelectedKeys={['run']}
              disallowEmptySelection
              aria-label="Фильтр турниров"
            >
              <ToggleButton id="all">Все</ToggleButton>
              <ToggleButton id="run">Идут</ToggleButton>
              <ToggleButton id="fin">Завершены</ToggleButton>
            </ToggleButtonGroup>
          )}
        />
        <Row
          prop="selectionMode='multiple' — города"
          vals={['несколько сразу']}
          render={() => (
            <ToggleButtonGroup
              selectionMode="multiple"
              defaultSelectedKeys={[CITIES[0], CITIES[1]]}
              aria-label="Фильтр по городам"
            >
              {CITIES.slice(0, 4).map((c) => (
                <ToggleButton key={c} id={c}>
                  {c}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          )}
        />
        {/* Вертикальной группе ширину ровняем сами: fullWidth группы даёт детям
            лишь flex-1 (в колонке это высота), поэтому кнопкам добавляем w-full
            внутри обёртки фиксированной ширины — иначе слитые углы рвутся. */}
        <Row
          prop="orientation"
          vals={values(toggleButtonGroupVariants, 'orientation')}
          render={(v) => (
            <div className={v === 'vertical' ? 'w-40' : undefined}>
              <ToggleButtonGroup
                orientation={v as never}
                fullWidth={v === 'vertical'}
                selectionMode="single"
                defaultSelectedKeys={['single']}
                aria-label="Разряд"
              >
                <ToggleButton id="single" className={v === 'vertical' ? 'w-full' : undefined}>
                  Одиночный
                </ToggleButton>
                <ToggleButton id="double" className={v === 'vertical' ? 'w-full' : undefined}>
                  Парный
                </ToggleButton>
              </ToggleButtonGroup>
            </div>
          )}
        />
        <Row
          prop="isDetached"
          vals={['false', 'true']}
          render={(v) => (
            <ToggleButtonGroup
              isDetached={v === 'true'}
              selectionMode="single"
              defaultSelectedKeys={['double']}
              aria-label="Разряд"
            >
              <ToggleButton id="single">Одиночный</ToggleButton>
              <ToggleButton id="double">Парный</ToggleButton>
            </ToggleButtonGroup>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Панель инструментов и закрытие ─────────────────────────────── */
export const Panel = {
  name: 'Панель инструментов',
  render: () => (
    <Shell>
      <Section
        name="Toolbar"
        note="role=toolbar со стрелочной навигацией — aria-label обязателен. Своего разделителя нет: берём Separator или разделители групп."
      >
        {/* Панель судьи за столом: подающий, правки и завершение матча. */}
        <Row
          prop="сборная панель судьи"
          vals={[`${PLAYERS[0].short} — ${PLAYERS[1].short}`]}
          render={() => (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <img src={PLAYERS[0].av} alt="" className="h-6 w-6 rounded-full object-cover" />
                <span>{PLAYERS[0].short}</span>
                <span className="text-neutral-400">против</span>
                <img src={PLAYERS[1].av} alt="" className="h-6 w-6 rounded-full object-cover" />
                <span>{PLAYERS[1].short}</span>
              </div>
              <Toolbar aria-label="Инструменты судьи">
                <ToggleButtonGroup
                  selectionMode="single"
                  defaultSelectedKeys={['p1']}
                  disallowEmptySelection
                  size="sm"
                  aria-label="Подающий"
                >
                  <ToggleButton id="p1">{PLAYERS[0].short}</ToggleButton>
                  <ToggleButton id="p2">{PLAYERS[1].short}</ToggleButton>
                </ToggleButtonGroup>
                <Separator orientation="vertical" className="h-6" />
                <Button isIconOnly variant="ghost" size="sm" aria-label="Правка счёта">
                  <Pencil size={16} />
                </Button>
                <Button isIconOnly variant="ghost" size="sm" aria-label="Обмен сторон">
                  <ArrowLeftRight size={16} />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button variant="danger-soft" size="sm">
                  <Flag size={16} /> Завершить матч
                </Button>
              </Toolbar>
            </div>
          )}
        />
        <Row
          prop="orientation"
          vals={values(toolbarVariants, 'orientation')}
          render={(v) => (
            <Toolbar aria-label="Инструменты судьи" orientation={v as never}>
              <Button isIconOnly variant="outline" size="sm" aria-label="Правка счёта">
                <Pencil size={16} />
              </Button>
              <Button isIconOnly variant="outline" size="sm" aria-label="Обмен сторон">
                <ArrowLeftRight size={16} />
              </Button>
              <Button isIconOnly variant="outline" size="sm" aria-label="Завершить матч">
                <Flag size={16} />
              </Button>
            </Toolbar>
          )}
        />
        {/* В слитой капсуле рамку и фон даёт сам attached-контейнер, поэтому
            дети — ghost: собственные рамки outline рисуют двойной контур. */}
        <Row
          prop="isAttached"
          vals={['false', 'true']}
          render={(v) => (
            <Toolbar aria-label="Инструменты судьи" isAttached={v === 'true'}>
              <Button isIconOnly variant="ghost" size="sm" aria-label="Правка счёта">
                <Pencil size={16} />
              </Button>
              <Button isIconOnly variant="ghost" size="sm" aria-label="Обмен сторон">
                <ArrowLeftRight size={16} />
              </Button>
              <Button isIconOnly variant="ghost" size="sm" aria-label="Завершить матч">
                <Flag size={16} />
              </Button>
            </Toolbar>
          )}
        />
      </Section>

      <Section
        name="CloseButton"
        note="Крестик встроен — children не нужны. Единственный вид, размеров нет; русский aria-label ставим сами, иначе останется зашитый «Close»."
      >
        <Row
          prop="variant"
          vals={values(closeButtonVariants, 'variant')}
          render={(v) => <CloseButton variant={v as never} aria-label="Закрыть" />}
        />
        <Row
          prop="состояния"
          vals={['обычная', 'недоступна']}
          render={(v) => <CloseButton aria-label="Закрыть" isDisabled={v === 'недоступна'} />}
        />
      </Section>
    </Shell>
  ),
};

/* ── Ссылка и клавиши ───────────────────────────────────────────── */

/* Горячие клавиши табло судьи: подпись берётся из vals строки-матрицы,
   глифы модификаторов подставляет Kbd.Abbr по keyValue. */
const SCOREBOARD_KEYS: Record<string, ReactNode> = {
  'очко слева': (
    <Kbd variant="default">
      <Kbd.Abbr keyValue="left" />
    </Kbd>
  ),
  'очко справа': (
    <Kbd variant="default">
      <Kbd.Abbr keyValue="right" />
    </Kbd>
  ),
  'отмена очка': (
    <Kbd variant="default">
      <Kbd.Abbr keyValue="ctrl" />
      <Kbd.Content>Z</Kbd.Content>
    </Kbd>
  ),
  'смена подачи': (
    <Kbd variant="default">
      <Kbd.Abbr keyValue="space" />
    </Kbd>
  ),
  'завершить партию': (
    <Kbd variant="default">
      <Kbd.Abbr keyValue="enter" />
    </Kbd>
  ),
};

export const LinksAndKeys = {
  name: 'Ссылка и клавиши',
  render: () => (
    <Shell>
      <Section
        name="Link"
        note="Вариантов нет вовсе — только слоты base и icon. Иконку внешней ссылки кладём сами в Link.Icon."
      >
        <Row
          prop="документы турнира"
          vals={['внутренняя', 'внешняя', 'недоступна']}
          render={(v) =>
            v === 'внешняя' ? (
              <Link href="https://fntrk.kz" target="_blank">
                Регламент ФНТ РК
                <Link.Icon>
                  {/* 12px — стрелка мельче текста ссылки, иначе перевешивает */}
                  <ArrowUpRight size={12} aria-hidden="true" />
                </Link.Icon>
              </Link>
            ) : (
              <Link href="#" isDisabled={v === 'недоступна'}>
                Положение — {TOURNAMENTS[0]}
              </Link>
            )
          }
        />
      </Section>

      <Section
        name="Kbd"
        note="Два вида; без variant модификатор-класс не навешивается — ставим явно. Модификаторы — Kbd.Abbr по keyValue, буквы — Kbd.Content."
      >
        <Row
          prop="variant"
          vals={values(kbdVariants, 'variant')}
          render={(v) => (
            <Kbd variant={v as never}>
              <Kbd.Abbr keyValue="ctrl" />
              <Kbd.Content>Z</Kbd.Content>
            </Kbd>
          )}
        />
        <Row
          prop="горячие клавиши табло"
          vals={Object.keys(SCOREBOARD_KEYS)}
          render={(v) => SCOREBOARD_KEYS[v]}
        />
      </Section>
    </Shell>
  ),
};
