# Референсы: как показывают знак организации

Собрано для локапа ФНТ РК в шапках экранов (`src/ui/brand.tsx`, знак —
`brand/fnt/`). 82 экрана, 12 запросов в Mobbin, 12.08.2026.

Смотрели не «красиво/некрасиво», а один вопрос: **как продукты показывают чужой
подробный герб в интерфейсе, где на него отведено 30 px.** У нас ровно эта
задача — официальный знак федерации вертикальный, с лентой орнамента и мелкой
надписью TTFRK.

Ниже — выводы, каждый со списком экранов, из которых он снят. Полный перечень с
разбивкой по запросам — в конце.

---

## 1. Подробный крест не живёт мелким. Рядом всегда есть упрощённый знак

Самое частое решение: **два ассета**. Крупно — настоящий герб со всеми
деталями, мелко — упрощённый значок с сильным силуэтом и одним доминирующим
цветом.

У [MLS](https://mobbin.com/screens/e843d07b-cacd-4841-a1a8-9e5d32b3eddd) это
видно на одном экране: герб «Интер Майами» стоит крупно в центре, и он же —
крошечным значком в таб-баре и в ряду выбора клуба. То же у
[DAZN](https://mobbin.com/screens/11f65168-3213-4490-baae-7739476c9897): герб
«Палмейраса» крупно на цветной ленте, а ниже логотипы лиг — плитками.

В таблицах и на табло крест ужат до 20–24 px и всегда подпёрт коротким кодом или
названием — сам по себе он на этом размере не опознаётся:
[theScore](https://mobbin.com/screens/1d4bf7ee-e00f-4360-8986-646663f5605f) ·
[NFL](https://mobbin.com/screens/1325a7cd-dac6-4e78-bb11-fa6816b761b4) ·
[Apple Sports](https://mobbin.com/screens/04b91d44-700e-43d8-a464-eb98a1a5733c) ·
[FotMob](https://mobbin.com/screens/9cdca008-941d-4127-95b6-d50bb4119828) ·
[MLS](https://mobbin.com/screens/19d86590-35b2-47f7-bac8-1d4ef4febab2) ·
[NBA](https://mobbin.com/screens/d3bcc086-3549-4bab-a78c-8201bccd8300) ·
[Formula 1](https://mobbin.com/screens/6fa8d76f-a91d-4f50-ba12-747155be7ba7) ·
[Fixtured](https://mobbin.com/screens/6725f8dd-6ffa-4207-8f57-d8bf19c5c1ec)

**Что сделали.** Завели второй ассет — `brand/fnt/fnt-mark.svg`: квадратная
марка из «тройки», солнца и беркута, без ленты орнамента и без надписи TTFRK.
Полный щит `fnt-logo.svg` остаётся для крупных подач. Проверили рядом на
16/18/24/30/40 px: щит ниже 30 px превращается в кашу, марка держится до 16.

## 2. В шапке продукта локап однострочный и тихий

Ни один рабочий интерфейс не делает из своего логотипа в верхней панели
двухъярусную композицию. Знак 18–24 px, рядом название, одна строка, дальше
сразу рабочий контекст:
[Uxcel](https://mobbin.com/screens/44031fc5-3796-4d67-a39a-0fdbc2896470) ·
[Lovable](https://mobbin.com/screens/ad361de1-19e5-4115-b654-876e0d8c06a8) ·
[Vercel](https://mobbin.com/screens/5bb75d66-7572-4f2e-a229-ebc54627343b) ·
[Posh](https://mobbin.com/screens/295a2a67-3635-41fd-8de0-a8ccc9c2fa83) ·
[Gorgias](https://mobbin.com/screens/d201baf7-979c-4b6c-a849-fc35269ab6bb) ·
[Base44](https://mobbin.com/screens/a1fff3e9-c0e4-4ea1-a63c-d6fa7df272fe) ·
[Fibery](https://mobbin.com/screens/e470f040-82a2-44ec-8954-c70e56ce695b) ·
[Microsoft Loop](https://mobbin.com/screens/7bda4249-5988-44d3-af7d-73f745a321e2) ·
[Air](https://mobbin.com/screens/fa59dedd-7f78-48a1-b5bc-a628f154af8e) ·
[Slite](https://mobbin.com/screens/389dd682-62d2-4aac-810c-2a02bf428f1c) ·
[ClickUp](https://mobbin.com/screens/2eb08959-de33-42e3-8873-69508b9d89b3) ·
[Clerk](https://mobbin.com/screens/78973eed-10da-43d5-9adc-56c444bc82c5) ·
[Amplitude](https://mobbin.com/screens/56f5ff3c-cf4c-47e0-b3cd-7040097105e5) ·
[Zoom](https://mobbin.com/screens/311f7c75-e5d9-4016-9112-21994dfb13fa)

**Что сделали.** Это прямо отменило первый вариант: я сперва поставил на
десктопе двухъярусный локап «ФНТ РК / Настольный теннис» — и убрал подпись
после этого разбора. В десктопной шапке рядом стоит название турнира, вторая
строка бренда с ним конкурирует. Теперь там `<Brand />` без `sub`.

## 3. Две строки — язык карточки сущности, а не шапки

Пара «название + уточнение под ним» встречается там, где блок описывает
**сущность**, а не владельца интерфейса: карточки лиг у
[Perplexity](https://mobbin.com/screens/60b3a024-93e2-4e7d-8871-5b552179aebb),
профили у [Threads](https://mobbin.com/screens/3bb59739-8f7f-44bb-b83e-09e595a35df0),
шапка профиля [Instagram](https://mobbin.com/screens/696693c8-a3be-4a99-bb57-d43cb8c53dce),
дома у [Clubhouse](https://mobbin.com/screens/86d4272f-77b9-48ee-a773-833a7e9567f4),
сообщества у [Pangea](https://mobbin.com/screens/3ba261f7-3c2f-4ec2-8307-c661a56c255d),
карточка игрока у [Premier League](https://mobbin.com/screens/33e22781-c790-446d-a58e-fb61493f0aea) и
[FotMob](https://mobbin.com/screens/74f4694b-05f4-464d-bb26-45f8d7a13795).

**Что сделали.** Вторую строку оставили только на телефонных шапках, где локап и
есть всё содержимое шапки. Туда же уехала роль: раньше в телефоне стояло
«знак + Судья», то есть бренд из шапки пропадал совсем. Теперь «ФНТ РК» сверху,
роль — подписью: `<Brand size="sm" sub="Судья" />`.

## 4. Плитка фирменного цвета — стандартный контейнер для мелкого знака

Скруглённый квадрат, залитый фирменным цветом, со знаком внутри — самый
устойчивый способ дать логотипу опору на чужом фоне:
[adidas](https://mobbin.com/screens/e38a6554-4ffa-4932-88ff-ce541c228c86) (сетка
клубных гербов, каждый на своей цветной плитке) ·
[Afterpay](https://mobbin.com/screens/e534f812-8bcb-4c7b-a3dc-fdd0853c12c7) ·
[Clubhouse](https://mobbin.com/screens/86d4272f-77b9-48ee-a773-833a7e9567f4) ·
[Splitwise](https://mobbin.com/screens/6817a5f7-e222-4568-afc4-1487fb2d1670) ·
[Apple News](https://mobbin.com/screens/dcf7884c-7bfa-4bb1-a3fe-d9dd27701353) ·
[Linktree](https://mobbin.com/screens/6480818a-d9bf-4abf-a59c-33847c008bc2) ·
[DAZN](https://mobbin.com/screens/11f65168-3213-4490-baae-7739476c9897) ·
[Formula 1](https://mobbin.com/screens/6fa8d76f-a91d-4f50-ba12-747155be7ba7)
(круглые цветные плитки под конструкторов) ·
[Fixtured](https://mobbin.com/screens/f38fb580-c136-492b-9f76-141acbcd67fb)
(круглые подставки под гербами)

Отдельно проверили обратное — **подставку под уже цветной плиткой**. У нас в
макете это выглядело грязно: два контура подряд читаются как артефакт. В
референсах такой двойной оправы нет ни разу.

**Что сделали.** Марка сама и есть плитка: синий щитовой цвет, скругление 12.36 %
стороны — та же доля, что у настоящего щита. Никакого дополнительного плинта.

## 5. Спортивный нейминг — узкий тяжёлый прописной

Названия команд и разделов набраны узким тяжёлым гротеском в верхнем регистре,
часто с наклоном:
[NFL](https://mobbin.com/screens/d1ff5f27-354e-426a-9374-7f0c4603fab0)
(«PHILADELPHIA EAGLES») ·
[NFL — коды команд](https://mobbin.com/screens/1325a7cd-dac6-4e78-bb11-fa6816b761b4) ·
[Formula 1](https://mobbin.com/screens/6fa8d76f-a91d-4f50-ba12-747155be7ba7)
(«2025 TEAMS' STANDINGS») ·
[NBA](https://mobbin.com/screens/d3bcc086-3549-4bab-a78c-8201bccd8300) ·
[MLS](https://mobbin.com/screens/19d86590-35b2-47f7-bac8-1d4ef4febab2) ·
[Locals](https://mobbin.com/screens/db88b9b9-6c37-49d4-beb2-f83e54e6357d) ·
[DICK'S](https://mobbin.com/screens/60595806-2440-4e2a-bcb3-3c0b772d069c) ·
[Strava](https://mobbin.com/screens/17bda029-9fd8-4dee-aebe-95c08e0f3e62)

**Что сделали.** Это подтвердило уже сделанный ранее отбор шрифтов: словесная
часть сидит на `--font-brand` = Fira Sans Extra Condensed 800, прописные, с
разрядкой. Токен отдельный от `--font` намеренно — подпись бренда не должна
ездить за переключателем «Шрифт» в тулбаре.

## 6. На титульном экране знак идёт вывороткой на фирменном цвете

Стартовые экраны почти все устроены одинаково: **одноцветный** знак по центру
залитого фирменным цветом поля, без плитки и без подложки:
[MLS](https://mobbin.com/screens/9d6fba4f-0a08-4102-ac7e-117e15ac6b3e) (белый
герб на чёрном) ·
[theScore](https://mobbin.com/screens/85c01f98-aeef-419d-8297-de2f5d081324) ·
[Strava](https://mobbin.com/screens/17bda029-9fd8-4dee-aebe-95c08e0f3e62) ·
[DICK'S](https://mobbin.com/screens/60595806-2440-4e2a-bcb3-3c0b772d069c) ·
[FotMob](https://mobbin.com/screens/9b66624a-db8d-49c3-bde0-df9b9b4b96ce) ·
[Formula 1](https://mobbin.com/screens/ad0f6071-ea62-45ef-a799-64ab20c77eeb) ·
[NBA](https://mobbin.com/screens/56528b01-9027-4fc3-a83c-ba138bd6f3dd) ·
[DAZN](https://mobbin.com/screens/5d63f539-087f-4550-a84c-60f951acf79d)

**Чего у нас нет.** Одноцветной выворотки в комплекте ФНТ не существует — ни в
присланном `.cdr`, ни в наших сборках. Пока титульных экранов с крупным знаком в
макетах нет, поэтому вариант **не рисовали**: это открытая рекомендация, а не
сделанная работа. Понадобится — собирается из тех же кривых эмблемы.

## 7. Что оказалось мимо

Честно про слабое место набора: **сайтов настоящих спортивных федераций в Mobbin
нет.** Запрос про витрину сайта организации вернул SaaS-лендинги, и как
референсы к нашей задаче они почти пустые. Из восьми пригодился один —
[Uniswap Cup](https://mobbin.com/sites/sections/761673b9-83df-468c-8868-b303b730cb00),
турнирный лендинг: знак турнира там мелкий, по углам, а всю работу делает
типографика. Остальные семь оставлены в перечне для полноты, но выводов на них
не строили:
[Webflow](https://mobbin.com/sites/sections/7d48bf03-9f8a-4bfa-ad21-239e0dc0adb0) ·
[Runway](https://mobbin.com/sites/sections/10d39ce5-31db-4556-8169-96098e3e8ede) ·
[Ploy](https://mobbin.com/sites/sections/c61d8e3e-1730-447a-8913-5a1841250554) ·
[Patreon](https://mobbin.com/sites/sections/2c0f332c-ee72-4766-bb86-a92d8c21b535) ·
[Airtable](https://mobbin.com/sites/sections/de1d1994-e910-42da-9f07-1076412af3d7) ·
[Qatalog](https://mobbin.com/sites/sections/6e6571a3-8bd7-4e94-b642-02d0cce0b71a) ·
[Vercel](https://mobbin.com/sites/sections/f875072a-1073-4dd1-b798-dbef0af45339)

Так же пусто по турнирным сеткам: на запрос про сетку плей-офф Mobbin отдал один
экран, и тот не про спорт —
[HubSpot](https://mobbin.com/screens/f0b56e4b-6fcb-4ad9-8627-e53bbcc172bf).
Сетку у нас рисует React Flow, и опереться в этой части было не на что.

---

## Полный перечень

Сгруппирован по запросу, в порядке сбора. Платформа указана в скобках.

**Шапка спортивного продукта (веб, 5).**
[Perplexity](https://mobbin.com/screens/60b3a024-93e2-4e7d-8871-5b552179aebb) ·
[X — хаб NBA](https://mobbin.com/screens/dfe579d5-08a1-44e5-b92c-fb7bf8de6cf7) ·
[X — таблица](https://mobbin.com/screens/9b1f3ea8-e1f6-4a7c-993d-b0162020ec56) ·
[Threads](https://mobbin.com/screens/3bb59739-8f7f-44bb-b83e-09e595a35df0) ·
[Stitch](https://mobbin.com/screens/0cd40828-ad37-4fa5-b905-a53874ba9a01)

**Квадратная плитка знака и двухстрочный заголовок (iOS, 8).**
[Linktree](https://mobbin.com/screens/6480818a-d9bf-4abf-a59c-33847c008bc2) ·
[Instagram](https://mobbin.com/screens/696693c8-a3be-4a99-bb57-d43cb8c53dce) ·
[Tolan](https://mobbin.com/screens/1cd768d8-8abc-4a56-8909-2c6e978bc7c2) ·
[Clubhouse](https://mobbin.com/screens/86d4272f-77b9-48ee-a773-833a7e9567f4) ·
[Splitwise](https://mobbin.com/screens/6817a5f7-e222-4568-afc4-1487fb2d1670) ·
[Afterpay](https://mobbin.com/screens/e534f812-8bcb-4c7b-a3dc-fdd0853c12c7) ·
[Apple News](https://mobbin.com/screens/dcf7884c-7bfa-4bb1-a3fe-d9dd27701353) ·
[Apple Notes](https://mobbin.com/screens/d78e943f-82fc-4d14-9125-29011acf12a0)

**Тёмная админка, логотип в панели (веб, 6).**
[Uxcel](https://mobbin.com/screens/44031fc5-3796-4d67-a39a-0fdbc2896470) ·
[Base44](https://mobbin.com/screens/a1fff3e9-c0e4-4ea1-a63c-d6fa7df272fe) ·
[Vercel](https://mobbin.com/screens/5bb75d66-7572-4f2e-a229-ebc54627343b) ·
[Posh](https://mobbin.com/screens/295a2a67-3635-41fd-8de0-a8ccc9c2fa83) ·
[Lovable](https://mobbin.com/screens/ad361de1-19e5-4115-b654-876e0d8c06a8) ·
[Gorgias](https://mobbin.com/screens/d201baf7-979c-4b6c-a849-fc35269ab6bb)

**Герб клуба в шапке (iOS, 6).**
[Spotify](https://mobbin.com/screens/e605d6df-89db-4774-911a-674d06d99667) ·
[MLS](https://mobbin.com/screens/e843d07b-cacd-4841-a1a8-9e5d32b3eddd) ·
[NFL](https://mobbin.com/screens/d1ff5f27-354e-426a-9374-7f0c4603fab0) ·
[Locals](https://mobbin.com/screens/db88b9b9-6c37-49d4-beb2-f83e54e6357d) ·
[DAZN](https://mobbin.com/screens/11f65168-3213-4490-baae-7739476c9897) ·
[adidas](https://mobbin.com/screens/e38a6554-4ffa-4932-88ff-ce541c228c86)

**Турнирная сетка (веб, 1).**
[HubSpot](https://mobbin.com/screens/f0b56e4b-6fcb-4ad9-8627-e53bbcc172bf)

**Табло матча с гербами (iOS, 8).**
[FotMob](https://mobbin.com/screens/7dc77398-839f-48b2-8b12-29ac90b2b9c1) ·
[Apple Sports](https://mobbin.com/screens/886ae66f-8615-4cb0-988f-81dec70b030e) ·
[Fixtured](https://mobbin.com/screens/f38fb580-c136-492b-9f76-141acbcd67fb) ·
[MLS](https://mobbin.com/screens/4b100fbb-973d-41a3-b542-7fea394fccf4) ·
[Premier League](https://mobbin.com/screens/23dce6cf-7ec9-4bd5-b8a2-6adc573f8eb4) ·
[theScore](https://mobbin.com/screens/d81ed8cb-a7fe-4990-89af-4515bb04dfef) ·
[NFL](https://mobbin.com/screens/14744a95-8fe1-4b21-b8b7-fb3203244281) ·
[X](https://mobbin.com/screens/73256e33-aa77-4caa-b2db-1697e0790a0f)

**Турнирная таблица с гербом в строке (iOS, 8).**
[theScore](https://mobbin.com/screens/1d4bf7ee-e00f-4360-8986-646663f5605f) ·
[NFL](https://mobbin.com/screens/1325a7cd-dac6-4e78-bb11-fa6816b761b4) ·
[Apple Sports](https://mobbin.com/screens/04b91d44-700e-43d8-a464-eb98a1a5733c) ·
[Formula 1](https://mobbin.com/screens/6fa8d76f-a91d-4f50-ba12-747155be7ba7) ·
[FotMob](https://mobbin.com/screens/9cdca008-941d-4127-95b6-d50bb4119828) ·
[MLS](https://mobbin.com/screens/19d86590-35b2-47f7-bac8-1d4ef4febab2) ·
[NBA](https://mobbin.com/screens/d3bcc086-3549-4bab-a78c-8201bccd8300) ·
[Fixtured](https://mobbin.com/screens/6725f8dd-6ffa-4207-8f57-d8bf19c5c1ec)

**Верхняя панель с логотипом и переключателем рабочего пространства (веб, 8).**
[Fibery](https://mobbin.com/screens/e470f040-82a2-44ec-8954-c70e56ce695b) ·
[Microsoft Loop](https://mobbin.com/screens/7bda4249-5988-44d3-af7d-73f745a321e2) ·
[Clerk](https://mobbin.com/screens/78973eed-10da-43d5-9adc-56c444bc82c5) ·
[Air](https://mobbin.com/screens/fa59dedd-7f78-48a1-b5bc-a628f154af8e) ·
[Amplitude](https://mobbin.com/screens/56f5ff3c-cf4c-47e0-b3cd-7040097105e5) ·
[Slite](https://mobbin.com/screens/389dd682-62d2-4aac-810c-2a02bf428f1c) ·
[Zoom](https://mobbin.com/screens/311f7c75-e5d9-4016-9112-21994dfb13fa) ·
[ClickUp](https://mobbin.com/screens/2eb08959-de33-42e3-8873-69508b9d89b3)

**Профиль спортсмена: флаг и эмблема (iOS, 8).**
[FotMob](https://mobbin.com/screens/74f4694b-05f4-464d-bb26-45f8d7a13795) ·
[Premier League](https://mobbin.com/screens/33e22781-c790-446d-a58e-fb61493f0aea) ·
[Under Armour](https://mobbin.com/screens/6d0dd17d-3bcb-4b84-8970-4de2834b4875) ·
[Formula 1](https://mobbin.com/screens/86839b4e-01e6-4b3b-99da-9c78aa6a75ab) ·
[Paramount+](https://mobbin.com/screens/5601479a-f19a-4374-a756-b73b88c1efa2) ·
[Azar](https://mobbin.com/screens/9d77eb88-a8ec-46b1-9339-1aa8aff5327b) ·
[Tonal](https://mobbin.com/screens/c648e34b-15c8-44d1-abb8-1a957d7d5150) ·
[Pangea](https://mobbin.com/screens/3ba261f7-3c2f-4ec2-8307-c661a56c255d)

**Членская карта с эмблемой и статусом (iOS, 8).**
[Shangri-La Circle](https://mobbin.com/screens/1c46893c-c975-4b9a-854d-3839e3dc7d7f) ·
[Nike Run Club](https://mobbin.com/screens/fc470692-d84c-40fe-bef1-a924cb6f5bbc) ·
[Ulta Beauty](https://mobbin.com/screens/53145832-e84f-48b1-b235-93f367535459) ·
[IKEA](https://mobbin.com/screens/59e57179-c37b-4203-875a-4201922217ba) ·
[Marriott Bonvoy](https://mobbin.com/screens/626ceb57-4d93-47e5-9825-98e28dd2c7d4) ·
[pushr](https://mobbin.com/screens/7c8e5492-4497-4a9f-a106-d7911c9b34a7) ·
[Chipotle](https://mobbin.com/screens/19542763-ad60-453a-9813-18b8ef9d67aa) ·
[adidas adiclub](https://mobbin.com/screens/ca2219bc-ced3-4b5e-b9c8-d9fda98e044b)

**Витрина сайта организации (веб-секции, 8 — набор слабый, см. пункт 7).**
[Webflow](https://mobbin.com/sites/sections/7d48bf03-9f8a-4bfa-ad21-239e0dc0adb0) ·
[Runway](https://mobbin.com/sites/sections/10d39ce5-31db-4556-8169-96098e3e8ede) ·
[Ploy](https://mobbin.com/sites/sections/c61d8e3e-1730-447a-8913-5a1841250554) ·
[Patreon](https://mobbin.com/sites/sections/2c0f332c-ee72-4766-bb86-a92d8c21b535) ·
[Uniswap Cup](https://mobbin.com/sites/sections/761673b9-83df-468c-8868-b303b730cb00) ·
[Airtable](https://mobbin.com/sites/sections/de1d1994-e910-42da-9f07-1076412af3d7) ·
[Qatalog](https://mobbin.com/sites/sections/6e6571a3-8bd7-4e94-b642-02d0cce0b71a) ·
[Vercel](https://mobbin.com/sites/sections/f875072a-1073-4dd1-b798-dbef0af45339)

**Стартовый экран со знаком (iOS, 8).**
[MLS](https://mobbin.com/screens/9d6fba4f-0a08-4102-ac7e-117e15ac6b3e) ·
[Strava](https://mobbin.com/screens/17bda029-9fd8-4dee-aebe-95c08e0f3e62) ·
[Formula 1](https://mobbin.com/screens/ad0f6071-ea62-45ef-a799-64ab20c77eeb) ·
[theScore](https://mobbin.com/screens/85c01f98-aeef-419d-8297-de2f5d081324) ·
[DAZN](https://mobbin.com/screens/5d63f539-087f-4550-a84c-60f951acf79d) ·
[FotMob](https://mobbin.com/screens/9b66624a-db8d-49c3-bde0-df9b9b4b96ce) ·
[NBA](https://mobbin.com/screens/56528b01-9027-4fc3-a83c-ba138bd6f3dd) ·
[DICK'S Sporting Goods](https://mobbin.com/screens/60595806-2440-4e2a-bcb3-3c0b772d069c)
