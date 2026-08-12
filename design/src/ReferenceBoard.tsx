/* Страница «Дизайн-система → Референсы»: на чём стоит локап ФНТ РК.

   Показываем не скриншоты чужих экранов (их нельзя тащить в репозиторий), а
   вывод + ссылку на оригинал в Mobbin, и рядом — наш результат живьём, теми же
   компонентами, что стоят в макетах. Сравнение «было/стало» поэтому всегда
   актуальное: если <Brand> поправят, страница поедет вместе с ним.

   Данные — `src/references.ts`, тот же источник, что у `design/REFERENCES.md`.

   Файл называется ReferenceBoard.tsx, а не References.tsx: на файловых системах
   без учёта регистра (Windows) он схлопывался бы с `references.ts` — данными, —
   и сборка падала. Та же история, что у `FontSpecimen.tsx` рядом. */

import type { CSSProperties, ReactNode } from 'react';
import { Brand } from './ui';
import { FINDINGS, GROUPS, SITE_REFS, TOTAL_QUERIES, TOTAL_REFS } from './references';
import type { Ref } from './references';
import oldEmblem from './assets/fnt-emblem.png';
import shield from '../../brand/fnt/fnt-logo.svg';
import mark from '../../brand/fnt/fnt-mark.svg';

const S: Record<string, CSSProperties> = {
  /* Цвет текста и фон задаём явно: история идёт в режиме fullscreen, без
     обёртки `.sb-main-padded`, и наследовать тут не от чего — иначе абзацы без
     своего `color` уезжают в почти нечитаемый тёмный по тёмному. */
  page: {
    padding: 28, display: 'flex', flexDirection: 'column', gap: 26, maxWidth: 1080,
    color: 'var(--c-ink)', background: 'var(--c-screen-1)', minHeight: '100%',
  },
  h1: { fontSize: 30, fontWeight: 800, letterSpacing: '-.4px', margin: 0, color: 'var(--c-ink)' },
  lead: { color: 'var(--c-muted)', fontSize: 14.5, lineHeight: 1.65, margin: 0, maxWidth: 760 },
  counters: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  counter: {
    background: 'var(--c-panel)', border: '1px solid var(--c-glass-line)',
    borderRadius: 12, padding: '9px 14px', display: 'flex', alignItems: 'baseline', gap: 8,
  },
  counterN: { fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-brand)', color: 'var(--c-ink)' },
  counterL: { fontSize: 11.5, color: 'var(--c-muted)', letterSpacing: '.4px' },

  h2: { fontSize: 12, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
        color: 'var(--c-dim)', margin: '10px 0 0' },

  card: {
    background: 'var(--c-panel)', border: '1px solid var(--c-glass-line)',
    borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 12,
  },
  bar: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', height: 58,
    background: 'var(--c-panel-2)', border: '1px solid var(--c-glass-line)',
    borderRadius: 12,
  },
  barName: { fontWeight: 700, fontSize: 14 },
  barSub: { color: 'var(--c-muted)', fontSize: 12.5 },
  sep: { width: 1, height: 26, background: 'var(--c-glass-line)' },

  tag: {
    fontSize: 10.5, fontWeight: 700, letterSpacing: '.7px', textTransform: 'uppercase',
    color: 'var(--c-muted)', background: 'var(--c-panel-3)',
    border: '1px solid var(--c-glass-line)', borderRadius: 'var(--r-pill)', padding: '3px 9px',
  },
  ok: { color: 'var(--c-success)', background: 'var(--c-success-soft)', border: 0 },
  open: { color: 'var(--c-warning)', background: 'var(--c-warning-soft)', border: 0 },

  fTitle: { fontSize: 17, fontWeight: 700, letterSpacing: '-.2px', color: 'var(--c-ink)' },
  fText: { fontSize: 13.5, lineHeight: 1.65, color: 'var(--c-muted)', margin: 0 },
  fDid: { fontSize: 13.5, lineHeight: 1.65, margin: 0, color: 'var(--c-ink)' },
  links: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  link: {
    fontSize: 12, fontWeight: 600, color: 'var(--c-accent)', textDecoration: 'none',
    background: 'var(--c-accent-soft)', borderRadius: 'var(--r-pill)', padding: '4px 11px',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 },
  shot: {
    display: 'block', width: '100%', height: 'auto', borderRadius: 10,
    border: '1px solid var(--c-glass-line)',
  },
  shotName: { fontSize: 14, fontWeight: 700, marginTop: 2 },
  ladder: { display: 'flex', alignItems: 'flex-end', gap: 22, flexWrap: 'wrap' },
  ladderCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 },
  ladderCap: { fontSize: 10.5, color: 'var(--c-dim)' },
};

const Links = ({ refs }: { refs: Ref[] }) => (
  <div style={S.links}>
    {refs.map((r) => (
      <a key={r.url + r.app} href={r.url} target="_blank" rel="noreferrer" style={S.link}>
        {r.app}
      </a>
    ))}
  </div>
);

const Counter = ({ n, label }: { n: ReactNode; label: string }) => (
  <div style={S.counter}><span style={S.counterN}>{n}</span><span style={S.counterL}>{label}</span></div>
);

/* Шапка-образец: та же разметка, что в `deskShell.tsx`, но бренд-блок подменяем —
   чтобы «было» и «стало» стояли рядом в одинаковых условиях. */
const SampleBar = ({ children }: { children: ReactNode }) => (
  <div style={S.bar}>
    {children}
    <div style={S.sep} />
    <div>
      <div style={S.barName}>Чемпионат Казахстана 2026</div>
      <div style={S.barSub}>Одиночный · олимпийская · г. Астана</div>
    </div>
  </div>
);

const SIZES = [40, 30, 24, 18, 16];

export function ReferenceBoard() {
  return (
    <div style={S.page}>
      <div>
        <h1 style={S.h1}>Референсы: как показывают знак организации</h1>
      </div>
      <p style={S.lead}>
        Разбор под локап ФНТ РК в шапках экранов. Смотрели не «красиво / некрасиво», а один
        вопрос: <b>как продукты показывают чужой подробный герб там, где на него отведено
        30&nbsp;px.</b> У нас ровно эта задача — официальный знак федерации вертикальный, с лентой
        орнамента и мелкой надписью TTFRK.
      </p>

      <div style={S.counters}>
        <Counter n={TOTAL_REFS + SITE_REFS.length} label="референсов" />
        <Counter n={TOTAL_REFS} label="экранов из Mobbin" />
        <Counter n={SITE_REFS.length} label="сайтов федераций, снято живьём" />
        <Counter n={TOTAL_QUERIES} label="запросов в Mobbin" />
        <Counter n={FINDINGS.filter((f) => f.done).length} label="выводов внедрено" />
        <Counter n={FINDINGS.filter((f) => !f.done).length} label="осталось рекомендацией" />
      </div>

      <h2 style={S.h2}>Что поменялось в шапке</h2>
      <div style={S.card}>
        <span style={{ ...S.tag, alignSelf: 'flex-start' }}>Было</span>
        <SampleBar>
          <img
            src={oldEmblem}
            alt="ФНТ РК"
            style={{ height: 30, width: 'auto', filter: 'drop-shadow(0 2px 7px var(--c-accent-line-2))' }}
          />
          <div style={{ fontWeight: 700, fontSize: 15 }}>ФНТ РК</div>
        </SampleBar>
        <p style={S.fText}>
          Одноцветная вырезка знака без щита, орнамента и надписи — на 30&nbsp;px читается как
          безымянное пятно. Рядом рабочий шрифт интерфейса: бренда в шапке фактически нет.
        </p>
        <span style={{ ...S.tag, ...S.ok, alignSelf: 'flex-start' }}>Стало</span>
        <SampleBar><Brand /></SampleBar>
        <p style={S.fText}>
          Марка на фирменной плитке плюс словесная часть узким тяжёлым гротеском. Одна строка —
          по пункту&nbsp;2 ниже.
        </p>
      </div>

      <h2 style={S.h2}>Телефон: роль ушла во вторую строку</h2>
      <div style={{ ...S.card, flexDirection: 'row', gap: 30, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <span style={S.tag}>Было</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700 }}>
            <img src={oldEmblem} alt="" style={{ height: 30 }} /> Судья
          </div>
          <div style={{ ...S.fText, maxWidth: 260 }}>Роль вытеснила бренд: «ФНТ РК» в шапке нет вовсе.</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <span style={{ ...S.tag, ...S.ok }}>Стало</span>
          <Brand size="sm" sub="Судья" />
          <div style={{ ...S.fText, maxWidth: 260 }}>Бренд на месте, роль — подписью под ним.</div>
        </div>
      </div>

      <h2 style={S.h2}>Лестница размеров: почему понадобился второй ассет</h2>
      <div style={S.card}>
        <div style={S.ladder}>
          {SIZES.map((h) => (
            <div key={'m' + h} style={S.ladderCol}>
              <img src={mark} alt="" style={{ height: h, width: h, borderRadius: h * 0.12 }} />
              <span style={S.ladderCap}>{h} px</span>
            </div>
          ))}
          <div style={{ ...S.sep, height: 46 }} />
          {SIZES.map((h) => (
            <div key={'s' + h} style={S.ladderCol}>
              <img src={shield} alt="" style={{ height: h }} />
              <span style={S.ladderCap}>{h} px</span>
            </div>
          ))}
        </div>
        <p style={S.fText}>
          Слева марка <code>fnt-mark.svg</code>, справа полный щит <code>fnt-logo.svg</code>.
          Ниже 30&nbsp;px у щита лента орнамента и надпись TTFRK схлопываются в шум; марка
          держится до 16&nbsp;px.
        </p>
      </div>

      <h2 style={S.h2}>Сайты федераций — снято живьём, {SITE_REFS.length} шапок</h2>
      <p style={S.lead}>
        Первый заход был целиком по Mobbin, а сайтов настоящих спортивных федераций там нет —
        получилось 82 экрана из мира продуктовых интерфейсов и ни одного из мира федераций. Здесь
        снято прямо с живых сайтов, картинки наши собственные. Снимок на 12.08.2026: сайты
        меняются, ссылка ведёт на оригинал.
      </p>
      <div style={S.grid}>
        {SITE_REFS.map((s) => (
          <div key={s.url} style={S.card}>
            <a href={s.url} target="_blank" rel="noreferrer">
              <img src={s.img} alt={`Шапка сайта ${s.name}`} style={S.shot} />
            </a>
            <div style={S.shotName}>{s.name}</div>
            <p style={S.fText}>{s.note}</p>
            <Links refs={[{ app: 'Открыть сайт', url: s.url }]} />
          </div>
        ))}
      </div>

      <h2 style={S.h2}>Выводы</h2>
      {FINDINGS.map((f, i) => (
        <div key={f.title} style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={S.counterN}>{i + 1}</span>
            <span style={S.fTitle}>{f.title}</span>
            <span style={{ ...S.tag, ...(f.done ? S.ok : S.open) }}>
              {f.done ? 'внедрено' : 'рекомендация'}
            </span>
          </div>
          <p style={S.fText}>{f.seen}</p>
          <p style={S.fDid}><b>Что сделали. </b>{f.did}</p>
          <Links refs={f.refs} />
        </div>
      ))}

      <h2 style={S.h2}>Полный перечень — {TOTAL_REFS} экранов</h2>
      <div style={S.grid}>
        {GROUPS.map((g) => (
          <div key={g.query} style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={S.tag}>{g.platform}</span>
              <span style={{ ...S.counterL, fontSize: 12 }}>{g.refs.length}</span>
              {g.weak && <span style={{ ...S.tag, ...S.open }}>набор слабый</span>}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{g.query}</div>
            <Links refs={g.refs} />
          </div>
        ))}
      </div>

      <p style={{ ...S.fText, borderTop: '1px solid var(--c-glass-line)', paddingTop: 16 }}>
        Честно про слабые места: в Mobbin нет ни сайтов настоящих спортивных федераций (запрос про
        витрину организации вернул SaaS-лендинги), ни турнирных сеток — там отдался один экран, и
        тот не про спорт. Оба набора помечены выше, выводов на них не строили. Первый пробел
        закрыт вторым источником — сайтами федераций живьём; по сеткам опереться по-прежнему не на
        что. Тот же разбор текстом — <code>design/REFERENCES.md</code>.
      </p>
    </div>
  );
}
