'use client';

/* Утвердить протокол для рейтинга (п. 10, 13) — из раздела «Протоколы».

   Уровень соревнования даёт коэффициент C, призовая тройка — коэффициент P.
   Без них в настоящих турнирах оба были бы 1,00. Если матча за 3-е место не
   было, бронзовые оба полуфиналиста (п. 10.4) — появляется второе «3 место».
   Сохранение пересчитывает турнир: прежние строки остаются в истории
   отменёнными. Если после турнира у участников были другие изменения,
   сервер откажет и назовёт причину. */

import { Button } from '@heroui/react';
import { useState } from 'react';

import { saveProtocol, type RatingProtocol } from '@/entities/rating';
import { FilterSeg, InlineDialog, QuietAction } from '@/shared/kit/app';

/** Таблица уровней п. 13 — подписи как в калибровке. */
const LEVELS: [string, string][] = [
  ['top', 'Чемпионат и кубок РК, спартакиада, молодёжные игры, ТОП-12'],
  ['republic', 'Чемпионаты РК по возрастам, ЕЛНТ, республиканские'],
  ['region', 'Областные и городские'],
  ['amateur', 'Любительские'],
];
const NONE = '— не назначено —';

export function ProtocolDialog({
  protocol,
  onClose,
  onDone,
}: {
  protocol: RatingProtocol;
  onClose: () => void;
  onDone: (protocol: RatingProtocol) => void;
}) {
  const nameOf = (place: number) => protocol.participants.filter((p) => p.place === place).map((p) => p.name);
  const [level, setLevel] = useState(protocol.level);
  const [first, setFirst] = useState(nameOf(1)[0] ?? NONE);
  const [second, setSecond] = useState(nameOf(2)[0] ?? NONE);
  const [third, setThird] = useState(nameOf(3)[0] ?? NONE);
  const [thirdTwo, setThirdTwo] = useState(nameOf(3)[1] ?? NONE);
  const [noThird, setNoThird] = useState(protocol.noThirdPlaceMatch);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const names = [NONE, ...protocol.participants.map((p) => p.name)];
  const idOf = (name: string) => protocol.participants.find((p) => p.name === name)?.userId;
  const levelLabel = LEVELS.find(([code]) => code === level)?.[1] ?? protocol.levelLabel;

  async function submit() {
    const places: Record<string, number> = {};
    const put = (name: string, place: number) => {
      const id = idOf(name);
      if (id) places[id] = place;
    };
    put(first, 1);
    put(second, 2);
    put(third, 3);
    if (noThird) put(thirdTwo, 3);

    setBusy(true);
    setError(null);
    try {
      onDone(await saveProtocol(protocol.id, { level, places, noThirdPlaceMatch: noThird }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <InlineDialog
      title={protocol.name}
      sub="Протокол для рейтинга"
      wide
      onClose={onClose}
      foot={
        <>
          <QuietAction onPress={onClose}>Закрыть</QuietAction>
          <Button variant="primary" data-testid="protocol-save" isDisabled={busy} onPress={() => void submit()}>
            Утвердить и пересчитать
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div data-testid="protocol-level">
          <FilterSeg
            items={LEVELS.map(([, label]) => label)}
            active={levelLabel}
            label="Уровень"
            onPick={(label) => setLevel((LEVELS.find(([, l]) => l === label)?.[0] ?? level) as RatingProtocol['level'])}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div data-testid="protocol-place-1">
            <FilterSeg items={names} active={first} label="1 место" onPick={setFirst} />
          </div>
          <div data-testid="protocol-place-2">
            <FilterSeg items={names} active={second} label="2 место" onPick={setSecond} />
          </div>
          <div data-testid="protocol-place-3">
            <FilterSeg items={names} active={third} label="3 место" onPick={setThird} />
          </div>
          {noThird && (
            <div data-testid="protocol-place-3b">
              <FilterSeg items={names} active={thirdTwo} label="3 место" onPick={setThirdTwo} />
            </div>
          )}
        </div>
        <label className="flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={noThird} onChange={(e) => setNoThird(e.target.checked)} />
          Матча за 3-е место не было — оба полуфиналиста бронзовые
        </label>
      </div>
      {error && (
        <p role="alert" data-testid="chairman-error" className="mt-3 text-[13px] text-red-600">
          {error}
        </p>
      )}
    </InlineDialog>
  );
}
