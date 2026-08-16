/* Роль 1 · Администратор Федерации — адаптив: планшет и телефон.

   Устройство роли по флоу — десктоп, и это не про то, что с телефона она
   работать не должна: продукт веб, значит те же экраны открываются с любого
   размера. Вопрос дизайна — что от роли остаётся на маленьком экране.

   Наш ответ: на планшете — та же раскладка плотнее (десктопная оболочка в
   планшетной рамке), на телефоне — только разбор и просмотр: «Требует
   внимания», ход сегодняшних матчей, календарь и журнал. Заведение
   соревнования, выдача ролей и объединение дублей — работа на десктопе:
   это длинные формы, и на 320 px они превращаются в анкету на десять экранов.

   Экраны те же, что в борде роли: Э1.1, Э1.2, Э1.7. */

import type { ReactNode } from 'react';
import { CalendarDays, History, LayoutDashboard, Search } from 'lucide-react';
import { Board as RespBoard, Col, Arrow } from '../respShell';
import { RolePhone } from './shell';
import { Cal1_2, Dash1_1 } from './role01';

/* ── Планшет: та же оболочка, плотнее ───────────────────────────── */

export function Role01TabletBoard() {
  return (
    <RespBoard
      title="1 · АДМИНИСТРАТОР ФЕДЕРАЦИИ — ПЛАНШЕТ"
      tag="веб · планшет · те же экраны Э1.1 и Э1.2, раскладка не меняется"
    >
      <Col cap="Э1.1 · Панель Федерации">
        <Dash1_1 variant="land" />
      </Col>
      <Arrow lbl="пункт «Календарь»" />
      <Col cap="Э1.2 · Календарь сезона">
        <Cal1_2 variant="land" />
      </Col>
    </RespBoard>
  );
}

/* ── Телефон: разбор, ход матчей, календарь, журнал ─────────────── */

const PTABS: [ReactNode, string][] = [
  [<LayoutDashboard size={20} />, 'Панель'],
  [<CalendarDays size={20} />, 'Календарь'],
  [<History size={20} />, 'Журнал'],
];

/** Плитка «Требует внимания» на телефоне: две в ряд вместо четырёх. */
const Stat = ({ v, k, tone }: { v: string; k: string; tone?: 'g' | 'r' | 'b' }) => (
  <div className={'stat' + (tone ? ` ${tone}` : '')}>
    <div className="v">{v}</div>
    <div className="k">{k}</div>
  </div>
);

/** Строка списка на телефоне: значок слева, состояние справа. */
const Item = ({
  ic,
  tt,
  ss,
  rt,
  live,
}: {
  ic: ReactNode;
  tt: string;
  ss: string;
  rt?: string;
  live?: boolean;
}) => (
  <div className={'item' + (live ? ' live' : '')}>
    <div className="ic">{ic}</div>
    <div className="tx">
      <div className="tt">{tt}</div>
      <div className="ss">{ss}</div>
    </div>
    {rt && <div className="rt">{rt}</div>}
  </div>
);

function Phone1_1() {
  return (
    <RolePhone brand="ФНТ РК" tabs={PTABS} active="Панель">
      <div className="title">Панель Федерации</div>
      <div className="sect">Требует внимания</div>
      <div className="stats" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <Stat v="3" k="Без судьи" />
        <Stat v="5" k="Регламент пуст" tone="r" />
        <Stat v="12" k="Заявки > 3 дней" tone="r" />
        <Stat v="96" k="Взносы не оплачены" tone="b" />
      </div>
      <div className="sect">Сегодня идут</div>
      <Item live ic={<span>М</span>} tt="Суперлига · мужчины" ss="Караганда · столы 1–6" rt="34 / 60" />
      <Item live ic={<span>Ж</span>} tt="Суперлига · женщины" ss="Караганда · столы 7–10" rt="26 / 48" />
      <div className="sect">Ближайшие старты</div>
      <div className="card">
        <span className="pill reg">СУДЬЯ НАЗНАЧЕН</span>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Кубок Республики Казахстан 2026</div>
        <div style={{ fontSize: 11.5, color: 'var(--c-muted)', marginTop: 4 }}>
          Главный старт · Астана · 18–20 мая · подано 128
        </div>
      </div>
    </RolePhone>
  );
}

function Phone1_2() {
  return (
    <RolePhone brand="ФНТ РК" tabs={PTABS} active="Календарь">
      <div className="title">Календарь</div>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px' }}>
        <Search size={16} />
        <div style={{ fontSize: 13, color: 'var(--c-muted)' }}>Поиск по названию · сезон 2026</div>
      </div>
      <div className="dseg2">
        <span className="on">Все</span>
        <span>Главный старт</span>
        <span>Лига</span>
        <span>ОРТ</span>
      </div>
      <div className="sect">32 соревнования</div>
      {[
        { st: 'ИДЁТ', cls: 'live', nm: 'Евразийская лига · 2-й тур', mt: 'Караганда · 14–16 апреля · судья Пак С.' },
        { st: 'ЗАЯВКИ СУДЕЙ', cls: 'wait', nm: 'ОРТ «Кубок Иртыша»', mt: 'Павлодар · 25 апреля · судьи нет' },
        { st: 'СУДЬЯ НАЗНАЧЕН', cls: 'reg', nm: 'Кубок Республики Казахстан 2026', mt: 'Астана · 18–20 мая · судья Оспанов Т.' },
        { st: 'ЧЕРНОВИК', cls: 'done', nm: 'ОРТ «Шымкент Open»', mt: 'Шымкент · 9 мая · регламент не заполнен' },
      ].map((t) => (
        <div className="card" key={t.nm}>
          <span className={'pill ' + t.cls}>{t.st}</span>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{t.nm}</div>
          <div style={{ fontSize: 11.5, color: 'var(--c-muted)', marginTop: 4 }}>{t.mt}</div>
        </div>
      ))}
    </RolePhone>
  );
}

function Phone1_7() {
  return (
    <RolePhone brand="ФНТ РК" tabs={PTABS} active="Журнал">
      <div className="title">Журнал</div>
      <div className="dseg2">
        <span className="on">Все</span>
        <span>Турниры</span>
        <span>Роли</span>
        <span>Взносы</span>
      </div>
      <div className="sect">15 апреля</div>
      <Item
        ic={<History size={17} />}
        tt="Изменил расписание"
        ss="Оспанов Т. · Кубок РК · стол 4, 10:00 → стол 6, 11:30"
        rt="18:03"
      />
      <div className="sect">14 апреля</div>
      <Item
        ic={<History size={17} />}
        tt="Опубликовала соревнование"
        ss="Абаева Д. · Кубок РК · Судья назначен → Приём заявок игроков"
        rt="10:42"
      />
      <Item
        ic={<History size={17} />}
        tt="Отметил оплату взноса"
        ss="Сериков Н. · Смагулов А. · Не оплачен → Оплачен"
        rt="09:15"
      />
      <div className="card" style={{ fontSize: 11.5, color: 'var(--c-dim)', lineHeight: 1.5 }}>
        Записи журнала не редактируются и не удаляются. С телефона журнал только читают:
        выгрузка — с десктопа.
      </div>
    </RolePhone>
  );
}

export function Role01PhoneBoard() {
  return (
    <RespBoard
      title="1 · АДМИНИСТРАТОР ФЕДЕРАЦИИ — ТЕЛЕФОН"
      tag="веб · телефон · разбор и просмотр; длинные формы остаются на десктопе"
    >
      <Col cap="Э1.1 · Панель Федерации">
        <Phone1_1 />
      </Col>
      <Arrow lbl="вкладка «Календарь»" />
      <Col cap="Э1.2 · Календарь сезона">
        <Phone1_2 />
      </Col>
      <Arrow lbl="вкладка «Журнал»" />
      <Col cap="Э1.7 · Журнал действий">
        <Phone1_7 />
      </Col>
    </RespBoard>
  );
}
