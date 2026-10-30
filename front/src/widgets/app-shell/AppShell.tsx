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

import { assetUrl } from '@/shared/kit/asset';
import markUrl from '@/shared/kit/brand/fnt-mark.svg';

/** Знак ФНТ РК — тот же файл, что у `Brand` в ките (`public/logo.png` — знак
 *  прототипа SpinCoach). */
const MARK = assetUrl(markUrl);

/** Один радиус у карточки человека, меню и строк меню. */
const RADIUS = 'rounded-xl';

/** Вложенный пункт раздела ✳ (30.10.2026, решение владельца продукта): вместо
 *  вкладок на экране — подпункты в сайдбаре («Судьи» → «Коллегия», «Заявки»).
 *  Какой выбран, решает экран (он знает адрес); значок — число (ждут решения). */
export type ShellSubItem = { label: string; href: string; active?: boolean; badge?: number };
export type ShellNavItem = { label: string; icon?: ReactNode; children?: ShellSubItem[] };
export type ShellRole = { title: string; to: string };

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
      className="hero-scope relative flex h-screen w-full flex-col overflow-hidden bg-white font-[Inter,-apple-system,'Segoe_UI',system-ui,sans-serif] text-neutral-900"
      data-theme="light"
    >
      <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-neutral-200 px-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MARK} alt="" className="h-7 w-7" />
        <span className="text-[15px] font-extrabold tracking-tight">ФНТ РК</span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-b border-neutral-200 px-3 py-2 md:w-60 md:border-b-0 md:border-r md:py-3">
          {context && (
            <div className="mb-2 md:mb-3 md:border-b md:border-neutral-200 md:pb-3 max-md:[&_[data-testid=tournament-context]]:hidden">
              {context}
            </div>
          )}
          {nav.length > 0 && (
            <nav className="flex gap-0.5 overflow-x-auto md:flex-col" aria-label="Разделы">
              {nav.map((item) => {
                const on = item.label === active;
                const nested = !!item.children?.length;
                const open = nested && isOpen(item.label);
                // Раскрыт — подсвечен выбранный подпункт, раздел — их шапка;
                // сложен — подсвечен сам раздел, если человек в нём.
                const lit = on && !(open && item.children!.some((c) => c.active));
                return (
                  <div key={item.label} className="contents md:flex md:flex-col md:gap-0.5">
                    <div className="relative flex max-md:flex-1">
                      <Button
                        variant="ghost"
                        aria-current={lit || undefined}
                        // Свой раздел — сложить/раскрыть; чужой — перейти (и раскрыть).
                        onPress={() => (on && nested ? toggle(item.label) : onNavigate(item.label))}
                        className={
                          'h-9 w-full justify-start gap-2.5 px-2.5 text-[13px] font-medium max-md:w-auto max-md:flex-1 max-md:justify-center ' +
                          (nested ? 'md:pr-9 ' : '') +
                          (lit ? 'bg-blue-50 text-blue-700' : on ? 'text-neutral-900' : 'text-neutral-600')
                        }
                      >
                        {item.icon}
                        {item.label}
                      </Button>
                      {nested && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          aria-label={(open ? 'Свернуть: ' : 'Раскрыть: ') + item.label}
                          aria-expanded={open}
                          onPress={() => toggle(item.label)}
                          className="absolute right-1 top-1/2 h-7 w-7 min-w-7 -translate-y-1/2 text-neutral-500 max-md:hidden"
                          data-testid="nav-toggle"
                        >
                          <ChevronDown size={15} className={'transition-transform ' + (open ? 'rotate-180' : '')} />
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
                            'h-8 w-full justify-start gap-2 pl-9 pr-2.5 text-[13px] font-medium max-md:w-auto max-md:flex-1 max-md:justify-center max-md:pl-2.5 ' +
                            (sub.active ? 'bg-blue-50 text-blue-700' : 'text-neutral-600')
                          }
                          data-testid="nav-sub"
                        >
                          <span className="min-w-0 flex-1 truncate text-left">{sub.label}</span>
                          {!!sub.badge && (
                            <span
                              className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold tabular-nums text-white"
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
            <Dropdown>
              <Dropdown.Trigger
                data-testid="side-person"
                className="flex w-full items-center gap-2.5 rounded-xl border border-neutral-200 px-2.5 py-2 text-left hover:bg-neutral-50 max-md:size-10 max-md:justify-center max-md:p-0"
                aria-label={person.name}
              >
                <Avatar size="sm">
                  <Avatar.Fallback>{person.name.slice(0, 1)}</Avatar.Fallback>
                </Avatar>
                <span className="min-w-0 flex-1 leading-tight max-md:hidden">
                  <span className="block truncate text-[12.5px] font-semibold">{person.name}</span>
                  {person.email && <span className="block truncate text-[11px] text-neutral-500">{person.email}</span>}
                </span>
                <ChevronsUpDown size={14} className="shrink-0 text-neutral-400 max-md:hidden" />
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
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-neutral-50">
          {/* Дети не ужимаются, лишнее уходит в прокрутку области (правило 7 в
              front/CLAUDE.md). */}
          <div
            className={
              'flex min-h-0 flex-1 flex-col ' +
              (bleed ? 'overflow-hidden' : 'overflow-auto px-6 pb-6 pt-5 [&>*]:shrink-0')
            }
          >
            {title && <h1 className="pb-4 text-xl font-semibold tracking-tight">{title}</h1>}
            {children}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-200 bg-white px-6 py-3">
              {actions}
            </div>
          )}
        </main>
      </div>

      {/* Профиль — окно поверх экрана, а не страница: у каждой роли своя
          оболочка, а профиль один на человека. */}
      {/* Без `Modal`-обёртки: она — триггер (DialogTrigger) и ждёт кнопку
          внутри, а профиль открывается пунктом меню. Окно ведёт состояние. */}
      <Modal.Backdrop isOpen={profile.isOpen} onOpenChange={profile.setOpen}>
        <Modal.Container size="sm">
          <Modal.Dialog className={RADIUS} data-testid="profile">
            <Modal.CloseTrigger />
            <Modal.Header className="flex flex-col items-center gap-3 pt-2 text-center">
              <Avatar size="lg">
                <Avatar.Fallback>{person.name.slice(0, 1)}</Avatar.Fallback>
              </Avatar>
              <Modal.Heading className="text-lg font-semibold">{person.name}</Modal.Heading>
              {person.email && <p className="text-[13px] text-neutral-500">{person.email}</p>}
            </Modal.Header>
            <Modal.Body className="flex flex-wrap justify-center gap-2 pb-2">
              {roles.map((r) => (
                <Chip key={r.to} size="sm" variant="soft" color={r.title === role.title ? 'accent' : 'default'}>
                  {r.title}
                </Chip>
              ))}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
