# User Flow

Кто что делает в системе.

- Системный дизайн — отдельно: [ARCHITECTURE.md](ARCHITECTURE.md)
- Требования: [TZ.md](TZ.md) · Дизайн: [DESIGN.md](DESIGN.md)
- Исходники диаграмм: [diagrams/](diagrams/) · сборка: `diagrams/build.ps1`

> Диаграммы на **[D2](https://d2lang.com)** — раскладку делает движок, а не я.
> Mermaid ниже оставлен как текстовая спецификация: правится в PR, рендерится
> без сборки.

## Как читать

Сначала иерархия (кто кого старше), потом жизненный цикл (что происходит
в целом), потом шесть ролевых флоу — что видит и делает **конкретный человек**.

Цвета: зелёный — шаги переиспользуемого движка и успешные исходы, жёлтый —
развилки, красный — блокировки и отказы.

## Иерархия ролей

![Иерархия ролей](diagrams/out/roles.svg)

## Жизненный цикл турнира

![Жизненный цикл](diagrams/out/flow-lifecycle.svg)

## Управляющие роли — десктоп

Показаны рядом, потому что их флоу сцеплены: администратор системы заводит
аккаунты и организации, тренер подаёт заявку, а главный судья одобряет,
собирает сетку и ведёт турнир.

![Управляющие роли](diagrams/out/flow-admins.svg)

## Судья стола — адаптивный сайт

![Судья стола](diagrams/out/flow-table-judge.svg)

Обрыв сети идёт **параллельно** всему циклу выше:

![Обрыв сети](diagrams/out/flow-offline.svg)

## Игрок — сайт и приложение

![Игрок](diagrams/out/flow-player.svg)

---

Ниже — то же самое в Mermaid, как текстовая спецификация.

## Три сквозных правила

Зафиксированы в [TZ.md](TZ.md) (§4.2, §8):

- **Заявка тренера** — одна заявка на **список игроков**, решение принимается по заявке целиком.
- **Самостоятельная заявка** — игрок может заявиться **сам**, без тренера, на открытые турниры.
- **Судья на столе** — **матч не стартует, пока на стол не назначен судья стола.** Блокирующее правило.

## Ограничения рендерера

- Никаких `<br/>`, HTML-тегов и эмодзи в подписях.
- ID узлов — camelCase, без подчёркиваний.
- Зарезервированы: `end`, `subgraph`, `graph`, **`call`** (callback-директива).
- В sequence-диаграммах **не работают** `Note`, `alt`, `loop`, `opt` — молча выбрасываются.

---

# Обзор

## Иерархия ролей

Наследование прав: вышестоящая роль может всё, что может нижестоящая.

```mermaid
flowchart TD
    adm["Администратор системы — вся платформа"]
    gs["Главный судья — один турнир"]
    tr["Тренер, представитель — свой клуб или регион"]
    ss["Судья стола — один стол"]
    ig["Игрок — свой профиль, сайт и приложение"]
    go["Гость — только чтение"]

    adm --> gs
    adm --> tr
    gs --> ss
    gs --> ig
    tr --> ig
    ss --> ig
    ig --> go

    style adm fill:#DCCCFF,stroke:#874FFF
    style go fill:#D9D9D9,stroke:#B3B3B3
```

## Жизненный цикл турнира

Сквозной сценарий через все роли.

```mermaid
flowchart TD
    createT["Главный судья создаёт турнир и собирает сетку"]
    openApps["Открыт приём заявок"]
    coachApply["Тренер подаёт заявку со списком игроков"]
    selfApply["Игрок подаёт заявку сам"]
    review{"Заявка одобрена?"}
    rejected["Отказ с причиной"]
    participants["Стороны (одиночки/пары) заявлены"]
    assignTable["Главный судья назначает судей столов"]
    refGate{"У каждого стола есть судья?"}
    blockStart["Старт заблокирован"]
    seeding["Главный судья: посев и запуск"]
    engineGen[["Движок генерирует сетку и распределяет столы"]]
    playMatch["Судья стола ведёт матч: партии, подача, регламент"]
    engineAdv[["Движок продвигает победителя"]]
    more{"Остались матчи?"}
    finishT["Главный судья завершает турнир"]
    engineRating[["Рейтинг пересчитывается по заложенной методике: игроки и судьи"]]
    analytics["Игрок видит результат и обновлённую аналитику"]
    live["Счёт в реальном времени: игроки, зрители, гости, YouTube"]
    override["Главный судья переопределяет счёт"]

    createT --> openApps
    openApps --> coachApply
    openApps --> selfApply
    coachApply --> review
    selfApply --> review
    review -->|"Нет"| rejected
    rejected --> openApps
    review -->|"Да"| participants
    participants --> assignTable
    assignTable --> refGate
    refGate -->|"Нет"| blockStart
    blockStart --> assignTable
    refGate -->|"Да"| seeding
    seeding --> engineGen
    engineGen --> playMatch
    playMatch --> engineAdv
    engineAdv --> more
    more -->|"Да"| playMatch
    more -->|"Нет"| finishT
    finishT --> engineRating
    engineRating --> analytics
    playMatch -.->|"В реальном времени"| live
    override -.->|"Пишется в аудит"| playMatch

    style engineGen fill:#DCCCFF,stroke:#874FFF
    style engineAdv fill:#DCCCFF,stroke:#874FFF
    style engineRating fill:#DCCCFF,stroke:#874FFF
    style review fill:#FFECBD,stroke:#FFC943
    style refGate fill:#FFECBD,stroke:#FFC943
    style more fill:#FFECBD,stroke:#FFC943
    style rejected fill:#FFCDC2,stroke:#FF7556
    style blockStart fill:#FFCDC2,stroke:#FF7556
    style live fill:#CDF4D3,stroke:#66D575
```

---

# Workflow по ролям

## 1. Администратор системы

**Десктоп.** Управляет всей платформой: заводит аккаунты и роли, ведёт
организации (клубы, спортшколы, федерации), настраивает систему и публикует
контент. Назначает главных судей на турниры и видит все турниры сверху. Сам
турниры не судит — это делает главный судья.

```mermaid
flowchart LR
    login(["Вход"])
    accounts["Аккаунты и роли: заводит, назначает"]
    orgs["Организации: клубы, спортшколы, федерации"]
    settings["Настройки системы"]
    content["Публикация контента: новости, страницы"]
    assignGS["Назначает главного судью на турнир"]
    oversee(["Обзор всех турниров"])

    login --> accounts
    accounts --> orgs
    orgs --> settings
    settings --> content
    accounts --> assignGS
    content --> oversee

    style accounts fill:#DCCCFF,stroke:#874FFF
    style oversee fill:#CDF4D3,stroke:#66D575
```

## 2. Главный судья

**Десктоп.** Создаёт турнир и ведёт его от начала до конца: собирает сетку
(из библиотеки или конструктором), открывает приём заявок и одобряет их, делает
посев, назначает судей столов, вызывает пары и переопределяет спорный счёт —
каждая правка идёт в аудит. Завершает турнир, что запускает пересчёт рейтинга.
Запуск блокируется, пока не на всех столах есть судьи.

```mermaid
flowchart LR
    login(["Вход"])
    create["Создаёт турнир: вид, разряд, формат сетки"]
    bracket["Собирает сетку: библиотека или конструктор"]
    openA["Открывает приём заявок"]
    inbox["Заявки: от тренеров и от игроков"]
    decide{"Заявка одобрена?"}
    reject["Отклоняет с причиной"]
    accept["Принимает — игроки в составе"]
    seed["Делает посев"]
    tables["Назначает судей столов"]
    refGate{"Все столы с судьями?"}
    blocked["Турнир не запустится"]
    startT["Запускает турнир"]
    engineGen[["Движок генерирует сетку и столы"]]
    watch["Ведёт турнир: вызывает пары, следит"]
    dispute{"Спор по счёту?"}
    override["Переопределяет счёт"]
    allDone{"Все матчи сыграны?"}
    finishT["Завершает турнир"]
    engineRating[["Рейтинг по заложенной методике: игроки и судьи"]]
    done(["Турнир завершён"])

    login --> create
    create --> bracket
    bracket --> openA
    openA --> inbox
    inbox --> decide
    decide -->|"Нет"| reject
    reject --> inbox
    decide -->|"Да"| accept
    accept --> seed
    seed --> tables
    tables --> refGate
    refGate -->|"Нет"| blocked
    blocked --> tables
    refGate -->|"Да"| startT
    startT --> engineGen
    engineGen --> watch
    watch --> dispute
    dispute -->|"Да"| override
    override -.->|"Пишется в аудит"| watch
    dispute -->|"Нет"| allDone
    allDone -->|"Нет"| watch
    allDone -->|"Да"| finishT
    finishT --> engineRating
    engineRating --> done

    style engineGen fill:#DCCCFF,stroke:#874FFF
    style engineRating fill:#DCCCFF,stroke:#874FFF
    style decide fill:#FFECBD,stroke:#FFC943
    style dispute fill:#FFECBD,stroke:#FFC943
    style refGate fill:#FFECBD,stroke:#FFC943
    style allDone fill:#FFECBD,stroke:#FFC943
    style reject fill:#FFCDC2,stroke:#FF7556
    style blocked fill:#FFCDC2,stroke:#FF7556
    style override fill:#FFCDC2,stroke:#FF7556
    style done fill:#CDF4D3,stroke:#66D575
```

## 3. Тренер, представитель

**Десктоп.** Подаёт **одну заявку на список игроков** — решение принимается по
заявке целиком. Не единственный путь в турнир: на открытые турниры игрок может
заявиться и сам. После одобрения тренер становится обычным зрителем.

```mermaid
flowchart LR
    login(["Вход"])
    club["Мой клуб — список игроков"]
    browse["Открытые турниры"]
    pick["Выбирает турнир"]
    roster["Формирует список игроков"]
    submit["Подаёт одну заявку на список"]
    pending["Заявка на рассмотрении"]
    verdict{"Решение главного судьи"}
    rejected["Видит причину отказа"]
    accepted["Принята — игроки в составе"]
    withdraw{"Нужно отозвать?"}
    cancelled(["Заявка отозвана"])
    watch(["Следит за турниром как зритель"])

    login --> club
    club --> browse
    browse --> pick
    pick --> roster
    roster --> submit
    submit --> pending
    pending --> verdict
    verdict -->|"Отклонена"| rejected
    rejected --> roster
    verdict -->|"Принята"| accepted
    accepted --> withdraw
    withdraw -->|"Да, до старта"| cancelled
    withdraw -->|"Нет"| watch

    style verdict fill:#FFECBD,stroke:#FFC943
    style withdraw fill:#FFECBD,stroke:#FFC943
    style rejected fill:#FFCDC2,stroke:#FF7556
    style accepted fill:#CDF4D3,stroke:#66D575
```

## 4. Судья стола

**Адаптивный сайт, обычно планшет.** Самая насыщенная роль: судья ведёт счёт
по розыгрышам и партиям, отслеживает подачу и смену сторон. Его счёт
**авторитетный**, подтверждение от игроков не требуется.

```mermaid
flowchart TD
    login(["Вход с устройства судьи"])
    myTable["Мой стол на турнире"]
    queue["Очередь матчей стола"]
    invite["Вызывает игроков к столу"]
    present{"Оба игрока пришли?"}
    absent["Отмечает неявку"]
    walkover[["Движок засчитывает техпоражение"]]
    setServe["Определяет подающего"]
    rally["Розыгрыш"]
    point["Начисляет очко: +1 игроку"]
    ribbon["Очко попадает в ленту розыгрышей"]
    mistake{"Ошибочный тап?"}
    undoRally["Отменяет последний розыгрыш"]
    gameOver{"Партия сыграна?"}
    swap["Смена сторон"]
    matchOver{"Матч сыгран?"}
    finish["Завершает матч"]
    engineAdv[["Движок продвигает победителя"]]
    nextM{"Есть следующий матч?"}
    freeT(["Стол свободен"])

    login --> myTable
    myTable --> queue
    queue --> invite
    invite --> present
    present -->|"Нет"| absent
    absent --> walkover
    walkover --> nextM
    present -->|"Да"| setServe
    setServe --> rally
    rally --> point
    point --> ribbon
    ribbon --> mistake
    mistake -->|"Да"| undoRally
    undoRally --> rally
    mistake -->|"Нет"| gameOver
    gameOver -->|"Нет"| rally
    gameOver -->|"Да"| matchOver
    matchOver -->|"Нет"| swap
    swap --> setServe
    matchOver -->|"Да"| finish
    finish --> engineAdv
    engineAdv --> nextM
    nextM -->|"Да"| queue
    nextM -->|"Нет"| freeT

    style walkover fill:#DCCCFF,stroke:#874FFF
    style engineAdv fill:#DCCCFF,stroke:#874FFF
    style present fill:#FFECBD,stroke:#FFC943
    style mistake fill:#FFECBD,stroke:#FFC943
    style gameOver fill:#FFECBD,stroke:#FFC943
    style matchOver fill:#FFECBD,stroke:#FFC943
    style nextM fill:#FFECBD,stroke:#FFC943
    style undoRally fill:#FFCDC2,stroke:#FF7556
    style freeT fill:#CDF4D3,stroke:#66D575
```

### Обрыв сети — отдельная ветка

Она вынесена, потому что идёт **параллельно** всему циклу выше: сеть может
пропасть в любой момент, и работа судьи от этого не останавливается.

```mermaid
flowchart LR
    enter["Судья вводит очко"]
    localSave["Событие в локальной очереди"]
    show["Счёт на экране сразу"]
    online{"Сеть есть?"}
    send["Отправка на сервер"]
    queued["Статус: N в очереди"]
    keep["Судья продолжает вести счёт"]
    back{"Сеть вернулась?"}
    flush["Очередь уходит по порядку"]
    synced(["Статус: синхронизация активна"])

    enter --> localSave
    localSave --> show
    show --> online
    online -->|"Да"| send
    send --> synced
    online -->|"Нет"| queued
    queued --> keep
    keep --> back
    back -->|"Нет"| keep
    back -->|"Да"| flush
    flush --> synced

    style online fill:#FFECBD,stroke:#FFC943
    style back fill:#FFECBD,stroke:#FFC943
    style queued fill:#FFCDC2,stroke:#FF7556
    style synced fill:#CDF4D3,stroke:#66D575
```

**Порядок событий восстанавливается по времени на устройстве, а не на сервере.**
После обрыва очередь уходит пачкой — серверные метки будут почти одинаковыми,
и последовательность розыгрышей развалится.

## 5. Игрок

**Сайт и приложение (iOS/Android).** Единственная роль с аналитикой; расширенная
аналитика платная (TZ §11). Счёт своих матчей не вводит — это делает судья стола.
На открытые турниры может заявиться **сам**.

```mermaid
flowchart TD
    login(["Вход"])
    home["Главная: рейтинг с дельтой, место в рейтинге"]
    stats["Статистика: матчи, победы, поражения, винрейт"]
    chart["График динамики рейтинга"]
    nearest["Ближайший турнир: статус регистрации"]
    apply{"Заявиться?"}
    applySelf["Подаёт заявку сам — без тренера"]
    verdict{"Заявка одобрена?"}
    rejectedA["Отказ с причиной"]
    inT["В составе турнира"]
    active{"Турнир идёт?"}
    myMatch["Мой матч: соперник, стол, когда выходить"]
    bracket["Смотрит сетку live"]
    playing["Играет — счёт ведёт судья стола"]
    result["Результат: счёт по партиям"]
    moreM{"Ещё матчи?"}
    finished["Турнир завершён — итоговое место"]
    ratingUp["Рейтинг пересчитан: 2456 плюс 24"]
    history["Последние матчи: соперник, счёт по партиям, дата"]
    h2h["Личные встречи с конкретным соперником"]

    login --> home
    home --> stats
    stats --> chart
    home --> nearest
    nearest --> apply
    apply -->|"Да"| applySelf
    applySelf --> verdict
    verdict -->|"Нет"| rejectedA
    rejectedA --> nearest
    verdict -->|"Да"| inT
    apply -->|"Нет"| history
    inT --> active
    active -->|"Да"| myMatch
    myMatch --> bracket
    bracket --> playing
    playing --> result
    result --> moreM
    moreM -->|"Да"| myMatch
    moreM -->|"Нет"| finished
    finished --> ratingUp
    ratingUp --> history
    active -->|"Нет"| history
    history --> h2h

    style apply fill:#FFECBD,stroke:#FFC943
    style verdict fill:#FFECBD,stroke:#FFC943
    style active fill:#FFECBD,stroke:#FFC943
    style moreM fill:#FFECBD,stroke:#FFC943
    style rejectedA fill:#FFCDC2,stroke:#FF7556
    style stats fill:#C2E5FF,stroke:#3DADFF
    style chart fill:#C2E5FF,stroke:#3DADFF
    style h2h fill:#C2E5FF,stroke:#3DADFF
    style ratingUp fill:#CDF4D3,stroke:#66D575
```

## 6. Гость

Только чтение, без регистрации. Единственный выход из роли — регистрация.

```mermaid
flowchart LR
    openPage(["Открывает сайт — без регистрации"])
    list["Список публичных турниров"]
    pick["Выбирает турнир"]
    view["Сетка и результаты"]
    live["Счёт в реальном времени"]
    stream["Трансляция столов на YouTube"]
    standings["Положение в группах"]
    blocked>"Действия на запись недоступны"]
    signup(["Регистрация — чтобы стать игроком"])

    openPage --> list
    list --> pick
    pick --> view
    view --> live
    view --> stream
    view --> standings
    view -.-> blocked
    blocked -.-> signup

    style blocked fill:#D9D9D9,stroke:#B3B3B3
    style live fill:#CDF4D3,stroke:#66D575
```

---

# Ключевой сценарий: ввод счёта судьёй стола

Sequence-разрез того же процесса — видно, кто с кем разговаривает.

```mermaid
sequenceDiagram
    title Розыгрыш: от тапа судьи до экрана зрителя
    participant Судья
    participant Планшет
    participant Сервер
    participant Движок
    participant Аудит
    participant Зрители

    Судья->>Планшет: Тап на половину игрока
    Планшет->>Планшет: Очко в локальную очередь
    Планшет-->>Судья: Счёт обновлён мгновенно
    Планшет->>Сервер: Розыгрыш: кто выиграл, время устройства
    Сервер->>Аудит: Кто, когда, было, стало
    Сервер->>Движок: Партия сыграна?
    Движок-->>Сервер: Партия закрыта, счёт по партиям 2:1
    Сервер-->>Планшет: Подтверждение, статус синхронизации
    Сервер--)Зрители: Обновление счёта в реальном времени
    Движок-->>Сервер: Матч завершён, победитель продвинут
    Сервер--)Зрители: Обновление сетки и YouTube-трансляции
```
