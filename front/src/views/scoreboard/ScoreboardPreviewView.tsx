'use client';

// Предпросмотр эфира: плашка счёта и полоса партнёров в одном кадре 16:9
// поверх нарисованного зала. В OBS это два отдельных источника, и где им
// стоять, решает режиссёр; здесь они расставлены так, как на образце — счёт
// слева сверху, партнёры слева снизу, на тёмном полу.
// Счёт живой: кадр слушает ту же доску, что и оверлей.

import { useScoreboardMirror } from '@/features/scoreboard-live/useScoreboardChannel';
import { ScoreboardBoard } from '@/widgets/scoreboard/ScoreboardBoard';
import { SponsorStrip } from '@/widgets/scoreboard/SponsorStrip';
import type { ScoreboardState } from '@/entities/scoreboard/model';

/* Зал нарисован, а не снят: трибуны в тени, пол, стол с сеткой. Цвета — от
   вещательной палитры, чтобы сырых значений в коде не было. Светлый кадр —
   те же три переменные, другие значения. */
const HALL_DARK =
  '[--hall-top:color-mix(in_srgb,var(--sb-navy)_45%,black)] ' +
  '[--hall-floor:color-mix(in_srgb,var(--sb-red)_38%,black)] ' +
  '[--hall-table:color-mix(in_srgb,var(--sb-azure-deep)_70%,var(--sb-navy))]';
const HALL_LIGHT =
  '[--hall-top:color-mix(in_srgb,var(--sb-ink-dim)_80%,var(--sb-navy))] ' +
  '[--hall-floor:color-mix(in_srgb,var(--sb-ink-dim)_55%,white)] ' +
  '[--hall-table:color-mix(in_srgb,var(--sb-azure)_75%,white)]';

export function ScoreboardPreviewView({
  initial,
  label,
  light = false,
}: {
  initial: ScoreboardState;
  label?: string;
  /** Светлый кадр: проверить, читаются ли белые знаки без тёмного пола. */
  light?: boolean;
}) {
  const { state } = useScoreboardMirror(initial);

  return (
    <div className="fixed inset-0 grid place-items-center bg-[color-mix(in_srgb,var(--sb-navy)_25%,black)]">
      {/* Кадр эфира 1920 × 1080, вписанный в окно. Плашки масштабируются той же
          переменной --sb-scale, что и в OBS: одна единица плашки = 1/1920
          ширины кадра, поэтому пропорции в предпросмотре те же, что в
          трансляции. */}
      <div
        className={
          '[--frame-w:min(100vw,calc(100vh*16/9))] [--sb-scale:calc(var(--frame-w)/1920)] ' +
          'relative aspect-video w-(--frame-w) overflow-hidden'
        }
        data-light={light || undefined}
        data-testid="preview-frame"
      >
        <div
          className={
            `${light ? HALL_LIGHT : HALL_DARK} absolute inset-0 ` +
            '[background:linear-gradient(var(--hall-top),color-mix(in_srgb,var(--hall-top)_60%,black)_46%)]'
          }
          aria-hidden
        >
          <div className="absolute [inset:44%_0_0] [background:linear-gradient(color-mix(in_srgb,var(--hall-floor)_70%,black),var(--hall-floor))]" />
          {/* Стол в перспективе: дальний край уже ближнего. */}
          <div
            className={
              'absolute top-[47%] right-[27%] left-[27%] h-[27%] ' +
              '[background:linear-gradient(90deg,transparent_calc(50%_-_0.12%),var(--sb-ink)_0_calc(50%_+_0.12%),transparent_0),linear-gradient(color-mix(in_srgb,var(--hall-table)_75%,black),var(--hall-table))] ' +
              '[clip-path:polygon(17%_0,83%_0,100%_100%,0_100%)]'
            }
          />
          <div className="absolute top-[56%] right-[30.5%] left-[30.5%] h-[2.2%] [border-top:calc(3*var(--sb-scale))_solid_var(--sb-ink)] bg-[color-mix(in_srgb,var(--sb-navy)_55%,transparent)]" />
        </div>
        <div className="absolute top-[calc(40*var(--sb-scale))] left-[calc(48*var(--sb-scale))]">
          <ScoreboardBoard state={state} />
        </div>
        <div className="absolute bottom-[calc(36*var(--sb-scale))] left-[calc(48*var(--sb-scale))]">
          <SponsorStrip label={label} />
        </div>
      </div>
    </div>
  );
}
