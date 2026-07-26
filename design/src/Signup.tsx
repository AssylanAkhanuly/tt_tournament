import type { ReactNode } from 'react';
import s from './Signup.module.css';

// Каркас телефона со статус-баром и аппбаром — переиспользуется всеми экранами.
function Phone({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={s.phone}>
      <div className={s.scr}>
        <div className={s.status}><span>9:41</span><span>▲ ▼ 100%</span></div>
        <div className={s.appbar}><span className={s.chev}>‹</span> {title}</div>
        <div className={s.body}>{children}</div>
      </div>
    </div>
  );
}

const money = (n: number) => n.toLocaleString('ru-RU') + ' ₸';

// Шаг 1 — карточка турнира
export function TournamentScreen({
  name, dates, city, fee,
}: { name: string; dates: string; city: string; fee: number }) {
  return (
    <Phone title="Турнир">
      <div className={s.card}>
        <div className={s.chip}>Официальный · республиканский</div>
        <div className={s.tName}>{name}</div>
        <div className={s.meta}>
          <div className={s.row}><span className={s.k} /> {dates}</div>
          <div className={s.row}><span className={s.k} /> {city} · ТЦ «Алау»</div>
          <div className={s.row}><span className={s.k} /> Одиночный · олимпийка</div>
        </div>
        <div className={s.hr} />
        <div className={s.fee}>
          <span className={s.lbl}>Плата за участие</span>
          <span className={s.val}>{money(fee)}</span>
        </div>
      </div>
      <div className={s.spacer} />
      <div className={s.btn}>Записаться</div>
    </Phone>
  );
}

// Шаг 2 — форма заявки
export function ApplicationForm({ rank, fee }: { rank: string; fee: number }) {
  return (
    <Phone title="Заявка">
      <div className={s.field}>
        <span className={s.flbl}>Категория</span>
        <div className={s.inp}>Мужчины · до 2200 <span className={s.car}>▾</span></div>
      </div>
      <div className={s.field}>
        <span className={s.flbl}>Разряд · из профиля</span>
        <div className={`${s.inp} ${s.ro}`}>{rank}</div>
      </div>
      <div className={s.check}>
        <span className={s.box}>✓</span>
        Согласен с регламентом турнира и правилами ФНТ РК
      </div>
      <div className={s.info}>
        Плата {money(fee)} — оплачивается организатору клуба при подтверждении заявки.
      </div>
      <div className={s.spacer} />
      <div className={s.btn}>Оплатить и подать · {money(fee)}</div>
    </Phone>
  );
}

// Шаг 3 — заявка подана
export function Submitted() {
  return (
    <Phone title="Заявка">
      <div className={s.done}>
        <div className={s.ok}>✓</div>
        <div className={s.doneH}>Заявка подана</div>
        <div className={s.doneP}>
          Ожидайте подтверждения организатора клуба. Придёт пуш, когда вас включат в сетку.
        </div>
      </div>
      <div className={`${s.btn} ${s.ghost}`}>К турниру</div>
    </Phone>
  );
}
