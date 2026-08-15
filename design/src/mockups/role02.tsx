/* Роль 2 · Экономист / бухгалтер — макеты по флоу.
   Экраны Э2.1 и Э2.2 (см. `flows/02-ekonomist.md` и схему роли). */

import { Download, FileWarning, Undo2 } from 'lucide-react';
import { ActionBar, Board, Chips, Hint, Panel, Row, Rows, RoleScreen, Screen, Arrow, A, AW } from './shell';
import { R02 } from './roles';
import { Login0_1 } from './role00';

type Fee = { av: string; nm: string; sub: string; st: 'ОПЛАЧЕН' | 'НЕ ОПЛАЧЕН' | 'ПРОСРОЧЕН'; cls: 'live' | 'wait' | 'bad'; when: string };

const FEES: Fee[] = [
  { av: A(32), nm: 'Смагулов Алан', sub: 'Алматы · Алатау · 2004 г.р.', st: 'ОПЛАЧЕН', cls: 'live', when: '14.01.2026 · Сериков Н.' },
  { av: A(44), nm: 'Ким Георгий', sub: 'Астана · СКА · 2003 г.р.', st: 'ОПЛАЧЕН', cls: 'live', when: '09.01.2026 · Сериков Н.' },
  { av: A(22), nm: 'Жумабеков Расул', sub: 'Караганда · Шахтёр · 2007 г.р.', st: 'НЕ ОПЛАЧЕН', cls: 'wait', when: '—' },
  { av: AW(21), nm: 'Тлеуова Аружан', sub: 'Шымкент · Достык · 2009 г.р.', st: 'НЕ ОПЛАЧЕН', cls: 'wait', when: '—' },
  { av: A(56), nm: 'Гладун Игорь', sub: 'Тараз · 2001 г.р.', st: 'ПРОСРОЧЕН', cls: 'bad', when: 'срок вышел 31.03' },
  { av: A(13), nm: 'Пак Сергей', sub: 'Павлодар · Иртыш · 2005 г.р.', st: 'ОПЛАЧЕН', cls: 'live', when: '22.02.2026 · Сериков Н.' },
];

/* Э2.1 — рабочий экран роли: весь год виден одной таблицей. */
export function Fees2_1() {
  return (
    <RoleScreen
      role={R02}
      nav="Взносы"
      title="Взносы за сезон"
      sub="2026 год · членский взнос федерации ₸ 10 000"
      hint="Взнос требуется там, где у турнира включён флаг: без него заявка не проходит (§9.2)."
    >
      <Chips
        items={[
          { v: '412', k: 'Оплачено', tone: 'g' },
          { v: '96', k: 'Не оплачено', tone: 'a' },
          { v: '18', k: 'Просрочено' },
          { v: '₸ 4,12M', k: 'Поступило', tone: 'b' },
        ]}
      />
      <ActionBar count="526 спортсменов · фильтр: регион Алматы, 2026">
        <button className="dpickbtn">
          <Download size={14} /> Выгрузить список
        </button>
      </ActionBar>
      <Rows>
        {FEES.map((f) => (
          <Row
            key={f.nm}
            av={f.av}
            nm={f.nm}
            sub={f.sub}
            val={f.when}
            pill={{ t: f.st, cls: f.cls }}
            action={f.cls === 'live' ? undefined : 'Отметить вручную'}
          />
        ))}
      </Rows>
    </RoleScreen>
  );
}

/* Э2.2 — карточка: здесь снимают отметку и видят, кто что делал. */
export function Fee2_2() {
  return (
    <RoleScreen
      role={R02}
      nav="Взносы"
      title="Карточка взноса"
      sub="Смагулов Алан · Алматы · клуб «Алатау»"
      hint="Снятие отметки требует причины и попадает в журнал действий (§12)."
    >
      <div className="mkcols">
        <Panel title="Взнос за 2026 год" extra={<span className="pill live" style={{ margin: 0 }}>ОПЛАЧЕН</span>}>
          <div className="dform">
            <div className="dfield">
              <div className="k">Год</div>
              <div className="dval">2026</div>
            </div>
            <div className="dfield">
              <div className="k">Сумма</div>
              <div className="dval">₸ 10 000</div>
            </div>
            <div className="dfield">
              <div className="k">Дата оплаты</div>
              <div className="dval">14.01.2026</div>
            </div>
            <div className="dfield">
              <div className="k">Как оплачен</div>
              <div className="dval">картой · Halyk ePay · платёж 4172-8830</div>
            </div>
            <div className="dfield wide">
              <div className="k">Приложенный документ</div>
              <div className="dval" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileWarning size={15} /> не решено, храним ли платёжку
              </div>
            </div>
          </div>
          <div className="dactionbar" style={{ marginTop: 12 }}>
            <div className="dcount">Спортсмен и его тренер видят это состояние</div>
            <button className="dpickbtn">
              <Undo2 size={14} /> Снять отметку с причиной
            </button>
          </div>
        </Panel>

        <Panel title="История по взносу">
          <Rows>
            <Row nm="Отметил оплату" sub="Сериков Н. · 14.01.2026, 10:42" pill={{ t: 'ОПЛАЧЕН', cls: 'live' }} />
            <Row nm="Взнос выставлен" sub="система · 01.01.2026" pill={{ t: 'НЕ ОПЛАЧЕН', cls: 'wait' }} />
          </Rows>
          <Hint>Записи журнала не редактируются и не удаляются — видно, кто и когда менял состояние.</Hint>
        </Panel>
      </div>
    </RoleScreen>
  );
}

export function Role02Board() {
  return (
    <Board role={R02}>
      <Screen code="Э0.1" cap="Вход">
        <Login0_1 />
      </Screen>
      <Arrow lbl="первый экран роли" />
      <Screen code="Э2.1" cap="Взносы за сезон">
        <Fees2_1 />
      </Screen>
      <Arrow lbl="строка спортсмена" />
      <Screen code="Э2.2" cap="Карточка взноса">
        <Fee2_2 />
      </Screen>
    </Board>
  );
}
