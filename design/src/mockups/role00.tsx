/* Сквозные экраны — есть у каждой роли. Э0.1–Э0.4
   (см. `flows/00-obshchie-ekrany.md` и схему «Флоу/00»).

   Это не роль, а общая часть системы. Держим её макетами по той же схеме, что
   и роли, ради одного: маршрут любой роли начинается со входа, и борд роли
   открывается им же — сценарий не должен начинаться с середины.

   Поэтому `Login0_1` экспортируется: борды ролей ставят его первой колонкой,
   а требование к экрану карточка узла берёт из данных сквозных экранов
   (`data/role00.ts`) — дублировать вход в четырнадцати файлах не нужно. */

import { BarChart3, Bell, CheckCheck, Gavel, KeyRound, LogIn, Radio, Scroll, Trophy, User } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  A, ActionBar, Alert, Also, Arrow, AW, Board, Ghost, Hint, Off, P, Panel, RoleScreen, Row, Rows,
  Screen, Shot, States, Tab,
} from './shell';
import { DeskFrame } from '../deskShell';
import { Frame } from '../PlayerApp';
import { Brand, Input } from '../ui';
import { R00 } from './roles';

/* ── Э0.1 · Вход ───────────────────────────────────────────────── */

/** Пустая оболочка с карточкой по центру: до входа ни сайдбара, ни профиля. */
const Auth = ({ wide, children }: { wide?: boolean; children: ReactNode }) => (
  <DeskFrame>
    <div className="mkauth">
      <div className="mkauth-card" style={wide ? { width: 540 } : undefined}>{children}</div>
    </div>
  </DeskFrame>
);

const Langs = () => (
  <div className="dseg2">
    <span className="on">RU</span>
    <span>KZ</span>
    <span>EN</span>
  </div>
);

export function Login0_1() {
  return (
    <Auth>
      <Brand size="lg" />
      <div className="t">Вход в систему</div>
      <div className="s">Цифровая платформа турниров ФНТ РК</div>
      <Input label="Телефон или почта" value="+7 705 431 20 18" icon={<User size={15} />} />
      <Input label="Пароль" value="••••••••••" icon={<KeyRound size={15} />} suffix="показать" />
      <div className="mkauth-row">
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--c-accent)' }}>Забыли пароль</span>
        <Langs />
      </div>
      <button className="dsubmit">
        <LogIn size={15} /> Войти
      </button>
      <div className="mkauth-sep">или</div>
      <Ghost>
        <KeyRound size={14} /> Войти по короткому коду — судье за столом
      </Ghost>
    </Auth>
  );
}

/** Следующий шаг, если ролей несколько: выбор контекста (✳ наше решение). */
export function Context0_1() {
  return (
    <Auth wide>
      <Brand size="lg" />
      <div className="t">С какой ролью войти</div>
      <div className="s">У Пака Сергея три действующие роли — выбор запоминается и меняется в шапке</div>
      <Rows>
        <Row
          nm="Судья · Кубок Республики Казахстан 2026"
          sub="выдала Абаева Д., 10.04.2026 · до 20.05.2026"
          pill={{ t: 'ДЕЙСТВУЕТ', cls: 'live' }}
        />
        <Row
          nm="Судья стола · стол 4"
          sub="выдал Оспанов Т., 15.04.2026 · до 20.05.2026"
          pill={{ t: 'ДЕЙСТВУЕТ', cls: 'live' }}
        />
        <Row nm="Спортсмен" sub="своя карточка, рейтинг, заявки на турниры" pill={{ t: 'ДЕЙСТВУЕТ', cls: 'live' }} />
      </Rows>
      <Hint>Роль с истёкшим сроком в списке не появляется, но её действия остаются в журнале (§12).</Hint>
    </Auth>
  );
}

/** Крупная ячейка кода: набирают пальцем на планшете, а не с клавиатуры. */
const CodeCell = ({ d }: { d: string }) => (
  <div
    style={{
      width: 54,
      height: 66,
      display: 'grid',
      placeItems: 'center',
      fontSize: 28,
      fontWeight: 800,
      fontVariantNumeric: 'tabular-nums',
      borderRadius: 14,
      border: '1px solid var(--c-glass-line)',
      background: 'var(--c-panel)',
      color: d ? 'var(--c-ink)' : 'var(--c-dim)',
    }}
  >
    {d || '—'}
  </div>
);

/** Вход по короткому коду: планшет за столом, пароль там не набирают (§6). */
export function Code0_1() {
  return (
    <Tab title="Вход по короткому коду" sub="Кубок Республики Казахстан 2026 · стол 4" badge="ИДЁТ" center>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, maxWidth: 460 }}>
        <Brand size="lg" />
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.3px' }}>Код со стола</div>
        <div style={{ fontSize: 13, color: 'var(--c-muted)', textAlign: 'center', lineHeight: 1.5 }}>
          Код выдаёт главный судья при распределении судей по столам. Пароль на планшете за столом
          не набирают.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['4', '7', '2', '9', '', ''].map((d, i) => (
            <CodeCell key={i} d={d} />
          ))}
        </div>
        <button className="dsubmit" style={{ padding: '13px 22px' }}>
          <LogIn size={15} /> Войти на стол 4
        </button>
      </div>
    </Tab>
  );
}

/** Тот же вход в приложении: спортсмен — единственная роль с ним (TZ §10). */
export function LoginPhone0_1() {
  return (
    <Frame>
      <div className="body" style={{ justifyContent: 'center', gap: 14, paddingBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
          <Brand size="lg" />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, textAlign: 'center' }}>Вход</div>
        <div style={{ fontSize: 12.5, color: 'var(--c-muted)', textAlign: 'center', lineHeight: 1.5 }}>
          Тот же логин, что на сайте: приложение и сайт — одна учётная запись
        </div>
        <Input label="Телефон" value="+7 705 431 20 18" size="sm" />
        <Input label="Пароль" value="••••••••" size="sm" suffix="показать" />
        <button className="dsubmit" style={{ padding: 13 }}>
          <LogIn size={15} /> Войти
        </button>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--c-accent)', textAlign: 'center' }}>
          Забыли пароль
        </div>
        <Hint>Спортсмен регистрируется сам — заводить его аккаунт федерации не нужно (TZ §2).</Hint>
      </div>
    </Frame>
  );
}

const Login0_1States = () => (
  <States>
    <Shot tone="danger" title="Неверный логин или пароль" text="Ошибка под полем; поля не очищаются.">
      <Input label="Телефон или почта" value="+7 705 431 20 18" icon={<User size={15} />} />
      <Input
        label="Пароль"
        value="••••••"
        icon={<KeyRound size={15} />}
        error="Неверный логин или пароль. Осталось 4 попытки до временной блокировки ✳"
      />
      <Off>Войти</Off>
    </Shot>

    <Shot
      tone="warning"
      title="Роль истекла"
      text="Роли нет в списке контекстов, история действий человека сохраняется."
    >
      <Rows>
        <Row nm="Спортсмен" sub="бессрочно" pill={{ t: 'ДЕЙСТВУЕТ', cls: 'live' }} />
        <Row nm="Судья · Открытие сезона 2026" sub="срок вышел 21.01.2026" pill={{ t: 'ИСТЕКЛА', cls: 'done' }} />
      </Rows>
      <Alert>
        Истёкшая роль в выбор не попадает: войти под ней нельзя. Всё, что человек делал в ней,
        остаётся в журнале с его именем.
      </Alert>
    </Shot>

    <Shot
      tone="warning"
      title="Аккаунт не активирован ✳"
      text="Приглашение отправлено, но пароль ещё не задан — стыкуется с Э1.10."
      wide
    >
      <Alert>
        На этот адрес отправлено приглашение 15.04.2026. Пароль задаётся по ссылке из письма — до
        этого вход не работает.
      </Alert>
      <div style={{ display: 'flex', gap: 8 }}>
        <Ghost>Отправить приглашение ещё раз</Ghost>
        <Off>Войти</Off>
      </div>
    </Shot>
  </States>
);

/* ── Э0.2 · Свой профиль ───────────────────────────────────────── */

export function Profile0_2() {
  return (
    <RoleScreen
      role={R00}
      nav="Профиль"
      title="Мой профиль"
      sub="Оболочка — той роли, под которой вошли; содержимое профиля у всех одинаковое"
      hint="Свои роли здесь только видно: выдаёт и отзывает их администратор Федерации (Э1.11)."
    >
      <div className="mkcols">
        <div style={{ display: 'grid', gap: 12 }}>
        <Panel title="Профиль">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <img
              src={AW(44)}
              alt=""
              style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Абаева Динара Ерлановна</div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 3 }}>
                Администратор Федерации · система · бессрочно
              </div>
            </div>
          </div>
          <div className="dform">
            <Input label="Телефон" value="+7 701 220 45 90" size="sm" />
            <Input label="Почта" value="d.abaeva@ttfrk.kz" size="sm" />
          </div>
          <div className="dactionbar" style={{ marginTop: 12 }}>
            <div className="dseg2">
              <span className="on">RU</span>
              <span>KZ</span>
              <span>EN</span>
            </div>
            <button className="dpickbtn">Сохранить</button>
          </div>
        </Panel>

        <Panel title="Безопасность">
          <Row nm="Пароль" sub="изменён 02.02.2026" />
          <div style={{ marginTop: 12 }}>
            <Ghost>
              <KeyRound size={14} /> Сменить пароль
            </Ghost>
          </div>
        </Panel>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <Panel title="Мои роли — только чтение">
            <Rows>
              <Row
                nm="Администратор Федерации"
                sub="система · бессрочно · завела федерация"
                pill={{ t: 'ДЕЙСТВУЕТ', cls: 'live' }}
              />
              <Row
                nm="Менеджер · только чтение"
                sub="система · до 31.12.2026 · выдал Мукашев Б."
                pill={{ t: 'ДЕЙСТВУЕТ', cls: 'live' }}
              />
            </Rows>
            <Hint>Отсюда роль не выдать и не продлить — это экран администратора Федерации (Э1.11).</Hint>
          </Panel>

          <Panel title="Язык интерфейса">
            <Row nm="Русский" sub="письма и уведомления приходят на нём же" pill={{ t: 'ВЫБРАН', cls: 'live' }} />
            <Hint>Переключатель RU / KZ / EN есть и на каждом экране системы — здесь он запоминается.</Hint>
          </Panel>
        </div>
      </div>
    </RoleScreen>
  );
}

const Profile0_2States = () => (
  <States>
    <Shot tone="warning" title="Срок роли скоро истекает ✳" text="Видно, когда роль заканчивается и кто её выдал.">
      <Rows>
        <Row
          nm="Судья · Кубок Республики Казахстан 2026"
          sub="выдала Абаева Д., 10.04.2026"
          val="осталось 5 дней"
          pill={{ t: 'ДО 20.05.2026', cls: 'wait' }}
        />
      </Rows>
      <Hint>Продлить роль может только администратор Федерации — из профиля видно, к кому идти.</Hint>
    </Shot>

    <Shot tone="info" title="Роль истекла ✳" text="Остаётся в списке серой, с датой окончания.">
      <Rows>
        <Row nm="Судья · Открытие сезона 2026" sub="выдала Абаева Д., 05.01.2026" pill={{ t: 'ИСТЕКЛА 21.01.2026', cls: 'done' }} />
      </Rows>
      <Alert>Доступ по ней закрыт, но записи журнала сохраняются: видно, что человек делал, пока роль действовала.</Alert>
    </Shot>
  </States>
);

/* ── Э0.3 · Уведомления ────────────────────────────────────────── */

/** Строка ленты: значок типа вместо аватара — уведомление не про человека. */
const NRow = ({
  ic,
  t,
  s,
  when,
  unread,
}: {
  ic: ReactNode;
  t: string;
  s: string;
  when: string;
  unread?: boolean;
}) => (
  <div className="drow">
    <div
      style={{
        width: 34,
        height: 34,
        flex: 'none',
        display: 'grid',
        placeItems: 'center',
        borderRadius: 11,
        background: unread ? 'var(--c-accent-soft)' : 'var(--c-panel-2)',
        color: unread ? 'var(--c-accent)' : 'var(--c-dim)',
      }}
    >
      {ic}
    </div>
    <div className="who">
      <div className="nm">{t}</div>
      <div className="rl">{s}</div>
    </div>
    <div className="amt" style={{ color: 'var(--c-muted)' }}>{when}</div>
    {unread && <P t="НОВОЕ" cls="reg" />}
  </div>
);

export function Notif0_3() {
  return (
    <RoleScreen
      role={R00}
      nav="Уведомления"
      title="Уведомления"
      sub="Перечень событий — TZ §10.1 · счётчик непрочитанных стоит в шапке каждого экрана"
      hint="Уведомление всегда ведёт на свой экран: заявку, матч, протокол — читать его отдельно не нужно."
    >
      <ActionBar count="3 непрочитанных из 42 · период: 7 дней">
        <Ghost>
          <CheckCheck size={14} /> Отметить все прочитанными
        </Ghost>
      </ActionBar>
      <Rows>
        <NRow
          unread
          ic={<Gavel size={17} />}
          t="Вы назначены главным судьёй"
          s="Кубок Республики Казахстан 2026 · решение председателя ГСК"
          when="сегодня, 09:20"
        />
        <NRow
          unread
          ic={<Radio size={17} />}
          t="Пара вызвана на стол 4"
          s="Смагулов А. — Ким Г. · Евразийская лига, 2-й тур"
          when="сегодня, 08:55"
        />
        <NRow
          unread
          ic={<Trophy size={17} />}
          t="Турнир перенесён"
          s="ОРТ «Кубок Иртыша» · 25 апреля → 16 мая · зал занят"
          when="вчера, 17:40"
        />
        <NRow
          ic={<Scroll size={17} />}
          t="Протокол утверждён"
          s="Открытие сезона 2026 · рейтинг пересчитан"
          when="21.01.2026"
        />
        <NRow
          ic={<BarChart3 size={17} />}
          t="Заявка принята"
          s="Первенство РК · 2010 г.р. и моложе"
          when="19.01.2026"
        />
      </Rows>
    </RoleScreen>
  );
}

const Notif0_3States = () => (
  <States>
    <Shot tone="info" title="Непрочитанных нет ✳" text="Пустая лента с подписью, что новые появятся здесь.">
      <ActionBar count="0 непрочитанных · всё разобрано" />
      <Hint>
        Здесь появятся решения по заявкам, вызовы на стол, утверждённые протоколы и отмены турниров
        (§10.1). Счётчик в шапке пуст.
      </Hint>
    </Shot>

    <Shot
      tone="warning"
      title="⚠ 11 — куда приходят уведомления ролям без приложения"
      text="Браузер, почта или SMS и можно ли их отключать — не решено."
    >
      <Rows>
        <Row nm="В системе" sub="лента и счётчик в шапке" pill={{ t: 'ЕСТЬ', cls: 'live' }} />
        <Row nm="Приложение" sub="есть только у спортсмена (TZ §10)" pill={{ t: 'ЕСТЬ', cls: 'live' }} />
        <Row nm="Почта / SMS / браузер" sub="для остальных тринадцати ролей" pill={{ t: 'ВОПРОС', cls: 'bad' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Э0.4 · Публичные страницы ─────────────────────────────────── */

export function Public0_4() {
  return (
    <DeskFrame>
      <div className="mkpub">
        <Brand />
        <div className="mkpub-nav">
          <span className="on">Главная</span>
          <span>Календарь</span>
          <span>Рейтинги</span>
          <span>Новости</span>
        </div>
        <div style={{ flex: 1 }} />
        <Langs />
        <button className="dpickbtn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <LogIn size={14} /> Войти
        </button>
      </div>
      <div className="mkpub-body">
        <Panel title="Идут сейчас" extra={<P t="В РЕАЛЬНОМ ВРЕМЕНИ" cls="live" />}>
          <Rows>
            <Row
              av={A(32)}
              nm="Смагулов Алан — Ким Георгий"
              sub="Евразийская лига, 2-й тур · стол 1 · трансляция"
              val="2 : 1 (11:8)"
              pill={{ t: 'ИДЁТ', cls: 'live' }}
            />
            <Row
              av={A(75)}
              nm="Ерлан Бекзат — Пак Сергей"
              sub="Евразийская лига, 2-й тур · стол 3"
              val="0 : 1 (6:9)"
              pill={{ t: 'ИДЁТ', cls: 'live' }}
            />
          </Rows>
        </Panel>

        <div className="mkcols">
          <Panel title="Ближайшие старты">
            <Rows>
              <Row nm="Кубок Республики Казахстан 2026" sub="Главный старт · Астана · 18–20 мая" pill={{ t: 'ЗАЯВКИ ОТКРЫТЫ', cls: 'reg' }} />
              <Row nm="ОРТ «Кубок Иртыша»" sub="ОРТ · Павлодар · 25 апреля" pill={{ t: 'ЗАЯВКИ ОТКРЫТЫ', cls: 'reg' }} />
              <Row nm="Первенство РК · 2010 г.р. и моложе" sub="Главный старт · Алматы · 3–5 июня" pill={{ t: 'ЗАЯВКИ ОТКРЫТЫ', cls: 'reg' }} />
            </Rows>
          </Panel>

          <Panel title="Лидеры рейтинга">
            <Rows>
              <Row av={A(32)} nm="1 · Смагулов Алан" sub="Алматы · «Алатау»" val="2456" />
              <Row av={A(44)} nm="2 · Ким Георгий" sub="Астана · СКА" val="2401" />
              <Row av={A(13)} nm="3 · Пак Сергей" sub="Павлодар · «Иртыш»" val="2312" />
            </Rows>
            <Hint>Полные таблицы игроков и судей открыты без входа (§7.2).</Hint>
          </Panel>
        </div>

        <Panel title="Новости" extra={<span className="dcount">на трёх языках</span>}>
          <Rows>
            <Row nm="Кубок Республики: приём заявок открыт" sub="12.04.2026 · RU · KZ" />
            <Row nm="Итоги открытия сезона 2026" sub="21.01.2026 · RU · KZ · EN" />
          </Rows>
        </Panel>
      </div>
    </DeskFrame>
  );
}

const Public0_4States = () => (
  <States>
    <Shot tone="info" title="Действие требует входа ✳" text="Заявка, счёт, правка — любое действие ведёт на экран входа.">
      <Row nm="Кубок Республики Казахстан 2026" sub="приём заявок до 10 мая" pill={{ t: 'ЗАЯВКИ ОТКРЫТЫ', cls: 'reg' }} />
      <Alert>
        Чтобы подать заявку, нужно войти: смотреть можно всем, делать — только под своей ролью.
      </Alert>
      <button className="dsubmit" style={{ padding: '11px 16px' }}>
        <LogIn size={15} /> Войти и подать заявку
      </button>
    </Shot>

    <Shot
      tone="warning"
      title="⚠ 12.9 — открыта ли публичная часть без входа"
      text="Подтвердить у федерации: мы исходим из того, что открыта (TZ §3)."
    >
      <Rows>
        <Row nm="Результаты, рейтинги, расписание" sub="наше допущение — видно всем" pill={{ t: 'БЕЗ ВХОДА', cls: 'live' }} />
        <Row nm="Персональные данные игроков" sub="что именно показываем в публичном профиле" pill={{ t: 'ВОПРОС', cls: 'bad' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Борд сквозных экранов ─────────────────────────────────────── */

export function Role00Board() {
  return (
    <Board role={R00}>
      <Screen code="Э0.1" cap="Вход">
        <Login0_1 />
        <Also cap="Следующий шаг, если ролей несколько ✳">
          <Context0_1 />
        </Also>
        <Also cap="То же на планшете судьи за столом — вход по короткому коду (§6)">
          <Code0_1 />
        </Also>
        <Login0_1States />
      </Screen>
      <Arrow lbl="имя и фото в шапке" />
      <Screen code="Э0.2" cap="Свой профиль">
        <Profile0_2 />
        <Profile0_2States />
      </Screen>
      <Arrow lbl="счётчик в шапке" />
      <Screen code="Э0.3" cap="Уведомления">
        <Notif0_3 />
        <Notif0_3States />
      </Screen>
      <Arrow lbl="выход — обратно на сайт" />
      <Screen code="Э0.4" cap="Публичные страницы">
        <Public0_4 />
        <Public0_4States />
      </Screen>
    </Board>
  );
}
