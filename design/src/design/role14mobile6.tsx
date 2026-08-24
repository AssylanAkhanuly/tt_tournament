/* Роль 14 · экраны денег и новостей — на телефоне.

   Продолжение role14mobile5.tsx: тот же подход — у каждого экрана свой ход, а
   общими остаются система и правила, а не одна картинка. Здесь семь экранов,
   которые закрывают роль целиком:

     Э14.8  Оплата взноса   — чек: сумма крупно, за что и кому, действие внизу.
     Э14.10 Взнос оплачен   — результат: зелёная полоса, факты платежа, куда дальше.
     Э14.11 Оплата не прошла — та же полоса красным, причина банка и «повторить».
     Э14.12 История платежей — список по сезонам, строка открывает квитанцию.
     Э14.9  Изменение данных — форма, где видно, что меняется сразу, а что ждёт.
     Э14.13 Новости          — лента: первая карточкой, остальные строками.
     Э14.14 Новость          — чтение: рубрика, заголовок, текст колонкой.

   Содержание — из flows/14-sportsmen.md. Рисуем на светлой теме. */

import { ArrowLeft, ArrowRight, Check, CreditCard, Download, RotateCcw, X } from 'lucide-react';
import { Frame } from '../PlayerApp';
import { MiniTabBar } from '../respShell';
import { Chrome, NAV } from './role14mobile';
import './role14mobile5.css';
import './role14mobile6.css';

function Screen({ cls, active, children }: { cls: string; active: string; children: React.ReactNode }) {
  return (
    <div className={'mb-wrap m5 ' + cls}>
      <Frame>
        <Chrome>
          <div className="mb-body m5-body">{children}</div>
        </Chrome>
        <MiniTabBar items={NAV} active={active} />
      </Frame>
    </div>
  );
}

/* ═══ Э14.8 · Оплата взноса — «чек» ════════════════════════════════
   Экран одного числа: человек платит и хочет видеть сумму, за что и до какого
   числа. Всё остальное — служебное, поэтому строками. Кнопка внизу и одна:
   оплата уходит на страницу банка, и на нашей стороне выбора нет. */
export function MobPay() {
  return (
    <Screen cls="m6pay" active="Профиль">
      <div className="m6-sum">
        <span className="k">К оплате</span>
        <span className="v o14-disp">₸ 10 000</span>
        <span className="s">Годовой взнос федерации · сезон 2026</span>
      </div>

      <div className="m5-sec">Платёж</div>
      <div className="m6-list">
        {[
          ['За что', 'Годовой взнос 2026'],
          ['Кому', 'ФНТ РК · Halyk ePay'],
          ['Плательщик', 'Ким Георгий'],
          ['Срок', 'до 31 марта'],
        ].map(([k, v]) => (
          <div className="m6-row" key={k}>
            <span className="k">{k}</span>
            <span className="v">{v}</span>
          </div>
        ))}
      </div>

      <div className="m5-dock">
        <div className="note">
          Оплата идёт на странице Халык Банка. Состояние поставится само, по подтверждению банка —
          держать вкладку открытой не нужно.
        </div>
        <button type="button" className="m5-go" data-to="Э14.10">
          <CreditCard size={17} /> Оплатить картой
        </button>
      </div>
    </Screen>
  );
}

/* ═══ Э14.10 / Э14.11 · Результат платежа — «полоса» ═══════════════
   Сюда возвращаются со страницы банка, и первое, что нужно, — ответ «прошло
   или нет». Ответ занимает верх экрана целиком и красится статусным цветом:
   зелёный — успех, красный — отказ. Ниже факты платежа, чтобы было что
   переслать, и два выхода: главное действие и тихое. */
function Result({
  ok,
  title,
  lead,
  facts,
  main,
  ghost,
}: {
  ok: boolean;
  title: string;
  lead: string;
  facts: [string, string][];
  main: { label: string; to: string; icon: React.ReactNode };
  ghost: { label: string; to: string };
}) {
  return (
    <Screen cls={'m6res ' + (ok ? 'ok' : 'no')} active="Профиль">
      <div className="m6-res">
        <span className="ic">{ok ? <Check size={20} /> : <X size={20} />}</span>
        <span className="t o14-disp">{title}</span>
        <span className="s">{lead}</span>
      </div>

      <div className="m5-sec">Платёж</div>
      <div className="m6-list">
        {facts.map(([k, v]) => (
          <div className="m6-row" key={k}>
            <span className="k">{k}</span>
            <span className="v">{v}</span>
          </div>
        ))}
      </div>

      <div className="m5-dock">
        <button type="button" className="m5-go" data-to={main.to}>
          {main.icon} {main.label}
        </button>
        <button type="button" className="m6-quiet" data-to={ghost.to}>
          {ghost.label}
        </button>
      </div>
    </Screen>
  );
}

export function MobPaid() {
  return (
    <Result
      ok
      title="Оплата прошла"
      lead="Взнос 2026 зачтён — заявки на турниры со взносом теперь проходят."
      facts={[
        ['Сумма', '₸ 10 000'],
        ['Когда', '14.01.2026, 10:42'],
        ['Карта', '•••• 1234 · Halyk ePay'],
        ['Номер заказа', '100416'],
      ]}
      main={{ label: 'Скачать квитанцию', to: 'Э14.12', icon: <Download size={17} /> }}
      ghost={{ label: 'Вернуться в профиль', to: 'Э14.7' }}
    />
  );
}

export function MobDeclined() {
  return (
    <Result
      ok={false}
      title="Оплата не прошла"
      lead="Банк вернул отказ: недостаточно средств. Деньги не списаны."
      facts={[
        ['Сумма', '₸ 10 000'],
        ['Когда', '14.01.2026, 10:41'],
        ['Карта', '•••• 1234 · Halyk ePay'],
        ['Ответ банка', 'insufficient funds'],
      ]}
      main={{ label: 'Повторить оплату', to: 'Э14.8', icon: <RotateCcw size={17} /> }}
      ghost={{ label: 'Вернуться в профиль', to: 'Э14.7' }}
    />
  );
}

/* ═══ Э14.12 · История платежей — «по сезонам» ═════════════════════
   Список, у которого главное — год и сумма: за квитанцией приходят «за какой
   сезон», а не «за какое число». Состояние платежа — пилюлей, квитанция —
   строкой со стрелкой. */
const PAYMENTS = [
  { y: '2026', sum: '₸ 10 000', at: '14.01.2026 · Halyk ePay', st: 'оплачен', ok: true },
  { y: '2025', sum: '₸ 9 000', at: '21.02.2025 · Halyk ePay', st: 'оплачен', ok: true },
  { y: '2024', sum: '₸ 9 000', at: '03.03.2024 · Halyk ePay', st: 'оплачен', ok: true },
  { y: '2023', sum: '₸ 8 000', at: '19.02.2023 · касса федерации', st: 'оплачен', ok: true },
];

export function MobPayments() {
  return (
    <Screen cls="m6his" active="Профиль">
      <div className="m6-back">
        <button type="button" data-to="Э14.7">
          <ArrowLeft size={14} /> Профиль
        </button>
      </div>

      <div className="m5-sec">История платежей</div>
      <div className="m6-list">
        {PAYMENTS.map((p) => (
          <div className="m6-pay" key={p.y} data-to="Э14.12">
            <span className="y o14-disp">{p.y}</span>
            <span className="tx">
              <span className="nm">{p.sum}</span>
              <span className="ss">{p.at}</span>
            </span>
            <span className="tag">{p.st}</span>
          </div>
        ))}
      </div>
      <div className="m6-note">Квитанция открывается по строке — её принимает бухгалтерия клуба.</div>
    </Screen>
  );
}

/* ═══ Э14.9 · Изменение данных — «что сразу, что ждёт» ═════════════
   Тут два разных поведения, и путать их нельзя: телефон и почта меняются
   сразу, клуб — только после подтверждения клубом. Поэтому поля разведены в
   две группы с разными подписями, а не сложены в один список. */
export function MobEdit() {
  return (
    <Screen cls="m6ed" active="Профиль">
      <div className="m6-back">
        <button type="button" data-to="Э14.7">
          <ArrowLeft size={14} /> Профиль
        </button>
      </div>

      <div className="m5-sec">Меняется сразу</div>
      <div className="m6-fields">
        <label className="m6-f">
          <span className="k">Телефон</span>
          <span className="v">+7 705 118 44 03</span>
        </label>
        <label className="m6-f">
          <span className="k">Почта</span>
          <span className="v">g.kim@mail.kz</span>
        </label>
      </div>

      <div className="m5-sec">Ждёт подтверждения</div>
      <div className="m6-fields">
        <label className="m6-f">
          <span className="k">Клуб</span>
          <span className="v">СКА · Астана</span>
        </label>
      </div>
      <div className="m6-warn">
        Клуб меняется только после того, как новый клуб подтвердит переход. До подтверждения в
        профиле остаётся прежний.
      </div>

      <div className="m5-dock">
        <button type="button" className="m5-go" data-to="Э14.7">
          Сохранить <ArrowRight size={17} />
        </button>
      </div>
    </Screen>
  );
}

/* ═══ Э14.13 · Новости — «лента» ═══════════════════════════════════
   Первая новость — карточкой во всю ширину с рубрикой и подводкой: она
   свежая, и её читают. Остальные строками: дата, рубрика, заголовок. Фотографий
   нет — решение «фона-картинки нет» держится, обложку кладёт редакция. */
const FEED = [
  {
    tag: 'КАЛЕНДАРЬ',
    nm: 'Календарь сезона 2026 опубликован',
    ss: 'Восемь главных стартов, четыре тура Евразийской лиги и двадцать открытых республиканских турниров.',
    at: '15 апреля',
  },
  { tag: 'ВЗНОСЫ', nm: 'Годовой взнос: срок до 31 марта', at: '2 марта' },
  { tag: 'ПОЛОЖЕНИЕ', nm: 'Изменения в положении о соревнованиях', at: '12 марта' },
  { tag: 'РЕЙТИНГ', nm: 'Пересчёт рейтинга: что изменилось в формуле', at: '28 февраля' },
];

export function MobNews() {
  const [first, ...rest] = FEED;
  return (
    <Screen cls="m6nw" active="Профиль">
      <div className="m6-lead" data-to="Э14.14">
        <span className="tag">{first.tag}</span>
        <span className="nm o14-disp">{first.nm}</span>
        <span className="ss">{first.ss}</span>
        <span className="at">{first.at} · пресс-служба ФНТ РК</span>
      </div>

      <div className="m5-sec">Ещё новости</div>
      <div className="m6-list">
        {rest.map((n) => (
          <div className="m6-nrow" key={n.nm} data-to="Э14.14">
            <span className="tx">
              <span className="nm">{n.nm}</span>
              <span className="ss">
                {n.tag} · {n.at}
              </span>
            </span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ═══ Э14.14 · Новость — «чтение» ══════════════════════════════════
   Единственный экран роли, где длинный текст. Поэтому здесь другая мера: одна
   колонка шириной в чтение, крупный заголовок, увеличенный интерлиньяж. Что
   изменилось для спортсмена — отдельным списком, потому что за этим и пришли. */
export function MobArticle() {
  return (
    <Screen cls="m6art" active="Профиль">
      <div className="m6-back">
        <button type="button" data-to="Э14.13">
          <ArrowLeft size={14} /> Все новости
        </button>
      </div>

      <article className="m6-read">
        <span className="tag">КАЛЕНДАРЬ</span>
        <h2 className="o14-disp">Календарь сезона 2026 опубликован</h2>
        <div className="meta">15 апреля 2026 · пресс-служба ФНТ РК · 3 мин чтения</div>

        <p>
          В сезоне 2026 года — восемь главных стартов, четыре тура Евразийской лиги и двадцать
          открытых республиканских турниров.
        </p>
        <p>
          Приём заявок на ОРТ открывается за месяц до старта: заявляется спортсмен сам. На главные
          старты состав подаёт старший тренер региона, в Лигу команду заявляет клуб.
        </p>

        <h3>Что изменилось для спортсменов</h3>
        <ul>
          <li>Приём заявок на ОРТ — за месяц до старта, а не за две недели.</li>
          <li>Годовой взнос принимается картой прямо в системе.</li>
          <li>Рейтинг пересчитывается в течение суток после турнира.</li>
        </ul>
      </article>
    </Screen>
  );
}
