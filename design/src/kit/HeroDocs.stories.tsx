/* Дизайн-система: справочник HeroUI 3 ✳ (30.08.2026).

   ПОЧЕМУ ОТДЕЛЬНО ОТ «ОСНОВЫ». Первая витрина показывала компоненты в одном
   виде и с придуманными свойствами: я писал `color="primary"` у кнопки и
   `variant="flat"` у чипа — это имена из версии 2, в тройке их нет вовсе.
   Компоненты от этого выглядели «никак»: неизвестное свойство молча
   игнорируется, и на экран попадает вариант по умолчанию.

   Здесь наоборот: набор вариантов взят из самого пакета. HeroUI собирает
   оформление через `tailwind-variants`, и каждый компонент экспортирует свой
   объект (`buttonVariants`, `chipVariants` и так далее) с полным перечнем
   значений. Мы читаем его в момент отрисовки и показываем ВСЕ значения —
   поэтому справочник не может разойтись с библиотекой: обновится пакет,
   обновится и он.

   Что показано: матрица «свойство × значение» для каждого компонента, у
   которого есть варианты. Структурные компоненты (таблица, модалка, календарь)
   живут в «Основе»: их нельзя отрисовать одной строкой. */

import type { ReactNode } from 'react';
import { Check, Download, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  Code,
  ButtonGroup,
  CheckboxGroup,
  RadioGroup,
  Radio,
  Separator,
  ToggleButton,
  ToggleButtonGroup,
  buttonGroupVariants,
  separatorVariants,
  toggleButtonGroupVariants,
  I18nProvider,
  Kbd,
  Link,
  Meter,
  ProgressBar,
  ProgressCircle,
  Skeleton,
  Spinner,
  Switch,
  alertVariants,
  avatarVariants,
  badgeVariants,
  buttonVariants,
  cardVariants,
  chipVariants,
  kbdVariants,
  meterVariants,
  progressBarVariants,
  progressCircleVariants,
} from '@heroui/react';
import { A } from '../fedCommon';
import './tailwind.css'; // собран из tailwind.src.css: npm run kit:css

export default {
  title: 'UI-кит/Справочник HeroUI',
  parameters: { layout: 'fullscreen' },
};

const Shell = ({ children }: { children: ReactNode }) => (
  <I18nProvider locale="ru-RU">
    <div
      data-theme="light"
      className="hero-scope min-h-screen bg-white p-7 text-neutral-900"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-10">{children}</div>
    </div>
  </I18nProvider>
);

/** Перечень значений одного свойства. Берём из объекта вариантов пакета:
    `tv()` хранит их в `.variants`, ключи `true`/`false` пропускаем — это
    булевы флаги, а не набор значений. */
function values(variants: unknown, prop: string): string[] {
  const v = (variants as { variants?: Record<string, Record<string, unknown>> })?.variants?.[prop];
  return v ? Object.keys(v).filter((k) => k !== 'true' && k !== 'false') : [];
}

/** Строка матрицы: подпись свойства и все его значения рядом. */
const Row = ({
  prop,
  vals,
  render,
}: {
  prop: string;
  vals: string[];
  render: (value: string) => ReactNode;
}) => {
  if (!vals.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {prop}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {vals.map((v) => (
          <div className="flex flex-col items-center gap-1" key={v}>
            {render(v)}
            <span className="text-[11px] text-neutral-400">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Comp = ({
  name,
  note,
  children,
}: {
  name: string;
  note?: string;
  children: ReactNode;
}) => (
  <section className="flex flex-col gap-4 border-t border-neutral-200 pt-6">
    <div>
      <h3 className="text-lg font-semibold">{name}</h3>
      {note && <p className="mt-1 text-sm text-neutral-500">{note}</p>}
    </div>
    {children}
  </section>
);

/* ── Действия ───────────────────────────────────────────────────── */
export const Buttons = {
  name: 'Кнопка',
  render: () => (
    <Shell>
      <Comp
        name="Button"
        note="Семь видов заливки и три размера — все значения взяты из buttonVariants самого пакета."
      >
        <Row
          prop="variant"
          vals={values(buttonVariants, 'variant')}
          render={(v) => <Button variant={v as never}>Заявиться</Button>}
        />
        <Row
          prop="size"
          vals={values(buttonVariants, 'size')}
          render={(v) => <Button size={v as never}>Заявиться</Button>}
        />
        <Row
          prop="состояния"
          vals={['обычная', 'недоступна', 'в работе']}
          render={(v) => (
            <Button isDisabled={v === 'недоступна'} isPending={v === 'в работе'}>
              Заявиться
            </Button>
          )}
        />
      </Comp>
    </Shell>
  ),
};

/* ── Метки ──────────────────────────────────────────────────────── */
export const Chips = {
  name: 'Метка и значок',
  render: () => (
    <Shell>
      <Comp name="Chip" note="Четыре вида, пять цветов, три размера.">
        <Row
          prop="variant"
          vals={values(chipVariants, 'variant')}
          render={(v) => <Chip variant={v as never}>Заявка принята</Chip>}
        />
        <Row
          prop="color"
          vals={values(chipVariants, 'color')}
          render={(v) => <Chip color={v as never}>Заявка принята</Chip>}
        />
        <Row
          prop="size"
          vals={values(chipVariants, 'size')}
          render={(v) => <Chip size={v as never}>Идёт</Chip>}
        />
      </Comp>

      <Comp name="Badge" note="Счётчик поверх элемента.">
        <Row
          prop="color"
          vals={values(badgeVariants, 'color')}
          render={(v) => (
            <Badge color={v as never}>
              <Avatar>
                <Avatar.Image src={A(44)} alt="" />
              </Avatar>
            </Badge>
          )}
        />
        <Row
          prop="placement"
          vals={values(badgeVariants, 'placement')}
          render={(v) => (
            <Badge placement={v as never}>
              <Avatar>
                <Avatar.Image src={A(12)} alt="" />
              </Avatar>
            </Badge>
          )}
        />
      </Comp>

      <Comp name="Kbd и Code">
        <Row
          prop="variant"
          vals={values(kbdVariants, 'variant')}
          render={(v) => <Kbd variant={v as never}>K</Kbd>}
        />
        <Row prop="Code" vals={['по умолчанию']} render={() => <Code>Э14.7</Code>} />
        <Row prop="Link" vals={['по умолчанию']} render={() => <Link href="#">Положение</Link>} />
      </Comp>
    </Shell>
  ),
};

/* ── Люди и поверхности ─────────────────────────────────────────── */
export const Surfaces = {
  name: 'Аватар и карточка',
  render: () => (
    <Shell>
      <Comp name="Avatar">
        <Row
          prop="size"
          vals={values(avatarVariants, 'size')}
          render={(v) => (
            <Avatar size={v as never}>
              <Avatar.Image src={A(44)} alt="" />
            </Avatar>
          )}
        />
        <Row
          prop="variant"
          vals={values(avatarVariants, 'variant')}
          render={(v) => (
            <Avatar variant={v as never}>
              <Avatar.Image src={A(23)} alt="" />
            </Avatar>
          )}
        />
        <Row
          prop="color"
          vals={values(avatarVariants, 'color')}
          render={(v) => <Avatar color={v as never}>КГ</Avatar>}
        />
      </Comp>

      <Comp name="Card" note="Четыре вида подложки.">
        <Row
          prop="variant"
          vals={values(cardVariants, 'variant')}
          render={(v) => (
            <Card variant={v as never} className="w-48">
              <Card.Header>
                <Card.Title>Кубок Алматы</Card.Title>
                <Card.Description>1/8 финала</Card.Description>
              </Card.Header>
            </Card>
          )}
        />
      </Comp>
    </Shell>
  ),
};

/* ── Сообщения и показатели ─────────────────────────────────────── */
export const Status = {
  name: 'Сообщения и показатели',
  render: () => (
    <Shell>
      <Comp name="Alert" note="Пять состояний.">
        <Row
          prop="status"
          vals={values(alertVariants, 'status')}
          render={(v) => (
            <Alert status={v as never} className="w-72">
              <Alert.Title>Заявка</Alert.Title>
              <Alert.Description>Решение придёт уведомлением.</Alert.Description>
            </Alert>
          )}
        />
      </Comp>

      <Comp name="ProgressBar и ProgressCircle">
        <Row
          prop="color"
          vals={values(progressBarVariants, 'color')}
          render={(v) => <ProgressBar aria-label="Ход" value={60} color={v as never} className="w-32" />}
        />
        <Row
          prop="size"
          vals={values(progressBarVariants, 'size')}
          render={(v) => <ProgressBar aria-label="Ход" value={60} size={v as never} className="w-32" />}
        />
        <Row
          prop="color (кругом)"
          vals={values(progressCircleVariants, 'color')}
          render={(v) => <ProgressCircle aria-label="Ход" value={70} color={v as never} />}
        />
      </Comp>

      <Comp name="Meter">
        <Row
          prop="color"
          vals={values(meterVariants, 'color')}
          render={(v) => <Meter aria-label="Заполнено" value={64} color={v as never} className="w-32" />}
        />
      </Comp>

      <Comp name="Spinner, Skeleton, Checkbox, Switch">
        <Row prop="Spinner" vals={['по умолчанию']} render={() => <Spinner />} />
        <Row
          prop="Skeleton"
          vals={['по умолчанию']}
          render={() => <Skeleton className="h-3 w-24" />}
        />
        <Row
          prop="Checkbox"
          vals={['выключен', 'включён']}
          render={(v) => <Checkbox defaultSelected={v === 'включён'}>Согласен</Checkbox>}
        />
        <Row
          prop="Switch"
          vals={['выключен', 'включён']}
          render={(v) => <Switch defaultSelected={v === 'включён'}>Уведомления</Switch>}
        />
      </Comp>
    </Shell>
  ),
};

/* ── Кнопки с иконками ──────────────────────────────────────────── */
export const Icons = {
  name: 'Кнопки с иконками',
  render: () => (
    <Shell>
      <Comp
        name="Иконка и подпись"
        note="Иконка ставится ребёнком рядом с текстом — отдельного свойства для неё нет."
      >
        <Row
          prop="иконка слева"
          vals={values(buttonVariants, 'variant')}
          render={(v) => (
            <Button variant={v as never}>
              <Plus size={16} /> Заявиться
            </Button>
          )}
        />
        <Row
          prop="иконка справа"
          vals={['primary', 'outline']}
          render={(v) => (
            <Button variant={v as never}>
              Скачать <Download size={16} />
            </Button>
          )}
        />
      </Comp>

      <Comp
        name="Только иконка"
        note="`isIconOnly` делает кнопку квадратной по высоте размера — подпись обязательна для читалки."
      >
        <Row
          prop="variant"
          vals={values(buttonVariants, 'variant')}
          render={(v) => (
            <Button isIconOnly variant={v as never} aria-label="Изменить">
              <Pencil size={16} />
            </Button>
          )}
        />
        <Row
          prop="size"
          vals={values(buttonVariants, 'size')}
          render={(v) => (
            <Button isIconOnly size={v as never} aria-label="Поиск">
              <Search size={16} />
            </Button>
          )}
        />
        <Row
          prop="назначение"
          vals={['подтвердить', 'удалить', 'закрыть']}
          render={(v) => (
            <Button
              isIconOnly
              variant={v === 'удалить' ? ('danger' as never) : ('outline' as never)}
              aria-label={v}
            >
              {v === 'подтвердить' ? <Check size={16} /> : v === 'удалить' ? <Trash2 size={16} /> : <X size={16} />}
            </Button>
          )}
        />
      </Comp>
    </Shell>
  ),
};

/* ── Расположение ───────────────────────────────────────────────── */
export const Orientation = {
  name: 'Расположение',
  render: () => (
    <Shell>
      <Comp
        name="ButtonGroup"
        note="Горизонтально и вертикально — значения взяты из buttonGroupVariants."
      >
        <Row
          prop="orientation"
          vals={values(buttonGroupVariants, 'orientation')}
          render={(v) => (
            <ButtonGroup orientation={v as never}>
              <Button variant="outline">Все</Button>
              <Button variant="outline">Идут</Button>
              <Button variant="outline">Завершены</Button>
            </ButtonGroup>
          )}
        />
        <Row
          prop="fullWidth"
          vals={['false', 'true']}
          render={(v) => (
            <div className="w-56">
              <ButtonGroup fullWidth={v === 'true'}>
                <Button variant="outline">Все</Button>
                <Button variant="outline">Идут</Button>
              </ButtonGroup>
            </div>
          )}
        />
      </Comp>

      <Comp name="ToggleButtonGroup">
        <Row
          prop="orientation"
          vals={values(toggleButtonGroupVariants, 'orientation')}
          render={(v) => (
            <ToggleButtonGroup orientation={v as never}>
              <ToggleButton id="s">Одиночный</ToggleButton>
              <ToggleButton id="d">Парный</ToggleButton>
            </ToggleButtonGroup>
          )}
        />
        <Row
          prop="isDetached"
          vals={['false', 'true']}
          render={(v) => (
            <ToggleButtonGroup isDetached={v === 'true'}>
              <ToggleButton id="s">Одиночный</ToggleButton>
              <ToggleButton id="d">Парный</ToggleButton>
            </ToggleButtonGroup>
          )}
        />
      </Comp>

      <Comp name="Separator">
        <Row
          prop="orientation"
          vals={values(separatorVariants, 'orientation')}
          render={(v) =>
            v === 'vertical' ? (
              <div className="flex h-12 items-center gap-3">
                <span className="text-sm">Астана</span>
                <Separator orientation="vertical" />
                <span className="text-sm">Алматы</span>
              </div>
            ) : (
              <div className="w-40">
                <Separator />
              </div>
            )
          }
        />
      </Comp>

      <Comp name="Группы выбора" note="У флажков и радио расположение задаётся orientation.">
        {/* У CheckboxGroup в тройке свойства orientation нет — проверено по
            типам пакета; показываем только то, что есть. */}
        <Row
          prop="RadioGroup"
          vals={['vertical', 'horizontal']}
          render={(v) => (
            <RadioGroup aria-label="Язык" orientation={v as never} defaultValue="ru">
              <Radio value="ru">Русский</Radio>
              <Radio value="kk">Қазақша</Radio>
            </RadioGroup>
          )}
        />
      </Comp>
    </Shell>
  ),
};
