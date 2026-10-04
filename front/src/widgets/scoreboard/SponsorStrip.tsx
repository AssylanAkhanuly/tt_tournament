// Полоса партнёров — вторая вещательная плашка: знаки в ряд через тонкие
// линии, без подложки, поверх видео. Чистая отрисовка, как и плашка счёта.

import type { CSSProperties } from 'react';

import { SPONSORS, type Sponsor } from './sponsors';
import styles from './SponsorStrip.module.css';

/** Размер источника «Браузер» в OBS под полный набор партнёров с подписью.
 *  Полоса занимает столько, сколько ей нужно; остаток источника прозрачный. */
export const SPONSOR_STRIP_SIZE = { width: 1400, height: 100 } as const;

export function SponsorStrip({
  label,
  sponsors = SPONSORS,
}: {
  /** Подпись перед знаками — город или название турнира. */
  label?: string;
  sponsors?: readonly Sponsor[];
}) {
  return (
    <div className={styles.strip} data-testid="sponsors">
      {label ? (
        <span className={styles.label} data-testid="sponsors-label">
          {label}
        </span>
      ) : null}
      {sponsors.map((sponsor) => (
        // Обычный <img>: знаки лежат готовыми в public, а оптимизатор картинок
        // Next источнику в OBS ничего не даёт.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={sponsor.id}
          className={styles.logo}
          src={`/sponsors/${sponsor.id}.png`}
          alt={sponsor.name}
          data-testid={`sponsor-${sponsor.id}`}
          style={{ '--sp-h': sponsor.height } as CSSProperties}
        />
      ))}
    </div>
  );
}
