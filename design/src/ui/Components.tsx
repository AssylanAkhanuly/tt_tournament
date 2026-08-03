import type { CSSProperties, ReactNode } from 'react';
import { Bell, CheckCircle2, Play, Search } from 'lucide-react';
import {
  Avatar,
  AvatarStack,
  Badge,
  Button,
  Card,
  Field,
  IconButton,
  Panel,
  Pill,
  SectionTitle,
  Segmented,
  Stat,
  Stats,
} from './index';

/* Витрина примитивов. Всё нарисовано на токенах, поэтому переключатель «Тема»
   в тулбаре перекрашивает и эту страницу, и живые экраны одинаково. */

const A = (n: number) => `https://randomuser.me/api/portraits/men/${n}.jpg`;
const page: CSSProperties = { background: 'var(--c-bg)', color: 'var(--c-text)', padding: 32, display: 'grid', gap: 26 };

function Block({ title, note, dark = true, children }: { title: string; note: string; dark?: boolean; children: ReactNode }) {
  return (
    <section style={{ display: 'grid', gap: 10 }}>
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>{title}</h2>
        <div style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: 4, maxWidth: 720, lineHeight: 1.5 }}>{note}</div>
      </div>
      <div className={dark ? 'ui-canvas' : 'ui-canvas ui-canvas--light'}>{children}</div>
    </section>
  );
}

export function ComponentGallery() {
  return (
    <div style={page}>
      <header style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em' }}>Компоненты</h1>
        <p style={{ fontSize: 13, color: 'var(--c-text-3)', lineHeight: 1.55, maxWidth: 780 }}>
          Примитивы из <code>src/ui</code>. Часть — типизированная обёртка над классами макетного слоя
          (<code>gen/frame.css</code>): у стиля один источник, поэтому экраны и компоненты не разъезжаются.
          Новое (<code>Button</code>, <code>Segmented</code>, <code>Field</code>) описано в <code>src/ui/ui.css</code>.
          Цвет во всех — только токены, ни одного «сырого» значения.
        </p>
      </header>

      <Block
        title="Кнопка · Button"
        note="Пять вариантов и три размера. Заливка, тень и текст — от токенов акцента и статусов; на кнопке трансляции градиент собирается из --c-broadcast."
      >
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
        <Button size="lg" block variant="success" icon={<CheckCircle2 size={16} />}>
          Отправить результат в федерацию
        </Button>
      </Block>

      <Block
        title="Пилюля · Pill и значок · Badge"
        note="Статусы матча и заявки. Подложка — прозрачный вариант того же токена, что и текст, поэтому пилюли остаются читаемыми в любой теме."
      >
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
        </div>
        <div className="ui-row">
          <Badge tone="win" />
          <Badge tone="loss" />
        </div>
      </Block>

      <Block
        title="Плитка · Stat"
        note="Сводка турнира: значение крупно, подпись мелко. Тон задаёт смысл — нейтральный, акцентный, успех, отказ."
      >
        <Stats>
          <Stat value="128" label="Участников" />
          <Stat value="12" label="Идут сейчас" tone="b" />
          <Stat value="60" label="Завершено" tone="g" />
          <Stat value="2" label="Отказы" tone="r" />
        </Stats>
      </Block>

      <Block
        title="Карточка · Card, панель · Panel"
        note="Стекло: полупрозрачная заливка, светлая грань сверху, мягкая тень. Живая карточка подсвечивается границей успеха."
      >
        <div className="ui-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
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
          <div className="list">
            <div className="match">
              <Badge tone="win" />
              <span className="who">
                <div className="nm">Смагулов А. — Токаев М.</div>
                <div className="mt">Стол 3 · 1/8 финала</div>
              </span>
              <span className="sc">2 : 1</span>
              <span className="dt">14:20</span>
            </div>
            <div className="match">
              <Badge tone="loss" />
              <span className="who">
                <div className="nm">Пак С. — Ерлан Б.</div>
                <div className="mt">Стол 1 · 1/8 финала</div>
              </span>
              <span className="sc">1 : 1</span>
              <span className="dt">14:35</span>
            </div>
          </div>
        </Panel>
      </Block>

      <Block
        title="Аватары, кнопки-иконки, заголовок секции"
        note="Мелкие детали интерфейса: фото игрока с кольцом, стеклянная кнопка-иконка с точкой уведомления, подпись раздела."
      >
        <div className="ui-row">
          <Avatar src={A(76)} />
          <Avatar src={A(32)} size="sm" />
          <AvatarStack srcs={[A(12), A(45)]} />
          <IconButton>
            <Search size={16} />
          </IconButton>
          <IconButton dot>
            <Bell size={16} />
          </IconButton>
        </div>
        <SectionTitle>Ожидают вызова</SectionTitle>
      </Block>

      <Block
        title="Форма · Field, Segmented"
        note="Поле — подпись сверху, значение или контрол снизу. Сегмент-контрол — выбор из двух-трёх режимов."
      >
        <div className="ui-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <Field label="Название турнира">Кубок Республики Казахстан</Field>
          <Field label="Формат">
            <Segmented items={['Олимпийская', 'Круговая', 'Смешанная']} active="Олимпийская" />
          </Field>
          <Field label="Город">Астана</Field>
          <Field label="Столов">20</Field>
        </div>
      </Block>
    </div>
  );
}
