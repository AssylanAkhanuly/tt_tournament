// Страница-оверлей с полосой партнёров: отдельный источник «Браузер» в OBS,
// чтобы её ставили в кадр независимо от плашки счёта. Состояния у неё нет —
// ни сети, ни клиентского кода.

import { SponsorStrip } from '@/widgets/scoreboard/SponsorStrip';

import styles from './ScoreboardOverlayView.module.css';

export function ScoreboardSponsorsView({ label }: { label?: string }) {
  return (
    <div className={styles.stage}>
      <SponsorStrip label={label} />
    </div>
  );
}
