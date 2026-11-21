'use client';

/* Оболочка рабочего места роли на десктопе ✳ (28.10.2026) — HeroUI + Tailwind.

   Первая оболочка по правилу «новое — на HeroUI и Tailwind, без своего кита»
   (решение владельца продукта): вместо `AppChrome` из `@/shared/kit/app`.
   Устройство то же — шапка, слева разделы и человек внизу, справа
   рабочая область с полосой главных кнопок, — но меню человека и смена роли
   собраны на `Dropdown` из HeroUI: вложенное меню, клавиатура, закрытие по
   клику мимо и Esc — из библиотеки, а не руками.

   Меню человека открывается справа от карточки; первая строка — роль, в
   которой работают, она раскрывает вложенное меню с ролями человека.
   Подписей-заголовков в меню нет (решение владельца продукта, 28.10.2026). */

import { Avatar, Button, Chip, Dropdown, Label, Modal, Separator, useOverlayState } from '@heroui/react';
import { ChevronDown, ChevronsUpDown, LogOut, User } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { useNarrow } from '@/shared/kit/app';
import { MenuSheet } from '@/shared/ui/MenuSheet';
import { ModalSheet } from '@/shared/ui/ModalSheet';

/** Квадратный знак QTT — значок приложения (`app/icon.svg`, Next отдаёт его по `/icon.svg`). */
const MARK = '/icon.svg';

/* Пункт меню: выбранный — белая плашка на подложке сайдбара, остальные —
   приглушённый текст. Цвета — токены оболочки (`--shell-*` во входе
   Tailwind), не шкалы. */
const ACTIVE = 'border border-shell-line bg-shell-active text-shell-active-ink shadow-xs';
const IDLE = 'border border-transparent text-shell-muted hover:bg-shell-side-hover hover:text-shell-ink';

/** Один радиус у карточки человека, меню и строк меню. */
const RADIUS = 'rounded-xl';

/** Вложенный пункт раздела ✳ (30.10.2026, решение владельца продукта): вместо
 *  вкладок на экране — подпункты в сайдбаре («Судьи» → «Коллегия», «Заявки»).
 *  Какой выбран, решает экран (он знает адрес); значок — число (ждут решения). */
export type ShellSubItem = { label: string; href: string; active?: boolean; badge?: number };
/** Пункт меню: `group` — заголовок группы над ним (как «Operations» в
 *  образце Visitly), `badge` — красный счётчик справа. */
export type ShellNavItem = { label: string; icon?: ReactNode; children?: ShellSubItem[]; group?: string; badge?: number };
export type ShellRole = { title: string; to: string };
/** Вкладка страницы ✳ (21.11.2026): разделы страницы (турнира, сезона, лиги,
 *  тура) — вкладками под заголовком, а не в сайдбаре; у выбранной — её виды
 *  («Матчи · День») справа в той же полосе. */
export type ShellTab = { label: string; href: string; icon?: ReactNode; active?: boolean; views?: ShellSubItem[] };

export function AppShell({
  role,
  roles,
  person,
  nav,
  active,
  title,
  actions,
  bleed = false,
  context,
  home,
  tabs,
  onNavigate,
  onOpen,
  onSwitchRole,
  onSignOut,
  children,
}: {
  /** Роль, в которой работают сейчас: первая строка меню человека. Отдельной
   *  карточки роли в сайдбаре нет (решение владельца продукта, 28.10.2026). */
  role: { title: string };
  /** Роли человека с кабинетом в приложении — для вложенного меню смены роли. */
  roles: ShellRole[];
  person: { name: string; email?: string | null };
  nav: ShellNavItem[];
  /** Активный раздел. */
  active?: string;
  /** Заголовок — только когда он и есть содержание (имя спортсмена). */
  title?: string;
  /** Шапка сайдбара над разделами: где человек сейчас (страница турнира —
   *  «← Все турниры», название и дата). Нет — разделы сразу. */
  context?: ReactNode;
  /** Куда ведёт знак QTT в шапке ✳ (19.11.2026, решение владельца продукта):
   *  с ним из турнира возвращаются к списку турниров кабинета — «← Все
   *  турниры» в сайдбаре больше нет. Пусто — знак не ссылка. */
  home?: string;
  /** Разделы страницы вкладками под заголовком. */
  tabs?: ShellTab[];
  /** Содержимое на всю рабочую область — без полей и общей прокрутки:
   *  экран сам раскладывается по высоте (календарь). */
  bleed?: boolean;
  /** Главные кнопки экрана: полоса внизу рабочей области. */
  actions?: ReactNode;
  onNavigate: (label: string) => void;
  /** Подпункт раздела — переход по его адресу. */
  onOpen?: (href: string) => void;
  onSwitchRole: (to: string) => void;
  onSignOut: () => void;
  children: ReactNode;
}) {
  const profile = useOverlayState();
  const narrow = useNarrow();
  const [personSheet, setPersonSheet] = useState(false);
  // Разделы с подпунктами складываются и раскрываются ✳ (30.10.2026, решение
  // владельца продукта). Тот, где человек сейчас, раскрыт, пока его не сложили;
  // прочие сложены, пока их не раскрыли. Помним только сделанное руками.
  const [flipped, setFlipped] = useState<Set<string>>(() => new Set());
  const isOpen = (label: string) => (label === active) !== flipped.has(label);
  const toggle = (label: string) =>
    setFlipped((f) => {
      const next = new Set(f);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });

  return (
    // `hero-scope` — локальный сброс вместо preflight; `relative` — диалоги
    // рабочей области рисуются абсолютным слоем внутри.
    <div
      className="hero-scope relative flex h-screen w-full flex-col overflow-hidden bg-shell-page font-[family-name:var(--font)] text-shell-ink"
      data-theme="light"
    >

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-b border-shell-line bg-shell-side px-3 py-2 md:w-56 md:border-b-0 md:border-r md:py-3">
          {/* Верх сайдбара ✳ (21.11.2026, образец Visitly): карточка рабочего
              места — знак, «ФНТ РК», роль; ⇅ — смена роли. Карточка ведёт на
              уровень выше (`home`). Поиска нет ✳ (21.11.2026, решение владельца продукта). */}
          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-shell-line bg-shell-active p-1 max-md:mr-12 md:mb-4">
            <a
              href={home ?? '#'}
              onClick={(e) => {
                e.preventDefault();
                if (home) onOpen?.(home);
              }}
              aria-label="Турниры"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-0.5"
              data-testid="home-link"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={MARK} alt="QTT" className="size-7 shrink-0 rounded-md" />
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-[13px] font-semibold text-shell-ink">ФНТ РК</span>
                <span className="truncate text-[11px] text-shell-muted">{role.title}</span>
              </span>
            </a>
            {roles.length > 1 && (
              <Dropdown>
                <Dropdown.Trigger aria-label="Сменить роль" className="grid size-7 shrink-0 place-items-center rounded-md text-shell-faint hover:bg-shell-side-hover" data-testid="workspace-switch">
                  <ChevronsUpDown size={14} />
                </Dropdown.Trigger>
                <Dropdown.Popover placement="bottom start" className={RADIUS}>
                  <Dropdown.Menu
                    aria-label="Работать как"
                    selectionMode="single"
                    selectedKeys={roles.filter((r) => r.title === role.title).map((r) => r.to)}
                    onAction={(key) => {
                      const picked = roles.find((r) => r.to === key);
                      if (picked && picked.title !== role.title) onSwitchRole(picked.to);
                    }}
                  >
                    {roles.map((r) => (
                      <Dropdown.Item key={r.to} id={r.to} textValue={r.title} className={RADIUS}>
                        <Dropdown.ItemIndicator />
                        <Label>{r.title}</Label>
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            )}
          </div>
          {context && (
            <div className="mb-2 md:mb-3 md:border-b md:border-shell-line md:pb-3 max-md:[&_[data-testid=tournament-context]]:hidden">
              {context}
            </div>
          )}
          {nav.length > 0 && !nav.some((n) => n.group) && (
            <p className="px-2 pb-1 text-[10px] font-semibold tracking-wider text-shell-faint uppercase max-md:hidden">Главное меню</p>
          )}
          {nav.length > 0 && (
            <nav className="flex gap-0.5 overflow-x-auto md:flex-col" aria-label="Разделы">
              {nav.map((item, k) => {
                const on = item.label === active;
                const heading = item.group && item.group !== nav[k - 1]?.group ? item.group : null;
                const nested = !!item.children?.length;
                const open = nested && isOpen(item.label);
                // Раскрыт — подсвечен выбранный подпункт, раздел — их шапка;
                // сложен — подсвечен сам раздел, если человек в нём.
                const lit = on && !(open && item.children!.some((c) => c.active));
                return (
                  <div key={item.label} className="contents md:flex md:flex-col md:gap-0.5">
                    {heading && (
                      <p className={'px-2 pb-1 text-[10px] font-semibold tracking-wider text-shell-faint uppercase max-md:hidden ' + (k ? 'pt-4' : '')}>
                        {heading}
                      </p>
                    )}
                    <div className="relative flex max-md:flex-1">
                      <Button
                        variant="ghost"
                        aria-current={lit || undefined}
                        // Свой раздел — сложить/раскрыть; чужой — перейти (и раскрыть).
                        onPress={() => (on && nested ? toggle(item.label) : onNavigate(item.label))}
                        className={
                          'h-8 w-full justify-start gap-2 rounded-lg px-2 text-[13px] font-medium [&_svg]:size-[15px] max-md:w-auto max-md:flex-1 max-md:justify-center ' +
                          (nested ? 'md:pr-9 ' : '') +
                          (lit ? ACTIVE : on ? 'text-shell-ink hover:bg-shell-side-hover' : IDLE)
                        }
                      >
                        {item.icon}
                        <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                        {!!item.badge && (
                          <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-md bg-red-600 px-1 text-[10.5px] font-semibold tabular-nums text-white">
                            {item.badge}
                          </span>
                        )}
                      </Button>
                      {nested && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          aria-label={(open ? 'Свернуть: ' : 'Раскрыть: ') + item.label}
                          aria-expanded={open}
                          onPress={() => toggle(item.label)}
                          className="absolute right-1 top-1/2 h-6 w-6 min-w-6 -translate-y-1/2 text-shell-muted hover:bg-shell-side-hover max-md:hidden"
                          data-testid="nav-toggle"
                        >
                          <ChevronDown size={14} className={'transition-transform ' + (open ? 'rotate-180' : '')} />
                        </Button>
                      )}
                    </div>
                    {open &&
                      item.children!.map((sub) => (
                        <Button
                          key={sub.href}
                          variant="ghost"
                          aria-current={sub.active || undefined}
                          onPress={() => onOpen?.(sub.href)}
                          className={
                            // На телефоне сайдбар — полоса: подпункты встают в неё следом.
                            'ml-[15px] h-7 w-[calc(100%-15px)] justify-start gap-2 rounded-none border-0 border-l border-shell-line pl-3.5 pr-2 text-[12.5px] font-medium max-md:ml-0 max-md:w-auto max-md:flex-1 max-md:justify-center max-md:border-l-0 max-md:pl-2.5 ' +
                            (sub.active ? 'border-l-shell-active-ink text-shell-ink' : 'text-shell-muted hover:text-shell-ink')
                          }
                          data-testid="nav-sub"
                        >
                          <span className="min-w-0 flex-1 truncate text-left">{sub.label}</span>
                          {!!sub.badge && (
                            <span
                              className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-shell-active-ink px-1 text-[10px] font-semibold tabular-nums text-shell-bar-ink"
                              aria-label={'ждут решения: ' + sub.badge}
                              data-testid="nav-sub-badge"
                            >
                              {sub.badge}
                            </span>
                          )}
                        </Button>
                      ))}
                  </div>
                );
              })}
            </nav>
          )}

          <div className="max-md:absolute max-md:right-4 max-md:top-2 max-md:w-10 md:mt-auto md:pt-3">
            {/* Телефон ✳ (03.11.2026, решение владельца продукта): меню человека —
                панелью снизу, а не выпадающим списком. */}
            {narrow ? (
              <>
                <button
                  type="button"
                  data-testid="side-person"
                  onClick={() => setPersonSheet(true)}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-shell-line bg-shell-active px-2.5 py-2 text-left hover:bg-shell-side-hover max-md:size-10 max-md:justify-center max-md:p-0"
                  aria-label={person.name}
                >
                <Avatar size="sm">
                  <Avatar.Fallback>{person.name.slice(0, 1)}</Avatar.Fallback>
                </Avatar>
                <span className="min-w-0 flex-1 leading-tight max-md:hidden">
                  <span className="block truncate text-[12.5px] font-semibold">{person.name}</span>
                  <span className="block truncate text-[11px] text-shell-muted">{role.title}</span>
                </span>
                <ChevronsUpDown size={14} className="shrink-0 text-shell-faint max-md:hidden" />
              </button>
                <MenuSheet
                  isOpen={personSheet}
                  onOpenChange={setPersonSheet}
                  title={person.name}
                  testId="person-menu"
                  sections={[
                    {
                      label: 'Работать как',
                      items: roles.map((r) => ({
                        id: r.to,
                        label: r.title,
                        selected: r.title === role.title,
                        onAction: () => r.title !== role.title && onSwitchRole(r.to),
                      })),
                    },
                    {
                      items: [
                        { id: 'profile', label: 'Профиль', icon: <User size={18} />, testId: 'person-profile', onAction: profile.open },
                        { id: 'out', label: 'Выйти', icon: <LogOut size={18} />, danger: true, onAction: onSignOut },
                      ],
                    },
                  ]}
                />
              </>
            ) : (
            <Dropdown>
              <Dropdown.Trigger
                data-testid="side-person"
                className="flex w-full items-center gap-2.5 rounded-xl border border-shell-line bg-shell-active px-2.5 py-2 text-left hover:bg-shell-side-hover max-md:size-10 max-md:justify-center max-md:p-0"
                aria-label={person.name}
              >
                <Avatar size="sm">
                  <Avatar.Fallback>{person.name.slice(0, 1)}</Avatar.Fallback>
                </Avatar>
                <span className="min-w-0 flex-1 leading-tight max-md:hidden">
                  <span className="block truncate text-[12.5px] font-semibold">{person.name}</span>
                  <span className="block truncate text-[11px] text-shell-muted">{role.title}</span>
                </span>
                <ChevronsUpDown size={14} className="shrink-0 text-shell-faint max-md:hidden" />
              </Dropdown.Trigger>

              {/* Меню — HeroUI: отступы, ширина, стрелка подменю и галочка
                  выбранного — его собственные. Своё поверх одно — радиус: у HeroUI
                  он у поповера 32px, у строки 16px, у карточки человека 12px, и
                  рядом это читалось как три разные формы. Везде `RADIUS` (12px). */}
              <Dropdown.Popover placement="right bottom" className={RADIUS} data-testid="person-menu">
                <Dropdown.Menu aria-label="Профиль">
                  <Dropdown.Section>
                    <Dropdown.SubmenuTrigger>
                      <Dropdown.Item textValue={role.title} className={RADIUS} data-testid="person-role">
                        <Label>{role.title}</Label>
                        <Dropdown.SubmenuIndicator />
                      </Dropdown.Item>
                      <Dropdown.Popover className={RADIUS} data-testid="role-menu">
                        <Dropdown.Menu
                          aria-label="Работать как"
                          selectionMode="single"
                          selectedKeys={roles.filter((r) => r.title === role.title).map((r) => r.to)}
                          onAction={(key) => {
                            const picked = roles.find((r) => r.to === key);
                            if (picked && picked.title !== role.title) onSwitchRole(picked.to);
                          }}
                        >
                          {roles.map((r) => (
                            <Dropdown.Item key={r.to} id={r.to} textValue={r.title} className={RADIUS}>
                              <Dropdown.ItemIndicator />
                              <Label>{r.title}</Label>
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown.Popover>
                    </Dropdown.SubmenuTrigger>
                  </Dropdown.Section>
                  <Separator />
                  <Dropdown.Section>
                    <Dropdown.Item
                      textValue="Профиль"
                      className={RADIUS}
                      data-testid="person-profile"
                      onAction={profile.open}
                    >
                      <User size={16} />
                      <Label>Профиль</Label>
                    </Dropdown.Item>
                    <Dropdown.Item textValue="Выйти" variant="danger" className={RADIUS} onAction={onSignOut}>
                      <LogOut size={16} />
                      <Label>Выйти</Label>
                    </Dropdown.Item>
                  </Dropdown.Section>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
            )}
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-shell-page">
          {/* Заголовок и вкладки страницы ✳ (21.11.2026). Место заголовка
              держится и пока имя грузится — вкладки не прыгают. */}
          {tabs && (
            <header className="shrink-0 px-6 pt-5 max-md:px-4 max-md:pt-3" data-testid="page-header">
              <h1 className="min-h-9 truncate text-[26px] leading-9 font-semibold tracking-tight max-md:text-[20px]" data-testid="page-title">
                {title}
              </h1>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-shell-line">
                <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Вкладки страницы">
                  {tabs.map((t) => (
                    <button
                      key={t.href}
                      type="button"
                      aria-current={t.active || undefined}
                      onClick={() => onOpen?.(t.href)}
                      className={
                        'flex h-10 shrink-0 items-center gap-2 border-b-2 text-[14px] font-medium ' +
                        (t.active ? 'border-shell-active-ink text-shell-ink' : 'border-transparent text-shell-muted hover:text-shell-ink')
                      }
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </nav>
                {tabs.find((t) => t.active)?.views && (
                  <div className="mb-1.5 flex gap-1 rounded-xl bg-shell-side p-1" role="group" aria-label="Вид">
                    {tabs
                      .find((t) => t.active)!
                      .views!.map((v) => (
                        <button
                          key={v.href}
                          type="button"
                          aria-current={v.active || undefined}
                          onClick={() => onOpen?.(v.href)}
                          className={
                            'flex h-7 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-medium ' +
                            (v.active ? 'bg-shell-active text-shell-active-ink shadow-xs' : 'text-shell-muted hover:text-shell-ink')
                          }
                          data-testid="nav-sub"
                        >
                          {v.label}
                          {!!v.badge && (
                            <span
                              className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-shell-active-ink px-1 text-[10px] font-semibold tabular-nums text-shell-bar-ink"
                              aria-label={'ждут решения: ' + v.badge}
                              data-testid="nav-sub-badge"
                            >
                              {v.badge}
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </header>
          )}
          {/* Дети не ужимаются, лишнее уходит в прокрутку области (правило 7 в
              front/CLAUDE.md). */}
          <div
            className={
              'flex min-h-0 flex-1 flex-col ' +
              (bleed ? 'overflow-hidden' : 'overflow-auto px-6 pb-6 pt-5 [&>*]:shrink-0')
            }
          >
            {title && !tabs && <h1 className="pb-4 text-xl font-semibold tracking-tight">{title}</h1>}
            {children}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-shell-line bg-shell-page px-6 py-3">
              {actions}
            </div>
          )}
        </main>
      </div>

      {/* Профиль — окно поверх экрана, а не страница: у каждой роли своя
          оболочка, а профиль один на человека. */}
      {/* Без `Modal`-обёртки: она — триггер (DialogTrigger) и ждёт кнопку
          внутри, а профиль открывается пунктом меню. Окно ведёт состояние. */}
      <ModalSheet isOpen={profile.isOpen} onOpenChange={profile.setOpen} size="sm" className={RADIUS} testId="profile">
            <Modal.CloseTrigger />
            <Modal.Header className="flex flex-col items-center gap-3 pt-2 text-center">
              <Avatar size="lg">
                <Avatar.Fallback>{person.name.slice(0, 1)}</Avatar.Fallback>
              </Avatar>
              <Modal.Heading className="text-lg font-semibold">{person.name}</Modal.Heading>
              {person.email && <p className="text-[13px] text-shell-muted">{person.email}</p>}
            </Modal.Header>
            <Modal.Body className="flex flex-wrap justify-center gap-2 pb-2">
              {roles.map((r) => (
                <Chip key={r.to} size="sm" variant="soft" color={r.title === role.title ? 'accent' : 'default'}>
                  {r.title}
                </Chip>
              ))}
            </Modal.Body>
          </ModalSheet>
    </div>
  );
}
