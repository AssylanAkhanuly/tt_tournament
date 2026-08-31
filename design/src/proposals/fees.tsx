/* Предложение 6 — взнос за нескольких спортсменов сразу ✳ (31.08.2026).

   Единственный пункт документа, который ложится на уже существующее: оплата
   картой через эквайринг Халык Банка и автоматическая простановка состояния
   описаны в TZ §9.2. Не хватает одного — выбрать, **за кого** платишь.

   Кто этим пользуется на самом деле: тренер и администратор клуба платят за
   группу, родитель — за двоих детей, спортсмен — за себя и партнёра по паре.
   Поэтому экран один и живёт там же, где взнос платят сейчас, а не отдельным
   разделом «групповая оплата»: это тот же платёж, просто получателей несколько.

   Что здесь наше решение ✳: платёж один, а состояний столько же, сколько людей.
   Банк подтверждает одну транзакцию — система проставляет «оплачено» каждому
   выбранному и кладёт квитанцию в профиль каждому, а не только плательщику. */

import { useState } from 'react';
import { CreditCard, Users } from 'lucide-react';
import { Avatar, Button } from '@heroui/react';
import {
  A, AW, Bar, Facts, KV, Panel, PhoneRoleApp, Pill, Row, Rows, Sheet, WebApp,
  type RoleUI,
} from '../kit/hero/app';
import type { ScreenMap } from '../mockups/shell';

const R: RoleUI = {
  num: '13',
  title: 'Администратор клуба',
  person: { nm: 'Досжан М.', rl: 'Администратор клуба «Алатау»', av: A(45) },
  brandName: 'Клуб «Алатау»',
  brandSub: 'Состав · заявки · взносы',
  badge: false,
  nav: [
    [<Users size={16} key="c" />, 'Мой клуб'],
    [<CreditCard size={16} key="v" />, 'Взносы'],
  ],
};

const FEE = 12000;

type Payee = { av: string; nm: string; sub: string; paid?: boolean };

const PEOPLE: Payee[] = [
  { av: A(13), nm: 'Ким Георгий', sub: '2003 г.р. · взнос за 2026 не оплачен' },
  { av: A(76), nm: 'Токаев Марат', sub: '2005 г.р. · взнос за 2026 не оплачен' },
  { av: AW(21), nm: 'Тлеуова Аружан', sub: '2007 г.р. · взнос за 2026 не оплачен' },
  { av: A(45), nm: 'Байжанов Асхат', sub: '2004 г.р. · оплачен 14.01.2026', paid: true },
  { av: AW(31), nm: 'Ким Лариса', sub: '2008 г.р. · взнос за 2026 не оплачен' },
  { av: A(64), nm: 'Сейтқали Айдос', sub: '2009 г.р. · взнос за 2026 не оплачен' },
];

const money = (n: number) => n.toLocaleString('ru-RU') + ' ₸';

const PAY_GRID = '40px minmax(0,1fr) 150px 132px';

export function Fees6_1({ done }: { done?: boolean }) {
  const [sel, setSel] = useState<string[]>(['Ким Георгий', 'Токаев Марат', 'Тлеуова Аружан']);
  const chosen = PEOPLE.filter((p) => sel.includes(p.nm) && !p.paid);
  const sum = chosen.length * FEE;
  const toggle = (nm: string) =>
    setSel(sel.includes(nm) ? sel.filter((x) => x !== nm) : [...sel, nm]);

  if (done) {
    return (
      <WebApp
        role={R}
        nav="Взносы"
        title="Взнос оплачен"
        sub="Платёж № 4412 · 31.08.2026, 14:07 · Халык Банк (ePay)"
      >
        <Panel title="Один платёж — три состояния" sub="Банк подтвердил транзакцию, состояния проставились сами" flush>
          <Rows>
            {chosen.map((p) => (
              <Row
                key={p.nm}
                av={p.av}
                nm={p.nm}
                sub={`годовой взнос 2026 · ${money(FEE)} · квитанция в профиле`}
                pill={{ t: 'ОПЛАЧЕН', cls: 'live' }}
              />
            ))}
          </Rows>
        </Panel>
        <Panel title="Квитанция">
          <KV
            items={[
              ['Плательщик', 'Досжан М. · администратор клуба «Алатау»'],
              ['За кого', `${chosen.length} спортсмена`],
              ['Сумма', money(sum)],
              ['Назначение', 'ежегодный регистрационный взнос ФНТ РК, 2026'],
              ['Документ', 'квитанция № 4412 · доступна каждому, за кого заплатили'],
            ]}
          />
        </Panel>
        <Bar>
          Квитанция ложится в профиль каждому, за кого заплатили, а не только плательщику: взнос
          личный, и подтверждать оплату спортсмену придётся своим документом, а не чужим.
        </Bar>
      </WebApp>
    );
  }

  return (
    <WebApp
      role={R}
      nav="Взносы"
      title="Оплата годового взноса"
      sub="Сезон 2026 · можно заплатить за себя и за других сразу"
      hint="Предложение 6: выбрать участников, за которых производится платёж, — состояние в их профилях меняется на «оплачено» автоматически."
    >
      <Panel
        title="За кого платим"
        sub="Отмеченные попадут в один платёж"
        extra={<Pill t={`ВЫБРАНО ${chosen.length}`} color={chosen.length ? 'accent' : 'default'} />}
        flush
      >
        <Sheet flush grid={PAY_GRID} cols={['', 'Спортсмен', 'Взнос 2026', 'Сумма']}>
          {PEOPLE.map((p) => {
            const on = sel.includes(p.nm) && !p.paid;
            return (
              <div
                key={p.nm}
                role="button"
                tabIndex={0}
                data-row
                data-on={on ? '' : undefined}
                onClick={p.paid ? undefined : () => toggle(p.nm)}
                className={
                  'grid w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] ' +
                  (p.paid ? 'opacity-55' : 'cursor-pointer')
                }
                style={{ gridTemplateColumns: PAY_GRID }}
              >
                {/* Отметка нарисована, а не взята чекбоксом библиотеки: на борде
                    открываются десятки экранов сразу, и живой чекбокс здесь
                    ничего не добавляет — состояние и так видно. */}
                <span
                  className={
                    'grid size-[18px] place-items-center border text-[11px] font-bold ' +
                    (on
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : p.paid
                      ? 'border-neutral-200 bg-neutral-100 text-neutral-400'
                      : 'border-neutral-300 bg-white text-transparent')
                  }
                >
                  ✓
                </span>
                <span className="flex min-w-0 items-center gap-2.5">
                  <Avatar size="sm">
                    <Avatar.Image alt={p.nm} src={p.av} />
                    <Avatar.Fallback>{p.nm.slice(0, 1)}</Avatar.Fallback>
                  </Avatar>
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate font-medium">{p.nm}</span>
                    <span className="block truncate text-xs text-neutral-500">{p.sub}</span>
                  </span>
                </span>
                <span>
                  <Pill t={p.paid ? 'ОПЛАЧЕН' : 'НЕ ОПЛАЧЕН'} color={p.paid ? 'success' : 'warning'} />
                </span>
                <span className="text-right tabular-nums text-neutral-600">
                  {p.paid ? '—' : money(FEE)}
                </span>
              </div>
            );
          })}
        </Sheet>
      </Panel>

      <Panel title="К оплате">
        <Facts
          items={[
            { k: 'участников', v: String(chosen.length) },
            { k: 'взнос за одного', v: money(FEE) },
            { k: 'итого', v: money(sum), hot: true },
          ]}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button variant="primary" data-to="П6.1">
            <CreditCard size={15} /> Оплатить {money(sum)} картой
          </Button>
          <span className="text-[12.5px] text-neutral-500">
            Один платёж через эквайринг Халык Банка (ePay). Уже оплатившие в платёж не попадают —
            их строки нельзя отметить.
          </span>
        </div>
      </Panel>

      <Bar tone="warning">
        ⚠ Что делать с возвратом, федерация не сказала: платёж один, а людей несколько — возвращать
        придётся долю, и по чьей заявке. Вопрос к федерации и к бухгалтеру (роль 2).
      </Bar>
    </WebApp>
  );
}

export const Fees6_1Phone = () => (
  <PhoneRoleApp role={R} nav="Взносы" title="Оплата взноса" sub="Выбрано 3 · 36 000 ₸">
    <Rows>
      {PEOPLE.map((p) => (
        <Row
          key={p.nm}
          av={p.av}
          nm={p.nm}
          sub={p.sub}
          pill={p.paid ? { t: 'ОПЛАЧЕН', cls: 'live' } : { t: 'В ПЛАТЁЖ', cls: 'wait' }}
        />
      ))}
    </Rows>
    <div className="mt-3">
      <Button className="w-full" variant="primary">
        <CreditCard size={15} /> Оплатить 36 000 ₸
      </Button>
    </div>
  </PhoneRoleApp>
);

export const FEES_SCREENS: ScreenMap = {
  'П6.1': {
    cap: 'Взнос за нескольких сразу',
    view: () => <Fees6_1 />,
    alt: () => <Fees6_1Phone />,
    frames: [{ t: 'После оплаты — состояние проставилось каждому', view: () => <Fees6_1 done /> }],
  },
};
