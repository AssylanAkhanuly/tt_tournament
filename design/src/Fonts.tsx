import type { CSSProperties } from 'react';
import { FONTS } from './fonts';

/* Специмен гарнитур: один и тот же кусок интерфейса турнира, набранный каждым
   шрифтом из списка. Нужен, чтобы сравнивать не «алфавит», а реальные вещи —
   заголовок, таблицу рейтинга, счёт матча, кнопку. */

const S: Record<string, CSSProperties> = {
  wrap: {
    background: 'var(--c-bg)',
    padding: 32,
    display: 'grid',
    gap: 20,
    gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
    color: 'var(--c-ink)',
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
  name: { fontSize: 13, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--c-primary)' },
  note: { fontSize: 12, color: 'var(--c-muted)', lineHeight: 1.45 },
  h1: { fontSize: 26, fontWeight: 800, letterSpacing: '-.01em', lineHeight: 1.15 },
  sub: { fontSize: 14, color: 'var(--c-muted)' },
  row: {
    display: 'grid',
    gridTemplateColumns: '28px 1fr 64px 52px',
    gap: 10,
    alignItems: 'center',
    padding: '8px 0',
    borderTop: '1px solid var(--c-line)',
    fontSize: 14,
  },
  num: { color: 'var(--c-muted)', fontVariantNumeric: 'tabular-nums' },
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
  },
};

const RATING = [
  ['1', 'Ахметов Данияр', '2 148', '+12'],
  ['2', 'Ким Сергей', '2 097', '−4'],
  ['3', 'Оспанова Әсем', '2 041', '+31'],
];

export function FontSpecimen() {
  return (
    <div style={S.wrap}>
      {FONTS.map((f) => (
        <div key={f.id} style={{ ...S.card, fontFamily: f.stack }}>
          <div style={S.head}>
            <span style={{ ...S.name, fontFamily: f.stack }}>{f.label}</span>
            <span style={S.chip}>Идёт</span>
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
                <span style={{ ...S.pts, color: d.startsWith('+') ? 'var(--c-success)' : 'var(--c-muted)' }}>{d}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button style={S.btn}>Подтвердить счёт</button>
            <span style={S.note}>{f.note}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
