import { Phone } from './Signup';
import n from './News.module.css';

// Лента новостей и анонсов: закреплённый анонс сверху + список новостей.
export function NewsFeed() {
  return (
    <Phone title="Новости">
      <div className={n.list}>
        {/* закреплённый анонс */}
        <div className={n.pinned}>
          <div className={n.pinBar}>📌 Анонс · закреплено</div>
          <div className={n.cover} />
          <div className={n.pad}>
            <div className={n.title}>Кубок Астаны 2026 — регистрация открыта</div>
            <div className={n.excerpt}>
              Заявки до 5 сентября. Одиночный разряд, олимпийская система, плата 5 000 ₸.
            </div>
            <div className={n.cta}>К турниру</div>
          </div>
        </div>

        {/* обычные новости */}
        <div className={n.card}>
          <div className={n.coverSm} />
          <div className={n.cardBody}>
            <div className={n.titleSm}>Итоги первенства среди юниоров</div>
            <div className={n.excerpt}>Победители и таблицы всех групп.</div>
            <div className={n.meta}>2 сентября</div>
          </div>
        </div>
        <div className={n.card}>
          <div className={n.coverSm} />
          <div className={n.cardBody}>
            <div className={n.titleSm}>Изменения в регламенте сезона</div>
            <div className={n.excerpt}>Новый порядок расчёта рейтинга.</div>
            <div className={n.meta}>28 августа</div>
          </div>
        </div>
      </div>
    </Phone>
  );
}

// Экран статьи/анонса.
export function Article() {
  return (
    <Phone title="Новости">
      <div className={n.article}>
        <div className={n.hero} />
        <div className={n.aPad}>
          <div className={n.aChip}>Анонс</div>
          <div className={n.aTitle}>Кубок Астаны 2026 — регистрация открыта</div>
          <div className={n.aMeta}>Федерация · 1 сентября</div>
          <div className={n.aBody}>
            <span>
              Открыта регистрация на осенний кубок. Турнир пройдёт 12–14 сентября
              в Астане, ТЦ «Алау», одиночный разряд по олимпийской системе.
            </span>
            <span>
              Заявки принимаются до 5 сентября через приложение или на сайте.
              Плата за участие — 5 000 ₸.
            </span>
          </div>
          <div className={n.cta}>К турниру</div>
        </div>
      </div>
    </Phone>
  );
}
