/* Сквозные экраны — есть у каждой роли. Э0.1–Э0.4
   (см. `flows/00-obshchie-ekrany.md` и схему «Флоу/00»).

   Это не роль, а общая часть системы. Держим её макетами по той же схеме, что
   и роли, ради одного: маршрут любой роли начинается со входа, и борд роли
   открывается им же — сценарий не должен начинаться с середины.

   Поэтому `Login0_1` экспортируется: борды ролей ставят его первой колонкой,
   а требование к экрану карточка узла берёт из данных сквозных экранов
   (`data/role00.ts`) — дублировать вход в четырнадцати файлах не нужно. */

import { BarChart3, Bell, CheckCheck, Gavel, KeyRound, LogIn, Radio, Scroll, Trophy, User, UserPlus } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  A, AW, ActionBar, Alert, Also, Arrow, Board, Field, Form, Ghost, Hint, Off, P, Panel, RoleScreen, Row, Rows, Screen, Shot, States, Tab,
} from './shell';
import type { ScreenMap } from './shell';
import { FormSeg } from '../segs';
import { DeskFrame } from '../deskShell';
import { Frame } from '../PlayerApp';
import { Brand, Checkbox, Input, Select } from '../ui';
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

/* Язык интерфейса переключается прямо на входе: до входа человек не может
   поменять его в профиле, а система трёхъязычная (TZ §3.1). */
const Langs = () => <FormSeg items={['RU', 'KZ', 'EN']} />;

export function Login0_1() {
  return (
    <Auth>
      <Brand size="lg" />
      <div className="t">Вход в систему</div>
      <Input label="Телефон или почта" value="+7 705 431 20 18" icon={<User size={15} />} />
      <Input label="Пароль" value="••••••••••" icon={<KeyRound size={15} />} suffix="показать" />
      <div className="mkauth-row">
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--c-accent)' }}>Забыли пароль</span>
        <Langs />
      </div>
      <button className="dsubmit">
        <LogIn size={15} /> Войти
      </button>
      <div className="mkauth-row">
        <span style={{ fontSize: 12.5, color: 'var(--c-muted)' }}>Впервые здесь?</span>
        <span
          style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--c-accent)' }}
          data-to="Э0.5"
        >
          Зарегистрироваться
        </span>
      </div>
    </Auth>
  );
}

/** Следующий шаг, если ролей несколько: выбор контекста (✳ наше решение). */
export function Context0_1() {
  return (
    <Auth wide>
      <Brand size="lg" />
      <div className="t">С какой ролью войти</div>
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
    </Auth>
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
      sub="Контакты, язык интерфейса и пароль"
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
            <FormSeg items={['RU', 'KZ', 'EN']} />
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

        {/* Блока про роль здесь нет: какая роль сейчас — подписью под именем, а
            переключают её там, где она написана, — в меню профиля в шапке.
            Списка своих ролей тоже нет: он был на чтение и ничего не решал. Кто
            роль выдал и до какого срока — в карточке пользователя у
            администратора Федерации (Э1.5). */}
        <div style={{ display: 'grid', gap: 12 }}>
          <Panel title="Язык интерфейса">
            <Row nm="Русский" sub="письма и уведомления приходят на нём же" pill={{ t: 'ВЫБРАН', cls: 'live' }} />
          </Panel>
        </div>
      </div>
    </RoleScreen>
  );
}

const Profile0_2States = () => (
  <States>
    <Shot tone="info" title="Роль одна ✳" text="Раздела переключения в меню профиля нет: выбирать не из чего.">
      <Rows>
        <Row nm="Спортсмен" sub="система · бессрочно" pill={{ t: 'СЕЙЧАС', cls: 'live' }} />
      </Rows>
    </Shot>

    <Shot tone="info" title="Роль истекла ✳" text="Из переключателя в шапке пропадает, доступ по ней закрыт. Срок и кто выдал — в карточке пользователя (Э1.5).">
      <Rows>
        <Row nm="Судья · Открытие сезона 2026" sub="роль закончилась 21.01.2026" pill={{ t: 'ИСТЕКЛА', cls: 'done' }} />
      </Rows>
      <Alert>Записи журнала сохраняются: видно, что человек делал, пока роль действовала.</Alert>
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
        borderRadius: 'var(--r-sm)',
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
      sub="3 непрочитанных из 42"
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
    </Shot>

    <Shot
      tone="warning"
      title="⚠ 11 — куда приходят уведомления ролям без приложения"
      text="Браузер, почта или SMS и можно ли их отключать — не решено."
    >
      <Rows>
        <Row nm="В системе" sub="лента и счётчик в шапке" pill={{ t: 'ЕСТЬ', cls: 'live' }} />
        <Row nm="Приложение" sub="есть только у спортсмена" pill={{ t: 'ЕСТЬ', cls: 'live' }} />
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
      text="Подтвердить у федерации: мы исходим из того, что открыта."
    >
      <Rows>
        <Row nm="Результаты, рейтинги, расписание" sub="наше допущение — видно всем" pill={{ t: 'БЕЗ ВХОДА', cls: 'live' }} />
        <Row nm="Персональные данные игроков" sub="что именно показываем в публичном профиле" pill={{ t: 'ВОПРОС', cls: 'bad' }} />
      </Rows>
    </Shot>
  </States>
);

/* ── Борд сквозных экранов ─────────────────────────────────────── */

/* ── Э0.5 · Регистрация спортсмена ─────────────────────────────── */

export function SignUp0_5() {
  return (
    <Auth wide>
      <Brand size="lg" />
      <div className="t">Регистрация спортсмена</div>

      {/* Поля, куда человек печатает, — настоящие поля ввода, а не подписанные
          значения: по макету должно быть видно, где ставится курсор. */}
      <div className="dform">
        <Input label="Фамилия" placeholder="Оралбек" />
        <Input label="Имя, отчество" placeholder="Диас Ерланович" />
        <Input label="Дата рождения" placeholder="дд.мм.гггг" format="date" />
        <Select label="Пол" options={['мужской', 'женский']} />
        <Input label="Телефон" placeholder="+7 ___ ___ __ __" />
        <Input label="Почта" placeholder="имя@домен" />
        <Input label="Пароль" placeholder="не короче 8 знаков" className="dfield wide" />
      </div>

      <Checkbox label="Согласие на обработку персональных данных ✳" />

      <button className="dsubmit">
        <UserPlus size={15} /> Зарегистрироваться
      </button>
      <div className="mkauth-row" style={{ justifyContent: 'center' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--c-accent)' }} data-to="Э0.1">
          Уже есть аккаунт — войти
        </span>
      </div>
    </Auth>
  );
}

/* ── Э0.6 · Принятие приглашения ───────────────────────────────── */

/** Вторая половина приглашения: то, что видит человек, открыв ссылку.

    Аккаунт за человека не заводит никто — ни клуб (Э13.2), ни федерация
    (Э1.10). Они выпускают одноразовую ссылку, а пароль человек задаёт себе
    здесь: система его не знает и не хранит, и пересылать его в мессенджере
    некому. До этого шага учётной записи нет — есть только карточка со
    значком «приглашён».

    Данные показаны на чтение, а не полями: их заполнил тот, кто приглашает, и
    правка тут превратила бы приглашение во вторую форму регистрации. Если
    данные чужие — «это не я», и ссылка гаснет. */
export function Accept0_6() {
  return (
    <Auth wide>
      <Brand size="lg" />
      <div className="t">Клуб «Алатау» приглашает вас в систему ФНТ РК</div>

      <Panel title="Что о вас указал клуб">
        <Form>
          <Field label="Фамилия, имя" value="Нұрланұлы Алихан" />
          <Field label="Дата рождения" value="14.05.2011" />
          <Field label="Разряд" value="2 разряд" />
          <Field label="Клуб" value="«Алатау» · г. Алматы" />
          <Field label="Пригласил" value="Досжан Мади · администратор клуба" wide />
        </Form>
      </Panel>

      {/* Пароль — единственное поле ввода на экране: всё остальное уже заполнено
          за человека, и придумывать себе он должен только доступ. */}
      <div className="dform">
        <Input label="Придумайте пароль" placeholder="не короче 8 знаков" icon={<KeyRound size={15} />} />
      </div>

      <Checkbox label="Согласие на обработку персональных данных ✳" />

      <button className="dsubmit">
        <LogIn size={15} /> Принять приглашение и войти
      </button>

      <div className="mkauth-row" style={{ justifyContent: 'space-between' }}>
        <Hint>Ссылка одноразовая и действует до 22.04.2026</Hint>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--c-muted)' }}>Это не я</span>
      </div>
    </Auth>
  );
}

export const Accept0_6States = () => (
  <States>
    <Shot tone="success" title="Приняли — человек в системе" text="Аккаунт появился в этот момент, а не когда его приглашали.">
      <Rows>
        <Row nm="Нұрланұлы Алихан" sub="принял приглашение 16.04 · пароль задан им самим" pill={{ t: 'В КЛУБЕ', cls: 'live' }} />
      </Rows>
      <Alert>Клуб видит только факт принятия. Пароля он не знает и сменить его не может.</Alert>
    </Shot>

    <Shot tone="danger" title="Срок ссылки вышел ✳" text="Семь дней прошли: войти по ней нельзя, нужна новая.">
      <Alert tone="danger">
        Ссылка выпущена 02.04.2026, срок вышел 09.04.2026. Попросите пригласившего выпустить новую —
        старая не работает даже у того, кто её открыл.
      </Alert>
      <Off>Принять приглашение и войти</Off>
    </Shot>

    <Shot tone="warning" title="Ссылкой уже воспользовались ✳" text="Одноразовая: второй раз по ней не входят.">
      <Rows>
        <Row nm="Приглашение принято 12.04" sub="дальше — обычный вход по телефону или почте" pill={{ t: 'ИСПОЛЬЗОВАНА', cls: 'done' }} />
      </Rows>
      <button className="dsubmit" style={{ padding: '11px 16px' }} data-to="Э0.1">
        <LogIn size={15} /> Войти
      </button>
    </Shot>

    <Shot tone="warning" title="«Это не я» ✳" text="Ссылка гаснет, пригласившему уходит уведомление — данные чужие.">
      <Rows>
        <Row nm="Приглашение отклонено" sub="уведомление ушло клубу «Алатау» · 16.04" pill={{ t: 'ОТКЛОНЕНО', cls: 'bad' }} />
      </Rows>
      <Alert>
        Так ловятся ошибки в контакте: письмо ушло не тому человеку, и он говорит об этом сам,
        а не молча заводит себе чужую карточку.
      </Alert>
    </Shot>
  </States>
);

export const SignUp0_5States = () => (
  <States>
    <Shot
      tone="warning"
      title="Найден похожий человек ✳"
      text="Предложение связать с существующей записью, а не заводить второго."
    >
      <Rows>
        <Row
          nm="Оралбек Диас · 2009 · Алматы"
          sub="завёл клуб «Алатау», 03.02.2026 · рейтинг 2042"
          pill={{ t: 'СОВПАДЕНИЕ', cls: 'wait' }}
        />
      </Rows>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="dpickbtn">Связать с этой записью</button>
        <Ghost>Это не я</Ghost>
      </div>
    </Shot>

    <Shot tone="danger" title="Согласие не отмечено" text="Кнопка неактивна.">
      <Checkbox
        label="Согласие на обработку персональных данных"
        sub="без него регистрация не проходит"
      />
      <Off>Зарегистрироваться</Off>
    </Shot>

    <Shot
      tone="warning"
      title="⚠ 12.10 — чья запись, если человека уже завели"
      text="Как самостоятельная регистрация сходится с записью клуба или федерации — не решено."
      wide
    >
      <Alert>
        Три пути в реестр: человек сам, клуб, федерация. Кто «владелец» записи и что происходит с
        рейтингом и историей при связывании — вопрос к федерации. Дубль молча не создаём.
      </Alert>
    </Shot>
  </States>
);

/** Экраны роли по кодам: из этой карты собираются и борд, и карта флоу. */
export const SCREENS: ScreenMap = {
  'Э0.1': {
    cap: 'Вход',
    view: () => (
      <>
        <Login0_1 />
        <Also cap="Следующий шаг, если ролей несколько ✳">
          <Context0_1 />
        </Also>
        <Login0_1States />
      </>
    ),
    next: 'имя и фото в шапке',
  },
  'Э0.5': {
    cap: 'Регистрация спортсмена',
    view: () => (
      <>
        <SignUp0_5 />
        <SignUp0_5States />
      </>
    ),
    next: 'ссылка приглашения',
  },
  'Э0.6': {
    cap: 'Принятие приглашения',
    view: () => (
      <>
        <Accept0_6 />
        <Accept0_6States />
      </>
    ),
    next: 'свой профиль',
  },
  'Э0.2': {
    cap: 'Свой профиль',
    view: () => (
      <>
        <Profile0_2 />
        <Profile0_2States />
      </>
    ),
    next: 'счётчик в шапке',
  },
  'Э0.3': {
    cap: 'Уведомления',
    view: () => (
      <>
        <Notif0_3 />
        <Notif0_3States />
      </>
    ),
    next: 'выход — обратно на сайт',
  },
  'Э0.4': {
    cap: 'Публичные страницы',
    view: () => (
      <>
        <Public0_4 />
        <Public0_4States />
      </>
    ),
  },
};

export function Role00Board() {
  return <Board role={R00} screens={SCREENS} />;
}
