/* Рисунки главной ✳ (21.11.2026): пейзаж шапки и три картинки «Vision Board».
   Картинки образца не копируются — нарисованы заменой в том же духе (пейзаж в
   цвете, остальное в серых тонах) и уйдут вместе с образцом. Цвета пейзажа —
   шкалы Tailwind, сырых значений нет. */

export function Landscape() {
  return (
    <svg viewBox="0 0 600 200" preserveAspectRatio="xMidYMid slice" className="size-full" aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="[stop-color:var(--color-sky-300)]" />
          <stop offset="1" className="[stop-color:var(--color-sky-50)]" />
        </linearGradient>
        <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="[stop-color:var(--color-lime-400)]" />
          <stop offset="1" className="[stop-color:var(--color-green-700)]" />
        </linearGradient>
        <linearGradient id="rock" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="[stop-color:var(--color-slate-400)]" />
          <stop offset="1" className="[stop-color:var(--color-slate-600)]" />
        </linearGradient>
      </defs>
      <rect width="600" height="200" fill="url(#sky)" />
      <g className="fill-white" opacity="0.85">
        <ellipse cx="260" cy="45" rx="60" ry="12" />
        <ellipse cx="300" cy="38" rx="40" ry="14" />
        <ellipse cx="470" cy="30" rx="70" ry="13" />
        <ellipse cx="520" cy="24" rx="40" ry="11" />
      </g>
      <path d="M330 150 L420 40 L455 85 L480 60 L560 150 Z" fill="url(#rock)" />
      <path d="M420 40 L405 62 L418 58 L428 70 L438 56 L455 85 L445 60 Z" className="fill-white" />
      <path d="M480 60 L470 74 L482 70 L492 80 L497 76 Z" className="fill-white" />
      <path d="M230 160 L310 90 L360 130 L400 110 L470 165 Z" className="fill-slate-400" opacity="0.8" />
      <path d="M180 200 C260 140 330 135 400 150 C470 165 540 140 600 120 L600 200 Z" fill="url(#hill)" />
      <path d="M300 200 C380 160 460 165 600 160 L600 200 Z" className="fill-green-800" opacity="0.55" />
      <g className="fill-slate-800">
        <circle cx="505" cy="140" r="8" />
        <path d="M490 200 C490 165 495 150 505 150 C517 150 522 165 524 200 Z" />
      </g>
      <g className="stroke-slate-500" fill="none" strokeWidth="1.2">
        <path d="M440 26 l4 3 l4 -3" />
        <path d="M470 18 l3 2 l3 -2" />
      </g>
    </svg>
  );
}

export function VisionArt({ kind }: { kind: 'climb' | 'book' | 'plant' }) {
  if (kind === 'climb') {
    return (
      <svg viewBox="0 0 180 90" className="h-full" aria-hidden>
        <path d="M60 90 L160 35 L160 90 Z" className="fill-neutral-800" />
        <path d="M60 90 L160 35 L160 42 L72 90 Z" className="fill-white" opacity="0.5" />
        <rect x="118" y="30" width="26" height="14" className="fill-neutral-700" />
        <line x1="122" y1="30" x2="122" y2="12" className="stroke-neutral-800" strokeWidth="1.2" />
        <path d="M122 12 L134 16 L122 20 Z" className="fill-neutral-800" />
        <circle cx="86" cy="64" r="2.5" className="fill-neutral-900" />
        <path d="M86 67 L84 76 M86 70 L90 73 M84 76 L82 82 M84 76 L88 81" className="stroke-neutral-900" strokeWidth="1.3" fill="none" />
      </svg>
    );
  }
  if (kind === 'book') {
    return (
      <svg viewBox="0 0 180 90" className="h-full" aria-hidden>
        <ellipse cx="90" cy="80" rx="55" ry="5" className="fill-neutral-300" />
        <path d="M40 70 L40 30 C60 22 78 24 90 34 L90 74 C78 64 60 62 40 70 Z" className="fill-neutral-100 stroke-neutral-500" strokeWidth="1" />
        <path d="M140 70 L140 30 C120 22 102 24 90 34 L90 74 C102 64 120 62 140 70 Z" className="fill-neutral-200 stroke-neutral-500" strokeWidth="1" />
        <path d="M90 34 C100 18 118 14 130 18 L128 28 C116 24 102 26 90 34" className="fill-white stroke-neutral-400" strokeWidth="0.8" />
        {[40, 46, 52].map((y) => (
          <line key={y} x1="50" y1={y} x2="80" y2={y - 3} className="stroke-neutral-300" strokeWidth="0.8" />
        ))}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 180 90" className="h-full" aria-hidden>
      <path d="M78 66 L102 66 L98 86 L82 86 Z" className="fill-neutral-800" />
      <path d="M90 66 C90 50 88 40 90 26" className="stroke-neutral-700" strokeWidth="1.4" fill="none" />
      {[
        [76, 44, -30],
        [104, 40, 30],
        [80, 30, -40],
        [100, 54, 25],
        [92, 22, 0],
      ].map(([x, y, r], k) => (
        <ellipse key={k} cx={x} cy={y} rx="9" ry="4.5" transform={`rotate(${r} ${x} ${y})`} className={k % 2 ? 'fill-neutral-500' : 'fill-neutral-700'} />
      ))}
      {[
        [58, 30, 3],
        [62, 50, 4],
        [70, 18, 2.5],
        [118, 22, 3],
        [124, 46, 3.5],
        [112, 70, 2.5],
      ].map(([x, y, r], k) => (
        <circle key={k} cx={x} cy={y} r={r} className="fill-neutral-400" />
      ))}
      <rect x="128" y="8" width="8" height="8" className="fill-neutral-900" />
    </svg>
  );
}
