import type { CSSProperties, ReactNode } from 'react';
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Grid2x2,
  Inbox,
  LayoutDashboard,
  MapPin,
  Network,
  Play,
  Search,
  Send,
  Trophy,
  Users,
} from 'lucide-react';
import {
  Avatar,
  AvatarStack,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  Divider,
  EmptyState,
  Field,
  IconButton,
  Input,
  KeyValue,
  LiveBadge,
  MatchRow,
  Modal,
  Nav,
  NavItem,
  Notice,
  Pagination,
  Panel,
  Pill,
  Progress,
  Radio,
  RadioGroup,
  RankRow,
  RatingDelta,
  RowItem,
  ScoreInput,
  SearchField,
  SectionTitle,
  SeedBadge,
  Segmented,
  Select,
  Skeleton,
  Spinner,
  Stat,
  Stats,
  Steps,
  Stepper,
  Switch,
  Table,
  TableTile,
  Tabs,
  Textarea,
  Timeline,
  Toast,
  Tooltip,
} from './index';

/* Витрины примитивов. Всё нарисовано на токенах, поэтому переключатель «Тема»
   в тулбаре перекрашивает эти страницы и живые экраны одинаково. */

const A = (n: number) => `https://randomuser.me/api/portraits/men/${n}.jpg`;
const AW = (n: number) => `https://randomuser.me/api/portraits/women/${n}.jpg`;
const page: CSSProperties = { background: 'var(--c-bg)', color: 'var(--c-text)', padding: 32, display: 'grid', gap: 26 };

function Page({ title, lead, children }: { title: string; lead: ReactNode; children: ReactNode }) {
  return (
    <div style={page}>
      <header style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em' }}>{title}</h1>
        <p style={{ fontSize: 13, color: 'var(--c-text-3)', lineHeight: 1.55, maxWidth: 800 }}>{lead}</p>
      </header>
      {children}
    </div>
  );
}

function Block({ title, note, dark = true, children }: { title: string; note: string; dark?: boolean; children: ReactNode }) {
  return (
    <section style={{ display: 'grid', gap: 10 }}>
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>{title}</h2>
        <div style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: 4, maxWidth: 760, lineHeight: 1.5 }}>{note}</div>
      </div>
      <div className={dark ? 'ui-canvas' : 'ui-canvas ui-canvas--light'}>{children}</div>
    </section>
  );
}

const cols2: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };

/* ═══════════ 1. Основа ═══════════ */

export function GalleryBase() {
  return (
    <Page
      title="Основа"
      lead={
        <>
          Стекло и статусы: кнопка, карточка, панель, пилюля, значок, плитка, аватар, кнопка-иконка. Часть примитивов —
          типизированная обёртка над классами макетного слоя (<code>gen/frame.css</code>): у стиля один источник, поэтому
          экраны и компоненты не разъезжаются.
        </>
      }
    >
      <Block title="Кнопка · Button" note="Пять вариантов и три размера. Заливка, тень и текст — от токенов акцента и статусов.">
        <div className="ui-row">
          <Button>Записаться</Button>
          <Button variant="success" icon={<CheckCircle2 size={15} />}>
            Подтвердить счёт
          </Button>
          <Button variant="broadcast" icon={<Play size={14} />}>
            Смотреть трансляцию
          </Button>
          <Button variant="ghost">Отменить</Button>
          <Button variant="quiet">Все матчи →</Button>
        </div>
        <div className="ui-row">
          <Button size="sm">Мелкая</Button>
          <Button size="md">Обычная</Button>
          <Button size="lg">Крупная</Button>
        </div>
        <Button size="lg" block variant="success" icon={<Send size={16} />}>
          Отправить результат в федерацию
        </Button>
      </Block>

      <Block title="Пилюля · Pill и значок · Badge" note="Статусы матча и заявки. Подложка — прозрачный вариант того же токена, что и текст.">
        <div className="ui-row">
          <Pill tone="live" dot>
            ИДЁТ
          </Pill>
          <Pill tone="reg">ЗАЯВКА ОТКРЫТА</Pill>
          <Pill tone="done">ЗАВЕРШЁН</Pill>
          <Pill tone="wait">ЖДЁТ ПОДТВЕРЖДЕНИЯ</Pill>
          <Pill tone="bad">ОТКЛОНЕНО</Pill>
          <Pill tone="up">+31</Pill>
          <Pill tone="down">−4</Pill>
          <Badge tone="win" />
          <Badge tone="loss" />
        </div>
      </Block>

      <Block title="Плитка · Stat" note="Сводка турнира: значение крупно, подпись мелко. Тон задаёт смысл.">
        <Stats>
          <Stat value="128" label="Участников" />
          <Stat value="12" label="Идут сейчас" tone="b" />
          <Stat value="60" label="Завершено" tone="g" />
          <Stat value="2" label="Отказы" tone="r" />
        </Stats>
      </Block>

      <Block title="Карточка · Card, панель · Panel" note="Стекло: полупрозрачная заливка, светлая грань сверху, мягкая тень.">
        <div style={cols2}>
          <Card>
            <div className="pcard">
              <Avatar src={A(76)} />
              <span className="who">
                <div className="nm">Оспанов Т.</div>
                <div className="mt">Главный судья · Астана</div>
              </span>
              <span className="rt">
                <div className="k">Рейтинг</div>
                <div className="v">2 148</div>
              </span>
            </div>
          </Card>
          <Card live>
            <div className="pcard">
              <Avatar src={A(32)} />
              <span className="who">
                <div className="nm">Смагулов А.</div>
                <div className="mt">Стол 3 · идёт партия</div>
              </span>
              <span className="rt">
                <div className="k">Счёт</div>
                <div className="v">2 : 1</div>
              </span>
            </div>
          </Card>
        </div>
        <Panel title="Идут и очередь" extra={<Segmented items={['Сетка', 'Группы']} active="Сетка" />}>
          <SectionTitle>Идут сейчас</SectionTitle>
          <MatchRow home={{ name: 'Смагулов А.', avatar: A(32) }} away={{ name: 'Токаев М.', avatar: A(12) }} score="2 : 1" note="стол 3" winner="home" live />
        </Panel>
      </Block>

      <Block title="Аватар, кнопка-иконка, заголовок, поле-значение" note="Мелкие детали: фото с кольцом, стопка фото, стеклянная кнопка с точкой уведомления. На жёлтой пилюле — подсказка Tooltip, наведите курсор.">
        <div className="ui-row">
          <Avatar src={A(76)} />
          <Avatar src={AW(44)} size="sm" />
          <AvatarStack srcs={[A(12), A(45)]} />
          <IconButton>
            <Search size={16} />
          </IconButton>
          <IconButton dot>
            <Bell size={16} />
          </IconButton>
          <Tooltip text="Матч начнётся, когда судья займёт стол">
            <Pill tone="wait">ЖДЁТ СТОЛА</Pill>
          </Tooltip>
        </div>
        <SectionTitle>Ожидают вызова</SectionTitle>
        <div style={cols2}>
          <Field label="Название турнира">Кубок Республики Казахстан</Field>
          <Field label="Формат">
            <Segmented items={['Олимпийская', 'Круговая', 'Смешанная']} active="Олимпийская" />
          </Field>
        </div>
      </Block>
    </Page>
  );
}

/* ═══════════ 2. Формы ═══════════ */

export function GalleryForms() {
  return (
    <Page
      title="Формы"
      lead="Ввод данных: поля, списки, флажки, тумблеры, счётчик. Все состояния — обычное, в фокусе, с ошибкой, выключенное — задаются пропами, а не копипастой стилей."
    >
      <Block title="Поле · Input" note="Подпись сверху, подсказка или ошибка снизу; слева можно поставить иконку, справа — единицу измерения.">
        <div style={cols2}>
          <Input label="Название турнира" value="Кубок Республики Казахстан" />
          <Input label="Город" placeholder="Начните вводить" icon={<MapPin size={15} />} />
          <Input label="Взнос с участника" value="5000" suffix="₸" hint="Списывается при подтверждении заявки" />
          <Input label="Дата начала" value="14.03.2026" icon={<CalendarDays size={15} />} focused />
          <Input label="Количество столов" value="0" error="Нужен хотя бы один стол" />
          <Input label="Организатор" value="ФНТ РК" disabled />
        </div>
        <SearchField />
        <Textarea label="Регламент" rows={3} placeholder="Короткое описание условий турнира" hint="Видно игрокам в карточке турнира" />
      </Block>

      <Block title="Список · Select, флажок · Checkbox, переключатель · Radio" note="Выбор из готовых вариантов. Флажки — множественный выбор, переключатели — один из нескольких.">
        <div style={cols2}>
          <Select label="Разряд" options={['Одиночный', 'Парный', 'Смешанный парный', 'Командный']} />
          <Select label="Возрастная категория" options={['Без ограничений', 'До 15 лет', 'До 19 лет', 'Ветераны 40+']} />
        </div>
        <Divider label="Условия" />
        <div style={cols2}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <Checkbox label="Публиковать в календаре федерации" sub="Турнир увидят все игроки" defaultChecked />
            <Checkbox label="Требовать подтверждение врача" />
            <Checkbox label="Разрешить замену игрока" disabled />
          </div>
          <RadioGroup name="draw" items={['Жеребьёвка автоматическая', 'Посев по рейтингу', 'Ручная расстановка']} value="Посев по рейтингу" />
        </div>
      </Block>

      <Block title="Тумблер · Switch и счётчик · Stepper" note="Тумблер — мгновенное действие без «Сохранить». Счётчик — ввод очка судьёй стола.">
        <div className="ui-row" style={{ gap: 22 }}>
          <Switch label="Показывать сетку зрителям" defaultChecked />
          <Switch label="Уведомления о вызове" />
          <Switch label="Трансляция" disabled />
        </div>
        <div className="ui-row" style={{ gap: 22 }}>
          <Stepper value={9} />
          <Stepper value={7} />
        </div>
      </Block>
    </Page>
  );
}

/* ═══════════ 3. Навигация ═══════════ */

export function GalleryNav() {
  return (
    <Page title="Навигация" lead="Как пользователь перемещается: вкладки внутри экрана, боковое меню роли, крошки, страницы длинных реестров и шаги мастера.">
      <Block title="Вкладки · Tabs" note="Переключение внутри одного экрана. Счётчик рядом с названием — сколько записей в разделе.">
        <Tabs
          items={[
            { id: 'all', label: 'Все матчи', count: 128 },
            { id: 'live', label: 'Идут', count: 12 },
            { id: 'wait', label: 'Ждут стола', count: 8 },
            { id: 'done', label: 'Завершены', count: 60 },
          ]}
          active="live"
        />
      </Block>

      <Block title="Боковое меню · Nav" note="Разделы роли. Значок справа — количество требующих внимания записей.">
        <Nav className="ui-nav-demo">
          <NavItem icon={<LayoutDashboard size={18} />} active>
            Обзор
          </NavItem>
          <NavItem icon={<Network size={18} />}>Сетка</NavItem>
          <NavItem icon={<Users size={18} />} badge={3}>
            Игроки
          </NavItem>
          <NavItem icon={<Grid2x2 size={18} />}>Столы</NavItem>
          <NavItem icon={<Trophy size={18} />}>Итоги</NavItem>
        </Nav>
      </Block>

      <Block title="Крошки · Breadcrumbs и страницы · Pagination" note="Крошки показывают, где мы внутри календаря; страницы — для реестров игроков и судей.">
        <Breadcrumbs items={['Календарь', 'Чемпионат Казахстана 2026', 'Сетка', '1/8 финала']} />
        <Pagination page={3} total={12} />
      </Block>

      <Block title="Шаги · Steps" note="Мастер заявки: пройденные шаги — зелёные, текущий — акцентный с кольцом.">
        <Steps items={['Заявка', 'Оплата взноса', 'Подтверждение', 'Жеребьёвка']} current={2} />
      </Block>
    </Page>
  );
}

/* ═══════════ 4. Данные ═══════════ */

export function GalleryData() {
  return (
    <Page title="Данные" lead="Показ содержимого: таблица реестра, строки-карточки, пары «ключ — значение», прогресс, состояния загрузки и пустоты, лента событий.">
      <Block title="Таблица · Table" note="Реестр: заголовки капсом, числовые колонки выровнены вправо табличными цифрами.">
        <Table
          columns={[
            { key: 'p', title: '#', num: true },
            { key: 'name', title: 'Игрок' },
            { key: 'city', title: 'Город' },
            { key: 'games', title: 'Матчи', num: true },
            { key: 'pts', title: 'Рейтинг', num: true },
            { key: 'delta', title: 'Δ', num: true },
          ]}
          rows={[
            { p: 1, name: 'Ахметов Данияр', city: 'Астана', games: 128, pts: '2 148', delta: <RatingDelta value={12} /> },
            { p: 2, name: 'Ким Сергей', city: 'Алматы', games: 117, pts: '2 097', delta: <RatingDelta value={-4} /> },
            { p: 3, name: 'Оспанова Әсем', city: 'Шымкент', games: 96, pts: '2 041', delta: <RatingDelta value={31} /> },
            { p: 4, name: 'Жумабеков Руслан', city: 'Караганда', games: 88, pts: '1 998', delta: <RatingDelta value={0} /> },
          ]}
        />
      </Block>

      <Block title="Строка реестра · RowItem" note="Та же запись, но карточкой — так реестры выглядят на планшете и в списках выбора.">
        <div style={{ display: 'grid', gap: 8 }}>
          <RowItem
            media={<Avatar src={A(45)} size="sm" />}
            title="Байжанов Алихан"
            subtitle="Судья 1 категории · Астана"
            right={
              <>
                <Pill tone="live" dot>
                  СВОБОДЕН
                </Pill>
                <Button size="sm">Назначить</Button>
              </>
            }
          />
          <RowItem
            media={<Avatar src={AW(44)} size="sm" />}
            title="Абаева Дана"
            subtitle="Судья высшей категории · Алматы"
            selected
            right={
              <>
                <Pill tone="wait">НА СТОЛЕ 4</Pill>
                <Button size="sm" variant="ghost">
                  Профиль
                </Button>
              </>
            }
          />
        </div>
      </Block>

      <Block title="Ключ — значение · KeyValue и прогресс · Progress" note="Карточка турнира и заполненность: сколько матчей сыграно, сколько взносов собрано.">
        <KeyValue
          columns={3}
          items={[
            ['Город', 'Астана'],
            ['Даты', '14–16 марта 2026'],
            ['Формат', 'Олимпийская, 128'],
            ['Столов', '20'],
            ['Главный судья', 'Оспанов Т.'],
            ['Взнос', '5 000 ₸'],
          ]}
        />
        <Divider />
        <div style={{ display: 'grid', gap: 14 }}>
          <Progress value={47} label="Сыграно матчей" />
          <Progress value={82} label="Собрано взносов" tone="g" />
          <Progress value={23} label="Подтверждено врачами" tone="a" />
        </div>
      </Block>

      <Block title="Загрузка и пустота · Skeleton, Spinner, EmptyState" note="Что видит пользователь, пока данных нет: заглушки вместо строк, крутилка у действия, объяснение при пустом списке.">
        <div style={cols2}>
          <div style={{ display: 'grid', gap: 10 }}>
            <Skeleton height={16} width="60%" />
            <Skeleton height={12} width="85%" />
            <Skeleton height={12} width="70%" />
            <div className="ui-row">
              <Spinner />
              <span style={{ fontSize: 12.5, color: 'var(--c-muted)' }}>Обновляем сетку…</span>
            </div>
          </div>
          <EmptyState
            icon={<Inbox size={22} />}
            title="Заявок пока нет"
            text="Как только игроки начнут записываться, они появятся здесь — и сразу можно будет сеять сетку."
            action={<Button size="sm">Открыть заявки</Button>}
          />
        </div>
      </Block>

      <Block title="Лента событий · Timeline" note="История матча или заявки: что уже случилось и что происходит сейчас.">
        <Timeline
          events={[
            { icon: <CheckCircle2 size={12} />, title: 'Заявка принята', text: 'Чемпионат Казахстана 2026 · 12 февраля', tone: 'ok' },
            { icon: <CheckCircle2 size={12} />, title: 'Взнос оплачен', text: '5 000 ₸ · 13 февраля', tone: 'ok' },
            { icon: <Play size={12} />, title: 'Вызов к столу 3', text: '1/8 финала · сейчас', tone: 'on' },
            { title: 'Матч', text: 'Ещё не начался' },
          ]}
        />
      </Block>
    </Page>
  );
}

/* ═══════════ 5. Обратная связь ═══════════ */

export function GalleryFeedback() {
  return (
    <Page title="Обратная связь" lead="Сообщения системы: спокойная плашка внутри экрана, всплывающее уведомление и диалог подтверждения.">
      <Block title="Плашка · Notice" note="Четыре тона по смыслу: пояснение, успех, предупреждение, отказ. Подложка и граница считаются от того же токена.">
        <div style={{ display: 'grid', gap: 10 }}>
          <Notice tone="info" title="Сетка обновляется автоматически" text="После каждого подтверждённого результата победитель встаёт в следующий круг." />
          <Notice tone="success" title="Результат принят" text="Матч ушёл главному судье на сверку и в протокол." action={<Button size="sm" variant="ghost">Открыть</Button>} />
          <Notice tone="warning" title="Не хватает судей" text="На 20 столов назначено 14 судей. Оставшиеся матчи не начнутся." />
          <Notice tone="danger" title="Взнос не поступил" text="Заявка будет снята автоматически через 24 часа." />
        </div>
      </Block>

      <Block title="Всплывающее · Toast" note="Короткое подтверждение действия. Живёт несколько секунд и не требует ответа.">
        <div style={{ display: 'grid', gap: 10, justifyItems: 'start' }}>
          <Toast tone="ok" icon={<CheckCircle2 size={16} />} title="Счёт сохранён" text="Партия 4 · 11 : 9" />
          <Toast title="Вас вызвали к столу 3" text="1/8 финала · через 2 минуты" />
          <Toast tone="bad" title="Не удалось отправить результат" text="Проверьте связь и повторите" />
        </div>
      </Block>

      <Block title="Диалог · Modal" note="Подтверждение необратимого действия. В витрине показан без затемнения всего экрана — это про внешний вид, поведение будет во фронте.">
        <Modal
          title="Снять игрока с турнира?"
          actions={
            <>
              <Button variant="ghost" size="sm">
                Отмена
              </Button>
              <Button size="sm">Снять</Button>
            </>
          }
        >
          Жумабеков Руслан выбывает из сетки, его матчи 1/8 финала будут засчитаны сопернику. Отменить это действие
          сможет только главный судья.
        </Modal>
      </Block>
    </Page>
  );
}

/* ═══════════ 6. Турнирные ═══════════ */

export function GalleryDomain() {
  return (
    <Page
      title="Турнирные"
      lead="То, чего нет в обычных библиотеках: значок идущего матча, строка матча, плитка стола, дельта рейтинга, номер посева, ввод счёта судьёй и строка рейтинга."
    >
      <Block
        title="Идущий матч · LiveBadge"
        note="Значок эфира по присланному UI-киту: пульсирующая точка и подпись. Красный здесь означает «идёт сейчас», а не ошибку — зелёный в системе занят статусами. Формы: сам по себе, со счётчиком идущих матчей и язычком на верхней грани карточки. Пульсация гаснет при prefers-reduced-motion."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <LiveBadge />
          <LiveBadge count={14} />
          <LiveBadge label="В эфире" />
        </div>
        <div style={{ position: 'relative', marginTop: 22 }}>
          <LiveBadge notch />
          <Card>
            <div style={{ textAlign: 'center', padding: '10px 0 2px' }}>
              <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>Кубок Алматы 2026 · 1/8 финала</div>
              <div style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>1 : 2</div>
              <div style={{ fontSize: 11, color: 'var(--c-dim)', marginTop: 4 }}>3-я партия · стол 5</div>
            </div>
          </Card>
        </div>
      </Block>

      <Block title="Строка матча · MatchRow" note="Двое, счёт по партиям и подпись под ним. Победитель выделен, живой матч — акцентной границей.">
        <div style={{ display: 'grid', gap: 8 }}>
          <MatchRow home={{ name: 'Смагулов Алан', avatar: A(32) }} away={{ name: 'Токаев Мурат', avatar: A(12) }} score="2 : 1" note="идёт · стол 3" winner="home" live />
          <MatchRow home={{ name: 'Пак Сергей', avatar: A(45) }} away={{ name: 'Ерлан Бекзат', avatar: A(76) }} score="1 : 3" note="1/8 финала" winner="away" />
          <MatchRow home={{ name: 'Жумабеков Р.' }} away={{ name: 'Байжанов А.' }} score="—" note="ожидает стола" />
        </div>
      </Block>

      <Block title="Плитка стола · TableTile и номер посева · SeedBadge" note="Карта столов зала: занятый стол светится акцентом и показывает счёт. Посев 1–8 выделен.">
        <div className="ui-row">
          <TableTile number={1} score="2 : 1" busy />
          <TableTile number={2} score="1 : 1" busy />
          <TableTile number={3} score="0 : 2" busy />
          <TableTile number={13} />
          <TableTile number={14} />
        </div>
        <div className="ui-row">
          <SeedBadge seed={1} />
          <SeedBadge seed={8} />
          <SeedBadge seed={17} />
          <SeedBadge seed={64} />
        </div>
      </Block>

      <Block title="Ввод счёта · ScoreInput" note="Экран судьи стола: у подающего — зелёная точка, счётчики на каждого игрока, сыгранные партии чипами.">
        <Card>
          <ScoreInput
            home={{ name: 'Смагулов Алан', avatar: A(32) }}
            away={{ name: 'Токаев Мурат', avatar: A(12) }}
            homePoints={9}
            awayPoints={7}
            serving="home"
            sets={[
              [11, 9],
              [9, 11],
              [11, 7],
            ]}
          />
        </Card>
      </Block>

      <Block title="Рейтинг · RankRow и дельта · RatingDelta" note="Таблица рейтинга федерации: место, игрок, очки и изменение после последнего турнира.">
        <div>
          <RankRow position={1} player={{ name: 'Ахметов Данияр', avatar: A(32) }} meta="Астана · 128 матчей" points="2 148" delta={12} />
          <RankRow position={2} player={{ name: 'Ким Сергей', avatar: A(45) }} meta="Алматы · 117 матчей" points="2 097" delta={-4} />
          <RankRow position={3} player={{ name: 'Оспанова Әсем', avatar: AW(44) }} meta="Шымкент · 96 матчей" points="2 041" delta={31} />
          <RankRow position={12} player={{ name: 'Жумабеков Руслан', avatar: A(76) }} meta="Караганда · 88 матчей" points="1 998" delta={0} />
        </div>
      </Block>
    </Page>
  );
}
