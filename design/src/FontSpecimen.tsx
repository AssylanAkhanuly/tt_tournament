import type { CSSProperties } from 'react';
import { FONTS, FONT_GROUPS, stackOf } from './fonts';
// Настоящий знак ФНТ — только здесь, чтобы примерять шрифт рядом с ним.
// В сами макеты его не ставим: по DESIGN.md они идут под нейтральным именем.
import fntLogo from '../../brand/fnt/png/fnt-logo-512.png';

/* Специмен гарнитур: один и тот же кусок интерфейса турнира, набранный каждым
   шрифтом из списка. Нужен, чтобы сравнивать не «алфавит», а реальные вещи —
   заголовок, таблицу рейтинга, счёт матча, кнопку. */

const S: Record<string, CSSProperties> = {
  page: { background: 'var(--c-bg)', padding: 32, color: 'var(--c-text)', display: 'grid', gap: 28 },
  section: { display: 'grid', gap: 14 },
  gname: {
    margin: 0,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    color: 'var(--c-text-3)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  gcount: {
    background: 'var(--c-surface)',
    border: '1px solid var(--c-line)',
    borderRadius: 999,
    padding: '2px 8px',
    fontSize: 11,
    letterSpacing: 0,
  },
  wrap: {
    display: 'grid',
    gap: 20,
    gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
  },
  card: {
    background: 'var(--c-surface)',
    border: '1px solid var(--c-line)',
    borderRadius: 'var(--r-md)',
    padding: 20,
    display: 'grid',
    gap: 14,
  },
  head: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  // блок «знак + название» — по нему видно, дружит ли гарнитура с логотипом
  lock: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    background: 'var(--c-chip)',
    borderRadius: 'var(--r-sm)',
  },
  lockLogo: { height: 52, width: 'auto', display: 'block' },
  lockName: { fontSize: 26, fontWeight: 800, lineHeight: 1, letterSpacing: '-.01em' },
  lockFull: { fontSize: 12, color: 'var(--c-text-3)', marginTop: 4, letterSpacing: '.02em' },
  lockLat: { marginLeft: 'auto', fontSize: 26, fontWeight: 800, letterSpacing: '-.02em', color: 'var(--c-text-3)' },
  name: { fontSize: 13, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--c-primary)' },
  note: { fontSize: 12, color: 'var(--c-text-3)', lineHeight: 1.45 },
  h1: { fontSize: 26, fontWeight: 800, letterSpacing: '-.01em', lineHeight: 1.15 },
  sub: { fontSize: 14, color: 'var(--c-text-3)' },
  row: {
    display: 'grid',
    gridTemplateColumns: '28px 1fr 64px 52px',
    gap: 10,
    alignItems: 'center',
    padding: '8px 0',
    borderTop: '1px solid var(--c-line)',
    fontSize: 14,
  },
  num: { color: 'var(--c-text-3)', fontVariantNumeric: 'tabular-nums' },
  pts: { fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  score: { display: 'flex', gap: 8, alignItems: 'center' },
  scoreBig: { fontSize: 34, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em' },
  chip: {
    background: 'var(--c-chip)',
    color: 'var(--c-primary)',
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 600,
  },
  btn: {
    background: 'var(--c-primary)',
    color: 'var(--c-primary-ink)',
    border: 0,
    borderRadius: 'var(--r-sm)',
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'inherit', // кнопки не наследуют шрифт сами — иначе примерка врёт
    whiteSpace: 'nowrap',
    flex: '0 0 auto', // на узких гарнитурах кнопка иначе ломается на две строки
  },
};

const RATING = [
  ['1', 'Ахметов Данияр', '2 148', '+12'],
  ['2', 'Ким Сергей', '2 097', '−4'],
  ['3', 'Оспанова Әсем', '2 041', '+31'],
];

export function FontSpecimen() {
  return (
    <div style={S.page}>
      {FONT_GROUPS.map((group) => {
        const fonts = FONTS.filter((f) => f.group === group);
        if (!fonts.length) return null;
        return (
          <section key={group} style={S.section}>
            <h2 style={S.gname}>
              {group}
              <span style={S.gcount}>{fonts.length}</span>
            </h2>
            <div style={S.wrap}>
              {fonts.map((f) => (
                <Card key={f.id} font={f} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Card({ font: f }: { font: (typeof FONTS)[number] }) {
  const stack = stackOf(f);
  return (
        <div style={{ ...S.card, fontFamily: stack }}>
          <div style={S.head}>
            <span style={{ ...S.name, fontFamily: stack }}>{f.label}</span>
            <span style={S.chip}>Идёт</span>
          </div>

          <div style={S.lock}>
            <img src={fntLogo} alt="Знак ФНТ РК" style={S.lockLogo} />
            <div>
              <div style={S.lockName}>ФНТ РК</div>
              <div style={S.lockFull}>Федерация настольного тенниса</div>
            </div>
            <span style={S.lockLat}>TTFRK</span>
          </div>
          <div>
            <div style={S.h1}>Кубок Республики Казахстан</div>
            <div style={S.sub}>Астана · 14–16 марта · одиночный разряд, 128 участников</div>
          </div>

          <div style={S.score}>
            <span style={S.scoreBig}>11 : 9</span>
            <span style={S.sub}>партии 2 : 1 · стол №4</span>
          </div>

          <div>
            {RATING.map(([n, player, pts, d]) => (
              <div key={n} style={S.row}>
                <span style={S.num}>{n}</span>
                <span>{player}</span>
                <span style={S.pts}>{pts}</span>
                <span style={{ ...S.pts, color: d.startsWith('+') ? 'var(--c-success-light)' : 'var(--c-text-3)' }}>{d}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button style={S.btn}>Подтвердить счёт</button>
            <span style={S.note}>{f.note}</span>
          </div>
        </div>
  );
}
