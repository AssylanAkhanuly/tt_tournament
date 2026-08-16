import { useState, type ReactNode } from 'react';
import { ArrowLeft, Bell, ChevronDown, LogOut, User } from 'lucide-react';
import { Brand } from './ui';

/* Общая десктоп-оболочка (верхняя панель + сайдбар + main) для флоу веба.
   variant='land' — тот же layout в горизонтальной планшетной рамке (веб на планшете
   лёжа ≈ компактный десктоп). Навигация, роль и заголовок — параметрами.

   Пункты сайдбара — кнопки. Если передан `onNavigate`, экран переключается по
   клику (истории «Прототип»); без него кнопки просто показывают текущий раздел,
   как и раньше в статичных флоу-бордах. */

export type DeskVariant = 'desktop' | 'land';

/* Последние уведомления в шапке. Перечень событий — TZ §10.1; каждое ведёт на
   свой экран, поэтому у строки есть код перехода. Роли берут одну оболочку, и
   набор здесь общий: у судьи и спортсмена он выглядел бы по-разному, но
   поведение — одно, и проверяем мы его. */
const NOTES: { t: string; s: string; at: string; to: string }[] = [
  { t: 'Заявка принята', s: 'Кубок Алматы 2026 · решение главного судьи', at: '10:42', to: 'Э0.3' },
  { t: 'Пара вызвана на стол', s: 'стол 5 · 1/8 финала', at: '09:15', to: 'Э0.3' },
  { t: 'Рейтинг пересчитан', s: 'турнир завершён · +8', at: 'вчера', to: 'Э0.3' },
];

// рамка: десктоп (ноутбук 1200x760) либо планшет-альбом (1024x720)
export function DeskFrame({ variant = 'desktop', children }: { variant?: DeskVariant; children: ReactNode }) {
  if (variant === 'land') return <div className="tabframe land"><div className="deskland">{children}</div></div>;
  return <div className="dwrap"><div className="laptop">{children}</div></div>;
}

export function Desk({
  variant = 'desktop', brandName, brandSub, badge = 'ИДЁТ', title, sub, back, nav, activeNav,
  onNavigate, role, hint, children,
}: {
  variant?: DeskVariant;
  brandName?: string;
  brandSub?: string;
  /** Значок состояния рядом с названием. `false` — роль вне турнира, значка нет. */
  badge?: string | false;
  title: string;
  /** Подзаголовок под названием экрана. Не задан — строки нет вовсе: пустая
      подпись оставляла бы под заголовком дырку. */
  sub?: string;
  /** Возврат над заголовком: подпись и экран, куда ведёт. Не задан — кнопки нет.

      Нужен экранам, на которые приходят из списка и куда сайдбар не ведёт:
      форма, карточка, мастер. Пункт меню у них тот же, что у списка, и без этой
      кнопки уйти обратно нечем — разве что снова жать пункт сайдбара, теряя
      место в списке. */
  back?: { label: string; to?: string; onClick?: () => void };
  nav: [ReactNode, string][];
  activeNav: string;
  /** передан — сайдбар становится кликабельным (живой прототип роли) */
  onNavigate?: (item: string) => void;
  role: { nm: string; rl: string; av: string };
  hint?: string;
  children: ReactNode;
}) {
  /* Меню профиля. Выход живёт здесь, а не отдельной кнопкой в шапке: система
     именная, каждое действие пишется в журнал с автором (TZ §12), поэтому «кто
     я» и «выйти» — одно место. Одним кликом по имени не выходим — случайный
     выход посреди турнира стоит дороже лишнего клика. */
  const [menu, setMenu] = useState(false);
  /* Уведомления. Колокольчик не просто счётчик: по клику открывается лента
     последних, и каждое уведомление ведёт на свой экран (TZ §10.1) — заявка в
     свою заявку, вызов в матч. Внизу — выход в полную ленту (Э0.3). */
  const [bell, setBell] = useState(false);
  return (
    <DeskFrame variant={variant}>
      <div className="dtop">
        <Brand />
        <div style={{ width: 1, height: 26, background: 'var(--c-glass-line)' }} />
        <div>
          <div className="bname" style={{ fontSize: 14 }}>{brandName ?? 'Чемпионат Казахстана 2026'}</div>
          <div className="tname">{brandSub ?? 'Одиночный · олимпийская · г. Астана'}</div>
        </div>
        {badge !== false && <span className="live"><span className="d" />{badge}</span>}
        <div className="sp" />
        {/* Поиска в шапке нет: единого «поиска по всему» у нас не проектируется,
            искать человека или турнир идут в свой реестр, где есть фильтры. */}
        <div className="dme">
          <button
            type="button"
            className="iconbtn dot"
            onClick={() => setBell(!bell)}
            aria-expanded={bell}
          >
            <Bell size={16} />
          </button>
          {bell && (
            <div className="dmenu dnotes">
              <div className="dmenu-h">Уведомления<span>3 непрочитанных</span></div>
              {NOTES.map((n) => (
                <button type="button" className="dnote" key={n.t} data-to={n.to}>
                  <span className="d" />
                  <span>
                    <b>{n.t}</b>
                    <i>{n.s}</i>
                  </span>
                  <em>{n.at}</em>
                </button>
              ))}
              <button type="button" className="dmenu-i" data-to="Э0.3">
                Все уведомления
              </button>
            </div>
          )}
        </div>
        <div className="dme">
          <button type="button" className="me" onClick={() => setMenu(!menu)} aria-expanded={menu}>
            <img src={role.av} alt="" />
            <div><div className="nm">{role.nm}</div><div className="rl">{role.rl}</div></div>
            <ChevronDown size={14} />
          </button>
          {menu && (
            <div className="dmenu">
              {/* Под каким аккаунтом сидишь — прямо над выходом: у одного
                  человека бывает несколько ролей, и выйти он может не из той. */}
              <div className="dmenu-h">{role.nm}<span>{role.rl}</span></div>
              {/* В свой профиль (Э0.2) попадают «по имени и фото в шапке» —
                  так и записано во флоу сквозных экранов. */}
              <button type="button" className="dmenu-i" data-to="Э0.2">
                <User size={14} /> Мой профиль
              </button>
              <button type="button" className="dmenu-i out" data-to="Э0.1">
                <LogOut size={14} /> Выйти
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="dgrid">
        <aside className="dside">
          {nav.map(([ic, t]) => (
            <button
              key={t}
              type="button"
              className={'dni' + (t === activeNav ? ' on' : '')}
              onClick={onNavigate ? () => onNavigate(t) : undefined}
            >
              {ic}{t}
            </button>
          ))}
          <div className="grow" />
          {hint && <div className="hint">{hint}</div>}
        </aside>
        <main className="dmain">
          <div className="dtitle">
            {back && (
              <button type="button" className="dback" data-to={back.to} onClick={back.onClick}>
                <ArrowLeft size={14} /> {back.label}
              </button>
            )}
            <h2>{title}</h2>
            {sub && <p>{sub}</p>}
          </div>
          {children}
        </main>
      </div>
    </DeskFrame>
  );
}
