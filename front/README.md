This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Табло трансляции (оверлей для OBS)

Пульт для оператора и прозрачная плашка счёта для эфира. Счёт хранит Django,
фронт — только пульт и отрисовка.

| Маршрут | Что это |
|---|---|
| `/scoreboard?board=<ключ>` | пульт: фамилии, страны, очки, партии, командный счёт, горячие клавиши |
| `/scoreboard/overlay?board=<ключ>` | плашка для эфира: прозрачный фон, 860 × 160 |
| `GET /api/scoreboard/` | список досок (Django) |
| `GET /api/scoreboard/<ключ>/` | снимок счёта; при неизменной версии — 304 без тела |
| `GET /api/scoreboard/<ключ>/stream/` | поток изменений (SSE) — основной путь |
| `PUT /api/scoreboard/<ключ>/` | новое состояние; чужая запись между делом — 409 |

`?board=` можно не указывать — тогда это доска `main`.

### Как подключить к OBS

1. Поднять бэкенд и фронт (`manage.py runserver` и `npm run dev`).
2. В OBS: **Источники → + → Браузер**, адрес
   `http://localhost:3000/scoreboard/overlay`, ширина **860**, высота **160**.
   Дополнительный CSS не нужен, фон плашки уже прозрачный.
3. Пульт открыть в обычном браузере на `/scoreboard`. Ссылку на оверлей он
   показывает сам — рядом кнопка «Копировать ссылку».

### Несколько столов сразу

Одна доска — один стол. Ключ произвольный (`table-3`, `final`), строка в базе
заводится при первом обращении:

```
пульт   /scoreboard?board=table-3
оверлей /scoreboard/overlay?board=table-3   → отдельный источник в OBS
```

Записи в разные доски не пересекаются: блокируется только своя строка.
В модели `Scoreboard` есть `tournament` и `table_number` — точка, куда
привязывать доску к реальному столу турнира, чтобы фамилии подтягивались из
жеребьёвки, а не набирались руками.

### Как счёт попадает в эфир

Одно постоянное соединение (SSE), а не череда запросов: пульт и плашка
подписываются на `GET /api/scoreboard/<ключ>/stream/` и получают только то, что
изменилось. Первым кадром приходит текущий счёт, поэтому источник в OBS оживает
сразу после перезапуска сцены.

Следит за изменениями сервер. Рассылать от пишущего нельзя: `gunicorn` поднимает
два процесса, общей памяти у них нет, и запись в одном не видна потоку в другом.
Общая у них база — поток читает ревизию строки (одно число по уникальному ключу)
и отдаёт полное состояние, только когда она сдвинулась.

**Чем это оплачено.** Под WSGI открытое соединение занимает поток gunicorn на всё
время жизни: транслируемый стол стоит двух потоков (пульт и оверлей). Поэтому в
`back/nixpacks.toml` их 12 на воркер, а не 4. Redis и переезд на ASGI понадобятся,
когда таких соединений станут сотни; на табло у стола их единицы.

Если первый кадр не пришёл за пять секунд — значит соединение где-то
буферизуется (прокси, фильтр в сети зала), и фронт молча переходит на опрос
`GET /api/scoreboard/<ключ>/`. В эфире счёт важнее красоты транспорта. У этой
ручки есть ETag: пока ревизия не сдвинулась, ответ приходит с 304 без тела.

### Что закрыть перед публикацией

Запись сейчас **открыта**: `permission_classes = [AllowAny]`. Локально это
нормально, в интернете — нет: любой, у кого есть ссылка, сможет менять счёт в
прямом эфире. Перед выкладкой нужен гейт на `PUT` (токен доски или
`IsAuthenticated` через существующую куку JWT).

Чтение оставляем открытым осознанно: браузер OBS не умеет логиниться, а счёт и
так виден в эфире.
