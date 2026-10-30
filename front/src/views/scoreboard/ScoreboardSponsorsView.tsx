// Страница-оверлей с полосой партнёров: отдельный источник «Браузер» в OBS,
// чтобы её ставили в кадр независимо от плашки счёта. Состояния у неё нет —
// ни сети, ни клиентского кода.

import { SponsorStrip } from '@/widgets/scoreboard/SponsorStrip';

// Сцена — как у плашки счёта (`ScoreboardOverlayView`): прозрачный фон
// страницы, полоса прижата к левому верхнему углу. Класс повторён, а не
// импортирован: тот модуль клиентский, а эта страница серверная.
const STAGE = 'inline-block overflow-hidden [:where(:is(html,body):has(&))]:[background:transparent]';

export function ScoreboardSponsorsView({ label }: { label?: string }) {
  return (
    <div className={STAGE}>
      <SponsorStrip label={label} />
    </div>
  );
}
