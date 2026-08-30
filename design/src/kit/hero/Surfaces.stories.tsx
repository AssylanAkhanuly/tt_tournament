/* HeroUI 3 · группа 07: поверхности и статус.

   Подложки (Card, Surface), люди и метки (Avatar, Badge, Chip, Separator)
   и всё, что сообщает состояние (Alert, ProgressBar/Circle, Meter, Spinner,
   Skeleton). Структура частей — из типов пакета, значения — из `*Variants`. */

import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Meter,
  ProgressBar,
  ProgressCircle,
  Separator,
  Skeleton,
  Spinner,
  Surface,
  alertVariants,
  avatarVariants,
  badgeVariants,
  cardVariants,
  chipVariants,
  meterVariants,
  progressBarVariants,
  progressCircleVariants,
  separatorVariants,
  skeletonVariants,
  spinnerVariants,
  surfaceVariants,
} from '@heroui/react';
import { CalendarDays, Check, Clock3, MapPin, X } from 'lucide-react';
import { CITIES, PLAYERS, Row, Section, Shell, TOURNAMENTS, values } from './HeroKit';

export default {
  title: 'UI-кит/HeroUI/07 · Поверхности и статус',
  parameters: { layout: 'fullscreen' },
};

/* Инициалы из «Фамилия Имя» — для запасного содержимого аватара. */
const init = (nm: string) =>
  nm
    .split(' ')
    .map((w) => w.charAt(0))
    .join('');

/* ── Подложки ───────────────────────────────────────────────────── */
export const Cards = {
  name: 'Card и Surface',
  render: () => (
    <Shell>
      <Section
        name="Card"
        note="Карточка из слотов Header (Title + Description), Content и Footer; четыре вида подложки. Обязателен только корень."
      >
        <Row
          prop="variant"
          vals={values(cardVariants, 'variant')}
          render={(v) => (
            <Card variant={v as never} className="w-44">
              <Card.Header>
                <Card.Title>{TOURNAMENTS[2]}</Card.Title>
                <Card.Description>{CITIES[1]}</Card.Description>
              </Card.Header>
            </Card>
          )}
        />
        <Row
          prop="карточка турнира"
          vals={['все слоты']}
          render={() => (
            <Card className="w-80">
              <Card.Header>
                <Card.Title>{TOURNAMENTS[0]}</Card.Title>
                <Card.Description>12–14 сентября 2026 · {CITIES[0]}</Card.Description>
              </Card.Header>
              <Card.Content className="flex flex-col gap-2 text-sm text-neutral-600">
                <span className="flex items-center gap-2">
                  <CalendarDays size={16} /> Приём заявок до 5 сентября
                </span>
                <span className="flex items-center gap-2">
                  <MapPin size={16} /> Дворец спорта, {CITIES[0]}
                </span>
              </Card.Content>
              <Card.Footer className="flex items-center justify-between">
                <Chip color="success" variant="soft">
                  Заявки открыты
                </Chip>
                <Button>Заявиться</Button>
              </Card.Footer>
            </Card>
          )}
        />
      </Section>

      <Section
        name="Surface"
        note="Голая поверхность без слотов — те же четыре варианта, что у Card; отступы задаются самому."
      >
        <Row
          prop="variant"
          vals={values(surfaceVariants, 'variant')}
          render={(v) => (
            <Surface variant={v as never} className="w-44 p-4 text-sm">
              Матчи 3-го тура
            </Surface>
          )}
        />
        <Row
          prop="вложенность"
          vals={['default → secondary → tertiary']}
          render={() => (
            <Surface className="w-72 p-4 text-sm">
              Сетка турнира
              <Surface variant="secondary" className="mt-3 p-3">
                Группа А
                <Surface variant="tertiary" className="mt-2 p-2">
                  {PLAYERS[0].short} — {PLAYERS[1].short}
                </Surface>
              </Surface>
            </Surface>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Люди и счётчики ────────────────────────────────────────────── */
export const Avatars = {
  name: 'Avatar и Badge',
  render: () => (
    <Shell>
      <Section
        name="Avatar"
        note="Radix-аватар: Image рендерится только после загрузки, поэтому Fallback с инициалами обязателен. Пять цветов (красят fallback), три размера, два вида."
      >
        <Row
          prop="size"
          vals={values(avatarVariants, 'size')}
          render={(v) => (
            <Avatar size={v as never}>
              <Avatar.Image alt={PLAYERS[0].nm} src={PLAYERS[0].av} />
              <Avatar.Fallback>{init(PLAYERS[0].nm)}</Avatar.Fallback>
            </Avatar>
          )}
        />
        <Row
          prop="variant"
          vals={values(avatarVariants, 'variant')}
          render={(v) => (
            <Avatar variant={v as never}>
              <Avatar.Image alt={PLAYERS[2].nm} src={PLAYERS[2].av} />
              <Avatar.Fallback>{init(PLAYERS[2].nm)}</Avatar.Fallback>
            </Avatar>
          )}
        />
        {/* Без Image остаётся один Fallback — так видно, что именно красит color. */}
        <Row
          prop="color"
          vals={values(avatarVariants, 'color')}
          render={(v) => (
            <Avatar color={v as never}>
              <Avatar.Fallback>{init(PLAYERS[3].nm)}</Avatar.Fallback>
            </Avatar>
          )}
        />
        <Row
          prop="игроки"
          vals={['фото и инициалы']}
          render={() => (
            <div className="flex items-center gap-2">
              {PLAYERS.slice(0, 4).map((p) => (
                <Avatar key={p.nm}>
                  <Avatar.Image alt={p.nm} src={p.av} />
                  <Avatar.Fallback>{init(p.nm)}</Avatar.Fallback>
                </Avatar>
              ))}
              <Avatar color="accent">
                <Avatar.Fallback>{init(PLAYERS[5].nm)}</Avatar.Fallback>
              </Avatar>
            </div>
          )}
        />
      </Section>

      <Section
        name="Badge"
        note="Пилюля-счётчик. Живёт ТОЛЬКО внутри Badge.Anchor: placement (по умолчанию top-right) всегда позиционирует её абсолютно, и без якоря бейдж улетает к краю страницы — так и сломался прошлый справочник."
      >
        {/* Каждая ячейка матрицы — свой якорь: голый Badge вне Anchor
            позиционируется относительно страницы. */}
        <Row
          prop="variant"
          vals={values(badgeVariants, 'variant')}
          render={(v) => (
            <Badge.Anchor>
              <Avatar size="sm">
                <Avatar.Image alt={PLAYERS[2].nm} src={PLAYERS[2].av} />
                <Avatar.Fallback>{init(PLAYERS[2].nm)}</Avatar.Fallback>
              </Avatar>
              <Badge variant={v as never}>3</Badge>
            </Badge.Anchor>
          )}
        />
        <Row
          prop="color"
          vals={values(badgeVariants, 'color')}
          render={(v) => (
            <Badge.Anchor>
              <Avatar size="sm">
                <Avatar.Image alt={PLAYERS[3].nm} src={PLAYERS[3].av} />
                <Avatar.Fallback>{init(PLAYERS[3].nm)}</Avatar.Fallback>
              </Avatar>
              <Badge color={v as never}>3</Badge>
            </Badge.Anchor>
          )}
        />
        <Row
          prop="size"
          vals={values(badgeVariants, 'size')}
          render={(v) => (
            <Badge.Anchor>
              <Avatar size="sm">
                <Avatar.Image alt={PLAYERS[4].nm} src={PLAYERS[4].av} />
                <Avatar.Fallback>{init(PLAYERS[4].nm)}</Avatar.Fallback>
              </Avatar>
              <Badge size={v as never}>3</Badge>
            </Badge.Anchor>
          )}
        />
        <Row
          prop="placement"
          vals={values(badgeVariants, 'placement')}
          render={(v) => (
            <Badge.Anchor>
              <Avatar>
                <Avatar.Image alt={PLAYERS[1].nm} src={PLAYERS[1].av} />
                <Avatar.Fallback>{init(PLAYERS[1].nm)}</Avatar.Fallback>
              </Avatar>
              <Badge color="danger" placement={v as never}>
                3
              </Badge>
            </Badge.Anchor>
          )}
        />
        <Row
          prop="в деле"
          vals={['непрочитанные', 'в сети (точка)']}
          render={(v) => (
            <Badge.Anchor>
              <Avatar size="lg">
                <Avatar.Image alt={PLAYERS[0].nm} src={PLAYERS[0].av} />
                <Avatar.Fallback>{init(PLAYERS[0].nm)}</Avatar.Fallback>
              </Avatar>
              {v === 'непрочитанные' ? (
                <Badge color="danger">5</Badge>
              ) : (
                /* «Точка» статуса — пустой Badge наименьшего размера; формы
                   «круг» у бейджа нет, поэтому докручиваем rounded-full. */
                <Badge className="rounded-full" color="success" placement="bottom-right" size="sm" />
              )}
            </Badge.Anchor>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Метки и разделитель ────────────────────────────────────────── */
export const Chips = {
  name: 'Chip и Separator',
  render: () => (
    <Shell>
      <Section
        name="Chip"
        note="Статусная метка: четыре вида, пять цветов, три размера. Не интерактивна — крестик закрытия при нужде собирается руками."
      >
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
        {/* Рядом с иконкой текст оборачиваем в Chip.Label вручную —
            автоматическая обёртка работает только для голой строки. */}
        <Row
          prop="статусы заявки"
          vals={['принята', 'на рассмотрении', 'отклонена']}
          render={(v) => (
            <Chip
              color={v === 'принята' ? 'success' : v === 'на рассмотрении' ? 'warning' : 'danger'}
              variant="soft"
            >
              {v === 'принята' ? (
                <Check size={16} />
              ) : v === 'на рассмотрении' ? (
                <Clock3 size={16} />
              ) : (
                <X size={16} />
              )}
              <Chip.Label>{v.charAt(0).toUpperCase() + v.slice(1)}</Chip.Label>
            </Chip>
          )}
        />
      </Section>

      <Section
        name="Separator"
        note="Разделитель с role=«separator», без children; вертикальному нужна flex-строка с высотой от родителя."
      >
        <Row
          prop="orientation"
          vals={values(separatorVariants, 'orientation')}
          render={(v) =>
            v === 'vertical' ? (
              <div className="flex h-10 items-center gap-3 text-sm">
                <span>{CITIES[0]}</span>
                <Separator orientation="vertical" />
                <span>{CITIES[1]}</span>
              </div>
            ) : (
              <div className="w-40">
                <Separator />
              </div>
            )
          }
        />
        <Row
          prop="variant"
          vals={values(separatorVariants, 'variant')}
          render={(v) => (
            <div className="w-40">
              <Separator variant={v as never} />
            </div>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Сообщения ──────────────────────────────────────────────────── */
export const Alerts = {
  name: 'Alert',
  render: () => (
    <Shell>
      <Section
        name="Alert"
        note="Статичный блок в потоке (не тост), пять статусов. Проп называется status и красит всё; Indicator без children сам подставляет иконку статуса."
      >
        <Row
          prop="status"
          vals={values(alertVariants, 'status')}
          render={(v) => (
            <Alert status={v as never} className="w-80">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Заявка на {TOURNAMENTS[2]}</Alert.Title>
                <Alert.Description>Решение придёт уведомлением.</Alert.Description>
              </Alert.Content>
            </Alert>
          )}
        />
        <Row
          prop="перенос матча"
          vals={['warning']}
          render={() => (
            <Alert status="warning" className="max-w-xl">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Матч перенесён</Alert.Title>
                <Alert.Description>
                  Встреча {PLAYERS[0].short} — {PLAYERS[1].short} перенесена на стол 4, начало в
                  14:30. Расписание тура обновлено.
                </Alert.Description>
              </Alert.Content>
            </Alert>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Показатели хода ────────────────────────────────────────────── */
export const Progress = {
  name: 'Прогресс и заполненность',
  render: () => (
    <Shell>
      <Section
        name="ProgressBar"
        note="Корень держит value и раздаёт его контекстом; видимую полосу дают обязательные Track + Fill, Output без children печатает «60%». Пять цветов, три размера."
      >
        <Row
          prop="color"
          vals={values(progressBarVariants, 'color')}
          render={(v) => (
            <ProgressBar aria-label="Ход загрузки" color={v as never} value={60} className="w-40">
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
          )}
        />
        <Row
          prop="size"
          vals={values(progressBarVariants, 'size')}
          render={(v) => (
            <ProgressBar aria-label="Ход загрузки" size={v as never} value={60} className="w-40">
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
          )}
        />
        <Row
          prop="загрузка протокола"
          vals={['60%', 'без значения']}
          render={(v) => (
            <ProgressBar
              aria-label="Загрузка протокола матча"
              isIndeterminate={v === 'без значения'}
              value={60}
              className="flex w-72 flex-col gap-1"
            >
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
              {v === '60%' && <ProgressBar.Output />}
            </ProgressBar>
          )}
        />
      </Section>

      <Section
        name="ProgressCircle"
        note="Тот же react-aria-прогресс кольцом: обязательна цепочка Track → TrackCircle + FillCircle, дуга считается из value автоматически."
      >
        <Row
          prop="color"
          vals={values(progressCircleVariants, 'color')}
          render={(v) => (
            <ProgressCircle aria-label="Ход тура" color={v as never} value={70}>
              <ProgressCircle.Track>
                <ProgressCircle.TrackCircle />
                <ProgressCircle.FillCircle />
              </ProgressCircle.Track>
            </ProgressCircle>
          )}
        />
        <Row
          prop="size"
          vals={values(progressCircleVariants, 'size')}
          render={(v) => (
            <ProgressCircle aria-label="Ход тура" size={v as never} value={70}>
              <ProgressCircle.Track>
                <ProgressCircle.TrackCircle />
                <ProgressCircle.FillCircle />
              </ProgressCircle.Track>
            </ProgressCircle>
          )}
        />
      </Section>

      <Section
        name="Meter"
        note="Уровень, а не процесс: role=«meter», isIndeterminate нет. Анатомия как у ProgressBar; Output с children печатает свой текст."
      >
        <Row
          prop="color"
          vals={values(meterVariants, 'color')}
          render={(v) => (
            <Meter aria-label="Заполненность сетки" color={v as never} maxValue={32} value={24} className="w-40">
              <Meter.Track>
                <Meter.Fill />
              </Meter.Track>
            </Meter>
          )}
        />
        <Row
          prop="size"
          vals={values(meterVariants, 'size')}
          render={(v) => (
            <Meter aria-label="Заполненность сетки" maxValue={32} size={v as never} value={24} className="w-40">
              <Meter.Track>
                <Meter.Fill />
              </Meter.Track>
            </Meter>
          )}
        />
        <Row
          prop="сетка турнира"
          vals={['24 из 32']}
          render={() => (
            <Meter aria-label="Заполненность сетки" maxValue={32} value={24} className="flex w-72 flex-col gap-1">
              <Meter.Track>
                <Meter.Fill />
              </Meter.Track>
              <Meter.Output>24 из 32 мест занято</Meter.Output>
            </Meter>
          )}
        />
      </Section>
    </Shell>
  ),
};

/* ── Ожидание ───────────────────────────────────────────────────── */
export const Loading = {
  name: 'Spinner и Skeleton',
  render: () => (
    <Shell>
      <Section
        name="Spinner"
        note="Однострочный волчок; в наборе цветов нет default, зато есть current — наследует цвет родителя (для спиннера в кнопке). Единственный с размером xl."
      >
        <Row
          prop="color"
          vals={values(spinnerVariants, 'color')}
          render={(v) =>
            v === 'current' ? (
              /* current красится в currentColor — оборачиваем в серый текст, чтобы это было видно. */
              <span className="text-neutral-400">
                <Spinner aria-label="Загрузка" color="current" />
              </span>
            ) : (
              <Spinner aria-label="Загрузка" color={v as never} />
            )
          }
        />
        <Row
          prop="size"
          vals={values(spinnerVariants, 'size')}
          render={(v) => <Spinner aria-label="Загрузка" size={v as never} />}
        />
        <Row
          prop="в кнопке"
          vals={['color=current']}
          render={() => (
            <Button>
              <Spinner aria-label="Отправка заявки" color="current" size="sm" />
              Отправка…
            </Button>
          )}
        />
      </Section>

      <Section
        name="Skeleton"
        note="Заглушка без собственных размеров — высоту и ширину задаёт className. Показ и скрытие — своим условным рендером, isLoaded из v2 нет."
      >
        <Row
          prop="animationType"
          vals={values(skeletonVariants, 'animationType')}
          render={(v) => <Skeleton animationType={v as never} className="h-4 w-40" />}
        />
        <Row
          prop="скелет карточки матча"
          vals={['загрузка']}
          render={() => (
            <Card className="w-80">
              <Card.Content className="flex flex-col gap-4">
                {/* Две строки игроков: круг под фото, две полоски текста, счёт справа. */}
                {[0, 1].map((i) => (
                  <div className="flex items-center gap-3" key={i}>
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex flex-1 flex-col gap-2">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-10" />
                  </div>
                ))}
              </Card.Content>
            </Card>
          )}
        />
      </Section>
    </Shell>
  ),
};
