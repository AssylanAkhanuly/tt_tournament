import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Bell, Play } from 'lucide-react';
import { THEMES, THEME_GROUPS, applyTheme } from '../theme/themes';
import { Avatar, Badge, Button, Card, Pill, Stat, Stats } from './index';

/* Специмен цвета: что за токены есть, чему равны прямо сейчас и как выглядит
   один и тот же интерфейс во всех темах. Значения не дублируем в коде —
   читаем живьём из `getComputedStyle`, поэтому специмен не может разъехаться
   с `src/theme/tokens.css`. Описания — здесь, они словами, а не значениями. */

type Group = { title: string; note: string; tokens: [string, string][] };

const GROUPS: Group[] = [
  {
    title: 'Акцент',
    note: 'Основной цвет действия. Прозрачные варианты считаются от него же — поменяли акцент, поехало всё.',
    tokens: [
      ['--c-accent', 'кнопки, активные вкладки, счёт победителя'],
      ['--c-accent-ink', 'текст поверх акцентной заливки'],
      ['--c-accent-soft', 'подложка чипа и иконки-плашки'],
      ['--c-accent-line', 'граница карточки «идёт сейчас»'],
      ['--c-accent-line-3', 'граница выбранной строки'],
      ['--c-accent-glow-2', 'свечение под кнопкой'],
      ['--c-accent-2', 'второй акцент — фиолетовое пятно фона'],
      ['--c-accent-3', 'третье пятно фона'],
    ],
  },
  {
    title: 'Статусы',
    note: 'Значения матча и заявки: идёт, подтверждено, ждёт, отклонено, эфир.',
    tokens: [
      ['--c-success', 'победа, «идёт сейчас», подтверждение'],
      ['--c-success-ink', 'текст на зелёной кнопке'],
      ['--c-success-soft', 'подложка зелёной пилюли'],
      ['--c-warning', 'ожидание, задолженность по взносу'],
      ['--c-warning-soft', 'подложка жёлтой пилюли'],
      ['--c-danger', 'поражение, отказ, точка уведомления'],
      ['--c-danger-soft', 'подложка красной пилюли'],
      ['--c-broadcast', 'кнопка трансляции (верх градиента)'],
      ['--c-broadcast-2', 'кнопка трансляции (низ градиента)'],
    ],
  },
  {
    title: 'Текст на тёмном',
    note: 'Три ступени контраста: основной, второстепенный, подсказка.',
    tokens: [
      ['--c-ink', 'основной текст экрана'],
      ['--c-ink-bright', 'максимальный контраст: лидер счёта'],
      ['--c-muted', 'подписи, вторые строки'],
      ['--c-dim', 'даты, «пусто», неактивные вкладки'],
    ],
  },
  {
    title: 'Поверхности и фон',
    note: 'Заливка карточек непрозрачная — узор-обои и градиент сквозь интерфейс не просвечивают; цвет считается от базы экрана с подмешанным белым. Полупрозрачными остались только грани.',
    tokens: [
      ['--c-panel', 'карточка, плитка, строка, поле'],
      ['--c-panel-2', 'выделенная панель, таб-бар, диалог'],
      ['--c-glass-line', 'граница стекла'],
      ['--c-glass-line-soft', 'разделитель строк'],
      ['--c-glass-hi', 'верхняя световая грань'],
      ['--c-screen-1', 'верх градиента экрана'],
      ['--c-screen-2', 'середина градиента'],
      ['--c-screen-3', 'низ градиента'],
      ['--c-screen-deep', '«остров» камеры'],
    ],
  },
  {
    title: 'Светлые поверхности',
    note: 'Подложка флоу-бордов и светлые страницы документации (регистрация, новости).',
    tokens: [
      ['--c-board-bg', 'фон флоу-борда'],
      ['--c-board-ink', 'текст на борде'],
      ['--c-board-muted', 'подписи колонок'],
      ['--c-board-accent', 'стрелки перехода и тег борда'],
      ['--c-bg', 'фон светлой страницы'],
      ['--c-surface', 'карточка на светлом'],
      ['--c-line', 'граница на светлом'],
      ['--c-primary', 'акцент светлых страниц'],
      ['--c-text', 'основной текст на светлом'],
      ['--c-text-3', 'второстепенный текст на светлом'],
    ],
  },
];

function useTokenValues(names: string[], deps: unknown[]) {
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const next: Record<string, string> = {};
    for (const n of names) next[n] = cs.getPropertyValue(n).trim();
    setValues(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return values;
}

function short(value: string) {
  // `color-mix(in srgb, rgb(111, 155, 255) 16%, transparent)` → «16% от акцента»
  const mix = value.match(/color-mix\(in srgb, (.+?) ([\d.]+)%, (.+)\)/);
  if (mix) return `${mix[2]}% ${mix[3] === 'transparent' ? 'прозрачности' : 'смеси'} · ${mix[1]}`;
  return value || '—';
}

function Swatch({ name, desc, value }: { name: string; desc: string; value: string }) {
  return (
    <div className="ui-swatch">
      <span className="chip">
        <i style={{ background: `var(${name})` }} />
      </span>
      <span className="meta">
        <div className="name">{name}</div>
        <div className="val">{short(value)}</div>
        <div className="desc">{desc}</div>
      </span>
    </div>
  );
}

/* Кусок настоящего интерфейса — чтобы видеть тему на живом, а не на квадратах */
function Sample() {
  return (
    <div style={{ display: 'grid', gap: 11 }}>
      <Stats>
        <Stat value="128" label="Участников" />
        <Stat value="12" label="Идут" tone="b" />
        <Stat value="8" label="Ждут" tone="g" />
        <Stat value="2" label="Отказ" tone="r" />
      </Stats>
      <Card live>
        <div className="pcard">
          <Avatar src="https://randomuser.me/api/portraits/men/76.jpg" />
          <span className="who">
            <div className="nm">Смагулов А.</div>
            <div className="mt">Стол 3 · 2 : 1</div>
          </span>
          <span className="rt">
            <div className="k">Рейтинг</div>
            <div className="v">2 148</div>
          </span>
        </div>
      </Card>
      <div className="ui-row">
        <Pill tone="live" dot>
          ИДЁТ
        </Pill>
        <Pill tone="reg">ЗАЯВКА</Pill>
        <Pill tone="wait">ЖДЁТ</Pill>
        <Pill tone="bad">ОТКАЗ</Pill>
        <Badge tone="win">П</Badge>
        <Badge tone="loss">О</Badge>
      </div>
      <div className="ui-row">
        <Button size="sm">Вызвать</Button>
        <Button variant="success" size="sm">
          Подтвердить
        </Button>
        <Button variant="broadcast" size="sm" icon={<Play size={13} />}>
          Эфир
        </Button>
        <Button variant="ghost" size="sm" icon={<Bell size={13} />}>
          Напомнить
        </Button>
      </div>
    </div>
  );
}

/** Одна тема в своей коробке: seeds выставляются на самой коробке, а не на :root */
function ThemeBox({ id, label, note }: { id: string; label: string; note: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) applyTheme(id, ref.current);
  }, [id]);
  return (
    <div ref={ref} className="ui-theme" style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <b style={{ fontSize: 14, color: 'var(--c-text)' }}>{label}</b>
        <code style={{ fontSize: 11, color: 'var(--c-text-3)' }}>theme:{id}</code>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--c-text-3)', lineHeight: 1.45, minHeight: 34 }}>{note}</div>
      <div className="ui-canvas">
        <Sample />
      </div>
    </div>
  );
}

const page: CSSProperties = { background: 'var(--c-bg)', color: 'var(--c-text)', padding: 32, display: 'grid', gap: 30 };

export function ColorSpecimen() {
  const all = GROUPS.flatMap((g) => g.tokens.map(([n]) => n));
  // перечитываем значения при смене темы в тулбаре: data-theme ставит applyTheme
  const themeAttr = typeof document !== 'undefined' ? document.documentElement.dataset.theme : 'fnt';
  const values = useTokenValues(all, [themeAttr]);

  return (
    <div style={page}>
      <header style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em' }}>Цвет</h1>
        <p style={{ fontSize: 13, color: 'var(--c-text-3)', lineHeight: 1.55, maxWidth: 760 }}>
          Единственный источник — <code>src/theme/tokens.css</code>. Экраны, примитивы и специмены берут цвет
          только оттуда, поэтому правка одного значения перекрашивает весь Storybook. Прозрачные варианты не
          записаны руками: они считаются от семантического токена через <code>color-mix()</code> — иначе при смене
          акцента подложки и свечения остались бы старого цвета. Проверка, что «сырых» цветов нигде не осталось —
          <code> npm run lint:colors</code>.
        </p>
        <p style={{ fontSize: 13, color: 'var(--c-text-3)', lineHeight: 1.55, maxWidth: 760 }}>
          Значения ниже читаются из браузера прямо сейчас: переключите «Тему» в тулбаре — обновятся и они, и все
          макеты в соседних разделах.
        </p>
      </header>

      {GROUPS.map((g) => (
        <section key={g.title} style={{ display: 'grid', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>{g.title}</h2>
            <div style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: 4 }}>{g.note}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 10 }}>
            {g.tokens.map(([name, desc]) => (
              <div key={name} style={{ background: 'var(--c-screen-1)', borderRadius: 14, padding: 4 }}>
                <Swatch name={name} desc={desc} value={values[name] ?? ''} />
              </div>
            ))}
          </div>
        </section>
      ))}

      <section style={{ display: 'grid', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>Темы целиком — {THEMES.length}</h2>
          <div style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: 4, maxWidth: 780, lineHeight: 1.5 }}>
            Тема — это набор «семян» (<code>src/theme/themes.ts</code>), всё остальное считается от них: ступени
            тёмного фона, корпус устройства и светлые производные собирает функция <code>dark()</code> из двух-трёх
            цветов, светлым темам нужен свой набор (<code>light()</code>) — там текст тёмный, грани не белые, а узор
            фона берётся тёмной плиткой. Ниже один и тот же кусок интерфейса в каждой теме; выбрать её целиком —
            тулбар «Тема».
          </div>
        </div>
        {THEME_GROUPS.map((group) => (
          <div key={group} style={{ display: 'grid', gap: 12 }}>
            <div className="ui-label" style={{ color: 'var(--c-text-3)' }}>{group}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
              {THEMES.filter((t) => t.group === group).map((t) => (
                <ThemeBox key={t.id} id={t.id} label={t.label} note={t.note} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
